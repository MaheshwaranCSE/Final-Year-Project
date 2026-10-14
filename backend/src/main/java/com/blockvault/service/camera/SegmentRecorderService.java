package com.blockvault.service.camera;

import com.blockvault.entity.CameraIncidentEntity;
import com.blockvault.entity.EvidenceSegmentEntity;
import com.blockvault.repository.CameraIncidentRepository;
import com.blockvault.repository.EvidenceSegmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Authoritative Server-Side Segment Recorder
 * Buffers exact compressed MJPEG payload bytes into fixed duration segments (~10s),
 * writes unmodified original evidence to disk, and computes cryptographic SHA-256 digests.
 */
@Service
public class SegmentRecorderService {

    private static final Logger log = LoggerFactory.getLogger(SegmentRecorderService.class);

    @Value("${app.camera.storage.dir:./data/camera-evidence}")
    private String storageBaseDir;

    @Autowired
    private EvidenceSegmentRepository segmentRepo;

    @Autowired
    private CameraIncidentRepository incidentRepo;

    private static class ActiveSegmentBuffer {
        final String cameraId;
        final String sessionId;
        final long sequenceNumber;
        final Instant startTimeUtc;
        final ByteArrayOutputStream streamBuffer = new ByteArrayOutputStream(524288); // 512 KB initial
        int frameCount = 0;

        ActiveSegmentBuffer(String cameraId, String sessionId, long sequenceNumber) {
            this.cameraId = cameraId;
            this.sessionId = sessionId;
            this.sequenceNumber = sequenceNumber;
            this.startTimeUtc = Instant.now();
        }
    }

    private final Map<String, ActiveSegmentBuffer> activeBuffers = new ConcurrentHashMap<>();
    private final Map<String, Long> cameraSequenceCounters = new ConcurrentHashMap<>();

    public void onFrameReceived(String cameraId, String sessionId, byte[] rawJpegBytes, int targetDurationSec) {
        if (rawJpegBytes == null || rawJpegBytes.length == 0 || sessionId == null) {
            return;
        }

        ActiveSegmentBuffer buffer = activeBuffers.computeIfAbsent(cameraId, id -> {
            long seq = cameraSequenceCounters.compute(cameraId, (k, v) -> v == null ? 1L : v + 1L);
            return new ActiveSegmentBuffer(cameraId, sessionId, seq);
        });

        // Append MJPEG multipart packet bytes
        try {
            buffer.streamBuffer.write(rawJpegBytes);
            buffer.frameCount++;
        } catch (IOException e) {
            log.error("Error writing frame to segment buffer for camera {}: {}", cameraId, e.getMessage());
        }

        // Check if target segment duration has elapsed
        long elapsedSeconds = Instant.now().getEpochSecond() - buffer.startTimeUtc.getEpochSecond();
        if (elapsedSeconds >= targetDurationSec && buffer.frameCount > 0) {
            finalizeSegment(cameraId);
        }
    }

    public synchronized EvidenceSegmentEntity finalizeSegment(String cameraId) {
        ActiveSegmentBuffer buffer = activeBuffers.remove(cameraId);
        if (buffer == null || buffer.frameCount == 0) {
            return null;
        }

        Instant endTimeUtc = Instant.now();
        byte[] payloadBytes = buffer.streamBuffer.toByteArray();

        String segmentId = String.format("SEG-%s-%d-%03d", buffer.cameraId, buffer.startTimeUtc.getEpochSecond(), buffer.sequenceNumber);

        // 1. Validate structure
        if (payloadBytes.length < 512) {
            log.warn("Corrupt/Empty segment {} for camera {} ({} bytes)", segmentId, cameraId, payloadBytes.length);
            recordRecordingFailureIncident(cameraId, "Corrupt/Empty segment: received only " + payloadBytes.length + " bytes.");
            return null;
        }

        // 2. Compute authentic SHA-256 over exact compressed stored bytes
        String sha256Hash;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(payloadBytes);
            sha256Hash = HexFormat.of().formatHex(hashBytes);
        } catch (Exception e) {
            log.error("Failed to compute SHA-256 for segment {}: {}", segmentId, e.getMessage());
            return null;
        }

        // 3. Persist exact raw payload to disk
        String relativePath = String.format("%s/%s/%s.mjpeg", buffer.cameraId, buffer.sessionId, segmentId);
        Path targetPath = Paths.get(storageBaseDir, relativePath);
        try {
            Files.createDirectories(targetPath.getParent());
            try (FileOutputStream fos = new FileOutputStream(targetPath.toFile())) {
                fos.write(payloadBytes);
                fos.flush();
            }
        } catch (IOException e) {
            log.error("Failed to write evidence segment file to disk: {}", e.getMessage());
            recordRecordingFailureIncident(cameraId, "Disk I/O error saving segment: " + e.getMessage());
            return null;
        }

        // 4. Save metadata in JPA repository
        EvidenceSegmentEntity segment = new EvidenceSegmentEntity();
        segment.setSegmentId(segmentId);
        segment.setCameraId(buffer.cameraId);
        segment.setSessionId(buffer.sessionId);
        segment.setSequenceNumber(buffer.sequenceNumber);
        segment.setStartTimeUtc(buffer.startTimeUtc);
        segment.setEndTimeUtc(endTimeUtc);
        segment.setByteLength(payloadBytes.length);
        segment.setSha256OriginalHash(sha256Hash);
        segment.setMimeType("multipart/x-mixed-replace");
        segment.setFrameCount(buffer.frameCount);
        segment.setStoragePath(targetPath.toAbsolutePath().toString());
        segment.setStatus("FINALIZED");
        segment.setCreatedAt(Instant.now());

        EvidenceSegmentEntity saved = segmentRepo.save(segment);
        log.info("FINALIZED Evidence Segment {}: {} frames, {} bytes, SHA-256: {}",
                segmentId, buffer.frameCount, payloadBytes.length, sha256Hash);

        return saved;
    }

    private void recordRecordingFailureIncident(String cameraId, String reason) {
        CameraIncidentEntity incident = new CameraIncidentEntity();
        incident.setIncidentId("INC-REC-" + UUID.randomUUID().toString().substring(0, 8));
        incident.setCameraId(cameraId);
        incident.setType("RECORDING_FAILURE");
        incident.setSeverity("HIGH");
        incident.setStatus("OPEN");
        incident.setTitle("Evidence Recording Segment Failure — " + cameraId);
        incident.setDetails("Evidence segment failed integrity checks: " + reason);
        incident.setDetectedAt(Instant.now());
        incidentRepo.save(incident);
    }
}
