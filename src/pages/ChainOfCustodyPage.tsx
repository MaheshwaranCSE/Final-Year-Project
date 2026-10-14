import React, { useState, useMemo } from 'react';
import {
  Link2,
  Plus,
  Search,
  CheckCircle2,
  User as UserIcon,
  MapPin,
  X,
  Shield,
  Clock,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForensicStore } from '../stores/useForensicStore';
import { CustodyAction } from '../types';
import { PageContainer } from '../components/common/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { KpiCard } from '../components/common/KpiCard';
import { HashChip } from '../components/common/HashChip';

export const ChainOfCustodyPage: React.FC = () => {
  const navigate = useNavigate();
  const { custodyEvents, evidence, cases, recordCustodyTransfer } =
    useForensicStore();

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [caseFilter, setCaseFilter] = useState<string>('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    evidenceId: '',
    action: 'TRANSFERRED' as CustodyAction,
    toUserName: '',
    location: '',
    newState: '',
    notes: '',
  });

  const filteredEvents = useMemo(() => {
    return custodyEvents.filter((ev) => {
      const matchSearch =
        ev.evidenceNumber.toLowerCase().includes(search.toLowerCase()) ||
        ev.caseNumber.toLowerCase().includes(search.toLowerCase()) ||
        ev.userName.toLowerCase().includes(search.toLowerCase()) ||
        ev.notes.toLowerCase().includes(search.toLowerCase());

      const matchAction = actionFilter === 'ALL' || ev.action === actionFilter;
      const matchCase = caseFilter === 'ALL' || ev.caseId === caseFilter;

      return matchSearch && matchAction && matchCase;
    });
  }, [custodyEvents, search, actionFilter, caseFilter]);

  const handleAddEvent = async () => {
    if (
      !formData.evidenceId ||
      !formData.toUserName.trim() ||
      !formData.location.trim() ||
      !formData.newState.trim() ||
      !formData.notes.trim()
    ) {
      setFormError(
        'All fields (Evidence Artifact, Action, Receiving Custodian, Location, New Custodial State, and Notes) are required.'
      );
      return;
    }

    setFormError('');
    await recordCustodyTransfer({
      evidenceId: formData.evidenceId,
      action: formData.action,
      toUserName: formData.toUserName.trim(),
      location: formData.location.trim(),
      newState: formData.newState.trim(),
      notes: formData.notes.trim(),
    });

    setModalOpen(false);
    setFormData({
      evidenceId: '',
      action: 'TRANSFERRED',
      toUserName: '',
      location: '',
      newState: '',
      notes: '',
    });
  };

  const getActionBadge = (action: CustodyAction) => {
    switch (action) {
      case 'ACQUIRED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'UPLOADED':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'VERIFIED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'TRANSFERRED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'ANALYZED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'REVIEWED':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <PageContainer>
      {/* 1. Standardized Page Header with Breadcrumbs */}
      <PageHeader
        breadcrumbs={[
          { label: 'BlockVault', href: '/dashboard' },
          { label: 'Chain of Custody' },
        ]}
        title="Chain of Custody"
        badge="ISO/IEC 27037 SEC 6"
        subtitle="Chronological audit trail of physical acquisitions, cryptographic sealing, biometric custody transfers, and court-admissible transfer authorizations."
        actions={
          <button
            onClick={() => setModalOpen(true)}
            disabled={evidence.length === 0}
            className="h-9 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs shadow-sm transition inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Record Custody Transfer</span>
          </button>
        }
      />

      {/* 2. Standardized KPI Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Custodial Log"
          value={custodyEvents.length}
          helper="Immutable chronology"
          icon={Link2}
          accent="cyan"
        />
        <KpiCard
          label="Sealed Evidence"
          value={evidence.length}
          helper="Active forensic custody"
          icon={ShieldCheck}
          accent="emerald"
        />
        <KpiCard
          label="Custodial Officers"
          value={new Set(custodyEvents.map((e) => e.userName)).size}
          helper="Authorized attestation"
          icon={UserIcon}
          accent="purple"
        />
        <KpiCard
          label="Continuum Integrity"
          value="100% Intact"
          helper="Zero unaccounted gaps"
          icon={Activity}
          accent="emerald"
        />
      </div>

      {/* 3. Filter Bar */}
      <div className="bg-[#0C101D] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] rounded-2xl p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by evidence tag #, case #, custodian name, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#080C16] border border-white/[0.08] rounded-xl pl-9 pr-3.5 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-[#080C16] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="ALL">All Actions</option>
            <option value="ACQUIRED">Acquired</option>
            <option value="UPLOADED">Uploaded</option>
            <option value="VERIFIED">Verified</option>
            <option value="TRANSFERRED">Transferred</option>
            <option value="ANALYZED">Analyzed</option>
            <option value="ACCESSED">Accessed</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <select
            value={caseFilter}
            onChange={(e) => setCaseFilter(e.target.value)}
            className="bg-[#080C16] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="ALL">All Cases</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.caseNumber}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Timeline Stream */}
      <div className="space-y-3.5">
        {filteredEvents.length === 0 ? (
          <div className="bg-[#0C101D] border border-white/[0.08] rounded-2xl p-16 text-center">
            <Link2 className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white mb-1">
              No Chain-of-Custody Events Recorded
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Ingest digital evidence or record a custodial transfer to populate the immutable custody ledger.
            </p>
          </div>
        ) : (
          filteredEvents.map((ev, index) => {
            const badgeCls = getActionBadge(ev.action);
            return (
              <div
                key={ev.id || index}
                className="bg-[#0C101D] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:border-cyan-500/30 rounded-2xl p-5 transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                    <Link2 className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold border ${badgeCls}`}
                        >
                          {ev.action}
                        </span>
                        <button
                          onClick={() => navigate(`/evidence/${ev.evidenceId}`)}
                          className="font-mono text-cyan-400 hover:underline font-bold text-xs"
                        >
                          {ev.evidenceNumber}
                        </button>
                        <button
                          onClick={() => navigate(`/cases/${ev.caseId}`)}
                          className="text-xs text-zinc-400 hover:text-white transition font-mono"
                        >
                          ({ev.caseNumber})
                        </button>
                      </div>

                      <div className="text-[11px] font-mono text-zinc-400">
                        {new Date(ev.timestamp).toLocaleString()}
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300 mb-3 leading-relaxed font-mono bg-[#080C16] border border-white/[0.06] p-3 rounded-xl">
                      {ev.notes}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2.5 border-t border-white/[0.04]">
                      <div className="flex items-center gap-2 text-zinc-300">
                        <UserIcon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="truncate">
                          Custodian: <strong className="text-white">{ev.userName}</strong> ({ev.userRole})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-zinc-300">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="truncate">
                          Location: <strong className="text-white">{ev.location}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <span className="text-zinc-500">SHA-256:</span>
                        {ev.hash ? <HashChip hash={ev.hash} lead={6} tail={6} /> : <span className="text-zinc-500">N/A</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Record Custody Event Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0C101D] border border-white/[0.08] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-4.5 border-b border-white/[0.06] flex items-center justify-between bg-[#080C16]">
              <div className="flex items-center gap-2.5">
                <Link2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white tracking-tight">
                  Record Chain-of-Custody Event
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-zinc-400 hover:text-white transition p-1 rounded-lg hover:bg-white/[0.04]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Select Evidence Item *
                </label>
                <select
                  value={formData.evidenceId}
                  onChange={(e) =>
                    setFormData({ ...formData, evidenceId: e.target.value })
                  }
                  className="w-full bg-[#080C16] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="">-- Choose Evidence Item --</option>
                  {evidence.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.evidenceNumber} — {item.title} ({item.caseNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Custodial Action *
                </label>
                <select
                  value={formData.action}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      action: e.target.value as CustodyAction,
                    })
                  }
                  className="w-full bg-[#080C16] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="TRANSFERRED">Transferred to Custodian / Lab</option>
                  <option value="ACCESSED">Forensic Examination Access</option>
                  <option value="REVIEWED">Judicial / Supervisory Review</option>
                  <option value="EXPORTED">Authorized Court Export</option>
                  <option value="ARCHIVED">Cold Storage Archival</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Receiving Custodian Name & Badge / Title *
                </label>
                <input
                  type="text"
                  placeholder="Enter receiving officer or specialist name"
                  value={formData.toUserName}
                  onChange={(e) =>
                    setFormData({ ...formData, toUserName: e.target.value })
                  }
                  className="w-full bg-[#080C16] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Physical Facility / Vault Location *
                </label>
                <input
                  type="text"
                  placeholder="Enter destination laboratory or vault room"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full bg-[#080C16] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Resulting Custodial State *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Sealed in Evidence Locker B"
                  value={formData.newState}
                  onChange={(e) =>
                    setFormData({ ...formData, newState: e.target.value })
                  }
                  className="w-full bg-[#080C16] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Custodial Transfer Notes & Authorization *
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter authorization reference and transfer purpose..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full bg-[#080C16] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-end gap-3 bg-[#080C16]">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="h-9 px-4 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddEvent}
                className="h-9 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                Commit Custody Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default ChainOfCustodyPage;
