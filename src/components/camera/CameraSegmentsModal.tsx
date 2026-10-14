import React, { useState, useEffect } from 'react';
import {
  X,
  FileCheck,
  ShieldCheck,
  Copy,
  Check,
  Download,
  Clock,
  HardDrive,
  Hash,
  RefreshCw,
} from 'lucide-react';
import {
  CameraSourceDto,
  EvidenceSegmentDto,
  cameraApiService,
} from '../../services/cameraApiService';

interface CameraSegmentsModalProps {
  camera: CameraSourceDto | null;
  onClose: () => void;
}

export const CameraSegmentsModal: React.FC<CameraSegmentsModalProps> = ({ camera, onClose }) => {
  const [segments, setSegments] = useState<EvidenceSegmentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  useEffect(() => {
    if (camera) {
      loadSegments();
    }
  }, [camera]);

  const loadSegments = async () => {
    if (!camera) return;
    setLoading(true);
    try {
      const data = await cameraApiService.fetchSegments(camera.cameraId);
      setSegments(data);
    } catch {
      setSegments([]);
    } finally {
      setLoading(false);
    }
  };

  if (!camera) return null;

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const totalBytes = segments.reduce((acc, s) => acc + s.byteLength, 0);
  const totalFrames = segments.reduce((acc, s) => acc + s.frameCount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0C101D] border border-white/[0.1] rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-8 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#080C16] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Preserved Evidence Segments</h2>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  {camera.cameraId}
                </span>
              </div>
              <p className="text-xs font-mono text-zinc-400">
                Deterministic SHA-256 Chain of Custody for {camera.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadSegments}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary Metric Ribbon */}
        <div className="px-6 py-3 bg-[#080C16]/50 border-b border-white/[0.06] grid grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <span className="text-zinc-500 uppercase text-[10px]">Total Segments</span>
            <div className="text-white font-bold text-sm">{segments.length} Chunks</div>
          </div>
          <div>
            <span className="text-zinc-500 uppercase text-[10px]">Total Captured Frames</span>
            <div className="text-cyan-400 font-bold text-sm">
              {totalFrames.toLocaleString()} JPEGs
            </div>
          </div>
          <div>
            <span className="text-zinc-500 uppercase text-[10px]">Total Preserved Size</span>
            <div className="text-white font-bold text-sm">
              {(totalBytes / (1024 * 1024)).toFixed(2)} MB
            </div>
          </div>
        </div>

        {/* Forensic Policy Notice */}
        <div className="px-6 py-2.5 bg-cyan-500/[0.03] border-b border-cyan-500/15 flex items-center gap-2 text-[11px] font-mono text-cyan-300">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <strong>Authentic Evidence Guarantee:</strong> Stored binaries are the exact raw
            compressed MJPEG packets received from the device. SHA-256 hashes are immutable and
            verify byte-level equality.
          </span>
        </div>

        {/* Table of Segments */}
        <div className="flex-1 overflow-y-auto p-6">
          {segments.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 font-mono text-xs">
              No evidence segments recorded yet for this camera. Click "Capture Evidence" on the
              camera tile to start capturing.
            </div>
          ) : (
            <div className="space-y-3">
              {segments.map((seg) => (
                <div
                  key={seg.segmentId}
                  className="p-3.5 rounded-xl bg-[#080C16] border border-white/[0.06] hover:border-cyan-500/30 transition space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">
                        {seg.segmentId}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.04] px-1.5 py-0.2 rounded border border-white/[0.06]">
                        {seg.sessionId}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                        Seq #{seg.sequenceNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
                      <span>{seg.frameCount} frames</span>
                      <span>{(seg.byteLength / 1024).toFixed(1)} KB</span>
                      <span className="text-zinc-500">
                        {new Date(seg.startTimeUtc).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {/* SHA-256 Hash Display */}
                  <div className="p-2 rounded-lg bg-[#060911] border border-white/[0.04] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Hash className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-[11px] font-mono text-zinc-300 truncate">
                        {seg.sha256OriginalHash}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopyHash(seg.sha256OriginalHash)}
                      title="Copy SHA-256 Digest"
                      className="p-1 rounded hover:bg-white/[0.08] text-zinc-400 hover:text-white shrink-0"
                    >
                      {copiedHash === seg.sha256OriginalHash ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
