import { create } from 'zustand';
import {
  cameraApiService,
  CameraSourceDto,
  CameraIncidentDto,
  AlertPipelineStatusDto,
  CameraRegisterReq,
} from '../services/cameraApiService';

interface CameraState {
  cameras: CameraSourceDto[];
  incidents: CameraIncidentDto[];
  pipelineStatus: AlertPipelineStatusDto | null;
  streamTokens: Record<string, { token: string; expiresAt: number }>;
  loading: boolean;
  error: string | null;
  selectedCameraId: string | null;
  isRegisterModalOpen: boolean;
  isIncidentDrawerOpen: boolean;
  isAwsSettingsModalOpen: boolean;

  // Actions
  loadCameras: () => Promise<void>;
  loadIncidents: (cameraId?: string, status?: string) => Promise<void>;
  loadAlertPipelineStatus: () => Promise<void>;
  registerCamera: (req: CameraRegisterReq) => Promise<CameraSourceDto>;
  updateCamera: (id: string, req: Partial<CameraRegisterReq>) => Promise<void>;
  toggleCamera: (id: string) => Promise<void>;
  startRecording: (id: string, sessionId?: string) => Promise<void>;
  stopRecording: (id: string) => Promise<void>;
  revokeConsent: (id: string, reason?: string) => Promise<void>;
  resolveIncident: (incidentId: string, notes?: string) => Promise<void>;
  ensureStreamToken: (cameraId: string) => Promise<string>;
  setSelectedCameraId: (id: string | null) => void;
  setRegisterModalOpen: (open: boolean) => void;
  setIncidentDrawerOpen: (open: boolean) => void;
  setAwsSettingsModalOpen: (open: boolean) => void;
}

export const useCameraStore = create<CameraState>((set, get) => ({
  cameras: [],
  incidents: [],
  pipelineStatus: null,
  streamTokens: {},
  loading: false,
  error: null,
  selectedCameraId: null,
  isRegisterModalOpen: false,
  isIncidentDrawerOpen: false,
  isAwsSettingsModalOpen: false,

  loadCameras: async () => {
    try {
      const cameras = await cameraApiService.fetchCameras();
      set({ cameras, error: null });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  loadIncidents: async (cameraId, status) => {
    try {
      const incidents = await cameraApiService.fetchIncidents(cameraId, status);
      set({ incidents, error: null });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  loadAlertPipelineStatus: async () => {
    try {
      const pipelineStatus = await cameraApiService.fetchAlertPipelineStatus();
      set({ pipelineStatus });
    } catch (err: any) {
      console.warn('Alert pipeline status query error:', err.message);
    }
  },

  registerCamera: async (req) => {
    set({ loading: true, error: null });
    try {
      const created = await cameraApiService.registerCamera(req);
      set((state) => ({
        cameras: [...state.cameras, created],
        loading: false,
        isRegisterModalOpen: false,
      }));
      return created;
    } catch (err: any) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  updateCamera: async (id, req) => {
    try {
      const updated = await cameraApiService.updateCamera(id, req);
      set((state) => ({
        cameras: state.cameras.map((c) => (c.cameraId === id ? updated : c)),
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  toggleCamera: async (id) => {
    try {
      const toggled = await cameraApiService.toggleCamera(id);
      set((state) => ({
        cameras: state.cameras.map((c) => (c.cameraId === id ? toggled : c)),
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  startRecording: async (id, sessionId) => {
    try {
      await cameraApiService.startRecording(id, sessionId);
      await get().loadCameras();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  stopRecording: async (id) => {
    try {
      await cameraApiService.stopRecording(id);
      await get().loadCameras();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  revokeConsent: async (id, reason) => {
    try {
      await cameraApiService.revokeConsent(id, reason);
      await get().loadCameras();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  resolveIncident: async (incidentId, notes) => {
    try {
      const resolved = await cameraApiService.resolveIncident(incidentId, notes);
      set((state) => ({
        incidents: state.incidents.map((inc) =>
          inc.incidentId === incidentId ? resolved : inc
        ),
      }));
      get().loadAlertPipelineStatus();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  ensureStreamToken: async (cameraId) => {
    const existing = get().streamTokens[cameraId];
    const now = Date.now();
    // Cache token if not within 20s of expiration
    if (existing && existing.expiresAt - now > 20000) {
      return existing.token;
    }

    try {
      const res = await cameraApiService.fetchStreamToken(cameraId);
      const expiresAt = now + res.expiresInSeconds * 1000;
      set((state) => ({
        streamTokens: {
          ...state.streamTokens,
          [cameraId]: { token: res.token, expiresAt },
        },
      }));
      return res.token;
    } catch {
      return '';
    }
  },

  setSelectedCameraId: (id) => set({ selectedCameraId: id }),
  setRegisterModalOpen: (open) => set({ isRegisterModalOpen: open }),
  setIncidentDrawerOpen: (open) => set({ isIncidentDrawerOpen: open }),
  setAwsSettingsModalOpen: (open) => set({ isAwsSettingsModalOpen: open }),
}));
