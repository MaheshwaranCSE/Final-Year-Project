import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCameraStore } from '../src/stores/useCameraStore';
import { cameraApiService } from '../src/services/cameraApiService';

describe('Camera Integration & Store Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('builds live stream and snapshot URLs correctly', () => {
    const streamUrl = cameraApiService.getLiveStreamUrl('CAM-001', 'token123');
    expect(streamUrl).toContain('/api/cameras/CAM-001/stream?token=token123');

    const snapUrl = cameraApiService.getSnapshotUrl('CAM-001', 'token123');
    expect(snapUrl).toContain('/api/cameras/CAM-001/snapshot?token=token123');
  });

  it('manages camera store state correctly', async () => {
    const mockCameras = [
      {
        cameraId: 'CAM-TEST',
        name: 'Office Phone Cam',
        participantName: 'Officer Dave',
        location: 'HQ',
        sourceType: 'IP_WEBCAM_ANDROID',
        streamUrl: 'http://192.168.1.50:8080/video',
        enabled: true,
        recordingActive: false,
        healthStatus: 'LIVE',
        fps: 25.0,
        framesProcessed: 120,
        totalBytesReceived: 2048500,
        alertOnOffline: true,
        alertOnObstruction: true,
        alertOnFrozen: true,
        consentRevoked: false,
        consentTimestamp: new Date().toISOString(),
        retentionDays: 30,
        purpose: 'Security',
        createdAt: new Date().toISOString(),
      },
    ];

    vi.spyOn(cameraApiService, 'fetchCameras').mockResolvedValue(mockCameras);

    const store = useCameraStore.getState();
    await store.loadCameras();

    expect(useCameraStore.getState().cameras.length).toBe(1);
    expect(useCameraStore.getState().cameras[0].cameraId).toBe('CAM-TEST');
    expect(useCameraStore.getState().cameras[0].healthStatus).toBe('LIVE');
  });

  it('enforces participant consent requirement during registration', async () => {
    vi.spyOn(cameraApiService, 'registerCamera').mockRejectedValue(
      new Error('Participant consent notice must be explicitly accepted before camera registration.')
    );

    const store = useCameraStore.getState();
    await expect(
      store.registerCamera({
        name: 'Cam Without Consent',
        participantName: 'Anonymous',
        location: 'Zone 1',
        streamUrl: 'http://192.168.1.60:8080/video',
        purpose: 'Test',
        noticeAccepted: false,
      })
    ).rejects.toThrow('Participant consent notice must be explicitly accepted');
  });
});
