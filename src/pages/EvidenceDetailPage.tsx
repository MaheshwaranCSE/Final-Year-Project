import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  FileCode,
  Link2,
  Blocks,
  ScanEye,
  Copy,
  Check,
  RefreshCw,
  X,
  AlertOctagon,
  UploadCloud,
  Download,
  FileCheck2,
  HardDrive,
  Cpu,
  Layers,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForensicStore } from '../stores/useForensicStore';
import { getEvidenceBlob } from '../services/vaultStorageService';
import { CustodyAction, FileVerificationResult } from '../types';
import { PageContainer } from '../components/common/PageContainer';

export const EvidenceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    evidence,
    custodyEvents,
    blocks,
    aiRecords,
    verifyEvidence,
    verifyEvidenceWithFile,
    anchorEvidenceToBlockchain,
    recordCustodyTransfer,
    runAIAnalysis,
  } = useForensicStore();

  const [activeTab, setActiveTab] = useState(0);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [anchoring, setAnchoring] = useState(false);
  const [runningAI, setRunningAI] = useState(false);
  const [aiError, setAiError] = useState('');
  const [lastVerificationResult, setLastVerificationResult] =
    useState<FileVerificationResult | null>(null);

  // Vault binary preview URL from IndexedDB
  const [vaultPreviewUrl, setVaultPreviewUrl] = useState<string | null>(null);

  // Custody transfer modal
  const [custodyModalOpen, setCustodyModalOpen] = useState(false);
  const [custodyError, setCustodyError] = useState('');
  const [custodyForm, setCustodyForm] = useState({
    action: 'TRANSFERRED' as CustodyAction,
    toUserName: '',
    location: '',
    newState: '',
    notes: '',
  });

  // External Disk File Verification modal
  const [diskVerifyModalOpen, setDiskVerifyModalOpen] = useState(false);
  const [diskFile, setDiskFile] = useState<File | null>(null);
  const [diskVerifying, setDiskVerifying] = useState(false);

  const item = evidence.find((e) => e.id === id || e.evidenceNumber === id);

  useEffect(() => {
    let revokeUrl: string | null = null;
    if (item) {
      getEvidenceBlob(item.id).then((res) => {
        if (res && res.blob) {
          const url = URL.createObjectURL(res.blob);
          revokeUrl = url;
          setVaultPreviewUrl(url);
        }
      });
    }
    return () => {
      if (revokeUrl) URL.revokeObjectURL(revokeUrl);
    };
  }, [item?.id]);

  const itemCustody = useMemo(() => {
    if (!item) return [];
    return custodyEvents.filter(
      (ev) => ev.evidenceId === item.id || ev.evidenceNumber === item.evidenceNumber
    );
  }, [custodyEvents, item]);

  const itemBlock = useMemo(() => {
    if (!item || !item.blockchainTxId) return null;
    for (const b of blocks) {
      const tx = b.transactions.find(
        (t) => t.txId === item.blockchainTxId || t.evidenceId === item.id
      );
      if (tx) return { block: b, tx };
    }
    return null;
  }, [blocks, item]);

  const itemAiRecord = useMemo(() => {
    if (!item) return null;
    return aiRecords.find(
      (r) => r.evidenceId === item.id || r.evidenceNumber === item.evidenceNumber
    );
  }, [aiRecords, item]);

  if (!item) {
    return (
      <div className="bg-[#0B101E] border border-[#1E293B] rounded-xl p-12 text-center space-y-4">
        <h3 className="text-xl font-bold text-red-400">Evidence Artifact Not Found</h3>
        <p className="text-sm text-slate-400 font-mono">
          No digital evidence artifact matches ID &quot;{id}&quot;.
        </p>
        <button
          onClick={() => navigate('/evidence')}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs border border-slate-700 transition inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Evidence Vault
        </button>
      </div>
    );
  }

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleVerifyVault = async () => {
    setVerifying(true);
    try {
      const res = await verifyEvidence(item.id);
      setLastVerificationResult(res);
    } finally {
      setVerifying(false);
    }
  };

  const handleDiskVerify = async () => {
    if (!diskFile) return;
    setDiskVerifying(true);
    try {
      const res = await verifyEvidenceWithFile(item.id, diskFile);
      setLastVerificationResult(res);
      setDiskVerifyModalOpen(false);
      setDiskFile(null);
    } finally {
      setDiskVerifying(false);
    }
  };

  const handleAnchor = async () => {
    setAnchoring(true);
    try {
      await anchorEvidenceToBlockchain(item.id);
    } finally {
      setAnchoring(false);
    }
  };

  const handleRunAI = async (fileOverride?: File) => {
    setRunningAI(true);
    setAiError('');
    try {
      await runAIAnalysis(item.id, fileOverride);
      setActiveTab(4);
    } catch (err: any) {
      setAiError(err?.message || 'Forensic signal analysis failed.');
    } finally {
      setRunningAI(false);
    }
  };

  const handleAddCustody = async () => {
    if (
      !custodyForm.toUserName.trim() ||
      !custodyForm.location.trim() ||
      !custodyForm.newState.trim() ||
      !custodyForm.notes.trim()
    ) {
      setCustodyError(
        'All custody fields (Recipient/Custodian, Location, New Custodial State, and Notes) must be entered.'
      );
      return;
    }

    setCustodyError('');
    await recordCustodyTransfer({
      evidenceId: item.id,
      action: custodyForm.action,
      toUserName: custodyForm.toUserName.trim(),
      location: custodyForm.location.trim(),
      newState: custodyForm.newState.trim(),
      notes: custodyForm.notes.trim(),
    });
    setCustodyModalOpen(false);
    setCustodyForm({
      action: 'TRANSFERRED',
      toUserName: '',
      location: '',
      newState: '',
      notes: '',
    });
  };

  const hashMatches =
    item.sha256Original.toLowerCase() === item.sha256Current.toLowerCase();

  const tabs = [
    { label: 'Cryptographic Verification & Preview', icon: ShieldCheck },
    { label: 'Extracted Technical Metadata', icon: FileCode },
    { label: `Chain of Custody (${itemCustody.length})`, icon: Link2 },
    { label: 'Blockchain Anchor', icon: Blocks },
    { label: 'Forensic Signal & Media Analysis', icon: ScanEye },
  ];

  return (
    <PageContainer>
      {/* 1. Modern Page Header with Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
        <button onClick={() => navigate('/evidence')} className="hover:text-cyan-400 transition cursor-pointer">
          BlockVault
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
        <button onClick={() => navigate('/evidence')} className="hover:text-cyan-400 transition cursor-pointer">
          Evidence Vault
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
        <span className="text-cyan-400 font-medium">{item.evidenceNumber}</span>
      </div>

      {/* Top Header Banner */}
      <div className="bg-[#0C101D] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-cyan-500/10 via-cyan-500/5 to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                EVIDENCE RECORD
              </span>
              <span className="text-xs font-mono text-cyan-400 font-semibold bg-white/[0.04] px-2.5 py-0.5 rounded-full border border-white/[0.08]">
                {item.evidenceNumber}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold border flex items-center gap-1.5 ${
                  item.integrityStatus === 'VERIFIED'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${item.integrityStatus === 'VERIFIED' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                {item.integrityStatus}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase text-slate-300 bg-white/[0.04] border border-white/[0.08]">
                {item.category}
              </span>
              {item.blockchainTxId && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20">
                  BLOCK #{item.blockchainBlockNumber}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/evidence')}
                className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-cyan-500/40 text-slate-400 hover:text-white flex items-center justify-center transition shrink-0"
                title="Return to Evidence Vault"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {item.title}
                </h1>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  Original File: <span className="text-slate-200">{item.originalFileName}</span> • Case: <span className="text-cyan-400">{item.caseNumber}</span> • Acquired: {new Date(item.collectionDate).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleVerifyVault}
              disabled={verifying}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
              {verifying ? 'Recomputing SHA-256...' : 'Verify Vault Binary'}
            </button>
            <button
              onClick={() => setDiskVerifyModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 text-cyan-400 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              Verify Against Disk File
            </button>
            {!item.blockchainTxId && (
              <button
                onClick={handleAnchor}
                disabled={anchoring}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                <Blocks className="w-3.5 h-3.5" />
                {anchoring ? 'Anchoring...' : 'Anchor to Ledger'}
              </button>
            )}
            <button
              onClick={() => setCustodyModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <Link2 className="w-3.5 h-3.5 text-cyan-400" />
              Record Custody Transfer
            </button>
          </div>
        </div>
      </div>

      {/* Live Verification Notification Banner */}
      {lastVerificationResult && (
        <div
          className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
            lastVerificationResult.matched
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <div className="flex items-start gap-3">
            {lastVerificationResult.matched ? (
              <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold text-sm">
                {lastVerificationResult.matched
                  ? `SHA-256 Verification Passed (${lastVerificationResult.source.replace(/_/g, ' ')})`
                  : `CRITICAL SHA-256 MISMATCH DETECTED (${lastVerificationResult.source.replace(/_/g, ' ')})`}
              </p>
              <p className="font-mono text-xs opacity-90 mt-1">
                File: {lastVerificationResult.fileName} ({lastVerificationResult.fileSize.toLocaleString()} bytes) • Computed SHA-256: {lastVerificationResult.computedHash}
              </p>
            </div>
          </div>
          <button
            onClick={() => setLastVerificationResult(null)}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Critical Alert if Tampered */}
      {!hashMatches && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-300 flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-rose-400 text-sm uppercase tracking-wide">
              Cryptographic Hash Discrepancy Detected
            </h4>
            <p className="text-xs text-rose-200/90 mt-1 font-mono">
              The most recently verified SHA-256 digest ({item.sha256Current.slice(0, 16)}...) diverges from the anchored intake SHA-256 digest ({item.sha256Original.slice(0, 16)}...). Potential bit-level tampering or disk corruption detected.
            </p>
          </div>
        </div>
      )}

      {/* Tabs Container */}
      <div className="bg-[#0C101D] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] rounded-2xl overflow-hidden">
        <div className="p-3 border-b border-white/[0.06] bg-[#070A12]/60 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const active = activeTab === idx;
            return (
              <button
                key={tab.label}
                onClick={() => setActiveTab(idx)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-medium whitespace-nowrap transition cursor-pointer ${
                  active
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 0: Cryptographic Verification & Preview */}
        {activeTab === 0 && (
          <div className="p-6 space-y-6">
            {/* SHA-256 Compare Card */}
            <div className="bg-[#060911] border border-[#1E293B] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  SHA-256 Cryptographic Integrity Comparison
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                  hashMatches
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}>
                  {hashMatches ? 'Bit-for-Bit Verified' : 'Cryptographic Mismatch'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Anchored Origin */}
                <div className="p-4 rounded-lg bg-[#0B101E] border border-[#1E293B] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                      Anchored Origin SHA-256 (At Intake)
                    </span>
                    <button
                      onClick={() => handleCopy(item.sha256Original)}
                      className="p-1 rounded text-slate-400 hover:text-cyan-400 transition"
                      title="Copy SHA-256"
                    >
                      {copiedHash === item.sha256Original ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="font-mono text-xs text-white break-all leading-relaxed bg-[#060911] p-2.5 rounded border border-[#1E293B]/60">
                    {item.sha256Original}
                  </p>
                </div>

                {/* Latest Verified */}
                <div
                  className={`p-4 rounded-lg bg-[#0B101E] border space-y-2 ${
                    hashMatches ? 'border-emerald-500/30' : 'border-rose-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider font-bold ${
                        hashMatches ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      Latest Verified SHA-256 ({hashMatches ? 'Match' : 'Mismatch'})
                    </span>
                    <button
                      onClick={() => handleCopy(item.sha256Current)}
                      className="p-1 rounded text-slate-400 hover:text-cyan-400 transition"
                      title="Copy SHA-256"
                    >
                      {copiedHash === item.sha256Current ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p
                    className={`font-mono text-xs break-all leading-relaxed bg-[#060911] p-2.5 rounded border ${
                      hashMatches
                        ? 'text-slate-200 border-[#1E293B]/60'
                        : 'text-rose-400 border-rose-500/40'
                    }`}
                  >
                    {item.sha256Current}
                  </p>
                </div>
              </div>
            </div>

            {/* Vaulted Binary Media Preview (if stored in IndexedDB) */}
            {vaultPreviewUrl && (
              <div className="bg-[#060911] border border-[#1E293B] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-cyan-400" />
                    Vaulted Binary Payload Inspection ({item.originalFileName})
                  </h3>
                  <a
                    href={vaultPreviewUrl}
                    download={item.originalFileName}
                    className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-semibold flex items-center gap-2 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export Original Binary ({item.fileSize.toLocaleString()} bytes)
                  </a>
                </div>

                {item.category === 'IMAGE' && (
                  <div className="text-center bg-[#0B101E] border border-[#1E293B] p-4 rounded-xl flex items-center justify-center">
                    <img
                      src={vaultPreviewUrl}
                      alt={item.title}
                      className="max-h-96 max-w-full rounded-lg object-contain border border-[#1E293B]"
                    />
                  </div>
                )}

                {item.category === 'VIDEO' && (
                  <div className="text-center bg-[#0B101E] border border-[#1E293B] p-4 rounded-xl flex items-center justify-center">
                    <video
                      src={vaultPreviewUrl}
                      controls
                      className="max-h-96 max-w-full rounded-lg border border-[#1E293B]"
                    />
                  </div>
                )}

                {item.category === 'AUDIO' && (
                  <div className="p-4 bg-[#0B101E] border border-[#1E293B] rounded-xl">
                    <audio src={vaultPreviewUrl} controls className="w-full" />
                  </div>
                )}
              </div>
            )}

            {/* Technical Specifications Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Storage Parameters */}
              <div className="bg-[#060911] border border-[#1E293B] rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  Cryptographic Storage Parameters
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">
                      Encryption Cipher
                    </span>
                    <span className="text-xs font-mono text-slate-200 font-semibold">
                      {item.encryptionAlgorithm}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">
                      File Size & MIME
                    </span>
                    <span className="text-xs font-mono text-slate-200 font-semibold">
                      {item.fileSize.toLocaleString()} bytes ({item.mimeType})
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">
                      Vault Object Key
                    </span>
                    <span className="text-xs font-mono text-slate-300 break-all bg-[#0B101E] p-2 rounded border border-[#1E293B] block mt-1">
                      {item.storageObjectKey}
                    </span>
                  </div>
                </div>
              </div>

              {/* Provenance */}
              <div className="bg-[#060911] border border-[#1E293B] rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Acquisition & Chain-of-Custody Provenance
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">
                      Collected By
                    </span>
                    <span className="text-xs font-mono text-slate-200 font-semibold">
                      {item.collectedBy}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">
                      Acquisition Method
                    </span>
                    <span className="text-xs font-mono text-slate-200">
                      {item.acquisitionMethod}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">
                      Source Device
                    </span>
                    <span className="text-xs font-mono text-slate-200">
                      {item.sourceDevice}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">
                      Collection Location
                    </span>
                    <span className="text-xs font-mono text-slate-200">
                      {item.collectionLocation}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">
                      Acquisition Tool / Write-Blocker
                    </span>
                    <span className="text-xs font-mono text-slate-200">
                      {item.acquisitionTool}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Extracted Metadata */}
        {activeTab === 1 && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Extracted Technical & EXIF Header Metadata
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Parsed directly from binary headers using forensic EXIF, MIME container and bitstream inspection.
              </p>
            </div>

            <div className="bg-[#060911] border border-[#1E293B] rounded-xl p-5">
              <pre className="text-xs font-mono text-cyan-400 leading-relaxed overflow-x-auto whitespace-pre">
                {JSON.stringify(
                  {
                    originalFileName: item.originalFileName,
                    fileSizeBytes: item.fileSize,
                    mimeType: item.mimeType,
                    extension: item.extension,
                    extractedMediaHeaders: item.metadata,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 2: Chain of Custody */}
        {activeTab === 2 && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Chronological Custodial Log ({itemCustody.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Append-only immutable record of custodial events and examiner sign-offs.
                </p>
              </div>
              <button
                onClick={() => setCustodyModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-semibold flex items-center gap-2 transition"
              >
                <Link2 className="w-3.5 h-3.5" />
                Record Custody Event
              </button>
            </div>

            <div className="space-y-3">
              {itemCustody.map((ev, idx) => (
                <div
                  key={ev.id || idx}
                  className="p-4 rounded-xl bg-[#060911] border border-[#1E293B] flex items-start gap-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Link2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-800 text-slate-200 border border-slate-700">
                          {ev.action}
                        </span>
                        <span className="text-xs font-semibold text-white">
                          {ev.previousState} → {ev.newState}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(ev.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-mono">
                      {ev.notes}
                    </p>
                    <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 pt-1 flex-wrap">
                      <span>Custodian: <strong className="text-white">{ev.userName}</strong> ({ev.userRole})</span>
                      <span>Location: <strong className="text-white">{ev.location}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Blockchain Anchor */}
        {activeTab === 3 && (
          <div className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Proof-of-Authority (PoA) Ledger Anchor
            </h3>

            {itemBlock ? (
              <div className="bg-[#060911] border border-cyan-500/30 rounded-xl p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">
                      Block Height
                    </span>
                    <span className="text-base font-bold font-mono text-cyan-400">
                      Block #{itemBlock.block.blockHeight}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">
                      Confirmation Status
                    </span>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {itemBlock.tx.status}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">
                      Transaction ID
                    </span>
                    <span className="text-xs font-mono text-slate-200 break-all bg-[#0B101E] p-2 rounded border border-[#1E293B] block mt-1">
                      {itemBlock.tx.txId}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">
                      Block SHA-256 Hash
                    </span>
                    <span className="text-xs font-mono text-cyan-400 break-all bg-[#0B101E] p-2 rounded border border-[#1E293B] block mt-1">
                      {itemBlock.block.blockHash}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">
                      Merkle Root
                    </span>
                    <span className="text-xs font-mono text-slate-300 break-all">
                      {itemBlock.block.merkleRoot}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">
                      Validator Node
                    </span>
                    <span className="text-xs font-mono text-slate-300">
                      {itemBlock.block.validator}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <Blocks className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-mono">
                  This evidence item has not yet been anchored into the PoA ledger.
                </p>
                <button
                  onClick={handleAnchor}
                  disabled={anchoring}
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs font-mono transition inline-flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  <Blocks className="w-4 h-4" />
                  {anchoring ? 'Anchoring...' : 'Anchor to Ledger Now'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Forensic Signal & Media Assessment */}
        {activeTab === 4 && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Forensic Signal, Entropy & Media Authenticity Analysis
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Multi-signal heuristics evaluating Shannon byte entropy, frame artifacts, and structural markers.
                </p>
              </div>
              <button
                onClick={() => handleRunAI()}
                disabled={runningAI}
                className="px-3.5 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
              >
                <ScanEye className={`w-3.5 h-3.5 ${runningAI ? 'animate-spin' : ''}`} />
                {runningAI ? 'Executing Signal Analysis...' : 'Run Signal & Entropy Analysis'}
              </button>
            </div>

            {aiError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                {aiError}
              </div>
            )}

            {itemAiRecord ? (
              <div className="bg-[#060911] border border-purple-500/30 rounded-xl p-5 space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-base font-bold text-white">
                      {itemAiRecord.assessment.replace(/_/g, ' ')}
                    </h4>
                    <span className="text-xs font-mono text-slate-400">
                      Engine: {itemAiRecord.modelMethod}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase border ${
                      itemAiRecord.riskLevel === 'CRITICAL' ||
                      itemAiRecord.riskLevel === 'HIGH'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    Anomaly Score: {itemAiRecord.confidenceScore}% ({itemAiRecord.riskLevel} RISK)
                  </span>
                </div>

                {itemAiRecord.binaryMetrics && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-[#0B101E] border border-[#1E293B] rounded-lg">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">
                        Shannon Entropy
                      </span>
                      <span className="text-sm font-bold font-mono text-cyan-400">
                        {itemAiRecord.binaryMetrics.shannonEntropy} bits/byte
                      </span>
                    </div>
                    <div className="p-3 bg-[#0B101E] border border-[#1E293B] rounded-lg">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">
                        Magic Header Hex
                      </span>
                      <span className="text-sm font-bold font-mono text-white">
                        0x{itemAiRecord.binaryMetrics.detectedMagicHex}
                      </span>
                    </div>
                    <div className="p-3 bg-[#0B101E] border border-[#1E293B] rounded-lg">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">
                        Signature Match
                      </span>
                      <span
                        className={`text-xs font-bold font-mono ${
                          itemAiRecord.binaryMetrics.signatureMatchesExtension
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {itemAiRecord.binaryMetrics.signatureMatchesExtension
                          ? 'Matches Extension'
                          : 'Mismatch'}
                      </span>
                    </div>
                    <div className="p-3 bg-[#0B101E] border border-[#1E293B] rounded-lg">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block">
                        Printable ASCII
                      </span>
                      <span className="text-sm font-bold font-mono text-slate-200">
                        {(itemAiRecord.binaryMetrics.printableAsciiRatio * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h5 className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">
                    Measured Forensic Findings
                  </h5>
                  <div className="pl-3 border-l-2 border-purple-500/40 space-y-1.5">
                    {itemAiRecord.reasoningSummary.map((line, idx) => (
                      <p key={idx} className="text-xs font-mono text-slate-300">
                        • {line}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Signal Indicator Breakdown
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {itemAiRecord.indicators.map((ind, i) => (
                      <div
                        key={i}
                        className="p-3 bg-[#0B101E] border border-[#1E293B] rounded-lg space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white">
                            {ind.name}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                              ind.detected
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {ind.detected ? 'Flagged' : 'Nominal'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {ind.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <ScanEye className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-mono">
                  Run signal, pixel/frame, or binary Shannon entropy inspection on this vaulted evidence artifact.
                </p>
                <button
                  onClick={() => handleRunAI()}
                  disabled={runningAI}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs font-mono transition inline-flex items-center gap-2 shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  <ScanEye className="w-4 h-4" />
                  {runningAI ? 'Analyzing Binary...' : 'Execute Signal & Entropy Analysis'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Custody Transfer Modal */}
      {custodyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0B101E] border border-[#1E293B] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl space-y-0">
            <div className="flex items-center justify-between p-5 border-b border-[#1E293B] bg-[#060911]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                  <Link2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Record Chain-of-Custody Event</h3>
              </div>
              <button
                onClick={() => setCustodyModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {custodyError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {custodyError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Custodial Action</label>
                <select
                  value={custodyForm.action}
                  onChange={(e) =>
                    setCustodyForm({
                      ...custodyForm,
                      action: e.target.value as CustodyAction,
                    })
                  }
                  className="w-full bg-[#060911] border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="TRANSFERRED">Transfer of Custody</option>
                  <option value="ACCESSED">Forensic Examination Access</option>
                  <option value="REVIEWED">Judicial / Supervisory Review</option>
                  <option value="EXPORTED">Authorized Court Export</option>
                  <option value="ARCHIVED">Long-Term Vault Archival</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Receiving Custodian / Officer Name & Badge</label>
                <input
                  type="text"
                  required
                  placeholder="Enter receiving officer or examiner name"
                  value={custodyForm.toUserName}
                  onChange={(e) =>
                    setCustodyForm({ ...custodyForm, toUserName: e.target.value })
                  }
                  className="w-full bg-[#060911] border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Physical or Digital Facility Location</label>
                <input
                  type="text"
                  required
                  placeholder="Enter facility, lab room, or secure vault destination"
                  value={custodyForm.location}
                  onChange={(e) =>
                    setCustodyForm({ ...custodyForm, location: e.target.value })
                  }
                  className="w-full bg-[#060911] border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">New Custodial State</label>
                <input
                  type="text"
                  required
                  placeholder="Enter resulting custodial state (e.g., Assigned to Forensic Lab)"
                  value={custodyForm.newState}
                  onChange={(e) =>
                    setCustodyForm({ ...custodyForm, newState: e.target.value })
                  }
                  className="w-full bg-[#060911] border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Custodial Transfer Notes & Authorization</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter reason for transfer, authorization reference, and seal verification notes..."
                  value={custodyForm.notes}
                  onChange={(e) =>
                    setCustodyForm({ ...custodyForm, notes: e.target.value })
                  }
                  className="w-full bg-[#060911] border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-[#1E293B] bg-[#060911] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCustodyModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustody}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition shadow-sm"
              >
                Commit Custody Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* External Disk File Cryptographic Verification Modal */}
      {diskVerifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0B101E] border border-blue-500/30 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl space-y-0">
            <div className="flex items-center justify-between p-5 border-b border-[#1E293B] bg-[#060911]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Verify Against External Disk File</h3>
              </div>
              <button
                onClick={() => setDiskVerifyModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                Select a file from your disk to compute its live SHA-256 digest via Web Crypto API and verify bit-for-bit equality against anchored evidence <strong className="text-white">{item.evidenceNumber}</strong>. If the disk file has been modified by even a single byte, a real cryptographic hash mismatch alert will be recorded.
              </p>

              <div
                onClick={() => document.getElementById('disk-verify-input')?.click()}
                className="border-2 border-dashed border-blue-500/40 rounded-xl p-6 text-center bg-blue-500/5 hover:bg-blue-500/10 transition cursor-pointer space-y-2"
              >
                <input
                  id="disk-verify-input"
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setDiskFile(e.target.files[0]);
                    }
                  }}
                />
                <UploadCloud className="w-8 h-8 text-blue-400 mx-auto" />
                <p className="text-xs font-semibold text-white font-mono">
                  {diskFile
                    ? `${diskFile.name} (${diskFile.size.toLocaleString()} bytes)`
                    : 'Select external file from disk to compare SHA-256'}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">Click or drag local file here</p>
              </div>
            </div>

            <div className="p-4 border-t border-[#1E293B] bg-[#060911] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDiskVerifyModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDiskVerify}
                disabled={!diskFile || diskVerifying}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {diskVerifying && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                {diskVerifying ? 'Computing SHA-256...' : 'Execute SHA-256 Comparison'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default EvidenceDetailPage;
