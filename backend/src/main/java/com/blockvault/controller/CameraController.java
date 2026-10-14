package com.blockvault.controller;

import com.blockvault.dto.CameraDtos.*;
import com.blockvault.entity.CameraSourceEntity;
import com.blockvault.entity.ConsentRecordEntity;
import com.blockvault.entity.EvidenceSegmentEntity;
import com.blockvault.repository.CameraSourceRepository;
import com.blockvault.repository.ConsentRecordRepository;
import com.blockvault.repository.EvidenceSegmentRepository;
import com.blockvault.service.camera.CameraAcquisitionManager;
import com.blockvault.service.camera.CameraHealthStatus;
import com.blockvault.service.camera.CameraSource;
import com.blockvault.service.security.SsrfValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cameras")
public class CameraController {

    private static final Logger log = LoggerFactory.getLogger(CameraController.class);

    @Autowired
    private CameraSourceRepository cameraRepo;

    @Autowired
    private ConsentRecordRepository consentRepo;

    @Autowired
    private EvidenceSegmentRepository segmentRepo;

    @Autowired
    private CameraAcquisitionManager acquisitionManager;

    @Autowired
    private SsrfValidator ssrfValidator;

    @GetMapping
    public ResponseEntity<List<CameraResponse>> getAllCameras() {
        List<CameraSourceEntity> cameras = cameraRepo.findAll();
        List<CameraResponse> responses = cameras.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{cameraId}")
    public ResponseEntity<CameraResponse> getCamera(@PathVariable String cameraId) {
        return cameraRepo.findByCameraId(cameraId)
                .map(this::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> registerCamera(
            @RequestBody CameraRegisterRequest request,
            Authentication authentication) {

        // 1. Mandatory consent notice verification
        if (!request.isNoticeAccepted()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Participant consent notice must be explicitly accepted before camera registration."
            ));
        }
        if (request.getParticipantName() == null || request.getParticipantName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Participant name is required to establish legitimate custody."
            ));
        }

        // 2. Strict SSRF validation
        try {
            ssrfValidator.validateAndResolveUrl(request.getStreamUrl());
            if (request.getSnapshotUrl() != null && !request.getSnapshotUrl().trim().isEmpty()) {
                ssrfValidator.validateAndResolveUrl(request.getSnapshotUrl());
            }
        } catch (SecurityException se) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "SSRF Security Violation: " + se.getMessage()
            ));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Invalid camera URL: " + ex.getMessage()
            ));
        }

        String username = authentication != null ? authentication.getName() : "admin";
        String cameraId = "CAM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // 3. Persist Consent Record
        ConsentRecordEntity consent = new ConsentRecordEntity();
        consent.setCameraId(cameraId);
        consent.setParticipantName(request.getParticipantName().trim());
        consent.setRegisteredBy(username);
        consent.setPurpose(request.getPurpose() != null ? request.getPurpose() : "Security & Digital Forensics Monitoring");
        consent.setRetentionDays(request.getRetentionDays() > 0 ? request.getRetentionDays() : 30);
        consent.setNoticeAccepted(true);
        consent.setConsentTimestamp(Instant.now());
        consent.setRevoked(false);
        consentRepo.save(consent);

        // 4. Persist Camera Source Entity
        CameraSourceEntity camera = new CameraSourceEntity();
        camera.setCameraId(cameraId);
        camera.setName(request.getName() != null && !request.getName().trim().isEmpty() ? request.getName().trim() : "Camera " + cameraId);
        camera.setParticipantName(request.getParticipantName().trim());
        camera.setLocation(request.getLocation() != null ? request.getLocation().trim() : "Unknown");
        camera.setSourceType(request.getSourceType() != null ? request.getSourceType() : "IP_WEBCAM_ANDROID");
        camera.setStreamUrl(request.getStreamUrl().trim());
        camera.setSnapshotUrl(request.getSnapshotUrl() != null ? request.getSnapshotUrl().trim() : null);
        camera.setStatusJsonUrl(request.getStatusJsonUrl() != null ? request.getStatusJsonUrl().trim() : null);
        camera.setAuthUsername(request.getAuthUsername());
        camera.setAuthPasswordEncrypted(request.getAuthPassword());
        camera.setSegmentDurationSeconds(request.getSegmentDurationSeconds() > 0 ? request.getSegmentDurationSeconds() : 10);
        camera.setEnabled(true);
        camera.setAlertOnOffline(request.isAlertOnOffline());
        camera.setAlertOnObstruction(request.isAlertOnObstruction());
        camera.setAlertOnFrozen(request.isAlertOnFrozen());
        camera.setHealthStatus("NOT_CONNECTED");
        camera.setCreatedAt(Instant.now());
        camera.setUpdatedAt(Instant.now());

        CameraSourceEntity savedCamera = cameraRepo.save(camera);

        // 5. Register with Acquisition Manager
        try {
            acquisitionManager.registerOrUpdateCamera(savedCamera);
        } catch (Exception e) {
            log.error("Error activating camera in acquisition manager: {}", e.getMessage());
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(savedCamera));
    }

    @PutMapping("/{cameraId}")
    public ResponseEntity<?> updateCamera(
            @PathVariable String cameraId,
            @RequestBody CameraUpdateRequest request) {

        Optional<CameraSourceEntity> opt = cameraRepo.findByCameraId(cameraId);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        CameraSourceEntity camera = opt.get();
        if (request.getName() != null) camera.setName(request.getName().trim());
        if (request.getLocation() != null) camera.setLocation(request.getLocation().trim());
        if (request.getSegmentDurationSeconds() > 0) camera.setSegmentDurationSeconds(request.getSegmentDurationSeconds());
        camera.setAlertOnOffline(request.isAlertOnOffline());
        camera.setAlertOnObstruction(request.isAlertOnObstruction());
        camera.setAlertOnFrozen(request.isAlertOnFrozen());
        camera.setUpdatedAt(Instant.now());

        CameraSourceEntity updated = cameraRepo.save(camera);
        return ResponseEntity.ok(toResponse(updated));
    }

    @PostMapping("/{cameraId}/toggle")
    public ResponseEntity<?> toggleCamera(@PathVariable String cameraId) {
        Optional<CameraSourceEntity> opt = cameraRepo.findByCameraId(cameraId);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        CameraSourceEntity camera = opt.get();
        boolean newEnabled = !camera.isEnabled();
        camera.setEnabled(newEnabled);
        camera.setUpdatedAt(Instant.now());

        if (newEnabled) {
            if (!consentRepo.existsByCameraIdAndRevokedFalse(cameraId)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Cannot enable camera: consent has been revoked."));
            }
            acquisitionManager.registerOrUpdateCamera(camera);
        } else {
            acquisitionManager.removeCamera(cameraId);
            camera.setHealthStatus("NOT_CONNECTED");
            camera.setRecordingActive(false);
            camera.setActiveSessionId(null);
        }

        CameraSourceEntity updated = cameraRepo.save(camera);
        return ResponseEntity.ok(toResponse(updated));
    }

    @PostMapping("/{cameraId}/record/start")
    public ResponseEntity<?> startRecording(
            @PathVariable String cameraId,
            @RequestBody(required = false) StartRecordingRequest request) {

        Optional<CameraSourceEntity> opt = cameraRepo.findByCameraId(cameraId);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String sessionId = (request != null && request.getSessionId() != null && !request.getSessionId().trim().isEmpty())
                ? request.getSessionId().trim()
                : "SESS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        try {
            acquisitionManager.startRecording(cameraId, sessionId);
            return ResponseEntity.ok(Map.of(
                    "status", "RECORDING_STARTED",
                    "cameraId", cameraId,
                    "sessionId", sessionId
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{cameraId}/record/stop")
    public ResponseEntity<?> stopRecording(@PathVariable String cameraId) {
        Optional<CameraSourceEntity> opt = cameraRepo.findByCameraId(cameraId);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        acquisitionManager.stopRecording(cameraId);
        return ResponseEntity.ok(Map.of(
                "status", "RECORDING_STOPPED",
                "cameraId", cameraId
        ));
    }

    @PostMapping("/{cameraId}/consent/revoke")
    public ResponseEntity<?> revokeConsent(
            @PathVariable String cameraId,
            @RequestBody(required = false) RevokeConsentRequest request,
            Authentication authentication) {

        Optional<ConsentRecordEntity> opt = consentRepo.findByCameraId(cameraId);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String username = authentication != null ? authentication.getName() : "user";
        ConsentRecordEntity consent = opt.get();
        consent.setRevoked(true);
        consent.setRevokedAt(Instant.now());
        consent.setRevokedBy(username);
        consent.setRevocationReason(request != null ? request.getReason() : "Participant revoked authorization");
        consentRepo.save(consent);

        acquisitionManager.onConsentRevoked(cameraId);

        return ResponseEntity.ok(Map.of(
                "status", "CONSENT_REVOKED",
                "cameraId", cameraId,
                "revokedAt", consent.getRevokedAt()
        ));
    }

    @PostMapping("/probe")
    public ResponseEntity<CameraProbeResponse> probeCamera(@RequestBody CameraProbeRequest request) {
        CameraProbeResponse response = new CameraProbeResponse();
        Map<String, Boolean> endpoints = new HashMap<>();
        response.setDetectedEndpoints(endpoints);

        if (request.getUrl() == null || request.getUrl().trim().isEmpty()) {
            response.setReachable(false);
            response.setMessage("Stream URL cannot be blank");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            InetAddress ip = ssrfValidator.validateAndResolveUrl(request.getUrl());
            response.setResolvedIp(ip.getHostAddress());

            long start = System.currentTimeMillis();
            URL url = new URL(request.getUrl());
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(3500);
            conn.setReadTimeout(3500);
            conn.setInstanceFollowRedirects(false);
            conn.setRequestMethod("GET");
            conn.setRequestProperty("User-Agent", "BlockVault-Probe/1.0");

            if (request.getUsername() != null && !request.getUsername().trim().isEmpty()) {
                String creds = request.getUsername() + ":" + (request.getPassword() != null ? request.getPassword() : "");
                String encoded = Base64.getEncoder().encodeToString(creds.getBytes(StandardCharsets.UTF_8));
                conn.setRequestProperty("Authorization", "Basic " + encoded);
            }

            int code = conn.getResponseCode();
            long elapsed = System.currentTimeMillis() - start;
            response.setStatusCode(code);
            response.setResponseTimeMs(elapsed);
            response.setReachable(code >= 200 && code < 400);
            conn.disconnect();

            // Probe standard paths if base host URL was tested
            probeAuxiliaryEndpoints(url, request.getUsername(), request.getPassword(), endpoints);

            response.setMessage(response.isReachable() ? "Camera stream endpoint reached successfully." : "HTTP status " + code);
            return ResponseEntity.ok(response);

        } catch (SecurityException se) {
            response.setReachable(false);
            response.setMessage("SSRF check rejected destination: " + se.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        } catch (Exception e) {
            response.setReachable(false);
            response.setMessage("Connection failed: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    @GetMapping("/{cameraId}/segments")
    public ResponseEntity<List<EvidenceSegmentEntity>> getSegments(@PathVariable String cameraId) {
        List<EvidenceSegmentEntity> segments = segmentRepo.findByCameraIdOrderByStartTimeUtcDesc(cameraId);
        return ResponseEntity.ok(segments);
    }

    private void probeAuxiliaryEndpoints(URL baseUrl, String user, String pass, Map<String, Boolean> endpoints) {
        String[] paths = {"/video", "/shot.jpg", "/status.json"};
        for (String path : paths) {
            try {
                URL sub = new URL(baseUrl.getProtocol(), baseUrl.getHost(), baseUrl.getPort(), path);
                HttpURLConnection conn = (HttpURLConnection) sub.openConnection();
                conn.setConnectTimeout(1500);
                conn.setReadTimeout(1500);
                conn.setInstanceFollowRedirects(false);
                if (user != null && !user.trim().isEmpty()) {
                    String creds = user + ":" + (pass != null ? pass : "");
                    conn.setRequestProperty("Authorization", "Basic " + Base64.getEncoder().encodeToString(creds.getBytes(StandardCharsets.UTF_8)));
                }
                int sc = conn.getResponseCode();
                endpoints.put(path, sc >= 200 && sc < 400);
                conn.disconnect();
            } catch (Exception e) {
                endpoints.put(path, false);
            }
        }
    }

    private CameraResponse toResponse(CameraSourceEntity entity) {
        CameraResponse r = new CameraResponse();
        r.setCameraId(entity.getCameraId());
        r.setName(entity.getName());
        r.setParticipantName(entity.getParticipantName());
        r.setLocation(entity.getLocation());
        r.setSourceType(entity.getSourceType());
        r.setStreamUrl(ssrfValidator.redactCredentials(entity.getStreamUrl()));
        r.setSnapshotUrl(entity.getSnapshotUrl() != null ? ssrfValidator.redactCredentials(entity.getSnapshotUrl()) : null);
        r.setAuthUsername(entity.getAuthUsername());
        r.setEnabled(entity.isEnabled());
        r.setRecordingActive(entity.isRecordingActive());
        r.setActiveSessionId(entity.getActiveSessionId());
        r.setHealthStatus(entity.getHealthStatus());
        r.setLastHealthCheck(entity.getLastHealthCheck());
        r.setLastValidFrameTime(entity.getLastValidFrameTime());
        r.setAlertOnOffline(entity.isAlertOnOffline());
        r.setAlertOnObstruction(entity.isAlertOnObstruction());
        r.setAlertOnFrozen(entity.isAlertOnFrozen());
        r.setCreatedAt(entity.getCreatedAt());

        // Live stats from manager
        CameraSource source = acquisitionManager.getSource(entity.getCameraId());
        if (source != null) {
            CameraHealthStatus health = source.checkHealth();
            r.setFps(health.getFps());
            r.setFramesProcessed(health.getFramesProcessed());
            r.setTotalBytesReceived(health.getTotalBytesReceived());
        }

        // Consent info
        consentRepo.findByCameraId(entity.getCameraId()).ifPresent(c -> {
            r.setConsentRevoked(c.isRevoked());
            r.setConsentTimestamp(c.getConsentTimestamp());
            r.setRetentionDays(c.getRetentionDays());
            r.setPurpose(c.getPurpose());
        });

        return r;
    }
}
