package com.blockvault.repository;

import com.blockvault.entity.CameraSourceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface CameraSourceRepository extends JpaRepository<CameraSourceEntity, Long> {
    Optional<CameraSourceEntity> findByCameraId(String cameraId);
    boolean existsByCameraId(String cameraId);
    List<CameraSourceEntity> findByEnabledTrue();
}
