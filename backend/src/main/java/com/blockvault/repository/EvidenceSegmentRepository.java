package com.blockvault.repository;

import com.blockvault.entity.EvidenceSegmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EvidenceSegmentRepository extends JpaRepository<EvidenceSegmentEntity, Long> {
    Optional<EvidenceSegmentEntity> findBySegmentId(String segmentId);
    List<EvidenceSegmentEntity> findByCameraIdOrderBySequenceNumberAsc(String cameraId);
    List<EvidenceSegmentEntity> findByCameraIdOrderByStartTimeUtcDesc(String cameraId);
    List<EvidenceSegmentEntity> findBySessionIdOrderBySequenceNumberAsc(String sessionId);
    long countByCameraId(String cameraId);
}
