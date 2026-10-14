package com.blockvault.repository;

import com.blockvault.entity.ConsentRecordEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ConsentRecordRepository extends JpaRepository<ConsentRecordEntity, Long> {
    Optional<ConsentRecordEntity> findByCameraId(String cameraId);
    boolean existsByCameraIdAndRevokedFalse(String cameraId);
}
