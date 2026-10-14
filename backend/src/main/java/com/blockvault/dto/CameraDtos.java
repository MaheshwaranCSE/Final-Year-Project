package com.blockvault.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.Instant;
import java.util.Map;

public class CameraDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CameraRegisterRequest {
        private String name;
        private String participantName;
        private String location;
        private String sourceType = "IP_WEBCAM_ANDROID";
        private String streamUrl;
        private String snapshotUrl;
        private String statusJsonUrl;
        private String authUsername;
        private String authPassword;
        private int segmentDurationSeconds = 10;
        private String purpose;
        private int retentionDays = 30;
        private boolean noticeAccepted = false;
        private boolean alertOnOffline = true;
        private boolean alertOnObstruction = true;
        private boolean alertOnFrozen = true;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CameraUpdateRequest {
        private String name;
        private String location;
        private int segmentDurationSeconds = 10;
        private boolean alertOnOffline = true;
        private boolean alertOnObstruction = true;
        private boolean alertOnFrozen = true;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CameraResponse {
        private String cameraId;
        private String name;
        private String participantName;
        private String location;
        private String sourceType;
        private String streamUrl;
        private String snapshotUrl;
        private String authUsername;
        private boolean enabled;
        private boolean recordingActive;
        private String activeSessionId;
        private String healthStatus;
        private double fps;
        private long framesProcessed;
        private long totalBytesReceived;
        private Instant lastHealthCheck;
        private Instant lastValidFrameTime;
        private boolean alertOnOffline;
        private boolean alertOnObstruction;
        private boolean alertOnFrozen;
        private boolean consentRevoked;
        private Instant consentTimestamp;
        private int retentionDays;
        private String purpose;
        private Instant createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CameraProbeRequest {
        private String url;
        private String username;
        private String password;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CameraProbeResponse {
        private boolean reachable;
        private int statusCode;
        private long responseTimeMs;
        private Map<String, Boolean> detectedEndpoints;
        private String message;
        private String resolvedIp;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StartRecordingRequest {
        private String sessionId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevokeConsentRequest {
        private String reason;
    }
}
