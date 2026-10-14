package com.blockvault.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.Instant;

@Entity
@Table(name = "camera_consent_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConsentRecordEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String cameraId;

    @Column(nullable = false)
    private String participantName;

    @Column(nullable = false)
    private String registeredBy;

    @Column(nullable = false)
    private String purpose;

    private int retentionDays = 30;

    @Column(nullable = false)
    private boolean noticeAccepted = true;

    @Column(nullable = false)
    private Instant consentTimestamp = Instant.now();

    @Column(nullable = false)
    private boolean revoked = false;

    private Instant revokedAt;
    private String revokedBy;
    private String revocationReason;
}
