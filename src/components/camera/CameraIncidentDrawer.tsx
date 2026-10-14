import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  Clock,
  Send,
  Mail,
  Layers,
  Info,
  RefreshCw,
} from 'lucide-react';
import { useCameraStore } from '../../stores/useCameraStore';
import { CameraIncidentDto } from '../../services/cameraApiService';

interface CameraIncidentDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const CameraIncidentDrawer: React.FC<CameraIncidentDrawerProps> = ({ open, onClose }) => {
  const { incidents, loadIncidents, resolveIncident } = useCameraStore();

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (open) {
      loadIncidents();
    }
  }, [open]);

  if (!open) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadIncidents();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResolve = async (incidentId: string) => {
    setIsSubmitting(true);
    try {
      await resolveIncident(incidentId, resolutionNotes || 'Resolved by forensic security operator');
      setResolvingId(null);
      setResolutionNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (filterStatus === 'OPEN') return inc.status === 'OPEN';
    if (filterStatus === 'RESOLVED') return inc.status === 'RESOLVED';
    return true;
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      default:
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }
  };

  const getDeliveryBadge = (inc: CameraIncidentDto) => {
    switch (inc.deliveryStatus) {
      case 'PUBLISHED_TO_SNS':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <Mail className="w-3 h-3" />
            SNS ALERT SENT
          </span>
        );
      case 'ENQUEUED_SQS':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
            <Layers className="w-3 h-3" />
            ENQUEUED IN SQS
          </span>
        );
      case 'AWS_NOT_CONFIGURED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Info className="w-3 h-3" />
            LOCAL INCIDENT (AWS UNCONFIGURED)
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            ALERT DELIVERY FAILED
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0C101D] border-l border-white/[0.08] w-full max-w-xl h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#080C16] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Camera Security & Integrity Incidents</h2>
              <p className="text-[11px] font-mono text-zinc-400">
                Continuous Heuristics & AWS Alert Queue
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="p-3 bg-[#080C16]/50 border-b border-white/[0.06] flex items-center gap-2">
          {(['ALL', 'OPEN', 'RESOLVED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition ${
                filterStatus === st
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-white/[0.04] text-zinc-400 border border-white/[0.06] hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
          <span className="ml-auto text-xs font-mono text-zinc-500">
            {filteredIncidents.length} Records
          </span>
        </div>

        {/* Incidents List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredIncidents.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 font-mono text-xs">
              <CheckCircle className="w-8 h-8 text-emerald-400/50 mx-auto mb-2" />
              No camera integrity incidents detected.
            </div>
          ) : (
            filteredIncidents.map((inc) => (
              <div
                key={inc.incidentId}
                className={`p-3.5 rounded-xl border transition-all ${
                  inc.status === 'OPEN'
                    ? 'bg-rose-500/[0.04] border-rose-500/30'
                    : 'bg-[#080C16] border-white/[0.06]'
                }`}
              >
                {/* Top line: IDs & Badges */}
                <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-white">
                      {inc.incidentId}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20">
                      {inc.cameraId}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.2 rounded text-[10px] font-mono uppercase border ${getSeverityBadge(
                        inc.severity
                      )}`}
                    >
                      {inc.severity}
                    </span>
                    <span
                      className={`px-2 py-0.2 rounded text-[10px] font-mono uppercase ${
                        inc.status === 'OPEN'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {inc.status}
                    </span>
                  </div>
                </div>

                {/* Title & Details */}
                <div className="text-xs font-medium text-white mb-1">{inc.title}</div>
                <p className="text-[11px] font-mono text-zinc-400 leading-relaxed mb-3">
                  {inc.details}
                </p>

                {/* Notification status & detected time */}
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(inc.detectedAt).toLocaleString()}</span>
                  </div>
                  <div>{getDeliveryBadge(inc)}</div>
                </div>

                {/* Resolve Action Box */}
                {inc.status === 'OPEN' && (
                  <div className="mt-3 pt-2 border-t border-white/[0.06]">
                    {resolvingId === inc.incidentId ? (
                      <div className="space-y-2">
                        <textarea
                          placeholder="Enter forensic resolution notes / verification findings..."
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          rows={2}
                          className="w-full bg-[#060911] border border-white/[0.08] rounded-lg p-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setResolvingId(null);
                              setResolutionNotes('');
                            }}
                            className="px-2.5 py-1 text-[11px] font-mono text-zinc-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleResolve(inc.incidentId)}
                            disabled={isSubmitting}
                            className="px-3 py-1 text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg hover:bg-emerald-500/30"
                          >
                            {isSubmitting ? 'Resolving...' : 'Confirm Resolution'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setResolvingId(inc.incidentId)}
                        className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Mark Incident as Resolved
                      </button>
                    )}
                  </div>
                )}

                {/* Resolution Notes if Resolved */}
                {inc.status === 'RESOLVED' && inc.resolutionNotes && (
                  <div className="mt-2 text-[10px] font-mono text-emerald-400/80 bg-emerald-500/[0.05] p-2 rounded border border-emerald-500/20">
                    <strong>Resolution ({inc.resolvedBy || 'Operator'}):</strong>{' '}
                    {inc.resolutionNotes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
