package com.blockvault.service.camera;

import com.blockvault.entity.CameraIncidentEntity;
import com.blockvault.entity.CameraSourceEntity;
import com.blockvault.repository.CameraIncidentRepository;
import com.blockvault.repository.CameraSourceRepository;
import com.blockvault.repository.ConsentRecordRepository;
import com.blockvault.service.alert.AlertNotificationService;
import com.blockvault.service.security.SsrfValidator;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Authoritative manager for all active camera streams.
 * Coordinates acquisition threads, periodic health checks, obstruction heuristics,
 * segmented recording, and incident dispatching.
 */
@Service
public class CameraAcquisitionManager {

    private static final Logger log = LoggerFactory.getLogger(CameraAcquisitionManager.class);

    private final Map<String, CameraSource> activeSources = new ConcurrentHashMap<>();

    @Autowired
    private CameraSourceRepository cameraRepo;

    @Autowired
    private ConsentRecordRepository consentRepo;

    @Autowired
    private CameraIncidentRepository incidentRepo;

    @Autowired
    private SegmentRecorderService segmentRecorder;

    @Autowired
    private SsrfValidator ssrfValidator;

    @Autowired
    private ObstructionHeuristicsService obstructionHeuristics;

    @Autowired
    private AlertNotificationService alertService;

    @PostConstruct
    public void initializeActiveCameras() {
        log.info("Initializing active camera acquisition manager from database...");
        List<CameraSourceEntity> cameras = cameraRepo.findByEnabledTrue();
        for (CameraSourceEntity camera : cameras) {
            try {
                // Verify consent record
                if (consentRepo.existsByCameraIdAndRevokedFalse(camera.getCameraId())) {
                    setupCameraSource(camera);
                } else {
                    log.warn("Camera {} is enabled but has no valid/unrevoked consent record. Skipping auto-start.", camera.getCameraId());
                }
            } catch (Exception e) {
                log.error("Failed to initialize camera {}: {}", camera.getCameraId(), e.getMessage());
            }
        }
    }

    @PreDestroy
    public void shutdownAll() {
        log.info("Shutting down all active camera sources...");
        for (CameraSource source : activeSources.values()) {
            try {
                source.stopAcquisition();
            } catch (Exception ignored) {}
        }
        activeSources.clear();
    }

    public synchronized CameraSource registerOrUpdateCamera(CameraSourceEntity config) {
        // Enforce participant consent check
        if (!consentRepo.existsByCameraIdAndRevokedFalse(config.getCameraId())) {
            throw new SecurityException("Camera registration rejected: A valid, non-revoked participant consent record is strictly required.");
        }

        // SSRF Check on the stream URL
        ssrfValidator.validateAndResolveUrl(config.getStreamUrl());

        // Stop existing instance if present
        CameraSource old = activeSources.remove(config.getCameraId());
        if (old != null) {
            old.stopAcquisition();
        }

        return setupCameraSource(config);
    }

    public synchronized void removeCamera(String cameraId) {
        CameraSource source = activeSources.remove(cameraId);
        if (source != null) {
            source.stopAcquisition();
        }
        obstructionHeuristics.clearCamera(cameraId);
    }

    public CameraSource getSource(String cameraId) {
        return activeSources.get(cameraId);
    }

    public Collection<CameraSource> getAllSources() {
        return Collections.unmodifiableCollection(activeSources.values());
    }

    public synchronized void startRecording(String cameraId, String sessionId) {
        CameraSource source = activeSources.get(cameraId);
        if (source == null) {
            throw new IllegalArgumentException("Camera " + cameraId + " is not currently active.");
        }
        source.startRecording(sessionId);
        cameraRepo.findByCameraId(cameraId).ifPresent(entity -> {
            entity.setRecordingActive(true);
            entity.setActiveSessionId(sessionId);
            entity.setUpdatedAt(Instant.now());
            cameraRepo.save(entity);
        });
    }

    public synchronized void stopRecording(String cameraId) {
        CameraSource source = activeSources.get(cameraId);
        if (source != null) {
            source.stopRecording();
        }
        segmentRecorder.finalizeSegment(cameraId);
        cameraRepo.findByCameraId(cameraId).ifPresent(entity -> {
            entity.setRecordingActive(false);
            entity.setActiveSessionId(null);
            entity.setUpdatedAt(Instant.now());
            cameraRepo.save(entity);
        });
    }

    public synchronized void onConsentRevoked(String cameraId) {
        log.warn("Participant consent revoked for camera {}. Terminating acquisition immediately.", cameraId);
        stopRecording(cameraId);
        CameraSource source = activeSources.remove(cameraId);
        if (source != null) {
            source.stopAcquisition();
        }
        cameraRepo.findByCameraId(cameraId).ifPresent(entity -> {
            entity.setEnabled(false);
            entity.setHealthStatus("REVOKED_CONSENT");
            entity.setUpdatedAt(Instant.now());
            cameraRepo.save(entity);
        });
    }

    private CameraSource setupCameraSource(CameraSourceEntity config) {
        IpWebcamMjpegSource source = new IpWebcamMjpegSource(config, ssrfValidator);

        // Frame listener to pipe into segmented evidence recorder
        source.addFrameListener(rawJpeg -> {
            if (source.isRecording()) {
                int durationSec = config.getSegmentDurationSeconds() > 0 ? config.getSegmentDurationSeconds() : 10;
                segmentRecorder.onFrameReceived(config.getCameraId(), source.getActiveSessionId(), rawJpeg, durationSec);
            }
        });

        activeSources.put(config.getCameraId(), source);

        if (config.isEnabled()) {
            source.startAcquisition();
        }

        return source;
    }

    @Scheduled(fixedRate = 4000)
    public void performPeriodicHealthChecks() {
        for (CameraSource source : activeSources.values()) {
            try {
                String cameraId = source.getCameraId();
                CameraHealthStatus health = source.checkHealth();

                cameraRepo.findByCameraId(cameraId).ifPresent(entity -> {
                    String prevStatus = entity.getHealthStatus();
                    entity.setHealthStatus(health.getStatus());
                    entity.setLastHealthCheck(health.getLastCheckTime());
                    if (health.getLastFrameTime() != null) {
                        entity.setLastValidFrameTime(health.getLastFrameTime());
                    }
                    entity.setConsecutiveHealthyChecks(health.getConsecutiveHealthyChecks());
                    entity.setConsecutiveFailedChecks(health.getConsecutiveFailedChecks());
                    cameraRepo.save(entity);

                    // Offline Incident Detection
                    if ("OFFLINE_INCIDENT".equals(health.getStatus()) && entity.isAlertOnOffline()) {
                        if (!incidentRepo.existsByCameraIdAndTypeAndStatus(cameraId, "OFFLINE", "OPEN")) {
                            CameraIncidentEntity incident = new CameraIncidentEntity();
                            incident.setIncidentId("INC-OFF-" + UUID.randomUUID().toString().substring(0, 8));
                            incident.setCameraId(cameraId);
                            incident.setType("OFFLINE");
                            incident.setSeverity("HIGH");
                            incident.setStatus("OPEN");
                            incident.setTitle("Camera Stream Offline — " + entity.getName());
                            incident.setDetails(health.getErrorDetails() != null ? health.getErrorDetails() : "No video frames received within timeout window.");
                            incident.setDetectedAt(Instant.now());
                            CameraIncidentEntity saved = incidentRepo.save(incident);
                            alertService.dispatchIncidentAlert(saved);
                        }
                    } else if ("LIVE".equals(health.getStatus()) && "OFFLINE_INCIDENT".equals(prevStatus)) {
                        // Auto-resolve open offline incident
                        List<CameraIncidentEntity> openOffline = incidentRepo.findByCameraIdAndStatus(cameraId, "OPEN");
                        for (CameraIncidentEntity inc : openOffline) {
                            if ("OFFLINE".equals(inc.getType())) {
                                inc.setStatus("RESOLVED");
                                inc.setResolvedAt(Instant.now());
                                inc.setResolvedBy("SYSTEM_HEALTH_MONITOR");
                                inc.setResolutionNotes("Stream connectivity recovered successfully.");
                                incidentRepo.save(inc);
                            }
                        }
                    }
                });
            } catch (Exception e) {
                log.error("Error checking health for camera {}: {}", source.getCameraId(), e.getMessage());
            }
        }
    }

    @Scheduled(fixedRate = 3500)
    public void performObstructionAndFreezeChecks() {
        for (CameraSource source : activeSources.values()) {
            if (!source.isAcquiring()) {
                continue;
            }

            byte[] frame = source.getLatestFrame();
            if (frame == null) {
                continue;
            }

            String cameraId = source.getCameraId();
            CameraSourceEntity config = source.getConfig();

            ObstructionHeuristicsService.HeuristicEvaluation eval =
                    obstructionHeuristics.evaluateFrame(cameraId, frame);

            // Lens Obstruction
            if (eval.obstructionDetected() && config.isAlertOnObstruction()) {
                if (!incidentRepo.existsByCameraIdAndTypeAndStatus(cameraId, "POSSIBLE_OBSTRUCTION", "OPEN")) {
                    CameraIncidentEntity incident = new CameraIncidentEntity();
                    incident.setIncidentId("INC-OBS-" + UUID.randomUUID().toString().substring(0, 8));
                    incident.setCameraId(cameraId);
                    incident.setType("POSSIBLE_OBSTRUCTION");
                    incident.setSeverity("MEDIUM");
                    incident.setStatus("OPEN");
                    incident.setTitle("Possible Lens Obstruction Detected — " + config.getName());
                    incident.setDetails(eval.details());
                    incident.setMetricsJson(String.format("{\"mean\":%.2f,\"stdDev\":%.2f}", eval.meanLuminance(), eval.stdDevLuminance()));
                    incident.setDetectedAt(Instant.now());
                    CameraIncidentEntity saved = incidentRepo.save(incident);
                    alertService.dispatchIncidentAlert(saved);
                }
            }

            // Frozen Feed
            if (eval.frozenDetected() && config.isAlertOnFrozen()) {
                if (!incidentRepo.existsByCameraIdAndTypeAndStatus(cameraId, "POSSIBLE_FROZEN_FEED", "OPEN")) {
                    CameraIncidentEntity incident = new CameraIncidentEntity();
                    incident.setIncidentId("INC-FRZ-" + UUID.randomUUID().toString().substring(0, 8));
                    incident.setCameraId(cameraId);
                    incident.setType("POSSIBLE_FROZEN_FEED");
                    incident.setSeverity("HIGH");
                    incident.setStatus("OPEN");
                    incident.setTitle("Possible Frozen Video Feed — " + config.getName());
                    incident.setDetails(eval.details());
                    incident.setMetricsJson(String.format("{\"interFrameMad\":%.4f}", eval.interFrameMad()));
                    incident.setDetectedAt(Instant.now());
                    CameraIncidentEntity saved = incidentRepo.save(incident);
                    alertService.dispatchIncidentAlert(saved);
                }
            }
        }
    }
}
