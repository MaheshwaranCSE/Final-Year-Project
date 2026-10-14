package com.blockvault.service.camera;

import com.blockvault.entity.CameraSourceEntity;
import java.io.InputStream;
import java.util.function.Consumer;

/**
 * Universal Camera Source Abstraction
 * Decouples camera hardware protocols (Android IP Webcam, Browser Webcams, RTSP, etc.)
 * from health monitoring, evidence segmentation, hashing, and alerting.
 */
public interface CameraSource {

    String getCameraId();

    CameraSourceEntity getConfig();

    boolean testConnectivity();

    CameraHealthStatus checkHealth();

    byte[] getLatestFrame();

    void startAcquisition();

    void stopAcquisition();

    boolean isAcquiring();

    void startRecording(String sessionId);

    void stopRecording();

    boolean isRecording();

    String getActiveSessionId();

    /**
     * Registers a listener for newly acquired compressed JPEG frames.
     */
    void addFrameListener(Consumer<byte[]> listener);

    void removeFrameListener(Consumer<byte[]> listener);
}
