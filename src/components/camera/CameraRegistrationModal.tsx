import React, { useState } from 'react';
import {
  X,
  Camera,
  Smartphone,
  Shield,
  ShieldCheck,
  Radio,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Lock,
} from 'lucide-react';
import { useCameraStore } from '../../stores/useCameraStore';
import { cameraApiService, ProbeResult } from '../../services/cameraApiService';

interface CameraRegistrationModalProps {
  open: boolean;
  onClose: () => void;
}

export const CameraRegistrationModal: React.FC<CameraRegistrationModalProps> = ({
  open,
  onClose,
}) => {
  const { registerCamera } = useCameraStore();

  const [name, setName] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [location, setLocation] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [snapshotUrl, setSnapshotUrl] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [purpose, setPurpose] = useState('Digital Forensics & Surveillance Integrity');
  const [retentionDays, setRetentionDays] = useState(30);
  const [segmentDuration, setSegmentDuration] = useState(10);
  const [noticeAccepted, setNoticeAccepted] = useState(false);

  const [alertOnOffline, setAlertOnOffline] = useState(true);
  const [alertOnObstruction, setAlertOnObstruction] = useState(true);
  const [alertOnFrozen, setAlertOnFrozen] = useState(true);

  const [probing, setProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<ProbeResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!open) return null;

  const handleProbe = async () => {
    if (!streamUrl.trim()) {
      setErrorMessage('Please enter a stream URL before running probe.');
      return;
    }
    setProbing(true);
    setErrorMessage('');
    setProbeResult(null);

    try {
      const res = await cameraApiService.probeCamera({
        url: streamUrl.trim(),
        username: authUsername.trim() || undefined,
        password: authPassword.trim() || undefined,
      });
      setProbeResult(res);
      if (!res.reachable) {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Probe request failed');
    } finally {
      setProbing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeAccepted) {
      setErrorMessage('You must accept and verify participant consent before registering.');
      return;
    }
    if (!participantName.trim()) {
      setErrorMessage('Participant name is required.');
      return;
    }
    if (!streamUrl.trim()) {
      setErrorMessage('Stream URL is required.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      await registerCamera({
        name: name.trim() || `Android IP Camera (${participantName.trim()})`,
        participantName: participantName.trim(),
        location: location.trim() || 'Command Center / Evidence Room',
        sourceType: 'IP_WEBCAM_ANDROID',
        streamUrl: streamUrl.trim(),
        snapshotUrl: snapshotUrl.trim() || undefined,
        authUsername: authUsername.trim() || undefined,
        authPassword: authPassword.trim() || undefined,
        segmentDurationSeconds: segmentDuration,
        purpose: purpose.trim(),
        retentionDays,
        noticeAccepted,
        alertOnOffline,
        alertOnObstruction,
        alertOnFrozen,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to register camera source');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0C101D] border border-white/[0.1] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-[#080C16] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Register Camera Source</h2>
              <p className="text-xs font-mono text-zinc-400">
                Android IP Webcam · Local Wi-Fi / VPN Mesh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Section 1: Device Information */}
          <div className="space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" />
              Device & Endpoint Configuration
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono text-zinc-400">Camera Name</label>
                <input
                  type="text"
                  placeholder="e.g. Phone Cam 01 (Entrance)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 bg-[#060911] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400">Physical Location</label>
                <input
                  type="text"
                  placeholder="e.g. Evidence Locker A"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full mt-1 bg-[#060911] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-zinc-400">
                  Stream URL (MJPEG /videofeed or /video) *
                </label>
                <span className="text-[10px] font-mono text-zinc-500">
                  IPv4 or IPv6 (e.g. http://192.168.1.x:8080/video or http://[ipv6]:8080/video)
                </span>
              </div>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="http://192.168.1.xxx:8080/video or http://[2001:...]:8080/video"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  className="flex-1 bg-[#060911] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60"
                />
                <button
                  type="button"
                  onClick={handleProbe}
                  disabled={probing || !streamUrl.trim()}
                  className="px-3 py-2 rounded-xl text-xs font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 transition disabled:opacity-40"
                >
                  {probing ? 'Testing...' : 'Test Probe'}
                </button>
              </div>
            </div>

            {/* Probe Results Feedback Banner */}
            {probeResult && (
              <div
                className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                  probeResult.reachable
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {probeResult.reachable ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  )}
                  <span>{probeResult.message}</span>
                  {probeResult.responseTimeMs > 0 && (
                    <span className="ml-auto text-[10px] text-zinc-400">
                      {probeResult.responseTimeMs} ms
                    </span>
                  )}
                </div>
                {probeResult.resolvedIp && (
                  <div className="text-[10px] text-zinc-400">
                    Destination IP resolved to: {probeResult.resolvedIp}
                  </div>
                )}
                {probeResult.detectedEndpoints && (
                  <div className="flex gap-3 text-[10px] pt-1">
                    <span>
                      /video:{' '}
                      {probeResult.detectedEndpoints['/video'] ? '✓ Supported' : '✗ Missing'}
                    </span>
                    <span>
                      /shot.jpg:{' '}
                      {probeResult.detectedEndpoints['/shot.jpg'] ? '✓ Supported' : '✗ Missing'}
                    </span>
                    <span>
                      /status.json:{' '}
                      {probeResult.detectedEndpoints['/status.json'] ? '✓ Supported' : '✗ Missing'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Optional Basic Auth */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-mono text-zinc-400">Username (Optional)</label>
                <input
                  type="text"
                  placeholder="IP Webcam Login"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  className="w-full mt-1 bg-[#060911] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-zinc-400">Password (Optional)</label>
                <input
                  type="password"
                  placeholder="IP Webcam Password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full mt-1 bg-[#060911] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>
            </div>

            {/* SSRF Safety Notice */}
            <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-start gap-2 text-[11px] font-mono text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>SSRF Protection Enforced:</strong> Loopback (127.0.0.1, localhost), AWS IMDS
                (169.254.169.254), and non-streaming ports are blocked. Passwords remain server-side
                and are never leaked in client code.
              </span>
            </div>
          </div>

          {/* Section 2: Mandatory Participant Consent & Privacy */}
          <div className="space-y-3 pt-2 border-t border-white/[0.08]">
            <div className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Participant Consent & Forensics Authorization (Required)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono text-zinc-400">Participant Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Officer Maheshwaran / Witness A"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  className="w-full mt-1 bg-[#060911] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400">Evidence Retention (Days)</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(parseInt(e.target.value) || 30)}
                  className="w-full mt-1 bg-[#060911] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500/60"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-zinc-400">Purpose of Acquisition</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full mt-1 bg-[#060911] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500/60"
              />
            </div>

            {/* Consent Notice Box */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2">
              <div className="text-xs font-mono text-amber-300 font-semibold flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-400" />
                Participant Notice & Chain of Custody Declaration
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                By registering this camera, you certify that the owner/participant has received clear
                notice that raw video frames will be segmented, hashed with SHA-256, and recorded on
                BlockVault's tamper-evident ledger. The participant can revoke this authorization at
                any time, which will immediately cease all stream acquisition and recording.
              </p>
              <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={noticeAccepted}
                  onChange={(e) => setNoticeAccepted(e.target.checked)}
                  className="mt-0.5 rounded border-amber-500 text-cyan-500 focus:ring-0 bg-[#060911]"
                />
                <span className="text-xs font-mono text-amber-200">
                  I confirm that the participant has reviewed and accepted this recording notice.
                </span>
              </label>
            </div>
          </div>

          {/* Section 3: Alert & Integrity Heuristics Toggles */}
          <div className="space-y-2 pt-2 border-t border-white/[0.08]">
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Integrity & Incident Alert Triggers
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono text-zinc-300">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertOnOffline}
                  onChange={(e) => setAlertOnOffline(e.target.checked)}
                  className="rounded text-cyan-500"
                />
                <span>Stream Offline</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertOnObstruction}
                  onChange={(e) => setAlertOnObstruction(e.target.checked)}
                  className="rounded text-cyan-500"
                />
                <span>Lens Obstruction</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertOnFrozen}
                  onChange={(e) => setAlertOnFrozen(e.target.checked)}
                  className="rounded text-cyan-500"
                />
                <span>Frozen Video Feed</span>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !noticeAccepted}
              className="px-5 py-2 rounded-xl text-xs font-mono font-semibold bg-cyan-500 text-black hover:bg-cyan-400 transition shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'Registering...' : 'Register & Start Stream'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
