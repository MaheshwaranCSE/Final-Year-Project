package com.blockvault.service.camera;

import com.blockvault.entity.EvidenceSegmentEntity;
import com.blockvault.repository.CameraIncidentRepository;
import com.blockvault.repository.EvidenceSegmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mockito;
import org.springframework.test.util.ReflectionTestUtils;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class SegmentRecorderServiceTest {

    private SegmentRecorderService segmentRecorder;
    private EvidenceSegmentRepository segmentRepo;
    private CameraIncidentRepository incidentRepo;

    @TempDir
    Path tempStorageDir;

    @BeforeEach
    void setUp() {
        segmentRecorder = new SegmentRecorderService();
        segmentRepo = Mockito.mock(EvidenceSegmentRepository.class);
        incidentRepo = Mockito.mock(CameraIncidentRepository.class);

        ReflectionTestUtils.setField(segmentRecorder, "storageBaseDir", tempStorageDir.toString());
        ReflectionTestUtils.setField(segmentRecorder, "segmentRepo", segmentRepo);
        ReflectionTestUtils.setField(segmentRecorder, "incidentRepo", incidentRepo);

        when(segmentRepo.save(any(EvidenceSegmentEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private byte[] createTestJpegFrame(Color color) throws IOException {
        BufferedImage img = new BufferedImage(160, 120, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setColor(color);
        g.fillRect(0, 0, 160, 120);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "jpg", baos);
        return baos.toByteArray();
    }

    @Test
    void testSegmentRecordingSha256AndMarkers() throws Exception {
        String cameraId = "CAM-AUDIT-01";
        String sessionId = "SESS-AUDIT-TEST";

        byte[] frame1 = createTestJpegFrame(Color.RED);
        byte[] frame2 = createTestJpegFrame(Color.GREEN);

        // Verify that frames begin with SOI (0xFF, 0xD8) and end with EOI (0xFF, 0xD9)
        assertEquals((byte) 0xFF, frame1[0]);
        assertEquals((byte) 0xD8, frame1[1]);
        assertEquals((byte) 0xFF, frame1[frame1.length - 2]);
        assertEquals((byte) 0xD9, frame1[frame1.length - 1]);

        // Push frames into segment recorder
        segmentRecorder.onFrameReceived(cameraId, sessionId, frame1, 10);
        segmentRecorder.onFrameReceived(cameraId, sessionId, frame2, 10);

        // Finalize segment
        EvidenceSegmentEntity segment = segmentRecorder.finalizeSegment(cameraId);

        assertNotNull(segment, "Segment should be finalized");
        assertEquals(cameraId, segment.getCameraId());
        assertEquals(sessionId, segment.getSessionId());
        assertEquals(2, segment.getFrameCount());
        assertEquals(frame1.length + frame2.length, segment.getByteLength());
        assertTrue(segment.getSegmentId().startsWith("SEG-" + cameraId));

        // Verify physical file on disk
        File segmentFile = new File(segment.getStoragePath());
        assertTrue(segmentFile.exists(), "Segment file must exist on disk");
        assertEquals(segment.getByteLength(), segmentFile.length(), "File size must match segment byte length");

        // Independent SHA-256 calculation directly from physical disk file
        byte[] fileBytes = Files.readAllBytes(segmentFile.toPath());
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        String actualFileSha256 = HexFormat.of().formatHex(digest.digest(fileBytes));

        assertEquals(actualFileSha256, segment.getSha256OriginalHash(),
                "Recorded SHA-256 MUST exactly match raw file bytes digest");

        // Verify segment starts with JPEG SOI
        assertEquals((byte) 0xFF, fileBytes[0]);
        assertEquals((byte) 0xD8, fileBytes[1]);
        // Verify segment ends with JPEG EOI
        assertEquals((byte) 0xFF, fileBytes[fileBytes.length - 2]);
        assertEquals((byte) 0xD9, fileBytes[fileBytes.length - 1]);
    }
}
