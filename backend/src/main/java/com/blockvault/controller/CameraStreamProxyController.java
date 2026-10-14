package com.blockvault.controller;

import com.blockvault.service.camera.CameraAcquisitionManager;
import com.blockvault.service.camera.CameraSource;
import com.blockvault.service.security.StreamTokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

/**
 * High-performance backend stream proxy for live camera previews.
 * Solves browser mixed-content HTTPS blocks and protects camera credentials.
 * Authorizes access via HMAC short-lived stream tokens.
 */
@RestController
@RequestMapping("/api/cameras")
public class CameraStreamProxyController {

    private static final Logger log = LoggerFactory.getLogger(CameraStreamProxyController.class);

    @Autowired
    private CameraAcquisitionManager acquisitionManager;

    @Autowired
    private StreamTokenService streamTokenService;

    /**
     * Issues short-lived signed preview token for an authenticated user.
     */
    @GetMapping("/{cameraId}/token")
    public ResponseEntity<?> getStreamToken(@PathVariable String cameraId, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "anonymous";
        String token = streamTokenService.generateStreamToken(cameraId, username);
        return ResponseEntity.ok(Map.of(
                "cameraId", cameraId,
                "token", token,
                "expiresInSeconds", 120
        ));
    }

    /**
     * Proxies live MJPEG stream using short-lived stream token.
     */
    @GetMapping(value = "/{cameraId}/stream")
    public ResponseEntity<StreamingResponseBody> streamLiveVideo(
            @PathVariable String cameraId,
            @RequestParam(required = false) String token) {

        if (!streamTokenService.validateStreamToken(token, cameraId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        CameraSource source = acquisitionManager.getSource(cameraId);
        if (source == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        StreamingResponseBody responseBody = outputStream -> {
            BlockingQueue<byte[]> frameQueue = new LinkedBlockingQueue<>(8);

            Consumer<byte[]> frameListener = frame -> {
                if (frameQueue.remainingCapacity() == 0) {
                    frameQueue.poll(); // drop older frame to maintain real-time low latency
                }
                frameQueue.offer(frame);
            };

            source.addFrameListener(frameListener);

            try {
                // If we already have a frame, send it immediately
                byte[] initialFrame = source.getLatestFrame();
                if (initialFrame != null) {
                    writeMjpegPart(outputStream, initialFrame);
                }

                while (!Thread.currentThread().isInterrupted()) {
                    byte[] frame = frameQueue.poll(6, TimeUnit.SECONDS);
                    if (frame == null) {
                        // Check if source still acquiring
                        if (!source.isAcquiring()) {
                            break;
                        }
                        continue;
                    }

                    writeMjpegPart(outputStream, frame);
                }
            } catch (Exception e) {
                // Client closed stream / connection reset
            } finally {
                source.removeFrameListener(frameListener);
            }
        };

        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "multipart/x-mixed-replace; boundary=bvframe");
        headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
        headers.set("Pragma", "no-cache");
        headers.set("Expires", "0");
        headers.set("Connection", "keep-alive");
        headers.set("X-Stream-Disclaimer", "LIVE PREVIEW - not preserved evidence");

        return new ResponseEntity<>(responseBody, headers, HttpStatus.OK);
    }

    /**
     * Fetches current snapshot JPEG frame.
     */
    @GetMapping(value = "/{cameraId}/snapshot", produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> getSnapshot(
            @PathVariable String cameraId,
            @RequestParam(required = false) String token) {

        if (token != null && !streamTokenService.validateStreamToken(token, cameraId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        CameraSource source = acquisitionManager.getSource(cameraId);
        if (source == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        byte[] frame = source.getLatestFrame();
        if (frame == null) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store")
                .header("X-Stream-Disclaimer", "LIVE PREVIEW - not preserved evidence")
                .body(frame);
    }

    private void writeMjpegPart(java.io.OutputStream out, byte[] frame) throws IOException {
        out.write(("--bvframe\r\nContent-Type: image/jpeg\r\nContent-Length: " + frame.length + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        out.write(frame);
        out.write("\r\n".getBytes(StandardCharsets.UTF_8));
        out.flush();
    }
}
