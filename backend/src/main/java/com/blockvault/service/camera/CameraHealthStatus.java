package com.blockvault.service.camera;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CameraHealthStatus {
    private String status = "NOT_CONNECTED"; // NOT_CONNECTED, LIVE, UNSTABLE, OFFLINE_INCIDENT
    private Instant lastCheckTime = Instant.now();
    private Instant lastFrameTime;
    private double fps = 0.0;
    private long totalBytesReceived = 0;
    private long framesProcessed = 0;
    private String errorDetails;
    private boolean streamActive = false;
    private int consecutiveHealthyChecks = 0;
    private int consecutiveFailedChecks = 0;
}
