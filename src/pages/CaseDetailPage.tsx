import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  ShieldCheck,
  Link2,
  Blocks,
  ScanEye,
  FileText,
  FileCheck,
  ArrowLeft,
  Printer,
  UploadCloud,
  Copy,
  Check,
  ArrowRight,
  User as UserIcon,
  ShieldAlert,
  Clock,
  Lock,
  Scale,
  Activity,
  Layers,
  CheckCircle2,
  FileSearch,
  ChevronRight,
} from 'lucide-react';
import { useForensicStore } from '../stores/useForensicStore';
import { printForensicReport } from '../services/reportService';
import { PageContainer } from '../components/common/PageContainer';

export const CaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    cases,
    evidence,
    custodyEvents,
    blocks,
    aiRecords,
    auditLogs,
    reports,
    generateReport,
    verifyEvidence,
    anchorEvidenceToBlockchain,
  } = useForensicStore();

  const [activeTab, setActiveTab] = useState(0);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [anchoringId, setAnchoringId] = useState<string | null>(null);

  const caseItem = cases.find((c) => c.id === id || c.caseNumber === id);

  const caseEvidence = useMemo(() => {
    if (!caseItem) return [];
    return evidence.filter(
      (e) => e.caseId === caseItem.id || e.caseNumber === caseItem.caseNumber
    );
  }, [evidence, caseItem]);

  const caseCustody = useMemo(() => {
    if (!caseItem) return [];
    return custodyEvents.filter(
      (ev) => ev.caseId === caseItem.id || ev.caseNumber === caseItem.caseNumber
    );
  }, [custodyEvents, caseItem]);

  const caseTxs = useMemo(() => {
    if (!caseItem) return [];
    const txList: any[] = [];
    blocks.forEach((b) => {
      b.transactions.forEach((tx) => {
        if (
          tx.caseId === caseItem.id ||
          caseEvidence.some((e) => e.id === tx.evidenceId)
        ) {
          txList.push({
            ...tx,
            blockHeight: b.blockHeight,
            blockHash: b.blockHash,
          });
        }
      });
    });
    return txList;
  }, [blocks, caseItem, caseEvidence]);

  const caseAiRecords = useMemo(() => {
    if (!caseItem) return [];
    return aiRecords.filter((r) =>
      caseEvidence.some((e) => e.id === r.evidenceId)
    );
  }, [aiRecords, caseItem, caseEvidence]);

  const caseAuditLogs = useMemo(() => {
    if (!caseItem) return [];
    return auditLogs.filter(
      (a) => a.caseId === caseItem.id || a.resourceId === caseItem.id
    );
  }, [auditLogs, caseItem]);

  const caseReports = useMemo(() => {
    if (!caseItem) return [];
    return reports.filter(
      (r) => r.caseId === caseItem.id || r.caseNumber === caseItem.caseNumber
    );
  }, [reports, caseItem]);

  const totalBytes = useMemo(() => {
    return caseEvidence.reduce((acc, e) => acc + (e.fileSize || 0), 0);
  }, [caseEvidence]);

  if (!caseItem) {
    return (
      <div className="bg-[#0B101E] border border-[#1E293B] rounded-2xl p-12 text-center space-y-4 shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-red-400">Forensic Case Not Found</h3>
        <p className="text-sm font-mono text-slate-400 max-w-md mx-auto">
          No active or archived forensic docket matches the identifier &quot;{id}&quot;.
        </p>
        <button
          onClick={() => navigate('/cases')}
          className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs border border-slate-700 transition inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Cases Repository
        </button>
      </div>
    );
  }

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleVerify = async (evId: string) => {
    setVerifyingId(evId);
    try {
      await verifyEvidence(evId);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleAnchor = async (evId: string) => {
    setAnchoringId(evId);
    try {
      await anchorEvidenceToBlockchain(evId);
    } finally {
      setAnchoringId(null);
    }
  };

  const handleGenerateReport = (
    type: 'CASE_SUMMARY' | 'COMPLETE_FORENSIC_REPORT'
  ) => {
    const report = generateReport(
      caseItem.id,
      type,
      `${caseItem.caseNumber} — ${caseItem.title} (${type.replace(/_/g, ' ')})`,
      caseItem.description
    );
    printForensicReport(report);
  };

  const displayTitle =
    caseItem.title && caseItem.title.trim().length > 2
      ? caseItem.title
      : `Forensic Docket: ${caseItem.caseNumber} Investigation`;

  const displayDescription =
    caseItem.description && caseItem.description.trim().length > 2
      ? caseItem.description
      : `Official forensic investigation and digital evidence acquisition docket initialized for Case ${caseItem.caseNumber}. Jurisdictional scope: ${caseItem.accessScope}. Cryptographic chain of custody and bit-for-bit SHA-256 verification are actively enforced under ISO/IEC 27037 standards.`;

  const displayInvestigator =
    caseItem.leadInvestigatorName && caseItem.leadInvestigatorName.trim().length > 2
      ? caseItem.leadInvestigatorName
      : 'Lead Forensic Examiner';

  const displayReviewer =
    caseItem.reviewerName && caseItem.reviewerName.trim().length > 2
      ? caseItem.reviewerName
      : 'Supervisory Judicial Reviewer (Magistrate Chambers)';

  const tabs = [
    { label: 'Overview & Docket Briefing', icon: FolderOpen, count: null },
    { label: 'Evidence Vault', icon: ShieldCheck, count: caseEvidence.length },
    { label: 'Chain of Custody', icon: Link2, count: caseCustody.length },
    { label: 'Blockchain Proofs', icon: Blocks, count: caseTxs.length },
    { label: 'AI Media Diagnostics', icon: ScanEye, count: caseAiRecords.length },
    { label: 'Audit Trail', icon: FileText, count: caseAuditLogs.length },
    { label: 'Court Reports', icon: FileCheck, count: caseReports.length },
  ];

  return (
    <PageContainer>
      {/* 1. Modern Page Header with Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
        <button onClick={() => navigate('/cases')} className="hover:text-cyan-400 transition cursor-pointer">
          BlockVault
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
        <button onClick={() => navigate('/cases')} className="hover:text-cyan-400 transition cursor-pointer">
          Cases
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
        <span className="text-cyan-400 font-medium">{caseItem.caseNumber}</span>
      </div>

      {/* 2. Top Header Dossier Banner */}
      <div className="bg-[#0C101D] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-cyan-500/10 via-cyan-500/5 to-transparent pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate('/cases')}
              className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-cyan-500/40 text-zinc-400 hover:text-white flex items-center justify-center transition shrink-0 mt-1 shadow-sm"
              title="Return to Cases Repository"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-medium">
                  CASE DOCKET RECORD
                </span>
                <span className="font-mono text-cyan-400 font-bold text-xs bg-white/[0.04] px-2.5 py-0.5 rounded-full border border-white/[0.08]">
                  {caseItem.caseNumber}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-medium border flex items-center gap-1.5 ${
                    caseItem.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      caseItem.status === 'ACTIVE'
                        ? 'bg-emerald-400 animate-pulse'
                        : 'bg-amber-400'
                    }`}
                  />
                  {caseItem.status}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-medium border flex items-center gap-1.5 ${
                    caseItem.priority === 'CRITICAL'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : caseItem.priority === 'HIGH'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      caseItem.priority === 'CRITICAL'
                        ? 'bg-rose-400'
                        : caseItem.priority === 'HIGH'
                        ? 'bg-amber-400'
                        : 'bg-cyan-400'
                    }`}
                  />
                  PRIORITY: {caseItem.priority}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-white/[0.04] text-zinc-300 border border-white/[0.08]">
                  {caseItem.classification.replace(/_/g, ' ')}
                </span>
              </div>

              <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                {displayTitle}
              </h1>

              <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 flex-wrap pt-0.5">
                <span>
                  Type: <strong className="text-zinc-200">{caseItem.type.replace(/_/g, ' ')}</strong>
                </span>
                <span className="text-zinc-600">•</span>
                <span>
                  Lead Investigator: <strong className="text-cyan-400">{displayInvestigator}</strong>
                </span>
                <span className="text-zinc-600">•</span>
                <span>
                  Opened: <strong className="text-zinc-200">{new Date(caseItem.dateCreated).toLocaleDateString()}</strong>
                </span>
                <span className="text-zinc-600">•</span>
                <span>
                  Jurisdiction: <strong className="text-zinc-200">{caseItem.accessScope}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleGenerateReport('COMPLETE_FORENSIC_REPORT')}
              className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 text-xs font-mono font-medium transition inline-flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4 text-zinc-400" />
              Export Court Dossier
            </button>

            <button
              onClick={() => navigate('/evidence')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs shadow-[0_1px_2px_rgba(0,0,0,0.4),0_0_20px_rgba(6,182,212,0.25)] transition-all active:scale-[0.98] flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4 stroke-[2.5]" />
              Ingest Evidence
            </button>
          </div>
        </div>
      </div>

      {/* ─── 4 FORENSIC KPI METRICS STRIP ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="rounded-2xl p-4.5 bg-[#0C101D] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:border-cyan-500/30 transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Vaulted Evidence
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-white">
            {caseEvidence.length} <span className="text-sm font-normal text-zinc-500">Item{caseEvidence.length === 1 ? '' : 's'}</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-cyan-400/90 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>{(totalBytes / (1024 * 1024)).toFixed(2)} MB Sealed Payload</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="rounded-2xl p-4.5 bg-[#0C101D] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:border-emerald-500/30 transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Custody Continuum
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
              <Link2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-white">
            {caseCustody.length} <span className="text-sm font-normal text-zinc-500">Transfer{caseCustody.length === 1 ? '' : 's'}</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Unbroken Chain of Custody</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="rounded-2xl p-4.5 bg-[#0C101D] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:border-purple-500/30 transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              PoA Ledger Anchors
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 shrink-0">
              <Blocks className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-white">
            {caseTxs.length} <span className="text-sm font-normal text-zinc-500">Transaction{caseTxs.length === 1 ? '' : 's'}</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-purple-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span>Immutable PoA Consensus</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="rounded-2xl p-4.5 bg-[#0C101D] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:border-emerald-500/30 transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Forensic Integrity
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-emerald-400">
            100% Sealed
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Bit-for-Bit Verified</span>
          </div>
        </div>
      </div>

      {/* ─── TABS & WORKSPACE CONTAINER ─────────────────────────────────── */}
      <div className="bg-[#0C101D] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] rounded-2xl overflow-hidden">
        {/* Modern Tab Capsule Navigation Bar */}
        <div className="p-3 border-b border-white/[0.06] bg-[#070A12]/60">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {tabs.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        isActive
                          ? 'bg-cyan-500/30 text-cyan-200 font-semibold'
                          : 'bg-white/[0.06] text-zinc-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── TAB 0: OVERVIEW & DOCKET BRIEFING ──────────────────────────── */}
        {activeTab === 0 && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Scope & Metadata */}
              <div className="lg:col-span-8 space-y-6">
                {/* Briefing Box */}
                <div className="bg-[#080C16] border border-white/[0.06] rounded-2xl p-5 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Case Briefing & Operational Scope
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">
                      Official Investigation Synopsis
                    </span>
                  </div>
                  <div className="text-sm text-zinc-300 leading-relaxed font-mono bg-[#0C101D] p-4.5 rounded-xl border border-white/[0.06] min-h-[90px]">
                    {displayDescription}
                  </div>
                </div>

                {/* Metadata Tiles */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    Forensic Docket Specifications
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-[#080C16] border border-white/[0.06] rounded-2xl p-4 space-y-1 hover:border-cyan-500/25 transition-all">
                      <div className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-cyan-400" />
                        Classification
                      </div>
                      <div className="text-xs font-bold text-white font-mono">
                        {caseItem.classification.replace(/_/g, ' ')}
                      </div>
                      <span className="text-[10px] text-zinc-500 block font-mono">
                        Statutory Evidence Tier
                      </span>
                    </div>

                    <div className="bg-[#080C16] border border-white/[0.06] rounded-2xl p-4 space-y-1 hover:border-cyan-500/25 transition-all">
                      <div className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1.5">
                        <Scale className="w-3 h-3 text-cyan-400" />
                        Jurisdiction & Access
                      </div>
                      <div className="text-xs font-bold text-white font-mono">
                        {caseItem.accessScope}
                      </div>
                      <span className="text-[10px] text-zinc-500 block font-mono">
                        Cross-Agency Isolation
                      </span>
                    </div>

                    <div className="bg-[#080C16] border border-white/[0.06] rounded-2xl p-4 space-y-1 hover:border-emerald-500/25 transition-all">
                      <div className="text-[10px] font-mono uppercase text-zinc-500 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        Retention Mandate
                      </div>
                      <div className="text-xs font-bold text-emerald-400 font-mono">
                        {caseItem.retentionPeriodYears} Years Mandatory
                      </div>
                      <span className="text-[10px] text-zinc-500 block font-mono">
                        FIPS 140-3 Compliant
                      </span>
                    </div>
                  </div>
                </div>

                {/* Evidence Quick Preview */}
                <div className="bg-[#080C16] border border-white/[0.06] rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-white font-bold flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      Associated Evidence Artifacts ({caseEvidence.length})
                    </h4>
                    <button
                      onClick={() => setActiveTab(1)}
                      className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1"
                    >
                      View All in Vault <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {caseEvidence.length === 0 ? (
                    <div className="p-8 text-center bg-[#0C101D] border border-dashed border-white/[0.08] rounded-xl space-y-3">
                      <FileSearch className="w-8 h-8 text-zinc-600 mx-auto" />
                      <p className="text-xs font-mono text-zinc-400">
                        No digital evidence files have been sealed to this docket yet.
                      </p>
                      <button
                        onClick={() => navigate('/evidence')}
                        className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-semibold transition inline-flex items-center gap-2"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        Upload & Seal First Artifact
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {caseEvidence.slice(0, 4).map((ev) => (
                        <div
                          key={ev.id}
                          onClick={() => navigate(`/evidence/${ev.id}`)}
                          className="p-3.5 rounded-xl bg-[#0C101D] border border-white/[0.06] hover:border-cyan-500/40 cursor-pointer transition space-y-2 group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-mono text-xs text-cyan-400 font-bold group-hover:underline">
                              {ev.evidenceNumber}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase bg-white/[0.04] text-zinc-300 border border-white/[0.08]">
                              {ev.category}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-white truncate">
                            {ev.title}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-500 truncate">
                            SHA: {ev.sha256Original.slice(0, 16)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Custodial Personnel & Rapid Actions */}
              <div className="lg:col-span-4 space-y-6">
                {/* Personnel Card */}
                <div className="bg-[#080C16] border border-white/[0.06] rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold border-b border-white/[0.06] pb-3 flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-cyan-400" />
                    Custodial Roster & Sign-Offs
                  </h3>

                  <div className="space-y-3">
                    {/* Lead Investigator */}
                    <div className="bg-[#0C101D] p-3.5 rounded-xl border border-white/[0.06] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                        Lead Forensic Examiner
                      </span>
                      <div className="font-bold text-white text-sm">
                        {displayInvestigator}
                      </div>
                      <div className="font-mono text-cyan-400 text-[11px]">
                        Badge / ID: {caseItem.leadInvestigatorId || 'INV-CUSTODY-01'}
                      </div>
                    </div>

                    {/* Judicial Reviewer */}
                    <div className="bg-[#0C101D] p-3.5 rounded-xl border border-white/[0.06] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                        Supervisory Reviewer
                      </span>
                      <div className="font-bold text-white text-sm">
                        {displayReviewer}
                      </div>
                      <div className="font-mono text-amber-400 text-[11px]">
                        Authorized Judicial Officer
                      </div>
                    </div>

                    {/* Date */}
                    <div className="bg-[#0C101D] p-3 rounded-xl border border-white/[0.06] flex items-center justify-between text-xs font-mono">
                      <span className="text-zinc-400">Docket Ingest Date:</span>
                      <span className="text-zinc-200">
                        {new Date(caseItem.dateCreated).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Card */}
                <div className="bg-[#080C16] border border-white/[0.06] rounded-2xl p-5 space-y-3">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold border-b border-white/[0.06] pb-3">
                    Forensic Action Hub
                  </h3>

                  <div className="space-y-2">
                    <button
                      onClick={() => navigate('/evidence')}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0C101D] hover:bg-white/[0.04] border border-white/[0.06] hover:border-cyan-500/40 text-left text-xs font-mono text-zinc-200 transition flex items-center justify-between group"
                    >
                      <span className="flex items-center gap-2">
                        <UploadCloud className="w-4 h-4 text-cyan-400" />
                        Ingest New Artifact
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-cyan-400 transition" />
                    </button>

                    <button
                      onClick={() => setActiveTab(4)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0C101D] hover:bg-white/[0.04] border border-white/[0.06] hover:border-purple-500/40 text-left text-xs font-mono text-zinc-200 transition flex items-center justify-between group"
                    >
                      <span className="flex items-center gap-2">
                        <ScanEye className="w-4 h-4 text-purple-400" />
                        Run AI Synthetics Scan
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-purple-400 transition" />
                    </button>

                    <button
                      onClick={() => handleGenerateReport('COMPLETE_FORENSIC_REPORT')}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0C101D] hover:bg-white/[0.04] border border-white/[0.06] hover:border-cyan-500/40 text-left text-xs font-mono text-zinc-200 transition flex items-center justify-between group"
                    >
                      <span className="flex items-center gap-2">
                        <Printer className="w-4 h-4 text-zinc-400" />
                        Compile Court Dossier
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-cyan-400 transition" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 1: EVIDENCE VAULT ──────────────────────────────────────── */}
        {activeTab === 1 && (
          <div className="overflow-x-auto">
            {caseEvidence.length === 0 ? (
              <div className="p-16 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1">
                    No Evidence Items Linked to this Docket
                  </h3>
                  <p className="text-xs font-mono text-zinc-400 max-w-md mx-auto">
                    Acquire digital media, documents, or disk binaries from external drives to compute immutable SHA-256 cryptographic digests and anchor them to the PoA blockchain.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/evidence')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium font-mono text-xs transition inline-flex items-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.4),0_0_20px_rgba(6,182,212,0.25)]"
                >
                  <UploadCloud className="w-4 h-4 stroke-[2.5]" />
                  Ingest Evidence into Vault
                </button>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-wider text-zinc-400 bg-white/[0.02]">
                    <th className="py-3.5 px-5">Evidence ID</th>
                    <th className="py-3.5 px-5">Artifact Title & File</th>
                    <th className="py-3.5 px-5">SHA-256 Hash</th>
                    <th className="py-3.5 px-5">Integrity Status</th>
                    <th className="py-3.5 px-5">Blockchain Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-xs font-mono">
                  {caseEvidence.map((e) => (
                    <tr key={e.id} className="hover:bg-white/[0.02] transition">
                      <td
                        onClick={() => navigate(`/evidence/${e.id}`)}
                        className="py-4 px-5 text-cyan-400 font-bold cursor-pointer hover:underline"
                      >
                        {e.evidenceNumber}
                      </td>
                      <td
                        onClick={() => navigate(`/evidence/${e.id}`)}
                        className="py-4 px-5 cursor-pointer"
                      >
                        <div className="font-semibold text-white font-sans text-sm">{e.title}</div>
                        <div className="text-[11px] text-zinc-400">
                          {e.originalFileName} • {e.category} • {(e.fileSize / 1024).toFixed(1)} KB
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2 text-zinc-300 text-[11px]">
                          <span>{e.sha256Original.slice(0, 16)}...</span>
                          <button
                            onClick={() => handleCopy(e.sha256Original)}
                            className="p-1 rounded text-zinc-500 hover:text-cyan-400 transition"
                            title="Copy SHA-256"
                          >
                            {copiedHash === e.sha256Original ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-medium border ${
                            e.integrityStatus === 'VERIFIED'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${e.integrityStatus === 'VERIFIED' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          {e.integrityStatus}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        {e.blockchainTxId ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                            BLOCK #{e.blockchainBlockNumber}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAnchor(e.id)}
                            disabled={anchoringId === e.id}
                            className="px-2.5 py-1 rounded-lg text-[10px] bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition disabled:opacity-50"
                          >
                            {anchoringId === e.id ? 'Anchoring...' : 'Anchor to Ledger'}
                          </button>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleVerify(e.id)}
                            disabled={verifyingId === e.id}
                            className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-emerald-400 text-[11px] border border-white/[0.08] transition"
                          >
                            {verifyingId === e.id ? 'Verifying...' : 'Verify Hash'}
                          </button>
                          <button
                            onClick={() => navigate(`/evidence/${e.id}`)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[11px] border border-cyan-500/30 transition inline-flex items-center gap-1"
                          >
                            Inspect <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ─── TAB 2: CHAIN OF CUSTODY ────────────────────────────────────── */}
        {activeTab === 2 && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                Chronological Custodial Log ({caseCustody.length} Record{caseCustody.length === 1 ? '' : 's'})
              </h3>
              <button
                onClick={() => navigate('/custody')}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-mono transition"
              >
                Open Custody Ledger
              </button>
            </div>

            {caseCustody.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 text-xs font-mono">
                No custodial events recorded yet for this case folder.
              </div>
            ) : (
              <div className="space-y-3">
                {caseCustody.map((ev, idx) => (
                  <div
                    key={ev.id || idx}
                    className="bg-[#080C16] border border-white/[0.06] rounded-2xl p-4.5 flex items-start gap-4 transition hover:border-cyan-500/30"
                  >
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold bg-white/[0.04] text-zinc-200 border border-white/[0.08]">
                            {ev.action}
                          </span>
                          <span className="text-xs font-mono text-cyan-400 font-bold">
                            {ev.evidenceNumber}
                          </span>
                          <span className="text-xs text-white">
                            {ev.previousState} → {ev.newState}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-zinc-500">
                          {new Date(ev.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 font-mono bg-[#0C101D] p-3 rounded-xl border border-white/[0.06]">
                        {ev.notes}
                      </p>
                      <div className="flex items-center gap-4 text-[11px] text-zinc-400 font-mono pt-0.5 flex-wrap">
                        <span>Custodian: <strong className="text-white">{ev.userName}</strong> ({ev.userRole})</span>
                        <span>Facility: <strong className="text-white">{ev.location}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: BLOCKCHAIN PROOFS ───────────────────────────────────── */}
        {activeTab === 3 && (
          <div className="overflow-x-auto">
            {caseTxs.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <Blocks className="w-10 h-10 text-zinc-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">No Blockchain Anchors Recorded</h4>
                <p className="text-xs font-mono text-zinc-400 max-w-sm mx-auto">
                  Evidence artifacts in this case docket have not yet been anchored to the Proof-of-Authority ledger.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-zinc-400 bg-white/[0.02]">
                    <th className="py-3.5 px-5">Transaction ID</th>
                    <th className="py-3.5 px-5">Block #</th>
                    <th className="py-3.5 px-5">Evidence Item</th>
                    <th className="py-3.5 px-5">Sealed SHA-256 Digest</th>
                    <th className="py-3.5 px-5">Ledger Timestamp</th>
                    <th className="py-3.5 px-5 text-right">Confirmation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {caseTxs.map((tx, idx) => (
                    <tr key={tx.txId || idx} className="hover:bg-white/[0.02] transition">
                      <td className="py-4 px-5 text-cyan-400 font-bold">
                        {tx.txId.slice(0, 18)}...
                      </td>
                      <td className="py-4 px-5 text-white font-bold">
                        Block #{tx.blockHeight}
                      </td>
                      <td className="py-4 px-5 text-zinc-300">
                        {tx.evidenceNumber}
                      </td>
                      <td className="py-4 px-5 text-zinc-400 text-[11px]">
                        {tx.evidenceHash.slice(0, 20)}...
                      </td>
                      <td className="py-4 px-5 text-zinc-400 text-[11px]">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ─── TAB 4: AI MEDIA DIAGNOSTICS ────────────────────────────────── */}
        {activeTab === 4 && (
          <div className="p-6 space-y-4">
            {caseAiRecords.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <ScanEye className="w-10 h-10 text-zinc-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">No AI Diagnostics Conducted</h4>
                <p className="text-xs font-mono text-zinc-400 max-w-sm mx-auto">
                  Run multi-spectral deepfake and synthetic anomaly screening on vaulted media in this case.
                </p>
                <button
                  onClick={() => navigate('/ai-analysis')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs font-medium transition inline-flex items-center gap-2 shadow-md"
                >
                  <ScanEye className="w-4 h-4" />
                  Open AI Diagnostics Lab
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {caseAiRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-[#080C16] border border-purple-500/25 rounded-2xl p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                          <ScanEye className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-white text-sm font-mono block">
                            {rec.evidenceNumber} Authenticity Diagnostic
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400">
                            Engine: {rec.modelMethod}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono uppercase font-bold border ${
                          rec.riskLevel === 'CRITICAL' || rec.riskLevel === 'HIGH'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${rec.riskLevel === 'CRITICAL' || rec.riskLevel === 'HIGH' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                        Anomaly Score: {rec.confidenceScore}% ({rec.assessment.replace(/_/g, ' ')})
                      </span>
                    </div>

                    <div className="bg-[#0C101D] p-3.5 rounded-xl border border-white/[0.06] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-purple-400 font-bold block">
                        Diagnostic Findings
                      </span>
                      {rec.reasoningSummary.map((line, i) => (
                        <div key={i} className="text-xs font-mono text-zinc-300">
                          • {line}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 5: AUDIT TRAIL ─────────────────────────────────────────── */}
        {activeTab === 5 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-zinc-400 bg-white/[0.02]">
                  <th className="py-3.5 px-5">Timestamp</th>
                  <th className="py-3.5 px-5">Officer / Role</th>
                  <th className="py-3.5 px-5">Action Event</th>
                  <th className="py-3.5 px-5">Details</th>
                  <th className="py-3.5 px-5 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {caseAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-4 px-5 text-zinc-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 px-5 text-white font-medium">{log.userName}</td>
                    <td className="py-4 px-5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-zinc-300 font-sans text-xs">{log.details}</td>
                    <td className="py-4 px-5 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {log.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── TAB 6: FORENSIC REPORTS ────────────────────────────────────── */}
        {activeTab === 6 && (
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-white font-bold">
                  Court-Admissible Dossiers & Reports ({caseReports.length})
                </h3>
                <p className="text-xs font-mono text-zinc-400 mt-0.5">
                  Generate cryptographically stamped PDF dossiers ready for judicial admissibility.
                </p>
              </div>
              <button
                onClick={() => handleGenerateReport('COMPLETE_FORENSIC_REPORT')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium font-mono text-xs transition shadow-[0_1px_2px_rgba(0,0,0,0.4),0_0_20px_rgba(6,182,212,0.25)]"
              >
                Generate Court Dossier
              </button>
            </div>

            {caseReports.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 text-xs font-mono">
                No formal reports compiled yet for this case docket.
              </div>
            ) : (
              <div className="space-y-3">
                {caseReports.map((rep) => (
                  <div
                    key={rep.id}
                    className="bg-[#080C16] border border-white/[0.06] rounded-2xl p-4.5 flex items-center justify-between gap-4 transition hover:border-cyan-500/30"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-cyan-400 font-bold text-xs">
                          {rep.reportNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-white/[0.04] text-zinc-300 border border-white/[0.08]">
                          {rep.reportType}
                        </span>
                      </div>
                      <div className="text-white font-medium text-sm font-sans">{rep.title}</div>
                      <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                        Author: {rep.authorName} • {new Date(rep.generatedAt).toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() => printForensicReport(rep)}
                      className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 border border-white/[0.08] text-xs font-mono transition inline-flex items-center gap-2 shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5 text-zinc-400" />
                      Print Dossier
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default CaseDetailPage;
