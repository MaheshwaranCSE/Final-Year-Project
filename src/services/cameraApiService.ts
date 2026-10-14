export interface CameraSourceDto {
  cameraId: string;
  name: string;
  participantName: string;
  location: string;
  sourceType: string;
  streamUrl: string;
  snapshotUrl?: string;
  authUsername?: string;
  enabled: boolean;
  recordingActive: boolean;
  activeSessionId?: string;
  healthStatus: 'LIVE' | 'UNSTABLE' | 'OFFLINE_INCIDENT' | 'NOT_CONNECTED' | 'REVOKED_CONSENT' | string;
  fps: number;
  framesProcessed: number;
  totalBytesReceived: number;
  lastHealthCheck?: string;
  lastValidFrameTime?: string;
  alertOnOffline: boolean;
  alertOnObstruction: boolean;
  alertOnFrozen: boolean;
  consentRevoked: boolean;
  consentTimestamp: string;
  retentionDays: number;
  purpose: string;
  createdAt: string;
}

export interface CameraIncidentDto {
  id: number;
  incidentId: string;
  cameraId: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'RESOLVED';
  title: string;
  details: string;
  metricsJson?: string;
  sqsMessageId?: string;
  snsPublished: boolean;
  deliveryStatus: string;
  deliveryError?: string;
  detectedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export interface EvidenceSegmentDto {
  id: number;
  segmentId: string;
  cameraId: string;
  sessionId: string;
  sequenceNumber: number;
  startTimeUtc: string;
  endTimeUtc: string;
  byteLength: number;
  sha256OriginalHash: string;
  mimeType: string;
  frameCount: number;
  storagePath: string;
  status: string;
}

export interface AlertPipelineStatusDto {
  pipelineStatus: string;
  awsRegion: string;
  sqsConfigured: boolean;
  sqsQueueMasked: string;
  snsConfigured: boolean;
  snsTopicMasked: string;
  totalIncidents: number;
  openIncidents: number;
}

export interface CameraRegisterReq {
  name: string;
  participantName: string;
  location: string;
  sourceType?: string;
  streamUrl: string;
  snapshotUrl?: string;
  statusJsonUrl?: string;
  authUsername?: string;
  authPassword?: string;
  segmentDurationSeconds?: number;
  purpose: string;
  retentionDays?: number;
  noticeAccepted: boolean;
  alertOnOffline?: boolean;
  alertOnObstruction?: boolean;
  alertOnFrozen?: boolean;
}

export interface ProbeReq {
  url: string;
  username?: string;
  password?: string;
}

export interface ProbeResult {
  reachable: boolean;
  statusCode: number;
  responseTimeMs: number;
  detectedEndpoints: Record<string, boolean>;
  message: string;
  resolvedIp?: string;
}

const getBaseApiUrl = () => {
  if (
    typeof window !== 'undefined' &&
    window.location.hostname &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    return `${window.location.protocol}//${window.location.hostname}:8080/api`;
  }
  return 'http://localhost:8080/api';
};

const API_BASE = (import.meta as any).env?.VITE_BACKEND_URL || getBaseApiUrl();

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token') || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const cameraApiService = {
  getBaseUrl: () => API_BASE,

  fetchCameras: async (): Promise<CameraSourceDto[]> => {
    const res = await fetch(`${API_BASE}/cameras`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch camera inventory');
    return res.json();
  },

  getCamera: async (cameraId: string): Promise<CameraSourceDto> => {
    const res = await fetch(`${API_BASE}/cameras/${cameraId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Camera ${cameraId} not found`);
    return res.json();
  },

  registerCamera: async (req: CameraRegisterReq): Promise<CameraSourceDto> => {
    const res = await fetch(`${API_BASE}/cameras`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(req),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  updateCamera: async (cameraId: string, req: Partial<CameraRegisterReq>): Promise<CameraSourceDto> => {
    const res = await fetch(`${API_BASE}/cameras/${cameraId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(req),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Update failed');
    return data;
  },

  toggleCamera: async (cameraId: string): Promise<CameraSourceDto> => {
    const res = await fetch(`${API_BASE}/cameras/${cameraId}/toggle`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Toggle failed');
    return data;
  },

  startRecording: async (cameraId: string, sessionId?: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/cameras/${cameraId}/record/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sessionId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Start recording failed');
    return data;
  },

  stopRecording: async (cameraId: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/cameras/${cameraId}/record/stop`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Stop recording failed');
    return data;
  },

  revokeConsent: async (cameraId: string, reason?: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/cameras/${cameraId}/consent/revoke`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Revocation failed');
    return data;
  },

  probeCamera: async (req: ProbeReq): Promise<ProbeResult> => {
    const res = await fetch(`${API_BASE}/cameras/probe`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(req),
    });
    const data = await res.json();
    return data;
  },

  fetchStreamToken: async (cameraId: string): Promise<{ token: string; expiresInSeconds: number }> => {
    const res = await fetch(`${API_BASE}/cameras/${cameraId}/token`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to acquire stream token');
    return res.json();
  },

  getLiveStreamUrl: (cameraId: string, token: string) => {
    return `${API_BASE}/cameras/${cameraId}/stream?token=${encodeURIComponent(token)}`;
  },

  getSnapshotUrl: (cameraId: string, token?: string) => {
    const q = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${API_BASE}/cameras/${cameraId}/snapshot${q}`;
  },

  fetchSegments: async (cameraId: string): Promise<EvidenceSegmentDto[]> => {
    const res = await fetch(`${API_BASE}/cameras/${cameraId}/segments`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch segments');
    return res.json();
  },

  fetchIncidents: async (cameraId?: string, status?: string): Promise<CameraIncidentDto[]> => {
    const params = new URLSearchParams();
    if (cameraId) params.set('cameraId', cameraId);
    if (status) params.set('status', status);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/incidents${qs}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch incidents');
    return res.json();
  },

  resolveIncident: async (incidentId: string, notes?: string): Promise<CameraIncidentDto> => {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/resolve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ notes }),
    });
    if (!res.ok) throw new Error('Failed to resolve incident');
    return res.json();
  },

  fetchAlertPipelineStatus: async (): Promise<AlertPipelineStatusDto> => {
    const res = await fetch(`${API_BASE}/incidents/alerts/status`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch alert pipeline status');
    return res.json();
  },
};
