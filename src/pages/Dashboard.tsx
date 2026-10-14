import React, { useState } from 'react';
import {
  FolderOpen,
  ShieldCheck,
  Blocks,
  AlertTriangle,
  Plus,
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  FileSearch,
  Lock,
  ArrowUpRight,
  Activity,
  Key,
  Video,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForensicStore } from '../stores/useForensicStore';
import { PageContainer } from '../components/common/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { ForensicBadge } from '../components/common/ForensicBadge';
import { KpiCard } from '../components/common/KpiCard';
import { HashChip } from '../components/common/HashChip';
import { StatusBadge } from '../components/common/StatusBadge';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    cases,
    evidence,
    blocks,
    currentUser,
    verifyChain,
    chainVerification,
    loadDemonstrationData,
  } = useForensicStore();

  const [verifyingChain, setVerifyingChain] = useState(false);

  const activeCasesCount = cases.filter((c) => c.status === 'ACTIVE').length;
  const verifiedEvidenceCount = evidence.filter(
    (e) => e.integrityStatus === 'VERIFIED'
  ).length;
  const tamperedCount = evidence.filter(
    (e) => e.integrityStatus === 'TAMPERED'
  ).length;
  const blockHeight =
    blocks.length > 0 ? blocks[blocks.length - 1].blockHeight : 0;
  const totalTransactions = blocks.reduce(
    (acc, b) => acc + b.transactions.length,
    0
  );

  const handleVerifyChain = async () => {
    setVerifyingChain(true);
    try {
      await verifyChain();
    } finally {
      setVerifyingChain(false);
    }
  };

  return (
    <PageContainer>
      {/* 1. Header with Breadcrumbs and Canonical Naming */}
      <PageHeader
        breadcrumbs={[
          { label: 'BlockVault', href: '/dashboard' },
          { label: 'Dashboard' },
        ]}
        title="Dashboard"
        subtitle="Operational overview of active forensic cases, cryptographic integrity, and PoA ledger commitments."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleVerifyChain}
              disabled={verifyingChain}
              className="h-9 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] text-xs font-medium transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${verifyingChain ? 'animate-spin' : ''}`} />
              <span>{verifyingChain ? 'Auditing...' : 'Audit Ledger'}</span>
            </button>

            {cases.length === 0 && (
              <button
                onClick={async () => {
                  await loadDemonstrationData();
                }}
                className="h-9 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 text-xs font-medium transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <FileSearch className="w-3.5 h-3.5" />
                <span>Load Demo</span>
              </button>
            )}

            <button
              onClick={() => navigate('/cases')}
              className="h-9 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] text-xs font-medium transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Case</span>
            </button>

            <button
              onClick={() => navigate('/evidence')}
              className="h-9 px-3.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-medium shadow-sm transition active:scale-[0.98] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Ingest Evidence</span>
            </button>

            <button
              onClick={() => navigate('/cameras')}
              className="h-9 px-3.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition inline-flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.2)]"
            >
              <Video className="w-3.5 h-3.5 text-cyan-400" />
              <span>Camera Monitor</span>
            </button>
          </div>
        }
      />

      {/* 2. Verification Alert Banner */}
      {chainVerification && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 backdrop-blur-md shadow-sm transition-all ${
            chainVerification.isValid
              ? 'bg-emerald-950/20 border-emerald-500/25 text-emerald-200'
              : 'bg-rose-950/20 border-rose-500/25 text-rose-200'
          }`}
        >
          {chainVerification.isValid ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider">
              {chainVerification.isValid
                ? 'Cryptographic Ledger Verified Intact'
                : 'Ledger Verification Discrepancy'}
            </div>
            <div className="text-xs mt-0.5 text-slate-300">
              {chainVerification.isValid
                ? `${chainVerification.totalBlocksChecked} block(s) and ${chainVerification.totalTransactionsVerified} transaction(s) passed SHA-256 Merkle root & hash continuity checks.`
                : chainVerification.errorDetail}
            </div>
          </div>
        </div>
      )}

      {/* 3. Metric Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Active Forensic Cases"
          value={`${activeCasesCount} / ${cases.length}`}
          helperText={
            cases.length === 0
              ? 'No active dossiers'
              : `${cases.length - activeCasesCount} archived or closed`
          }
          icon={FolderOpen}
          variant="blue"
        />

        <KpiCard
          label="Vault Evidence"
          value={evidence.length}
          helperText={`${verifiedEvidenceCount} cryptographically verified`}
          icon={ShieldCheck}
          variant="emerald"
        />

        <KpiCard
          label="PoA Ledger Height"
          value={`#${blockHeight}`}
          helperText={`${totalTransactions} transactions committed`}
          icon={Blocks}
          variant="purple"
        />

        <KpiCard
          label="Integrity Discrepancies"
          value={tamperedCount > 0 ? `${tamperedCount}` : '0'}
          helperText={
            tamperedCount > 0
              ? 'CRITICAL: Hash mismatch'
              : 'Zero hash discrepancies'
          }
          icon={tamperedCount > 0 ? AlertTriangle : Activity}
          variant={tamperedCount > 0 ? 'rose' : 'cyan'}
        />
      </div>

      {/* 4. Main Grid: Active Cases & Evidence Vault (Equal Height) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Cases Table */}
        <div className="lg:col-span-7 bg-[#0C101D] border border-white/[0.08] rounded-xl overflow-hidden flex flex-col h-full shadow-sm">
          <div className="px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.01] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
                Case Dossiers
              </h2>
            </div>
            <button
              onClick={() => navigate('/cases')}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1 cursor-pointer"
            >
              Manage ({cases.length}) <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {cases.length === 0 ? (
            <div className="p-10 text-center flex-1 flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center mb-3 text-cyan-400">
                <FolderOpen className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">
                No Forensic Cases Initialized
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
                Create your first forensic investigation dossier to begin ingesting, hashing, and anchoring digital evidence files.
              </p>
              <button
                onClick={() => navigate('/cases')}
                className="h-8 px-3.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs transition inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Case</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[11px] font-medium text-slate-400 uppercase tracking-wider bg-white/[0.01]">
                    <th className="py-2.5 px-4 font-mono">Docket</th>
                    <th className="py-2.5 px-4">Title</th>
                    <th className="py-2.5 px-4">Priority</th>
                    <th className="py-2.5 px-4">Evidence</th>
                    <th className="py-2.5 px-4">Investigator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-xs">
                  {cases.slice(0, 5).map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/cases/${c.id}`)}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer h-12"
                    >
                      <td className="py-2.5 px-4 font-mono text-cyan-400 font-semibold whitespace-nowrap">
                        {c.caseNumber}
                      </td>
                      <td className="py-2.5 px-4 text-slate-100 font-medium max-w-[180px] truncate">
                        {c.title}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <ForensicBadge type="priority" value={c.priority} />
                      </td>
                      <td className="py-2.5 px-4 text-slate-300 font-mono text-xs whitespace-nowrap">
                        {c.evidenceCount} item(s)
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 text-xs truncate max-w-[120px]">
                        {c.leadInvestigatorName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Evidence Vault Activity */}
        <div className="lg:col-span-5 bg-[#0C101D] border border-white/[0.08] rounded-xl overflow-hidden flex flex-col h-full shadow-sm">
          <div className="px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.01] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
                Vaulted Evidence
              </h2>
            </div>
            <button
              onClick={() => navigate('/evidence')}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1 cursor-pointer"
            >
              Open Vault ({evidence.length}) <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {evidence.length === 0 ? (
            <div className="p-10 text-center flex-1 flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mb-3 text-emerald-400">
                <FileSearch className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">
                Evidence Vault is Empty
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mb-4 leading-relaxed">
                Upload files from disk to compute SHA-256 digests, encrypt with AES-256-GCM in IndexedDB, and anchor on the ledger.
              </p>
              <button
                onClick={() => navigate('/evidence')}
                className="h-8 px-3.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs transition inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Ingest Evidence File</span>
              </button>
            </div>
          ) : (
            <div className="p-3.5 space-y-2.5 flex-1">
              {evidence.slice(0, 4).map((e) => (
                <div
                  key={e.id}
                  onClick={() => navigate(`/evidence/${e.id}`)}
                  className="bg-[#080C16] border border-white/[0.06] hover:border-cyan-500/35 rounded-lg p-3 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-cyan-400">
                        {e.evidenceNumber}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                        {e.category}
                      </span>
                    </div>
                    <StatusBadge
                      variant={e.integrityStatus === 'VERIFIED' ? 'success' : 'danger'}
                      label={e.integrityStatus === 'VERIFIED' ? 'Verified' : 'Tampered'}
                    />
                  </div>

                  <div className="text-xs text-slate-200 font-medium truncate mb-2">
                    {e.title} <span className="text-slate-400 font-normal">({e.originalFileName})</span>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.04]">
                    <HashChip hash={e.sha256Original} leadLength={6} tailLength={4} />

                    {e.blockchainBlockNumber !== undefined && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        Block #{e.blockchainBlockNumber}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. PoA Ledger Blocks & Protocol Telemetry (Eliminating Dead Space) */}
      <div className="bg-[#0C101D] border border-white/[0.08] rounded-xl overflow-hidden p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Blocks className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
              Proof-of-Authority Cryptographic Ledger
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
              Deterministic Merkle Root
            </span>
          </div>
          <button
            onClick={() => navigate('/blockchain')}
            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1 cursor-pointer"
          >
            Inspect Full Ledger ({blocks.length} Blocks) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Recent Blocks Grid: 4 items filling the space */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {blocks.slice(-4).map((b) => (
              <div
                key={b.blockHeight}
                onClick={() => navigate('/blockchain')}
                className="bg-[#080C16] border border-white/[0.06] hover:border-cyan-500/35 rounded-lg p-3.5 cursor-pointer transition-colors flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-cyan-400">
                    Block #{b.blockHeight} {b.blockHeight === 0 ? '(Genesis)' : ''}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                    {b.transactions.length} tx
                  </span>
                </div>
                <div className="space-y-1.5 my-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono text-[10px]">HASH:</span>
                    <HashChip hash={b.blockHash} leadLength={6} tailLength={4} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono text-[10px]">MERKLE:</span>
                    <HashChip hash={b.merkleRoot} leadLength={6} tailLength={4} />
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 pt-2 border-t border-white/[0.04] flex items-center justify-between">
                  <span>Validator: {typeof b.validator === 'string' ? b.validator : (b.validator as any)?.nodeId || 'Node #01'}</span>
                  <span className="font-mono">{new Date(b.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Ledger Telemetry & Protocol Panel */}
          <div className="lg:col-span-4 bg-[#080C16] border border-white/[0.06] rounded-lg p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-300">Consensus Engine</span>
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                  Active PoA
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                  <span className="text-slate-400">Validator Authority:</span>
                  <span className="text-slate-200 font-mono text-xs">Node #01 (Approved)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                  <span className="text-slate-400">Cryptographic Standard:</span>
                  <span className="text-slate-200 font-mono text-xs">FIPS 180-4 SHA-256</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                  <span className="text-slate-400">Commitment Model:</span>
                  <span className="text-slate-200 font-mono text-xs">Deterministic Merkle</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Active Operator:</span>
                  <span className="text-cyan-400 font-mono text-xs truncate max-w-[140px]">
                    {currentUser.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Key className="w-3 h-3 text-cyan-400" />
                IndexedDB AES-GCM
              </span>
              <span className="font-mono text-slate-500">v1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
