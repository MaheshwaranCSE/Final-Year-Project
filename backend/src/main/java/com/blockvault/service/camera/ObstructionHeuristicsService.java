package com.blockvault.service.camera;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Server-side heuristics for detecting camera lens obstruction (covered, blinded)
 * and frozen video feeds using luminance statistics and inter-frame differences.
 */
@Service
public class ObstructionHeuristicsService {

    private static final Logger log = LoggerFactory.getLogger(ObstructionHeuristicsService.class);

    public record HeuristicEvaluation(
            boolean obstructionDetected,
            boolean frozenDetected,
            double meanLuminance,
            double stdDevLuminance,
            double interFrameMad,
            String details
    ) {}

    private static class CameraHeuristicState {
        int consecutiveObstruction = 0;
        int consecutiveFrozen = 0;
        Instant lastObstructionIncidentTime;
        Instant lastFrozenIncidentTime;
        double[] previousSampleGrid;
    }

    private final Map<String, CameraHeuristicState> cameraStates = new ConcurrentHashMap<>();

    private static final int GRID_SIZE = 32; // 32x32 = 1024 sample points for speed and stability
    private static final int REQUIRED_CONSECUTIVE = 3;
    private static final long COOLDOWN_SECONDS = 60;

    /**
     * Analyzes a newly received JPEG frame for obstruction or freeze conditions.
     */
    public HeuristicEvaluation evaluateFrame(String cameraId, byte[] jpegBytes) {
        if (jpegBytes == null || jpegBytes.length < 256) {
            return new HeuristicEvaluation(false, false, 0, 0, 0, "Empty or invalid frame");
        }

        try {
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(jpegBytes));
            if (image == null) {
                return new HeuristicEvaluation(false, false, 0, 0, 0, "Unreadable image format");
            }

            int width = image.getWidth();
            int height = image.getHeight();
            if (width <= 0 || height <= 0) {
                return new HeuristicEvaluation(false, false, 0, 0, 0, "Zero dimension image");
            }

            // Downsample into 32x32 luminance grid
            double[] currentGrid = new double[GRID_SIZE * GRID_SIZE];
            double sumLum = 0.0;
            int idx = 0;

            int stepX = Math.max(1, width / GRID_SIZE);
            int stepY = Math.max(1, height / GRID_SIZE);

            for (int y = 0; y < GRID_SIZE; y++) {
                int py = Math.min(y * stepY, height - 1);
                for (int x = 0; x < GRID_SIZE; x++) {
                    int px = Math.min(x * stepX, width - 1);
                    int rgb = image.getRGB(px, py);
                    int r = (rgb >> 16) & 0xFF;
                    int g = (rgb >> 8) & 0xFF;
                    int b = rgb & 0xFF;

                    // Standard ITU-R BT.601 luminance
                    double lum = 0.299 * r + 0.587 * g + 0.114 * b;
                    currentGrid[idx++] = lum;
                    sumLum += lum;
                }
            }

            int n = currentGrid.length;
            double mean = sumLum / n;

            double sumSqDiff = 0.0;
            for (double lum : currentGrid) {
                double diff = lum - mean;
                sumSqDiff += diff * diff;
            }
            double stdDev = Math.sqrt(sumSqDiff / n);

            // Compute MAD against previous frame sample
            CameraHeuristicState state = cameraStates.computeIfAbsent(cameraId, k -> new CameraHeuristicState());
            double mad = -1.0;
            if (state.previousSampleGrid != null) {
                double diffSum = 0.0;
                for (int i = 0; i < n; i++) {
                    diffSum += Math.abs(currentGrid[i] - state.previousSampleGrid[i]);
                }
                mad = diffSum / n;
            }
            state.previousSampleGrid = currentGrid;

            // Heuristic 1: Obstruction (very low stdDev combined with either pitch-black or bleached white)
            boolean singleFrameObstruction = (stdDev < 5.0) && (mean < 20.0 || mean > 235.0);
            if (singleFrameObstruction) {
                state.consecutiveObstruction++;
            } else {
                state.consecutiveObstruction = 0;
            }

            // Heuristic 2: Frozen feed (feed is active, but pixels are completely identical over time)
            boolean singleFrameFrozen = (mad >= 0.0 && mad < 0.20);
            if (singleFrameFrozen) {
                state.consecutiveFrozen++;
            } else {
                state.consecutiveFrozen = 0;
            }

            Instant now = Instant.now();
            boolean triggerObstruction = false;
            boolean triggerFrozen = false;
            StringBuilder details = new StringBuilder();

            if (state.consecutiveObstruction >= REQUIRED_CONSECUTIVE) {
                boolean cooledDown = state.lastObstructionIncidentTime == null ||
                        (now.getEpochSecond() - state.lastObstructionIncidentTime.getEpochSecond() > COOLDOWN_SECONDS);
                if (cooledDown) {
                    triggerObstruction = true;
                    state.lastObstructionIncidentTime = now;
                    details.append(String.format("Luminance mean=%.1f, stdDev=%.2f indicates covered/blinded lens. ", mean, stdDev));
                }
            }

            if (state.consecutiveFrozen >= (REQUIRED_CONSECUTIVE + 2)) { // Require slightly more for frozen to avoid still scene false positive
                boolean cooledDown = state.lastFrozenIncidentTime == null ||
                        (now.getEpochSecond() - state.lastFrozenIncidentTime.getEpochSecond() > COOLDOWN_SECONDS);
                if (cooledDown) {
                    triggerFrozen = true;
                    state.lastFrozenIncidentTime = now;
                    details.append(String.format("Inter-frame MAD=%.3f across consecutive frames indicates frozen feed. ", mad));
                }
            }

            return new HeuristicEvaluation(
                    triggerObstruction,
                    triggerFrozen,
                    mean,
                    stdDev,
                    mad,
                    details.toString().trim()
            );

        } catch (Exception e) {
            log.warn("Error running obstruction heuristics for camera {}: {}", cameraId, e.getMessage());
            return new HeuristicEvaluation(false, false, 0, 0, 0, "Error: " + e.getMessage());
        }
    }

    public void clearCamera(String cameraId) {
        cameraStates.remove(cameraId);
    }
}
