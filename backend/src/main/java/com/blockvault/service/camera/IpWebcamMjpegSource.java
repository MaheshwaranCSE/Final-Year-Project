package com.blockvault.service.camera;

import com.blockvault.entity.CameraSourceEntity;
import com.blockvault.service.security.SsrfValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Consumer;

/**
 * Concrete CameraSource for Android phones running IP Webcam.
 * Acquires multipart/x-mixed-replace MJPEG streams or HTTP JPEG snapshots,
 * extracts raw compressed JPEG frames, validates SOI/EOI markers, and manages health metrics.
 */
public class IpWebcamMjpegSource implements CameraSource {

    private static final Logger log = LoggerFactory.getLogger(IpWebcamMjpegSource.class);

    private final CameraSourceEntity config;
    private final SsrfValidator ssrfValidator;

    private final AtomicBoolean acquiring = new AtomicBoolean(false);
    private final AtomicBoolean recording = new AtomicBoolean(false);
    private volatile String activeSessionId;

    private volatile byte[] latestFrame;
    private volatile Instant lastFrameTime;
    private volatile String lastError;

    private long framesCount = 0;
    private long totalBytes = 0;
    private long lastFpsCalcTime = System.currentTimeMillis();
    private long framesSinceLastFps = 0;
    private volatile double currentFps = 0.0;

    private int consecutiveHealthy = 0;
    private int consecutiveFailed = 0;

    private final Set<Consumer<byte[]>> frameListeners = ConcurrentHashMap.newKeySet();
    private Thread acquisitionThread;

    public IpWebcamMjpegSource(CameraSourceEntity config, SsrfValidator ssrfValidator) {
        this.config = config;
        this.ssrfValidator = ssrfValidator;
    }

    @Override
    public String getCameraId() {
        return config.getCameraId();
    }

    @Override
    public CameraSourceEntity getConfig() {
        return config;
    }

    @Override
    public byte[] getLatestFrame() {
        return latestFrame;
    }

    @Override
    public boolean isAcquiring() {
        return acquiring.get();
    }

    @Override
    public boolean isRecording() {
        return recording.get();
    }

    @Override
    public String getActiveSessionId() {
        return activeSessionId;
    }

    @Override
    public void addFrameListener(Consumer<byte[]> listener) {
        frameListeners.add(listener);
    }

    @Override
    public void removeFrameListener(Consumer<byte[]> listener) {
        frameListeners.remove(listener);
    }

    @Override
    public boolean testConnectivity() {
        try {
            ssrfValidator.validateAndResolveUrl(config.getStreamUrl());
            URL url = new URL(config.getStreamUrl());
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(3000);
            conn.setReadTimeout(3000);
            conn.setInstanceFollowRedirects(false);
            conn.setRequestMethod("GET");
            conn.setRequestProperty("User-Agent", "BlockVault-Probe/1.0");

            applyBasicAuthIfConfigured(conn);

            int code = conn.getResponseCode();
            conn.disconnect();
            return (code >= 200 && code < 400);
        } catch (Exception e) {
            this.lastError = e.getMessage();
            return false;
        }
    }

    @Override
    public CameraHealthStatus checkHealth() {
        CameraHealthStatus status = new CameraHealthStatus();
        status.setLastCheckTime(Instant.now());
        status.setLastFrameTime(lastFrameTime);
        status.setFps(currentFps);
        status.setTotalBytesReceived(totalBytes);
        status.setFramesProcessed(framesCount);
        status.setStreamActive(acquiring.get() && latestFrame != null);

        // Hysteresis & Status Determination:
        // Live requires fresh valid frames arriving within the last 15 seconds
        if (!acquiring.get() || latestFrame == null) {
            status.setStatus("NOT_CONNECTED");
            status.setErrorDetails(lastError != null ? lastError : "Stream acquisition is idle");
            consecutiveHealthy = 0;
            consecutiveFailed++;
        } else {
            long secondsSinceLastFrame = lastFrameTime != null ?
                    Instant.now().getEpochSecond() - lastFrameTime.getEpochSecond() : 999;

            if (secondsSinceLastFrame <= 12) {
                consecutiveHealthy++;
                consecutiveFailed = 0;
                // Require at least 2 consecutive successful checks to mark green (hysteresis)
                if (consecutiveHealthy >= 2) {
                    status.setStatus("LIVE");
                    status.setErrorDetails(null);
                } else {
                    status.setStatus("UNSTABLE");
                    status.setErrorDetails("Establishing stable frame flow...");
                }
            } else if (secondsSinceLastFrame <= 25) {
                consecutiveHealthy = 0;
                consecutiveFailed++;
                status.setStatus("UNSTABLE");
                status.setErrorDetails("Frame flow intermittent (lag: " + secondsSinceLastFrame + "s)");
            } else {
                consecutiveHealthy = 0;
                consecutiveFailed++;
                status.setStatus("OFFLINE_INCIDENT");
                status.setErrorDetails("No frames received for " + secondsSinceLastFrame + " seconds");
            }
        }

        status.setConsecutiveHealthyChecks(consecutiveHealthy);
        status.setConsecutiveFailedChecks(consecutiveFailed);
        return status;
    }

    @Override
    public synchronized void startAcquisition() {
        if (acquiring.compareAndSet(false, true)) {
            acquisitionThread = new Thread(this::runAcquisitionLoop, "camera-acq-" + config.getCameraId());
            acquisitionThread.setDaemon(true);
            acquisitionThread.start();
            log.info("Started stream acquisition worker for camera {}", config.getCameraId());
        }
    }

    @Override
    public synchronized void stopAcquisition() {
        acquiring.set(false);
        stopRecording();
        if (acquisitionThread != null) {
            acquisitionThread.interrupt();
            acquisitionThread = null;
        }
        log.info("Stopped stream acquisition worker for camera {}", config.getCameraId());
    }

    @Override
    public void startRecording(String sessionId) {
        this.activeSessionId = sessionId;
        this.recording.set(true);
        log.info("Camera {} started recording for session {}", config.getCameraId(), sessionId);
    }

    @Override
    public void stopRecording() {
        this.recording.set(false);
        this.activeSessionId = null;
    }

    private void runAcquisitionLoop() {
        int failureCount = 0;

        while (acquiring.get() && !Thread.currentThread().isInterrupted()) {
            HttpURLConnection conn = null;
            InputStream in = null;
            try {
                // 1. SSRF and DNS check
                ssrfValidator.validateAndResolveUrl(config.getStreamUrl());

                URL url = new URL(config.getStreamUrl());
                conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(4000);
                conn.setReadTimeout(5000);
                conn.setInstanceFollowRedirects(false);
                conn.setRequestProperty("User-Agent", "BlockVault-Acquisition/1.0");
                applyBasicAuthIfConfigured(conn);

                int responseCode = conn.getResponseCode();
                if (responseCode != 200) {
                    throw new IOException("HTTP response status " + responseCode + " from camera stream");
                }

                String contentType = conn.getContentType();
                in = new BufferedInputStream(conn.getInputStream(), 65536);

                failureCount = 0;
                lastError = null;

                // Read continuous MJPEG
                readMjpegStream(in);

            } catch (Exception e) {
                failureCount++;
                lastError = e.getMessage();
                log.warn("Camera {} acquisition error (attempt {}): {}", config.getCameraId(), failureCount, e.getMessage());

                // Backoff before retry
                try {
                    int sleepMs = Math.min(1000 * failureCount, 8000);
                    Thread.sleep(sleepMs);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            } finally {
                if (in != null) {
                    try { in.close(); } catch (Exception ignored) {}
                }
                if (conn != null) {
                    conn.disconnect();
                }
            }
        }
    }

    /**
     * Reads MJPEG stream by tracking JPEG SOI (0xFF 0xD8) and EOI (0xFF 0xD9) markers.
     */
    private void readMjpegStream(InputStream in) throws IOException {
        ByteArrayOutputStream frameBuffer = new ByteArrayOutputStream(65536);
        int prev = -1;
        int curr;
        boolean inFrame = false;

        while (acquiring.get() && (curr = in.read()) != -1) {
            totalBytes++;

            if (!inFrame) {
                // Look for JPEG SOI: 0xFF, 0xD8
                if (prev == 0xFF && curr == 0xD8) {
                    inFrame = true;
                    frameBuffer.reset();
                    frameBuffer.write(0xFF);
                    frameBuffer.write(0xD8);
                }
            } else {
                frameBuffer.write(curr);

                // Look for JPEG EOI: 0xFF, 0xD9
                if (prev == 0xFF && curr == 0xD9) {
                    byte[] rawJpeg = frameBuffer.toByteArray();
                    inFrame = false;

                    // Validate minimum plausible JPEG size (> 256 bytes)
                    if (rawJpeg.length > 256) {
                        onNewFrameAcquired(rawJpeg);
                    }
                }
            }

            prev = curr;
        }
    }

    private void onNewFrameAcquired(byte[] jpegBytes) {
        this.latestFrame = jpegBytes;
        this.lastFrameTime = Instant.now();
        this.framesCount++;
        this.framesSinceLastFps++;

        long now = System.currentTimeMillis();
        long elapsed = now - lastFpsCalcTime;
        if (elapsed >= 2000) {
            this.currentFps = (framesSinceLastFps * 1000.0) / elapsed;
            this.framesSinceLastFps = 0;
            this.lastFpsCalcTime = now;
        }

        // Notify downstream consumers (segment recorder, obstruction analyzer, preview proxy)
        for (Consumer<byte[]> listener : frameListeners) {
            try {
                listener.accept(jpegBytes);
            } catch (Exception ex) {
                log.error("Frame listener exception in camera {}: {}", config.getCameraId(), ex.getMessage());
            }
        }
    }

    private void applyBasicAuthIfConfigured(HttpURLConnection conn) {
        if (config.getAuthUsername() != null && !config.getAuthUsername().trim().isEmpty()) {
            String password = config.getAuthPasswordEncrypted() != null ? config.getAuthPasswordEncrypted() : "";
            String creds = config.getAuthUsername() + ":" + password;
            String encoded = Base64.getEncoder().encodeToString(creds.getBytes(StandardCharsets.UTF_8));
            conn.setRequestProperty("Authorization", "Basic " + encoded);
        }
    }
}
