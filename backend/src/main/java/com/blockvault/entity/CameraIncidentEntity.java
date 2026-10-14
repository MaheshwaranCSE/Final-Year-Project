package com.blockvault.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.Instant;

@Entity
@Table(name = "camera_incidents")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CameraIncidentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String incidentId;

    @Column(nullable = false)
    private String cameraId;

    @Column(nullable = false)
    private String type; // OFFLINE, STREAM_UNAVAILABLE, RECORDING_FAILURE, MISSING_FRAMES, POSSIBLE_OBSTRUCTION, POSSIBLE_FROZEN_FEED, RECOVERY

    @Column(nullable = false)
    private String severity; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(nullable = false)
    private String status = "OPEN"; // OPEN, RESOLVED

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 4096)
    private String details;

    @Column(length = 2048)
    private String metricsJson;

    private String sqsMessageId;
    private boolean snsPublished = false;

    @Column(nullable = false)
    private String deliveryStatus = "PENDING"; // PENDING, PUBLISHED_TO_SNS, FAILED, AWS_NOT_CONFIGURED

    @Column(length = 1024)
    private String deliveryError;

    @Column(nullable = false)
    private Instant detectedAt = Instant.now();

    private Instant resolvedAt;
    private String resolvedBy;
    private String resolutionNotes;
}
