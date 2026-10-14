import React, { useState } from 'react';
import {
  AlertOctagon,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  UploadCloud,
  FileCheck2,
  Flame,
  ShieldAlert,
  Info,
  X,
  FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForensicStore } from '../stores/useForensicStore';
import { FileVerificationResult, TamperSimulationResult } from '../types';
import { PageContainer } from '../components/common/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { KpiCard } from '../components/common/KpiCard';
import { HashChip } from '../components/common/HashChip';

export const IntegrityMonitorPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    evidence,
    alerts,
    auditLogs,
    verifyEvidence,
    verifyEvidenceWithFile,
    verifyAllEvidence,
    resolveAlert,
    simulateTamperOnTestCopy,
  } = useForensicStore();

  const [workbenchTab, setWorkbenchTab] = useState<'DISK_AUDIT' | 'TAMPER_SIMULATION'>('DISK_AUDIT');
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string>(
    evidence[0]?.id || ''
  );
  const [diskFile, setDiskFile] = useState<File | null>(null);
  const [verifyingFile, setVerifyingFile] = useState(false);
  const [verificationResult, setVerificationResult] =
    useState<FileVerificationResult | null>(null);
  const [reverifyingAll, setReverifyingAll] = useState(false);

  // Controlled Tamper Simulation state
  const [mutationType, setMutationType] = useState<
    'SINGLE_BYTE_MODIFICATION' | 'METADATA_ALTERATION' | 'OBJECT_REPLACEMENT' | 'VERSION_ROLLBACK' | 'DELETION_RECREATION'
  >('SINGLE_BYTE_MODIFICATION');
  const [simulatingTamper, setSimulatingTamper] = useState(false);
  const [simulationResult, setSimulationResult] = useState<TamperSimulationResult | null>(null);

  // Alert resolution dialog
  const [resolveAlertId, setResolveAlertId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const tamperedList = evidence.filter((e) => e.integrityStatus === 'TAMPERED');
  const verifiedCount = evidence.filter(
    (e) => e.integrityStatus === 'VERIFIED'
  ).length;

  const handleVerifyDiskFile = async () => {
    if (!selectedEvidenceId || !diskFile) return;
    setVerifyingFile(true);
    try {
      const res = await verifyEvidenceWithFile(selectedEvidenceId, diskFile);
      setVerificationResult(res);
    } finally {
      setVerifyingFile(false);
    }
  };

  const handleVerifyVaultBinary = async () => {
    if (!selectedEvidenceId) return;
    setVerifyingFile(true);
    try {
      const res = await verifyEvidence(selectedEvidenceId);
      setVerificationResult(res);
    } finally {
      setVerifyingFile(false);
    }
  };

  const handleRunTamperSimulation = async () => {
    if (!selectedEvidenceId) return;
    setSimulatingTamper(true);
    try {
      const res = await simulateTamperOnTestCopy(selectedEvidenceId, mutationType);
      setSimulationResult(res);
    } finally {
      setSimulatingTamper(false);
    }
  };

  const handleReverifyAll = async () => {
    setReverifyingAll(true);
    try {
      await verifyAllEvidence();
    } finally {
      setReverifyingAll(false);
    }
  };

  const handleConfirmResolveAlert = () => {
    if (!resolveAlertId || !resolutionNotes.trim()) return;
    resolveAlert(resolveAlertId, resolutionNotes.trim());
    setResolveAlertId(null);
    setResolutionNotes('');
  };

  return (
    <PageContainer>
      {/* 1. Standardized Page Header with Breadcrumbs */}
      <PageHeader
        breadcrumbs={[
          { label: 'BlockVault', href: '/dashboard' },
          { label: 'Integrity Monitor' },
        ]}
        title="Integrity Monitor"
        badge="FIPS 180-4 SHA-256"
        subtitle="Verify vaulted binaries in IndexedDB or audit external disk files against anchored origin SHA-256 digests."
        actions={
          <button
            onClick={handleReverifyAll}
            disabled={reverifyingAll || evidence.length === 0}
            className="h-9 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs shadow-sm transition inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reverifyingAll ? 'animate-spin' : ''}`} />
            <span>{reverifyingAll ? 'Auditing Vault...' : 'Verify All Binaries'}</span>
          </button>
        }
      />

      {/* 2. Standardized KPI Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Monitored Evidence"
          value={evidence.length}
          helper="Vaulted binary items"
          icon={ShieldCheck}
          accent="cyan"
        />
        <KpiCard
          label="Verified Intact"
          value={verifiedCount}
          helper="Bit-for-bit SHA-256 confirmed"
          icon={CheckCircle2}
          accent="emerald"
        />
        <KpiCard
          label="Hash Discrepancies"
          value={tamperedList.length}
          helper={tamperedList.length === 0 ? 'Zero integrity alerts' : 'Action required'}
          icon={AlertOctagon}
          accent={tamperedList.length > 0 ? 'crimson' : 'neutral'}
        />
        <KpiCard
          label="Audit Check Runs"
          value={
            auditLogs.filter(
              (a) =>
                a.action === 'VERIFY_EVIDENCE' ||
                a.action === 'DISK_FILE_VERIFICATION' ||
                a.action === 'TAMPER_SIMULATION'
            ).length
          }
          helper="Logged verification events"
          icon={FileCheck2}
          accent="blue"
        />
      </div>

      {/* Cryptographic File Verification & Tamper Simulation Workbench */}
      <div className="bg-[#0C101D] border border-white/[0.08] rounded-2xl overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        {/* Tab Selector */}
        <div className="flex border-b border-white/[0.06] bg-white/[0.02]">
          <button
            onClick={() => setWorkbenchTab('DISK_AUDIT')}
            className={`px-6 py-3.5 text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 border-b-2 cursor-pointer ${
              workbenchTab === 'DISK_AUDIT'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            Live External Disk File Cryptographic Audit
          </button>
          <button
            onClick={() => setWorkbenchTab('TAMPER_SIMULATION')}
            className={`px-6 py-3.5 text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 border-b-2 cursor-pointer ${
              workbenchTab === 'TAMPER_SIMULATION'
                ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4" />
            Controlled Tamper Simulation (Isolated Test Copy)
          </button>
        </div>

        <div className="p-6">
          {workbenchTab === 'DISK_AUDIT' ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-cyan-400" />
                  Live Cryptographic File Verification & Disk Audit
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Select any vaulted evidence artifact and provide an external file from disk to compute its live SHA-256 digest and verify bit-for-bit equality against the anchored intake hash.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-5">
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                    Select Vaulted Evidence Record *
                  </label>
                  <select
                    value={selectedEvidenceId}
                    onChange={(e) => setSelectedEvidenceId(e.target.value)}
                    className="w-full bg-[#060911] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/60 transition"
                  >
                    {evidence.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.evidenceNumber} — {e.title} ({e.originalFileName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                    External Disk File *
                  </label>
                  <button
                    onClick={() =>
                      document.getElementById('workbench-disk-file')?.click()
                    }
                    className="w-full py-2.5 px-3.5 rounded-xl bg-[#060911] border border-white/[0.08] hover:border-cyan-500/40 text-left text-xs font-mono text-slate-300 transition flex items-center gap-2 truncate cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="truncate">
                      {diskFile
                        ? `${diskFile.name} (${diskFile.size.toLocaleString()} B)`
                        : 'Choose External File from Disk...'}
                    </span>
                  </button>
                  <input
                    id="workbench-disk-file"
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setDiskFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>

                <div className="md:col-span-3 flex gap-2">
                  <button
                    onClick={handleVerifyDiskFile}
                    disabled={!selectedEvidenceId || !diskFile || verifyingFile}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Verify Disk File
                  </button>
                  <button
                    onClick={handleVerifyVaultBinary}
                    disabled={!selectedEvidenceId || verifyingFile}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 font-medium text-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    Verify Vault
                  </button>
                </div>
              </div>

              {/* Verification Output Card */}
              {verificationResult && (
                <div
                  className={`mt-4 p-4 rounded-xl border ${
                    verificationResult.matched
                      ? 'bg-emerald-950/40 border-emerald-500/40'
                      : 'bg-red-950/40 border-red-500/45'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      {verificationResult.matched ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <AlertOctagon className="w-5 h-5 text-red-400" />
                      )}
                      <span
                        className={`text-xs font-bold font-mono uppercase tracking-wider ${
                          verificationResult.matched
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}
                      >
                        {verificationResult.matched
                          ? 'CRYPTOGRAPHIC SHA-256 MATCH CONFIRMED'
                          : 'CRITICAL: SHA-256 HASH MISMATCH DETECTED'}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#080C16] border border-white/[0.08] text-slate-300">
                      {verificationResult.source.replace(/_/g, ' ')} • {verificationResult.fileName} ({verificationResult.fileSize.toLocaleString()} B)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-[#080C16] border border-emerald-500/20 rounded-xl p-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold mb-1">
                        Expected Anchored SHA-256 ({verificationResult.evidenceNumber})
                      </div>
                      <div className="font-mono text-slate-200 text-xs break-all">
                        {verificationResult.expectedHash}
                      </div>
                    </div>

                    <div
                      className={`bg-[#080C16] rounded-xl p-3 border shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] ${
                        verificationResult.matched
                          ? 'border-emerald-500/20'
                          : 'border-red-500/30'
                      }`}
                    >
                      <div
                        className={`text-[10px] font-mono uppercase tracking-wider font-bold mb-1 ${
                          verificationResult.matched
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}
                      >
                        Computed File SHA-256 ({verificationResult.fileName})
                      </div>
                      <div
                        className={`font-mono text-xs break-all ${
                          verificationResult.matched
                            ? 'text-slate-200'
                            : 'text-red-300 font-bold'
                        }`}
                      >
                        {verificationResult.computedHash}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: Controlled Tamper Simulation */
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Isolated Tamper Simulation & Security Demonstration Workbench
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Perform controlled cryptographic mutations on an isolated test copy in memory to demonstrate the platform’s tamper detection pipeline. Original vaulted evidence remains 100% immutable.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-5">
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                    Select Target Evidence Artifact *
                  </label>
                  <select
                    value={selectedEvidenceId}
                    onChange={(e) => setSelectedEvidenceId(e.target.value)}
                    className="w-full bg-[#060911] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500/60 transition"
                  >
                    {evidence.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.evidenceNumber} — {e.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                    Controlled Mutation Type *
                  </label>
                  <select
                    value={mutationType}
                    onChange={(e) => setMutationType(e.target.value as any)}
                    className="w-full bg-[#060911] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs font-mono text-amber-400 focus:outline-none focus:border-amber-500/60 transition"
                  >
                    <option value="SINGLE_BYTE_MODIFICATION">
                      Single-Byte Bit Flip (Offset 0x42)
                    </option>
                    <option value="METADATA_ALTERATION">
                      EXIF / Header Metadata Alteration
                    </option>
                    <option value="OBJECT_REPLACEMENT">
                      Counterfeit Payload Substitution
                    </option>
                    <option value="VERSION_ROLLBACK">
                      Legacy Version Rollback Simulation
                    </option>
                    <option value="DELETION_RECREATION">
                      Unanchored Deletion & Recreation
                    </option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <button
                    onClick={handleRunTamperSimulation}
                    disabled={!selectedEvidenceId || simulatingTamper}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-semibold text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    {simulatingTamper ? 'Simulating...' : 'Execute Mutation on Test Copy'}
                  </button>
                </div>
              </div>

              {simulationResult && (
                <div className="mt-4 p-4 rounded-xl border border-red-500/40 bg-red-950/40 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertOctagon className="w-5 h-5 text-red-400" />
                      <span className="text-xs font-bold font-mono uppercase tracking-wider text-red-400">
                        HASH MISMATCH — INTEGRITY VIOLATION DETECTED (SIMULATION)
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-red-500/10 text-red-300 border border-red-500/30">
                      MUTATION: {simulationResult.mutationType}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-[#080C16] border border-emerald-500/20 rounded-xl p-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold mb-1">
                        Original Reference Hash ({simulationResult.evidenceNumber})
                      </div>
                      <div className="font-mono text-slate-200 text-xs break-all">
                        {simulationResult.originalHash}
                      </div>
                    </div>

                    <div className="bg-[#080C16] border border-red-500/30 rounded-xl p-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-bold mb-1">
                        Mutated Test Copy SHA-256 ({simulationResult.fileName})
                      </div>
                      <div className="font-mono text-red-300 text-xs break-all font-bold">
                        {simulationResult.tamperedHash}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#080C16] border border-white/[0.08] flex items-center gap-2 text-xs text-slate-300">
                    <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>
                      <strong className="text-white">Forensic Assurance:</strong> {simulationResult.notes}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Active Alerts Table */}
      <div className="bg-[#0C101D] border border-white/[0.08] rounded-2xl overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
          <h2 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            Cryptographic Integrity Incident Feed ({alerts.length})
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            CONTINUOUS MONITORED STREAM
          </span>
        </div>

        {alerts.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white mb-1">
              No Cryptographic Alerts Recorded
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              All vaulted evidence binaries pass SHA-256 verification against anchored ledger records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-white/[0.02]">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Evidence ID</th>
                  <th className="py-3.5 px-4">Severity & Type</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Incident Details</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {alerts.map((alt) => (
                  <tr key={alt.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(alt.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-white font-bold">
                      {alt.evidenceNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase border font-bold ${
                            alt.severity === 'CRITICAL'
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {alt.severity}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {alt.type}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase border font-bold ${
                          alt.status === 'RESOLVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}
                      >
                        {alt.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-sm">
                      {alt.message}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {alt.status !== 'RESOLVED' ? (
                        <button
                          onClick={() => {
                            setResolveAlertId(alt.id);
                            setResolutionNotes(alt.investigatorNotes || '');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 font-medium text-xs transition cursor-pointer"
                        >
                          Resolve Alert
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-emerald-400">
                          Resolved
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolve Alert Modal */}
      {resolveAlertId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#0C101D] border border-white/[0.08] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  Resolve Integrity Incident Alert
                </h3>
              </div>
              <button
                onClick={() => setResolveAlertId(null)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-400">
                Provide formal disposition notes explaining the resolution of this cryptographic incident or demonstration.
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Resolution & Forensic Disposition Notes *
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g., Incident investigated. Mismatch identified as controlled simulation test / secondary external copy discrepancy verified."
                  className="w-full bg-[#060911] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-end gap-3 bg-white/[0.02]">
              <button
                onClick={() => setResolveAlertId(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResolveAlert}
                disabled={!resolutionNotes.trim()}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default IntegrityMonitorPage;
