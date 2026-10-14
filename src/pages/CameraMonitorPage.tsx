import React, { useEffect, useState } from 'react';
import {
  Video,
  Plus,
  AlertTriangle,
  Cloud,
  Layers,
  Radio,
  ShieldCheck,
  Smartphone,
  HardDrive,
  RefreshCw,
  FileCheck,
} from 'lucide-react';
import { useCameraStore } from '../stores/useCameraStore';
import { CameraTile } from '../components/camera/CameraTile';
import { CameraRegistrationModal } from '../components/camera/CameraRegistrationModal';
import { CameraIncidentDrawer } from '../components/camera/CameraIncidentDrawer';
import { AwsAlertSettingsModal } from '../components/camera/AwsAlertSettingsModal';
import { CameraSegmentsModal } from '../components/camera/CameraSegmentsModal';
import { CameraSourceDto, cameraApiService } from '../services/cameraApiService';

export default function CameraMonitorPage() {
  const {
    cameras,
    incidents,
    pipelineStatus,
    loadCameras,
    loadIncidents,
    loadAlertPipelineStatus,
    isRegisterModalOpen,
    setRegisterModalOpen,
    isIncidentDrawerOpen,
    setIncidentDrawerOpen,
    isAwsSettingsModalOpen,
    setAwsSettingsModalOpen,
    error,
  } = useCameraStore();

  const [selectedCameraForSegments, setSelectedCameraForSegments] =
    useState<CameraSourceDto | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadCameras();
    loadIncidents();
    loadAlertPipelineStatus();

    const interval = setInterval(() => {
      loadCameras();
      loadIncidents();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadCameras(), loadIncidents(), loadAlertPipelineStatus()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const openIncidentsCount = incidents.filter((i) => i.status === 'OPEN').length;
  const activeStreamsCount = cameras.filter((c) => c.healthStatus === 'LIVE').length;
  const recordingCount = cameras.filter((c) => c.recordingActive).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
              <Video className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Multi-Camera Live Evidence Monitor
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              FORENSIC V2
            </span>
          </div>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            Android IP Webcam Continuous MJPEG Acquisition · Server-Side Segmentation · AWS Alert
            Pipeline
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-white/[0.04] text-zinc-400 hover:text-white border border-white/[0.08] hover:bg-white/[0.08] transition"
            title="Refresh All Cameras & Health"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* AWS SQS/SNS Alert Status Button */}
          <button
            onClick={() => setAwsSettingsModalOpen(true)}
            className="px-3 py-2 rounded-xl text-xs font-mono bg-white/[0.04] text-zinc-300 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white flex items-center gap-2 transition"
          >
            <Cloud className="w-4 h-4 text-orange-400" />
            <span>AWS Alerts</span>
            {pipelineStatus?.pipelineStatus === 'ACTIVE_END_TO_END' ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            ) : (
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Local
              </span>
            )}
          </button>

          {/* Incident Drawer Button */}
          <button
            onClick={() => setIncidentDrawerOpen(true)}
            className={`px-3 py-2 rounded-xl text-xs font-mono flex items-center gap-2 transition border ${
              openIncidentsCount > 0
                ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 hover:bg-rose-500/25 animate-pulse'
                : 'bg-white/[0.04] text-zinc-300 border-white/[0.08] hover:bg-white/[0.08] hover:text-white'
            }`}
          >
            <AlertTriangle
              className={`w-4 h-4 ${openIncidentsCount > 0 ? 'text-rose-400' : 'text-zinc-400'}`}
            />
            <span>Incidents</span>
            {openIncidentsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                {openIncidentsCount}
              </span>
            )}
          </button>

          {/* Register Camera Button */}
          <button
            onClick={() => setRegisterModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-cyan-500 text-black hover:bg-cyan-400 flex items-center gap-2 transition shadow-[0_0_20px_rgba(6,182,212,0.35)]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Register Camera</span>
          </button>
        </div>
      </div>

      {/* Backend Connection Alert if Error */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs font-mono">
            <div className="font-bold text-rose-300">
              Backend Connection Warning: Unable to reach {cameraApiService.getBaseUrl()}
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Ensure your local Spring Boot backend is active on <code className="text-cyan-400">http://localhost:8080</code>.
              {typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') && (
                <span className="block text-amber-300 mt-1">
                  Notice: You are viewing BlockVault on Vercel. Because your Android IP Webcam is located on your private local network, open BlockVault locally on this PC at <strong className="text-white">http://localhost:3000/cameras</strong> to access the local backend engine and live stream.
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#0C101D] border border-white/[0.08] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              Live Feeds
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {activeStreamsCount}{' '}
              <span className="text-xs font-normal text-zinc-500">/ {cameras.length} active</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0C101D] border border-white/[0.08] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              Recording
            </div>
            <div className="text-lg font-bold text-rose-400 font-mono">
              {recordingCount}{' '}
              <span className="text-xs font-normal text-zinc-500">sessions</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0C101D] border border-white/[0.08] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              Open Incidents
            </div>
            <div className="text-lg font-bold text-amber-400 font-mono">
              {openIncidentsCount}{' '}
              <span className="text-xs font-normal text-zinc-500">alerts</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0C101D] border border-white/[0.08] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              Chain of Custody
            </div>
            <div className="text-lg font-bold text-emerald-400 font-mono">
              SHA-256{' '}
              <span className="text-xs font-normal text-zinc-500">segmented</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Camera Grid */}
      {cameras.length === 0 ? (
        <div className="bg-[#0C101D] border border-white/[0.08] rounded-2xl p-12 text-center max-w-2xl mx-auto space-y-4 my-8">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
            <Smartphone className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No Camera Sources Connected</h3>
            <p className="text-xs font-mono text-zinc-400 max-w-md mx-auto leading-relaxed">
              Connect your Android phone running the "IP Webcam" app to stream live video evidence
              directly into BlockVault.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#060911] border border-white/[0.06] text-left text-xs font-mono space-y-2 max-w-md mx-auto text-zinc-300">
            <div className="text-cyan-400 font-bold">Quick Setup Guide:</div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-zinc-400">
              <li>Install "IP Webcam" from Google Play Store on your Android phone.</li>
              <li>Connect phone to the same Wi-Fi network as this computer.</li>
              <li>Scroll to bottom in IP Webcam and tap "Start server".</li>
              <li>Note the displayed IP address (e.g. http://192.168.1.xxx:8080).</li>
              <li>Click "Register Camera" below to register and start evidence acquisition.</li>
            </ol>
          </div>

          <button
            onClick={() => setRegisterModalOpen(true)}
            className="px-6 py-2.5 rounded-xl text-xs font-mono font-semibold bg-cyan-500 text-black hover:bg-cyan-400 transition shadow-[0_0_20px_rgba(6,182,212,0.4)]"
          >
            Register First IP Webcam
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cameras.map((camera) => (
            <CameraTile
              key={camera.cameraId}
              camera={camera}
              onOpenSegments={(c) => setSelectedCameraForSegments(c)}
            />
          ))}
        </div>
      )}

      {/* Modals & Slide-out Drawers */}
      <CameraRegistrationModal
        open={isRegisterModalOpen}
        onClose={() => setRegisterModalOpen(false)}
      />

      <CameraIncidentDrawer
        open={isIncidentDrawerOpen}
        onClose={() => setIncidentDrawerOpen(false)}
      />

      <AwsAlertSettingsModal
        open={isAwsSettingsModalOpen}
        onClose={() => setAwsSettingsModalOpen(false)}
      />

      <CameraSegmentsModal
        camera={selectedCameraForSegments}
        onClose={() => setSelectedCameraForSegments(null)}
      />
    </div>
  );
}
