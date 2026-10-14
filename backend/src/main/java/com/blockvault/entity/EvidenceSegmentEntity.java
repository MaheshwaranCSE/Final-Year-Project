package com.blockvault.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.Instant;

@Entity
@Table(name = "camera_evidence_segments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EvidenceSegmentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String segmentId;

    @Column(nullable = false)
    private String cameraId;

    @Column(nullable = false)
    private String sessionId;

    @Column(nullable = false)
    private long sequenceNumber;

    @Column(nullable = false)
    private Instant startTimeUtc;

    @Column(nullable = false)
    private Instant endTimeUtc;

    @Column(nullable = false)
    private long byteLength;

    /**
     * Genuine cryptographic SHA-256 computed over the exact stored compressed payload bytes.
     */
    @Column(nullable = false, length = 64)
    private String sha256OriginalHash;

    @Column(nullable = false)
    private String mimeType = "multipart/x-mixed-replace";

    private int frameCount = 0;

    @Column(nullable = false, length = 1024)
    private String storagePath;

    @Column(nullable = false)
    private String status = "FINALIZED"; // FINALIZED, FAILED, CORRUPT

    private Long anchoredBlockHeight;
    private String anchoredTxId;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
