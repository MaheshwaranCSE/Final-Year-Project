package com.blockvault.service.camera;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;

class ObstructionHeuristicsTest {

    private ObstructionHeuristicsService service;

    @BeforeEach
    void setUp() {
        service = new ObstructionHeuristicsService();
    }

    private byte[] createSyntheticJpeg(Color color, int width, int height) throws IOException {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        g.setColor(color);
        g.fillRect(0, 0, width, height);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "jpg", baos);
        return baos.toByteArray();
    }

    @Test
    void testCoveredLensDetection() throws IOException {
        byte[] blackFrame = createSyntheticJpeg(Color.BLACK, 320, 240);
        String cameraId = "CAM-TEST-OBS";

        // Required consecutive frames to trigger incident
        ObstructionHeuristicsService.HeuristicEvaluation eval = null;
        for (int i = 0; i < 3; i++) {
            eval = service.evaluateFrame(cameraId, blackFrame);
        }

        assertNotNull(eval);
        assertTrue(eval.obstructionDetected(), "Black covered lens should trigger obstruction incident after 3 frames");
        assertTrue(eval.meanLuminance() < 15.0);
    }

    @Test
    void testNormalFrameDoesNotTriggerObstruction() throws IOException {
        // Create an image with variance
        BufferedImage image = new BufferedImage(320, 240, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        g.setColor(Color.BLUE);
        g.fillRect(0, 0, 160, 240);
        g.setColor(Color.YELLOW);
        g.fillRect(160, 0, 160, 240);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "jpg", baos);
        byte[] normalFrame = baos.toByteArray();

        String cameraId = "CAM-TEST-NORM";
        for (int i = 0; i < 3; i++) {
            ObstructionHeuristicsService.HeuristicEvaluation eval = service.evaluateFrame(cameraId, normalFrame);
            assertFalse(eval.obstructionDetected());
        }
    }
}
