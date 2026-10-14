package com.blockvault.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.Instant;

@Entity
@Table(name = "camera_sources")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CameraSourceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String cameraId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String participantName;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private String sourceType = "IP_WEBCAM_ANDROID"; // IP_WEBCAM_ANDROID, BROWSER_WEBCAM, RTSP_STREAM

    @Column(nullable = false, length = 1024)
    private String streamUrl;

    @Column(length = 1024)
    private String snapshotUrl;

    @Column(length = 1024)
    private String statusJsonUrl;

    private String authUsername;

    @Column(length = 1024)
    private String authPasswordEncrypted;

    private int healthCheckIntervalSeconds = 10;
    private int segmentDurationSeconds = 10;

    private boolean enabled = true;
    private boolean recordingActive = false;
    private String activeSessionId;

    @Column(nullable = false)
    private String healthStatus = "NOT_CONNECTED"; // NOT_CONNECTED, LIVE, UNSTABLE, OFFLINE_INCIDENT

    private Instant lastHealthCheck;
    private Instant lastValidFrameTime;
    private Instant lastFinishedSegmentTime;

    private int consecutiveHealthyChecks = 0;
    private int consecutiveFailedChecks = 0;

    private boolean alertOnOffline = true;
    private boolean alertOnObstruction = true;
    private boolean alertOnFrozen = true;

    private boolean privacyShutterActive = false;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();
}
