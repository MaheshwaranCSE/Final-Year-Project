import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Radio,
  Play,
  Square,
  AlertTriangle,
  ShieldAlert,
  Clock,
  HardDrive,
  FileCheck,
  RefreshCw,
  Power,
  Eye,
} from 'lucide-react';
import { CameraSourceDto, cameraApiService, EvidenceSegmentDto } from '../../services/cameraApiService';
import { useCameraStore } from '../../stores/useCameraStore';

interface CameraTileProps {
  camera: CameraSourceDto;
  onOpenSegments: (camera: CameraSourceDto) => void;
}

export const CameraTile: React.FC<CameraTileProps> = ({ camera, onOpenSegments }) => {
  const { toggleCamera, startRecording, stopRecording, revokeConsent, ensureStreamToken } =
    useCameraStore();

  const [streamToken, setStreamToken] = useState<string>('');
  const [streamError, setStreamError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [segmentsCount, setSegmentsCount] = useState<number>(0);

  const imgRef = useRef<HTMLImageElement>(null);

  // Refresh token on mount or every 90 seconds
  const refreshToken = async () => {
    setIsRefreshing(true);
    setStreamError(false);
    try {
      const token = await ensureStreamToken(camera.cameraId);
      setStreamToken(token);
    } catch {
      setStreamError(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (camera.enabled && !camera.consentRevoked) {
      refreshToken();
      const interval = setInterval(refreshToken, 90000);
      return () => clearInterval(interval);
    }
  }, [camera.cameraId, camera.enabled, camera.consentRevoked]);

  // Load segment count
  useEffect(() => {
    cameraApiService
      .fetchSegments(camera.cameraId)
      .then((segs) => setSegmentsCount(segs.length))
      .catch(() => setSegmentsCount(0));
  }, [camera.cameraId, camera.recordingActive]);

  const handleToggle = async () => {
    setActionLoading(true);
    try {
      await toggleCamera(camera.cameraId);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleRecord = async () => {
    setActionLoading(true);
    try {
      if (camera.recordingActive) {
        await stopRecording(camera.cameraId);
      } else {
        const sessId = `SESSION-${Date.now().toString(36).toUpperCase()}`;
        await startRecording(camera.cameraId, sessId);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to revoke consent for ${camera.participantName}? The stream and recording will stop immediately.`
    );
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await revokeConsent(camera.cameraId, 'Revoked by operator in Camera Monitor');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (camera.consentRevoked) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1.5">
          <ShieldAlert className="w-3 h-3" />
          CONSENT REVOKED
        </span>
      );
    }
    if (!camera.enabled) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/30 flex items-center gap-1.5">
          <Power className="w-3 h-3" />
          DISABLED
        </span>
      );
    }
    switch (camera.healthStatus) {
      case 'LIVE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE · {camera.fps > 0 ? `${camera.fps.toFixed(1)} FPS` : 'STREAMING'}
          </span>
        );
      case 'UNSTABLE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            UNSTABLE
          </span>
        );
      case 'OFFLINE_INCIDENT':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
            <VideoOff className="w-3 h-3" />
            OFFLINE ALERT
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-500/10 text-slate-400 border border-slate-500/30 flex items-center gap-1.5">
            <Radio className="w-3 h-3" />
            CONNECTING...
          </span>
        );
    }
  };

  const streamSrc =
    camera.enabled && !camera.consentRevoked && streamToken && !streamError
      ? cameraApiService.getLiveStreamUrl(camera.cameraId, streamToken)
      : '';

  return (
    <div className="bg-[#0B101E] border border-white/[0.08] rounded-xl overflow-hidden shadow-lg flex flex-col group transition-all hover:border-cyan-500/30">
      {/* Tile Header */}
      <div className="p-3 bg-[#080C16] border-b border-white/[0.06] flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-white truncate">{camera.name}</span>
            <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20">
              {camera.cameraId}
            </span>
          </div>
          <p className="text-[11px] font-mono text-zinc-400 truncate">
            {camera.location} · {camera.participantName}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">{getStatusBadge()}</div>
      </div>

      {/* Video Viewport Area */}
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
        {/* Stream disclaimer watermark (per requirement 3.3) */}
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm border border-white/10 text-[9px] font-mono uppercase tracking-wider text-amber-300">
          LIVE PREVIEW — NOT PRESERVED EVIDENCE
        </div>

        {/* Recording active glowing indicator */}
        {camera.recordingActive && (
          <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded bg-rose-950/80 backdrop-blur-sm border border-rose-500/50 text-[10px] font-mono font-semibold text-rose-300 flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]" />
            RECORDING
          </div>
        )}

        {/* Video feed or fallback placeholder */}
        {streamSrc ? (
          <img
            ref={imgRef}
            src={streamSrc}
            alt={camera.name}
            onError={() => setStreamError(true)}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-500 space-y-2">
            {camera.consentRevoked ? (
              <>
                <ShieldAlert className="w-10 h-10 text-purple-400/60" />
                <p className="text-xs font-mono text-purple-300">Participant Consent Revoked</p>
                <p className="text-[10px] text-zinc-500">Stream halted to protect participant rights.</p>
              </>
            ) : !camera.enabled ? (
              <>
                <Power className="w-10 h-10 text-zinc-600" />
                <p className="text-xs font-mono text-zinc-400">Camera Feed is Disabled</p>
                <button
                  onClick={handleToggle}
                  disabled={actionLoading}
                  className="px-2.5 py-1 text-[11px] font-mono bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/40 hover:bg-cyan-500/30"
                >
                  Enable Camera
                </button>
              </>
            ) : streamError ? (
              <>
                <VideoOff className="w-10 h-10 text-rose-400/60" />
                <p className="text-xs font-mono text-rose-300">Stream Connection Offline</p>
                <button
                  onClick={refreshToken}
                  disabled={isRefreshing}
                  className="px-2.5 py-1 text-[11px] font-mono bg-zinc-800 text-zinc-300 rounded border border-zinc-700 hover:bg-zinc-700 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Retry Connection
                </button>
              </>
            ) : (
              <>
                <Radio className="w-10 h-10 text-cyan-400/40 animate-pulse" />
                <p className="text-xs font-mono text-zinc-400">Authenticating Stream Token...</p>
              </>
            )}
          </div>
        )}

        {/* Lower overlay with quick stats */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2 flex items-center justify-between text-[10px] font-mono text-zinc-300">
          <div className="flex items-center gap-3">
            <span>Frames: {camera.framesProcessed.toLocaleString()}</span>
            <span>Bytes: {(camera.totalBytesReceived / (1024 * 1024)).toFixed(1)} MB</span>
          </div>
          <button
            onClick={refreshToken}
            title="Refresh stream token"
            className="p-1 hover:text-white rounded bg-white/5"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Control Actions Toolbar */}
      <div className="p-3 bg-[#080C16] border-t border-white/[0.06] flex items-center justify-between gap-2">
        {/* Record toggle */}
        <button
          onClick={handleToggleRecord}
          disabled={actionLoading || !camera.enabled || camera.consentRevoked}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition cursor-pointer ${
            camera.recordingActive
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
              : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {camera.recordingActive ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              Stop & Finalize
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              Capture Evidence
            </>
          )}
        </button>

        {/* Preserved Segments button */}
        <button
          onClick={() => onOpenSegments(camera)}
          className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-white/[0.04] text-zinc-300 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white flex items-center gap-1.5 transition"
        >
          <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Segments ({segmentsCount})</span>
        </button>

        {/* Right buttons: Toggle Power & Revoke Consent */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleToggle}
            title={camera.enabled ? 'Disable Camera Stream' : 'Enable Camera Stream'}
            className={`p-1.5 rounded-lg text-xs border transition ${
              camera.enabled
                ? 'bg-white/[0.04] text-zinc-400 border-white/[0.08] hover:text-white'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
          </button>

          {!camera.consentRevoked && (
            <button
              onClick={handleRevoke}
              title="Revoke Participant Consent"
              className="p-1.5 rounded-lg text-xs bg-purple-500/10 text-purple-400 border border-purple-500/25 hover:bg-purple-500/20 transition"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
