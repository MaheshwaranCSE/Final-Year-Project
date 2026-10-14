package com.blockvault.repository;

import com.blockvault.entity.CameraIncidentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CameraIncidentRepository extends JpaRepository<CameraIncidentEntity, Long> {
    Optional<CameraIncidentEntity> findByIncidentId(String incidentId);
    List<CameraIncidentEntity> findByCameraIdOrderByDetectedAtDesc(String cameraId);
    List<CameraIncidentEntity> findByStatusOrderByDetectedAtDesc(String status);
    List<CameraIncidentEntity> findByCameraIdAndStatus(String cameraId, String status);
    boolean existsByCameraIdAndTypeAndStatus(String cameraId, String type, String status);
    List<CameraIncidentEntity> findTop50ByOrderByDetectedAtDesc();
}
