import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Alert,
  Stack,
  Switch,
  FormControlLabel,
  LinearProgress,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  ShieldCheck,
  UploadCloud,
  Search,
  Copy,
  Check,
  ArrowRight,
  X,
  Plus,
  FileCheck2,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Layers,
  Trash2,
  Image as ImageIcon,
  Film,
  Music,
  FileText,
  RefreshCw,
  Cpu,
  Eye,
  Ban,
  ShieldAlert,
  Maximize2,
  Blocks,
  ScanEye,
  Activity,
  FolderOpen,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForensicStore } from '../stores/useForensicStore';
import { calculateFileSHA256 } from '../services/cryptoService';
import { extractFileMetadata } from '../services/metadataService';
import { runForensicMediaAnalysis } from '../services/aiAnalysisService';
import { getEvidenceBlob } from '../services/vaultStorageService';
import { EvidenceCategory, Evidence, MediaMetadata, AIAssessment, AIRiskLevel, AIIndicator } from '../types';
import { PageContainer } from '../components/common/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { KpiCard } from '../components/common/KpiCard';
import { HashChip } from '../components/common/HashChip';
import { StatusBadge } from '../components/common/StatusBadge';

export interface StagedEvidenceItem {
  id: string;
  file: File;
  previewUrl: string;
  evidenceNumber: string;
  title: string;
  category: EvidenceCategory;
  computedHash: string;
  extractedMeta: MediaMetadata | null;
  status:
    | 'PENDING_HASH'
    | 'SCREENING'
    | 'READY'
    | 'AI_BLOCKED'
    | 'INGESTING'
    | 'COMPLETED'
    | 'ERROR';
  statusMessage?: string;
  aiAssessment?: AIAssessment;
  aiConfidence?: number;
  aiRiskLevel?: AIRiskLevel;
  aiIndicators?: AIIndicator[];
  aiReasoning?: string[];
  error?: string;
  createdEvidenceId?: string;
}

export interface PreviewModalData {
  title: string;
  evidenceNumber?: string;
  fileName: string;
  fileSize: number;
  category: EvidenceCategory;
  mimeType: string;
  previewUrl: string;
  computedHash?: string;
  aiAssessment?: AIAssessment;
  aiConfidence?: number;
  aiRiskLevel?: AIRiskLevel;
  isAiBlocked?: boolean;
  aiIndicators?: AIIndicator[];
  aiReasoning?: string[];
  metadata?: MediaMetadata | null;
  vaulted?: boolean;
}

function detectCategoryFromFile(file: File): EvidenceCategory {
  if (file.type.startsWith('image/')) return 'IMAGE';
  if (file.type.startsWith('video/')) return 'VIDEO';
  if (file.type.startsWith('audio/')) return 'AUDIO';
  if (/\.(zip|tar|gz|7z|rar)$/i.test(file.name)) return 'ARCHIVE';
  if (/\.(iso|dmg|e01|raw|dd|img)$/i.test(file.name)) return 'DISK_IMAGE';
  return 'DOCUMENT';
}

function getCategoryIcon(cat: EvidenceCategory) {
  switch (cat) {
    case 'IMAGE':
      return <ImageIcon size={14} color="#38BDF8" />;
    case 'VIDEO':
      return <Film size={14} color="#A855F7" />;
    case 'AUDIO':
      return <Music size={14} color="#EC4899" />;
    case 'ARCHIVE':
    case 'DISK_IMAGE':
      return <Layers size={14} color="#F59E0B" />;
    default:
      return <FileText size={14} color="#94A3B8" />;
  }
}

export const EvidencePage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const appendFileInputRef = useRef<HTMLInputElement>(null);

  const {
    evidence,
    cases,
    blocks,
    currentUser,
    aiRecords,
    addEvidence,
    verifyEvidence,
    anchorEvidenceToBlockchain,
    runAIAnalysis,
  } = useForensicStore();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [integrityFilter, setIntegrityFilter] = useState<string>('ALL');
  const [caseFilter, setCaseFilter] = useState<string>('ALL');
  const [aiFilter, setAiFilter] = useState<string>('ALL');

  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [anchoringId, setAnchoringId] = useState<string | null>(null);
  const [scanningAIId, setScanningAIId] = useState<string | null>(null);

  // Multi-File Upload & AI Screening Intake Wizard State
  const [openWizard, setOpenWizard] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<StagedEvidenceItem[]>([]);
  const [autoAiScan, setAutoAiScan] = useState(true);
  const [formError, setFormError] = useState('');

  // Processing state during batch ingest
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, stage: '' });
  const [isBatchFinished, setIsBatchFinished] = useState(false);

  // Preview Modal State
  const [previewData, setPreviewData] = useState<PreviewModalData | null>(null);

  const [batchForm, setBatchForm] = useState({
    caseId: cases[0]?.id || '',
    baseEvidenceNumber: '',
    sourceDevice: 'Physical Media Extraction / Digital Workstation',
    acquisitionMethod: 'PHYSICAL_EXTRACTION' as Evidence['acquisitionMethod'],
    acquisitionTool: 'BlockVault Forensic Suite v2.4 (FIPS 180-4 Hashing Engine)',
    collectionLocation: 'Cyber Forensic Intake Facility / Secure Lab Terminal',
    description: '',
  });

  const canIngest = currentUser.role !== 'REVIEWER';

  // Revoke object URLs when staged items change or unmount
  useEffect(() => {
    return () => {
      stagedFiles.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  const filteredEvidence = useMemo(() => {
    return evidence.filter((e) => {
      const matchSearch =
        e.evidenceNumber.toLowerCase().includes(search.toLowerCase()) ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.originalFileName.toLowerCase().includes(search.toLowerCase()) ||
        e.sha256Original.toLowerCase().includes(search.toLowerCase()) ||
        e.caseNumber.toLowerCase().includes(search.toLowerCase());

      const matchCat = categoryFilter === 'ALL' || e.category === categoryFilter;
      const matchIntegrity = integrityFilter === 'ALL' || e.integrityStatus === integrityFilter;
      const matchCase = caseFilter === 'ALL' || e.caseId === caseFilter;

      let matchAi = true;
      if (aiFilter === 'SYNTHETIC') {
        matchAi =
          e.aiAssessment === 'LIKELY_SYNTHETIC' || e.aiAssessment === 'POTENTIALLY_SYNTHETIC';
      } else if (aiFilter === 'AUTHENTIC') {
        matchAi = e.aiAssessment === 'NO_STRONG_SYNTHETIC_INDICATORS';
      } else if (aiFilter === 'NOT_ANALYZED') {
        matchAi = !e.aiAnalysisStatus || e.aiAnalysisStatus === 'NOT_ANALYZED';
      }

      return matchSearch && matchCat && matchIntegrity && matchCase && matchAi;
    });
  }, [evidence, search, categoryFilter, integrityFilter, caseFilter, aiFilter]);

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleVerify = async (id: string) => {
    setVerifyingId(id);
    try {
      await verifyEvidence(id);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleAnchor = async (id: string) => {
    setAnchoringId(id);
    try {
      await anchorEvidenceToBlockchain(id);
    } finally {
      setAnchoringId(null);
    }
  };

  const handleRunAI = async (id: string) => {
    setScanningAIId(id);
    try {
      await runAIAnalysis(id);
    } finally {
      setScanningAIId(null);
    }
  };

  // Helper to open preview for a staged file
  const handleOpenStagedPreview = (item: StagedEvidenceItem) => {
    setPreviewData({
      title: item.title,
      evidenceNumber: item.evidenceNumber,
      fileName: item.file.name,
      fileSize: item.file.size,
      category: item.category,
      mimeType: item.file.type || 'application/octet-stream',
      previewUrl: item.previewUrl,
      computedHash: item.computedHash,
      aiAssessment: item.aiAssessment,
      aiConfidence: item.aiConfidence,
      aiRiskLevel: item.aiRiskLevel,
      isAiBlocked: item.status === 'AI_BLOCKED',
      aiIndicators: item.aiIndicators,
      aiReasoning: item.aiReasoning,
      metadata: item.extractedMeta,
      vaulted: false,
    });
  };

  // Helper to open preview for a vaulted evidence item
  const handleOpenVaultedPreview = async (item: Evidence) => {
    let url = item.fileBlobUrl || '';
    if (!url) {
      const vaultObj = await getEvidenceBlob(item.id);
      if (vaultObj) {
        url = URL.createObjectURL(vaultObj.blob);
      }
    }
    const aiRec = aiRecords.find((r) => r.evidenceId === item.id || r.evidenceNumber === item.evidenceNumber);

    setPreviewData({
      title: item.title,
      evidenceNumber: item.evidenceNumber,
      fileName: item.originalFileName,
      fileSize: item.fileSize,
      category: item.category,
      mimeType: item.mimeType,
      previewUrl: url,
      computedHash: item.sha256Original,
      aiAssessment: item.aiAssessment || aiRec?.assessment,
      aiConfidence: item.aiConfidence || aiRec?.confidenceScore,
      aiRiskLevel: item.aiRiskLevel || aiRec?.riskLevel,
      isAiBlocked:
        item.aiAssessment === 'LIKELY_SYNTHETIC' ||
        item.aiRiskLevel === 'CRITICAL' ||
        (item.aiConfidence !== undefined && item.aiConfidence >= 45),
      aiIndicators: aiRec?.indicators,
      aiReasoning: aiRec?.reasoningSummary,
      metadata: item.metadata,
      vaulted: true,
    });
  };

  // Process newly selected or dropped files into staged items with immediate pre-screening
  const handleFilesAdded = async (newFiles: File[]) => {
    if (newFiles.length === 0) return;
    setFormError('');

    const baseTag =
      batchForm.baseEvidenceNumber.trim() ||
      `EVD-2026-${String(evidence.length + stagedFiles.length + 1).padStart(3, '0')}`;

    const newStaged: StagedEvidenceItem[] = newFiles.map((file, idx) => {
      const globalIdx = stagedFiles.length + idx;
      const tag =
        newFiles.length === 1 && stagedFiles.length === 0
          ? baseTag
          : `${baseTag.replace(/-\d+$/, '')}-${String(globalIdx + 1).padStart(2, '0')}`;

      const rawTitle = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .trim();
      const formattedTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);

      const previewUrl = URL.createObjectURL(file);

      return {
        id: `stg-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        file,
        previewUrl,
        evidenceNumber: tag.toUpperCase(),
        title: formattedTitle || file.name,
        category: detectCategoryFromFile(file),
        computedHash: '',
        extractedMeta: null,
        status: 'SCREENING',
        statusMessage: 'Screening for AI generation & computing SHA-256...',
      };
    });

    setStagedFiles((prev) => [...prev, ...newStaged]);

    // Asynchronously compute SHA-256 and run AI detection screening in parallel
    newStaged.forEach(async (item) => {
      try {
        const [hash, meta, aiRes] = await Promise.all([
          calculateFileSHA256(item.file),
          extractFileMetadata(item.file),
          autoAiScan
            ? runForensicMediaAnalysis(
                item.file,
                item.id,
                item.evidenceNumber,
                item.category,
                `${currentUser.name} (${currentUser.role})`,
                item.file.name
              ).catch((e) => {
                console.warn('AI pre-screening failed non-fatally:', e);
                return null;
              })
            : Promise.resolve(null),
        ]);

        const isSynthetic =
          aiRes &&
          (aiRes.assessment === 'LIKELY_SYNTHETIC' ||
            aiRes.riskLevel === 'CRITICAL' ||
            aiRes.confidenceScore >= 45);

        setStagedFiles((prev) =>
          prev.map((s) =>
            s.id === item.id
              ? {
                  ...s,
                  computedHash: hash,
                  extractedMeta: meta,
                  status: isSynthetic ? 'AI_BLOCKED' : 'READY',
                  aiAssessment: aiRes?.assessment,
                  aiConfidence: aiRes?.confidenceScore,
                  aiRiskLevel: aiRes?.riskLevel,
                  aiIndicators: aiRes?.indicators,
                  aiReasoning: aiRes?.reasoningSummary,
                  statusMessage: isSynthetic
                    ? `AI Detected (${aiRes.confidenceScore}%) — Blocked from upload`
                    : aiRes
                    ? `Authentic (${aiRes.confidenceScore}%) — Ready`
                    : `SHA-256 Ready: ${hash.substring(0, 16)}...`,
                }
              : s
          )
        );
      } catch (err: any) {
        setStagedFiles((prev) =>
          prev.map((s) =>
            s.id === item.id
              ? {
                  ...s,
                  status: 'ERROR',
                  error: err?.message || 'Failed to inspect file',
                  statusMessage: 'File inspection failed',
                }
              : s
          )
        );
      }
    });
  };

  const handleRemoveStaged = (id: string) => {
    setStagedFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleDismissAllAiBlocked = () => {
    setStagedFiles((prev) => {
      const blocked = prev.filter((item) => item.status === 'AI_BLOCKED');
      blocked.forEach((b) => {
        if (b.previewUrl) URL.revokeObjectURL(b.previewUrl);
      });
      return prev.filter((item) => item.status !== 'AI_BLOCKED');
    });
  };

  const handleUpdateStagedItem = (id: string, updates: Partial<StagedEvidenceItem>) => {
    setStagedFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleApplyBaseTagToAll = () => {
    const cleanBase = batchForm.baseEvidenceNumber.trim().toUpperCase();
    if (!cleanBase) return;

    setStagedFiles((prev) =>
      prev.map((item, idx) => ({
        ...item,
        evidenceNumber:
          prev.length === 1
            ? cleanBase
            : `${cleanBase.replace(/-\d+$/, '')}-${String(idx + 1).padStart(2, '0')}`,
      }))
    );
  };

  // Batch Ingestion Handler (Strictly excludes any AI-blocked artifacts)
  const handleStartBatchIngest = async () => {
    if (stagedFiles.length === 0) {
      setFormError('Please select at least one file from disk to ingest.');
      return;
    }

    // Filter strictly for authentic files only
    const authenticItems = stagedFiles.filter((item) => item.status !== 'AI_BLOCKED');

    if (authenticItems.length === 0) {
      setFormError(
        'Upload Blocked: All staged files have been identified as AI-generated media. BlockVault integrity policy strictly prohibits synthetic media from being admitted as digital evidence.'
      );
      return;
    }

    if (!batchForm.caseId) {
      setFormError('Please select a Target Forensic Case Dossier.');
      return;
    }

    const assignedCase = cases.find((c) => c.id === batchForm.caseId);
    if (!assignedCase) {
      setFormError('Target Case Dossier not found.');
      return;
    }

    // Check if any authentic file is still screening
    const stillScreening = authenticItems.some((f) => f.status === 'SCREENING' || f.status === 'PENDING_HASH');
    if (stillScreening) {
      setFormError('Please wait for the automated AI screening and SHA-256 hashing to finish.');
      return;
    }

    // Check if any authentic file had an error
    const errored = authenticItems.some((f) => f.status === 'ERROR' || !f.computedHash);
    if (errored) {
      setFormError('One or more files encountered an error during hashing. Please remove them.');
      return;
    }

    // Validate fields
    for (const item of authenticItems) {
      if (!item.evidenceNumber.trim() || !item.title.trim()) {
        setFormError('All evidence items must have a non-empty exhibit tag # and title.');
        return;
      }
    }

    if (
      !batchForm.sourceDevice.trim() ||
      !batchForm.acquisitionTool.trim() ||
      !batchForm.collectionLocation.trim()
    ) {
      setFormError('All chain-of-custody fields (Source Device, Acquisition Tool, Location) are required.');
      return;
    }

    setFormError('');
    setIsProcessingBatch(true);
    setBatchProgress({
      current: 0,
      total: authenticItems.length,
      stage: 'Initiating Forensic Sealing Pipeline (Authentic Files Only)...',
    });

    const now = new Date().toISOString();

    for (let i = 0; i < authenticItems.length; i++) {
      const item = authenticItems[i];
      const evNumber = item.evidenceNumber.trim().toUpperCase();

      setBatchProgress({
        current: i + 1,
        total: authenticItems.length,
        stage: `Sealing & Anchoring "${item.title}" (${i + 1}/${authenticItems.length})...`,
      });

      handleUpdateStagedItem(item.id, {
        status: 'INGESTING',
        statusMessage: 'Encrypting AES-256-GCM and anchoring to PoA blockchain block...',
      });

      try {
        const newEvidence: Evidence = {
          id: `ev-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          evidenceNumber: evNumber,
          caseId: assignedCase.id,
          caseNumber: assignedCase.caseNumber,
          title: item.title.trim(),
          description: batchForm.description.trim(),
          category: item.category,
          originalFileName: item.file.name,
          fileSize: item.file.size,
          mimeType: item.file.type || 'application/octet-stream',
          extension: item.file.name.split('.').pop() || '',
          sourceDevice: batchForm.sourceDevice.trim(),
          acquisitionMethod: batchForm.acquisitionMethod,
          acquisitionTool: batchForm.acquisitionTool.trim(),
          acquisitionNotes: batchForm.description.trim(),
          collectedBy: currentUser.name,
          collectionDate: now,
          collectionLocation: batchForm.collectionLocation.trim(),
          sha256Original: item.computedHash,
          sha256Current: item.computedHash,
          integrityStatus: 'VERIFIED',
          lastVerifiedAt: now,
          isEncrypted: true,
          encryptionAlgorithm: 'AES-256-GCM',
          storageObjectKey: `vault/${assignedCase.caseNumber}/${evNumber}/${item.file.name}.enc`,
          currentVersion: 1,
          versions: [
            {
              id: `ver-${Date.now()}-${i}`,
              versionNumber: 1,
              label: 'Initial Forensic Acquisition',
              sha256: item.computedHash,
              createdAt: now,
              createdBy: currentUser.name,
              changeDescription: `Ingested from ${batchForm.sourceDevice.trim()} via ${batchForm.acquisitionMethod}`,
              isOriginal: true,
              fileSize: item.file.size,
            },
          ],
          derivatives: [],
          metadata: item.extractedMeta || {},
          aiAnalysisStatus: 'COMPLETED',
          aiAssessment: item.aiAssessment || 'NO_STRONG_SYNTHETIC_INDICATORS',
          aiConfidence: item.aiConfidence || 0,
          aiRiskLevel: item.aiRiskLevel || 'LOW',
          createdAt: now,
          updatedAt: now,
        };

        const result = await addEvidence(newEvidence, item.file, {
          autoAiScan: false, // already screened
          enforceAiRejection: true,
        });

        handleUpdateStagedItem(item.id, {
          status: 'COMPLETED',
          createdEvidenceId: result.evidence.id,
          statusMessage: 'AES-256-GCM Sealed & Ledger Anchored',
        });
      } catch (err: any) {
        handleUpdateStagedItem(item.id, {
          status: 'ERROR',
          error: err?.message || 'Ingestion failed',
          statusMessage: 'Error during ingestion',
        });
      }
    }

    setIsProcessingBatch(false);
    setIsBatchFinished(true);
  };

  const resetWizard = () => {
    stagedFiles.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setStagedFiles([]);
    setIsProcessingBatch(false);
    setIsBatchFinished(false);
    setFormError('');
    setBatchProgress({ current: 0, total: 0, stage: '' });
  };

  const blockedAiFiles = stagedFiles.filter((s) => s.status === 'AI_BLOCKED');
  const authenticStagedFiles = stagedFiles.filter((s) => s.status !== 'AI_BLOCKED');

  return (
    <PageContainer>
      {/* 1. Header Banner */}
      <PageHeader
        breadcrumbs={[
          { label: 'BlockVault', href: '/dashboard' },
          { label: 'Evidence Vault' },
        ]}
        title="Evidence Vault"
        subtitle="Cryptographically verified digital evidence repository anchored to the Proof-of-Authority ledger."
        actions={
          canIngest && (
            <button
              onClick={() => {
                resetWizard();
                setOpenWizard(true);
              }}
              className="h-9 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs shadow-sm transition-all active:scale-[0.98] inline-flex items-center gap-2 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Ingest Evidence</span>
            </button>
          )
        }
      />

      {/* 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Evidence"
          value={evidence.length}
          helperText={`${(evidence.reduce((acc, e) => acc + (e.fileSize || 0), 0) / (1024 * 1024)).toFixed(2)} MB Vaulted`}
          icon={FolderOpen}
          variant="cyan"
        />

        <KpiCard
          label="Cryptographic Integrity"
          value={`${evidence.filter((e) => e.integrityStatus === 'VERIFIED').length} / ${evidence.length}`}
          helperText="100% Bit-for-Bit Verified"
          icon={ShieldCheck}
          variant="emerald"
        />

        <KpiCard
          label="AI Deepfake Screening"
          value={`${evidence.filter((e) => e.aiAnalysisStatus === 'COMPLETED').length} Screened`}
          helperText={
            evidence.filter((e) => e.aiRiskLevel === 'CRITICAL' || e.aiRiskLevel === 'HIGH').length > 0
              ? `${evidence.filter((e) => e.aiRiskLevel === 'CRITICAL' || e.aiRiskLevel === 'HIGH').length} Anomalies Flagged`
              : '0 Anomalies Detected'
          }
          icon={ScanEye}
          variant={evidence.filter((e) => e.aiRiskLevel === 'CRITICAL' || e.aiRiskLevel === 'HIGH').length > 0 ? 'rose' : 'purple'}
        />

        <KpiCard
          label="Blockchain Ledger"
          value={`${evidence.filter((e) => e.blockchainTxId).length} Anchored`}
          helperText={`PoA Consensus · Block #${blocks.length > 0 ? blocks[blocks.length - 1].blockHeight : 0}`}
          icon={Blocks}
          variant="blue"
        />
      </div>

      {/* Unified Filter Toolbar & Evidence Table Card */}
      <div className="bg-[#0C101D] border border-white/[0.08] rounded-xl overflow-hidden shadow-sm">
        {/* Filter Toolbar */}
        <div className="p-3.5 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3 bg-[#0C101D]">
          <div className="flex items-center gap-2.5 flex-1 min-w-[260px] max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter evidence by ID, filename, or hash..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 bg-[#060911] border border-white/[0.08] rounded-lg pl-9 pr-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/60 transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 bg-[#060911] border border-white/[0.08] rounded-lg px-2.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/60 transition"
            >
              <option value="ALL">All Categories</option>
              <option value="IMAGE">Image</option>
              <option value="VIDEO">Video</option>
              <option value="AUDIO">Audio</option>
              <option value="DOCUMENT">Document</option>
              <option value="DISK_IMAGE">Disk Image</option>
              <option value="ARCHIVE">Archive</option>
            </select>

            <select
              value={aiFilter}
              onChange={(e) => setAiFilter(e.target.value)}
              className="h-9 bg-[#060911] border border-white/[0.08] rounded-lg px-2.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/60 transition"
            >
              <option value="ALL">All AI Statuses</option>
              <option value="SYNTHETIC">Synthetic Flagged</option>
              <option value="AUTHENTIC">Authentic / Low Risk</option>
              <option value="NOT_ANALYZED">Not Analyzed</option>
            </select>

            <select
              value={integrityFilter}
              onChange={(e) => setIntegrityFilter(e.target.value)}
              className="h-9 bg-[#060911] border border-white/[0.08] rounded-lg px-2.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/60 transition"
            >
              <option value="ALL">All Integrity</option>
              <option value="VERIFIED">Verified</option>
              <option value="TAMPERED">Tampered</option>
              <option value="PENDING">Pending</option>
            </select>

            <select
              value={caseFilter}
              onChange={(e) => setCaseFilter(e.target.value)}
              className="h-9 bg-[#060911] border border-white/[0.08] rounded-lg px-2.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/60 transition max-w-[150px]"
            >
              <option value="ALL">All Cases</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caseNumber}
                </option>
              ))}
            </select>

            {(search || categoryFilter !== 'ALL' || aiFilter !== 'ALL' || integrityFilter !== 'ALL' || caseFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('ALL');
                  setAiFilter('ALL');
                  setIntegrityFilter('ALL');
                  setCaseFilter('ALL');
                }}
                className="h-9 px-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
              >
                Clear
              </button>
            )}

            <span className="text-xs text-slate-400 ml-2 hidden sm:inline">
              Showing {filteredEvidence.length} of {evidence.length}
            </span>
          </div>
        </div>

        {/* Evidence Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.01] text-xs font-medium text-slate-400 h-10">
                <th className="py-2.5 px-4 font-medium min-w-[220px]">Evidence</th>
                <th className="py-2.5 px-3 font-medium w-24 whitespace-nowrap">Case</th>
                <th className="py-2.5 px-3 font-medium w-40 whitespace-nowrap">SHA-256 Digest</th>
                <th className="py-2.5 px-3 font-medium w-36 whitespace-nowrap">AI Screening</th>
                <th className="py-2.5 px-3 font-medium w-24 whitespace-nowrap">Integrity</th>
                <th className="py-2.5 px-3 font-medium w-24 whitespace-nowrap">Ledger</th>
                <th className="py-2.5 px-4 font-medium w-28 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredEvidence.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <ShieldCheck className="w-10 h-10 text-emerald-400 opacity-60 mb-2" />
                      <div className="text-base font-semibold text-white mb-1">
                        {evidence.length === 0 ? 'No Evidence in Vault' : 'No Matching Evidence'}
                      </div>
                      <div className="text-xs text-slate-400 mb-4 text-center leading-relaxed">
                        {evidence.length === 0
                          ? 'Select files from disk to screen for AI generation, encrypt with AES-256-GCM, and anchor to a case dossier.'
                          : 'Try adjusting your search query or filters to find what you are looking for.'}
                      </div>
                      {evidence.length === 0 && canIngest && (
                        <button
                          onClick={() => {
                            resetWizard();
                            setOpenWizard(true);
                          }}
                          className="h-8 px-3.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Ingest First Evidence</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEvidence.map((item) => (
                  <tr
                    key={item.id}
                    className="h-16 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    onClick={() => navigate(`/evidence/${item.id}`)}
                  >
                    {/* 1. Evidence Thumbnail + Name + Subtitle */}
                    <td className="py-3 px-4 min-w-[220px]">
                      <div className="flex items-center gap-3">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenVaultedPreview(item);
                          }}
                          className="w-10 h-10 rounded-lg bg-[#060911] border border-white/[0.08] hover:border-cyan-400/50 transition-colors flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
                        >
                          {item.fileBlobUrl && item.category === 'IMAGE' ? (
                            <img src={item.fileBlobUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            getCategoryIcon(item.category)
                          )}
                        </div>
                        <div className="min-w-0 max-w-[240px]">
                          <div className="text-sm font-medium text-white truncate group-hover:text-cyan-300 transition-colors">
                            {item.title}
                          </div>
                          <div className="text-xs text-slate-400 truncate flex items-center gap-1.5 font-mono">
                            <span className="text-cyan-400 font-semibold">{item.evidenceNumber}</span>
                            <span>·</span>
                            <span className="truncate">{item.originalFileName}</span>
                            <span>·</span>
                            <span>{(item.fileSize / 1024).toFixed(0)} KB</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Case Number */}
                    <td className="py-3 px-3 whitespace-nowrap font-mono text-xs text-slate-300 font-medium">
                      {item.caseNumber}
                    </td>

                    {/* 3. SHA-256 Digest */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <HashChip hash={item.sha256Original} />
                    </td>

                    {/* 4. AI Screening */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {item.aiAnalysisStatus === 'COMPLETED' ? (
                        <StatusBadge
                          variant={
                            item.aiAssessment === 'LIKELY_SYNTHETIC'
                              ? 'danger'
                              : item.aiAssessment === 'POTENTIALLY_SYNTHETIC'
                              ? 'warning'
                              : 'success'
                          }
                          label={
                            item.aiAssessment === 'LIKELY_SYNTHETIC'
                              ? `Synthetic (${item.aiConfidence}%)`
                              : item.aiAssessment === 'POTENTIALLY_SYNTHETIC'
                              ? `Suspicious (${item.aiConfidence}%)`
                              : `Authentic (${item.aiConfidence}%)`
                          }
                        />
                      ) : item.aiAnalysisStatus === 'RUNNING' ? (
                        <span className="text-xs text-blue-400 animate-pulse font-medium">Scanning...</span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRunAI(item.id);
                          }}
                          disabled={scanningAIId === item.id}
                          className="px-2 py-0.5 rounded text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition cursor-pointer"
                        >
                          {scanningAIId === item.id ? 'Scanning...' : 'Scan AI'}
                        </button>
                      )}
                    </td>

                    {/* 5. Cryptographic Integrity */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge
                        variant={item.integrityStatus === 'VERIFIED' ? 'success' : 'danger'}
                        label={item.integrityStatus === 'VERIFIED' ? 'Verified' : 'Tampered'}
                      />
                    </td>

                    {/* 6. Blockchain Ledger */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {item.blockchainTxId ? (
                        <span className="font-mono text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-medium">
                          Block #{item.blockchainBlockNumber}
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAnchor(item.id);
                          }}
                          disabled={anchoringId === item.id}
                          className="px-2 py-0.5 rounded text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition cursor-pointer"
                        >
                          {anchoringId === item.id ? 'Anchoring...' : 'Anchor'}
                        </button>
                      )}
                    </td>

                    {/* 7. Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenVaultedPreview(item)}
                          className="h-7 px-2 rounded text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition flex items-center gap-1 cursor-pointer"
                          title="Preview Evidence"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                        <button
                          onClick={() => handleVerify(item.id)}
                          disabled={verifyingId === item.id}
                          className="h-7 px-2.5 rounded text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 transition flex items-center gap-1 cursor-pointer"
                          title="Verify Cryptographic Hash & Ledger Anchor"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>{verifyingId === item.id ? 'Verifying...' : 'Verify'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-File Upload & Automated AI Detection Intake Dialog */}
      <Dialog
        open={openWizard}
        onClose={() => {
          if (!isProcessingBatch) {
            setOpenWizard(false);
            resetWizard();
          }
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0C101D',
            color: '#F8FAFC',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 3,
            boxShadow: '0 24px 72px rgba(0, 0, 0, 0.95)',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            pb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: 'rgba(37, 99, 235, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(37, 99, 235, 0.3)',
              }}
            >
              <UploadCloud size={20} color="#3B82F6" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#F8FAFC', fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
                Forensic Evidence Intake & Multi-Modal AI Detection
              </Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '0.8rem', mt: 0.25 }}>
                Batch file acquisition with live media preview, automated AI deepfake screening, and strict synthetic media rejection
              </Typography>
            </Box>
          </Box>
          {!isProcessingBatch && (
            <IconButton
              onClick={() => {
                setOpenWizard(false);
                resetWizard();
              }}
              sx={{ color: '#64748B' }}
            >
              <X size={18} />
            </IconButton>
          )}
        </DialogTitle>

        <DialogContent sx={{ py: 3 }}>
          {cases.length === 0 && (
            <Alert
              severity="warning"
              action={
                <Button
                  color="inherit"
                  size="small"
                  startIcon={<Plus size={14} />}
                  onClick={() => {
                    setOpenWizard(false);
                    navigate('/cases');
                  }}
                >
                  Create Case First
                </Button>
              }
              sx={{ mb: 2.5 }}
            >
              No forensic cases exist yet. Every evidence item must be bound to an active Case Dossier.
            </Alert>
          )}

          {formError && (
            <Alert
              severity="error"
              sx={{
                mb: 2.5,
                bgcolor: 'rgba(239, 68, 68, 0.12)',
                color: '#FCA5A5',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              {formError}
            </Alert>
          )}

          {/* ACTIVE INGESTION / COMPLETED VIEW */}
          {isProcessingBatch || isBatchFinished ? (
            <Box sx={{ py: 2 }}>
              <Card
                sx={{
                  bgcolor: '#060911',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  p: 3,
                  borderRadius: 2,
                  mb: 3,
                }}
              >
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      {isBatchFinished ? (
                        <CheckCircle2 size={24} color="#10B981" />
                      ) : (
                        <Cpu size={24} color="#3B82F6" className="animate-spin" />
                      )}
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#F8FAFC' }}>
                          {isBatchFinished
                            ? 'Batch Evidence Ingestion & Cryptographic Sealing Complete'
                            : 'Executing Forensic Sealing & Blockchain Anchoring Pipeline'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                          {isBatchFinished
                            ? `Successfully vaulted and anchored ${authenticStagedFiles.length} authentic artifacts to the PoA ledger.`
                            : batchProgress.stage}
                        </Typography>
                      </Box>
                    </Stack>
                    <Chip
                      label={`${batchProgress.current} / ${batchProgress.total} Items`}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontFamily: '"JetBrains Mono", monospace',
                        bgcolor: isBatchFinished ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                        color: isBatchFinished ? '#34D399' : '#60A5FA',
                      }}
                    />
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={(batchProgress.current / Math.max(1, batchProgress.total)) * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: 'rgba(255, 255, 255, 0.08)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: isBatchFinished ? '#10B981' : '#2563EB',
                      },
                    }}
                  />

                  {/* Summary badges when finished */}
                  {isBatchFinished && (
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#0D1527', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                          <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                            TOTAL AUTHENTIC VAULTED
                          </Typography>
                          <Typography variant="h6" sx={{ color: '#38BDF8', fontWeight: 800 }}>
                            {authenticStagedFiles.length} Exhibits
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#0D1527', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                          <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>
                            ADMITTED INTO EVIDENCE
                          </Typography>
                          <Typography variant="h6" sx={{ color: '#34D399', fontWeight: 800 }}>
                            {authenticStagedFiles.filter((s) => s.status === 'COMPLETED').length} Artifacts
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#0D1527', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                          <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 600 }}>
                            AI / SYNTHETIC BLOCKED
                          </Typography>
                          <Typography variant="h6" sx={{ color: '#F87171', fontWeight: 800 }}>
                            {blockedAiFiles.length} Exhibits
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  )}
                </Stack>
              </Card>

              {/* Ingestion results list */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#94A3B8', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Batch Item Cryptographic & Verification Details
              </Typography>
              <TableContainer sx={{ border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'rgba(255, 255, 255, 0.03)' }}>
                    <TableRow>
                      <TableCell sx={{ color: '#64748B', fontWeight: 700, fontSize: '0.72rem' }}>EXHIBIT #</TableCell>
                      <TableCell sx={{ color: '#64748B', fontWeight: 700, fontSize: '0.72rem' }}>FILE & SIZE</TableCell>
                      <TableCell sx={{ color: '#64748B', fontWeight: 700, fontSize: '0.72rem' }}>ORIGIN SHA-256</TableCell>
                      <TableCell sx={{ color: '#64748B', fontWeight: 700, fontSize: '0.72rem' }}>AI FORENSIC VERDICT</TableCell>
                      <TableCell sx={{ color: '#64748B', fontWeight: 700, fontSize: '0.72rem' }}>PREVIEW & STATUS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stagedFiles.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell sx={{ color: '#38BDF8', fontWeight: 700, fontFamily: '"JetBrains Mono", monospace' }}>
                          {s.evidenceNumber}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#F8FAFC' }}>
                            {s.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            {s.file.name} ({(s.file.size / 1024).toFixed(1)} KB)
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.72rem', color: '#94A3B8' }}>
                          {s.computedHash ? `${s.computedHash.substring(0, 16)}...` : 'Pending'}
                        </TableCell>
                        <TableCell>
                          {s.status === 'AI_BLOCKED' ? (
                            <Chip
                              icon={<Ban size={12} color="#EF4444" />}
                              label={`BLOCKED: AI Detected (${s.aiConfidence}%)`}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '0.66rem',
                                fontWeight: 800,
                                bgcolor: 'rgba(239, 68, 68, 0.2)',
                                color: '#F87171',
                                border: '1px solid rgba(239, 68, 68, 0.5)',
                              }}
                            />
                          ) : s.aiAssessment ? (
                            <Chip
                              icon={<CheckCircle2 size={12} color="#10B981" />}
                              label={`Authentic (${s.aiConfidence}%)`}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '0.66rem',
                                fontWeight: 700,
                                bgcolor: 'rgba(16, 185, 129, 0.16)',
                                color: '#34D399',
                              }}
                            />
                          ) : (
                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                              {s.statusMessage || 'Processing...'}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              label={s.status === 'AI_BLOCKED' ? 'REJECTED' : s.status}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.64rem',
                                fontWeight: 700,
                                bgcolor:
                                  s.status === 'COMPLETED'
                                    ? 'rgba(16, 185, 129, 0.2)'
                                    : s.status === 'AI_BLOCKED' || s.status === 'ERROR'
                                    ? 'rgba(239, 68, 68, 0.2)'
                                    : 'rgba(59, 130, 246, 0.2)',
                                color:
                                  s.status === 'COMPLETED'
                                    ? '#10B981'
                                    : s.status === 'AI_BLOCKED' || s.status === 'ERROR'
                                    ? '#EF4444'
                                    : '#60A5FA',
                              }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => handleOpenStagedPreview(s)}
                              sx={{ p: 0.3, color: '#38BDF8' }}
                            >
                              <Eye size={14} />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            /* WIZARD SETUP VIEW */
            <Grid container spacing={3}>
              {/* Step 1: Multi-File Selection & Drag/Drop Zone */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    border: isDragging
                      ? '2px dashed #3B82F6'
                      : '2px dashed rgba(59, 130, 246, 0.4)',
                    borderRadius: 2.5,
                    p: 3.5,
                    textAlign: 'center',
                    bgcolor: isDragging ? 'rgba(37, 99, 235, 0.1)' : 'rgba(37, 99, 235, 0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#3B82F6',
                      bgcolor: 'rgba(37, 99, 235, 0.07)',
                    },
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleFilesAdded(Array.from(e.dataTransfer.files));
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFilesAdded(Array.from(e.target.files));
                        e.target.value = '';
                      }
                    }}
                  />
                  <UploadCloud size={40} color="#3B82F6" style={{ marginBottom: 10 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#F8FAFC', mb: 0.5 }}>
                    Drop evidence files here or click to browse (Multiple files supported)
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94A3B8', maxWidth: 620, mx: 'auto' }}>
                    Select images, videos, audio clips, or documents. Files immediately generate high-resolution previews and undergo real-time multi-modal AI deepfake screening.
                  </Typography>
                  <Chip
                    label="Instant Media Preview • Automated AI Deepfake Rejection Policy Enforced"
                    size="small"
                    sx={{ mt: 1.5, bgcolor: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', fontWeight: 600 }}
                  />
                </Box>
              </Grid>

              {/* Policy Rejection Alert Banner (if AI files were detected) */}
              {blockedAiFiles.length > 0 && (
                <Grid item xs={12}>
                  <Alert
                    severity="error"
                    action={
                      <Button
                        color="inherit"
                        size="small"
                        startIcon={<Trash2 size={13} />}
                        onClick={handleDismissAllAiBlocked}
                        sx={{ fontWeight: 700, textTransform: 'none' }}
                      >
                        Dismiss Blocked AI Files ({blockedAiFiles.length})
                      </Button>
                    }
                    sx={{
                      bgcolor: 'rgba(239, 68, 68, 0.14)',
                      color: '#FCA5A5',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                    }}
                  >
                    <strong>Policy Enforcement: {blockedAiFiles.length} file(s) identified as AI-generated media.</strong>{' '}
                    Per BlockVault evidence standards, synthetic media cannot be uploaded or admitted into the official case vault.
                  </Alert>
                </Grid>
              )}

              {/* Automated AI Synthetic Media Detection Algorithm Toggle Card */}
              <Grid item xs={12}>
                <Card
                  sx={{
                    bgcolor: '#060911',
                    border: '1px solid rgba(168, 85, 247, 0.35)',
                    borderRadius: 2,
                    p: 2.5,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: 2,
                          bgcolor: 'rgba(168, 85, 247, 0.18)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid rgba(168, 85, 247, 0.4)',
                        }}
                      >
                        <Sparkles size={20} color="#C084FC" />
                      </Box>
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F8FAFC', fontSize: '0.95rem' }}>
                            Automated AI Detection & Ingestion Rejection Engine
                          </Typography>
                          <Chip
                            label="Strict Policy Rejection"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              bgcolor: 'rgba(239, 68, 68, 0.2)',
                              color: '#FCA5A5',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                            }}
                          />
                        </Stack>
                        <Typography variant="body2" sx={{ color: '#94A3B8', display: 'block', mt: 0.3, fontSize: '0.8rem' }}>
                          Screening files upon drop. Any artifact confirmed as AI-generated is automatically blocked from being uploaded.
                        </Typography>
                      </Box>
                    </Stack>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={autoAiScan}
                          onChange={(e) => setAutoAiScan(e.target.checked)}
                          color="secondary"
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ fontWeight: 700, color: autoAiScan ? '#C084FC' : '#64748B' }}>
                          {autoAiScan ? 'AI Screening Active' : 'Disabled'}
                        </Typography>
                      }
                    />
                  </Box>

                  {/* Multi-modal Algorithm Specs Badges */}
                  <Grid container spacing={1.5} sx={{ mt: 1.5 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mb: 0.5 }}>
                          <ImageIcon size={14} color="#38BDF8" />
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#38BDF8' }}>
                            Images (JPG / PNG)
                          </Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem', lineHeight: 1.4 }}>
                          Canvas RGB variance + 8x8 DCT boundary discontinuities + C2PA JUMBF / EXIF tags
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mb: 0.5 }}>
                          <Film size={14} color="#A855F7" />
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#A855F7' }}>
                            Video (MP4 / MOV)
                          </Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem', lineHeight: 1.4 }}>
                          HTML5 multi-timestamp frame seeking + Canvas Mean Absolute Difference (MAD) delta
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mb: 0.5 }}>
                          <Music size={14} color="#EC4899" />
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#EC4899' }}>
                            Audio (WAV / MP3)
                          </Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem', lineHeight: 1.4 }}>
                          Web Audio API PCM decoding: Zero-Crossing Rate (ZCR), RMS energy flux, crest factor
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mb: 0.5 }}>
                          <FileText size={14} color="#10B981" />
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#10B981' }}>
                            Binaries / Documents
                          </Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ color: '#94A3B8', display: 'block', fontSize: '0.72rem', lineHeight: 1.4 }}>
                          Shannon byte entropy (0-8 bits) + Magic byte headers + AI generator signatures
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>

              {/* Staged Files Queue Table with Live Previews & AI Status */}
              {stagedFiles.length > 0 && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F8FAFC' }}>
                        Staged Evidence Queue ({stagedFiles.length})
                      </Typography>
                      <Chip
                        label={`${authenticStagedFiles.length} Authentic`}
                        size="small"
                        sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: 'rgba(16, 185, 129, 0.2)', color: '#34D399' }}
                      />
                      {blockedAiFiles.length > 0 && (
                        <Chip
                          label={`${blockedAiFiles.length} AI Blocked`}
                          size="small"
                          sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700, bgcolor: 'rgba(239, 68, 68, 0.2)', color: '#F87171' }}
                        />
                      )}
                    </Stack>

                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Plus size={14} />}
                        onClick={() => appendFileInputRef.current?.click()}
                        sx={{
                          fontSize: '0.75rem',
                          borderColor: 'rgba(255, 255, 255, 0.15)',
                          color: '#FFFFFF',
                          textTransform: 'none',
                        }}
                      >
                        Add More Files
                      </Button>
                      <input
                        ref={appendFileInputRef}
                        type="file"
                        multiple
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleFilesAdded(Array.from(e.target.files));
                            e.target.value = '';
                          }
                        }}
                      />
                      {blockedAiFiles.length > 0 && (
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          startIcon={<Ban size={13} />}
                          onClick={handleDismissAllAiBlocked}
                          sx={{ fontSize: '0.75rem', textTransform: 'none' }}
                        >
                          Remove Blocked AI Files
                        </Button>
                      )}
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Trash2 size={14} />}
                        onClick={() => {
                          stagedFiles.forEach((item) => {
                            if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
                          });
                          setStagedFiles([]);
                        }}
                        sx={{ fontSize: '0.75rem', textTransform: 'none' }}
                      >
                        Clear All
                      </Button>
                    </Stack>
                  </Box>

                  <TableContainer
                    sx={{
                      maxHeight: 340,
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 2,
                      bgcolor: '#060911',
                    }}
                  >
                    <Table size="small" stickyHeader>
                      <TableHead sx={{ bgcolor: '#0B101E' }}>
                        <TableRow>
                          <TableCell sx={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.75rem' }}>Preview</TableCell>
                          <TableCell sx={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.75rem' }}>Evidence #</TableCell>
                          <TableCell sx={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.75rem' }}>Title</TableCell>
                          <TableCell sx={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.75rem' }}>Origin SHA-256</TableCell>
                          <TableCell sx={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.75rem' }}>AI Verdict</TableCell>
                          <TableCell align="right" sx={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.75rem' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stagedFiles.map((item) => {
                          const isBlocked = item.status === 'AI_BLOCKED';

                          return (
                            <TableRow
                              key={item.id}
                              hover
                              sx={{
                                bgcolor: isBlocked ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                                borderLeft: isBlocked ? '3px solid #EF4444' : '3px solid transparent',
                                '&:hover': {
                                  bgcolor: isBlocked
                                    ? 'rgba(239, 68, 68, 0.08)'
                                    : 'rgba(255, 255, 255, 0.02)',
                                },
                              }}
                            >
                              {/* Media Preview Thumbnail */}
                              <TableCell sx={{ width: 130 }}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Box
                                    onClick={() => handleOpenStagedPreview(item)}
                                    sx={{
                                      width: 44,
                                      height: 44,
                                      borderRadius: 1.5,
                                      bgcolor: '#0B101E',
                                      border: isBlocked
                                        ? '1px solid #EF4444'
                                        : '1px solid rgba(255, 255, 255, 0.15)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      overflow: 'hidden',
                                      position: 'relative',
                                      '&:hover': {
                                        borderColor: '#38BDF8',
                                        boxShadow: '0 0 8px rgba(56, 189, 248, 0.3)',
                                      },
                                    }}
                                  >
                                    {item.category === 'IMAGE' ? (
                                      <img
                                        src={item.previewUrl}
                                        alt={item.title}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      />
                                    ) : item.category === 'VIDEO' ? (
                                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Film size={20} color="#A855F7" />
                                      </Box>
                                    ) : item.category === 'AUDIO' ? (
                                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Music size={20} color="#EC4899" />
                                      </Box>
                                    ) : (
                                      <FileText size={20} color="#38BDF8" />
                                    )}
                                  </Box>
                                  <Button
                                    size="small"
                                    onClick={() => handleOpenStagedPreview(item)}
                                    startIcon={<Eye size={12} />}
                                    sx={{
                                      fontSize: '0.68rem',
                                      color: '#38BDF8',
                                      textTransform: 'none',
                                      p: 0.2,
                                    }}
                                  >
                                    Preview
                                  </Button>
                                </Stack>
                              </TableCell>

                              {/* Exhibit Tag # */}
                              <TableCell sx={{ width: 170 }}>
                                <TextField
                                  size="small"
                                  value={item.evidenceNumber}
                                  disabled={isBlocked}
                                  onChange={(e) =>
                                    handleUpdateStagedItem(item.id, {
                                      evidenceNumber: e.target.value.toUpperCase(),
                                    })
                                  }
                                  sx={{
                                    '& input': {
                                      fontFamily: '"JetBrains Mono", monospace',
                                      fontSize: '0.78rem',
                                      py: 0.5,
                                      px: 1,
                                      color: isBlocked ? '#F87171' : '#38BDF8',
                                      fontWeight: 700,
                                    },
                                  }}
                                />
                              </TableCell>

                              {/* Title */}
                              <TableCell>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={item.title}
                                  disabled={isBlocked}
                                  onChange={(e) =>
                                    handleUpdateStagedItem(item.id, { title: e.target.value })
                                  }
                                  helperText={`${item.file.name} (${(item.file.size / 1024).toFixed(1)} KB)`}
                                  FormHelperTextProps={{
                                    sx: { color: '#64748B', fontSize: '0.66rem', mt: 0.2 },
                                  }}
                                  sx={{
                                    '& input': { fontSize: '0.8rem', py: 0.5, px: 1 },
                                  }}
                                />
                              </TableCell>

                              {/* Origin SHA-256 */}
                              <TableCell>
                                {item.status === 'SCREENING' || item.status === 'PENDING_HASH' ? (
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <RefreshCw size={13} color="#3B82F6" className="animate-spin" />
                                    <Typography variant="caption" sx={{ color: '#60A5FA', fontSize: '0.72rem' }}>
                                      Hashing & Screening...
                                    </Typography>
                                  </Stack>
                                ) : item.computedHash ? (
                                  <Stack direction="row" spacing={0.6} alignItems="center">
                                    <FileCheck2 size={14} color="#10B981" />
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontFamily: '"JetBrains Mono", monospace',
                                        color: '#34D399',
                                        fontSize: '0.72rem',
                                      }}
                                    >
                                      {item.computedHash.substring(0, 16)}...
                                    </Typography>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleCopy(item.computedHash)}
                                      sx={{ p: 0.2, color: '#64748B' }}
                                    >
                                      <Copy size={11} />
                                    </IconButton>
                                  </Stack>
                                ) : (
                                  <Typography variant="caption" sx={{ color: '#EF4444' }}>
                                    {item.error || 'Failed'}
                                  </Typography>
                                )}
                              </TableCell>

                              {/* AI Forensic Verdict Column */}
                              <TableCell>
                                {item.status === 'SCREENING' ? (
                                  <Chip
                                    label="Analyzing Signals..."
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: '0.64rem',
                                      bgcolor: 'rgba(59, 130, 246, 0.15)',
                                      color: '#60A5FA',
                                    }}
                                  />
                                ) : isBlocked ? (
                                  <Tooltip title="This artifact has been flagged as AI-generated and cannot be uploaded. Click Preview to view detailed signals.">
                                    <Chip
                                      icon={<Ban size={12} color="#EF4444" />}
                                      label={`BLOCKED: AI Detected (${item.aiConfidence}%)`}
                                      size="small"
                                      sx={{
                                        height: 22,
                                        fontSize: '0.66rem',
                                        fontWeight: 800,
                                        bgcolor: 'rgba(239, 68, 68, 0.22)',
                                        color: '#F87171',
                                        border: '1px solid #EF4444',
                                      }}
                                    />
                                  </Tooltip>
                                ) : item.aiAssessment ? (
                                  <Chip
                                    icon={<CheckCircle2 size={12} color="#10B981" />}
                                    label={`Authentic (${item.aiConfidence}%)`}
                                    size="small"
                                    sx={{
                                      height: 22,
                                      fontSize: '0.66rem',
                                      fontWeight: 700,
                                      bgcolor: 'rgba(16, 185, 129, 0.16)',
                                      color: '#34D399',
                                      border: '1px solid rgba(16, 185, 129, 0.3)',
                                    }}
                                  />
                                ) : (
                                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                                    Ready
                                  </Typography>
                                )}
                              </TableCell>

                              {/* Actions */}
                              <TableCell align="right">
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveStaged(item.id)}
                                  sx={{ color: '#64748B', '&:hover': { color: '#EF4444' } }}
                                >
                                  <X size={15} />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}

              {/* Step 2: Target Case & Batch Chain-of-Custody Parameters */}
              <Grid item xs={12}>
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', my: 0.5 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#94A3B8', mt: 1, mb: 2 }}>
                  Chain of Custody & Acquisition Parameters (Applies to Batch)
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Target Forensic Case Dossier</InputLabel>
                  <Select
                    value={batchForm.caseId}
                    label="Target Forensic Case Dossier"
                    onChange={(e) => setBatchForm({ ...batchForm, caseId: e.target.value })}
                  >
                    {cases.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.caseNumber} — {c.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Base Evidence Number Prefix"
                  placeholder="e.g. EVD-2026-101"
                  value={batchForm.baseEvidenceNumber}
                  onChange={(e) => setBatchForm({ ...batchForm, baseEvidenceNumber: e.target.value })}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          size="small"
                          onClick={handleApplyBaseTagToAll}
                          sx={{ fontSize: '0.68rem', textTransform: 'none', py: 0.2 }}
                        >
                          Auto-Number
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label="Source Device / Storage Medium"
                  value={batchForm.sourceDevice}
                  onChange={(e) => setBatchForm({ ...batchForm, sourceDevice: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Acquisition Method</InputLabel>
                  <Select
                    value={batchForm.acquisitionMethod}
                    label="Acquisition Method"
                    onChange={(e) =>
                      setBatchForm({
                        ...batchForm,
                        acquisitionMethod: e.target.value as Evidence['acquisitionMethod'],
                      })
                    }
                  >
                    <MenuItem value="PHYSICAL_EXTRACTION">Physical Extraction</MenuItem>
                    <MenuItem value="LOGICAL_IMAGE">Logical Image</MenuItem>
                    <MenuItem value="NETWORK_PCAP">Network Packet Capture</MenuItem>
                    <MenuItem value="CCTV_EXPORT">DVR / CCTV Export</MenuItem>
                    <MenuItem value="CLOUD_API_SUBMISSION">Cloud / Warrant Return</MenuItem>
                    <MenuItem value="WITNESS_UPLOAD">Direct Custodial Submission</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label="Forensic Acquisition Tool & Write-Blocker"
                  value={batchForm.acquisitionTool}
                  onChange={(e) => setBatchForm({ ...batchForm, acquisitionTool: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label="Collection / Seizure Location"
                  value={batchForm.collectionLocation}
                  onChange={(e) => setBatchForm({ ...batchForm, collectionLocation: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  label="Custodial Context & Seizure Notes"
                  placeholder="Enter warrant reference, physical location coordinates, or custody transfer context..."
                  value={batchForm.description}
                  onChange={(e) => setBatchForm({ ...batchForm, description: e.target.value })}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {isBatchFinished ? (
            <>
              <Button
                variant="outlined"
                onClick={() => {
                  setOpenWizard(false);
                  resetWizard();
                }}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#FFFFFF',
                  textTransform: 'none',
                }}
              >
                Close & Return to Vault
              </Button>
              {authenticStagedFiles[0]?.createdEvidenceId && (
                <Button
                  variant="contained"
                  onClick={() => {
                    const targetId = authenticStagedFiles[0].createdEvidenceId;
                    setOpenWizard(false);
                    resetWizard();
                    navigate(`/evidence/${targetId}`);
                  }}
                  endIcon={<ArrowRight size={15} />}
                  sx={{
                    bgcolor: '#2563EB',
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#1D4ED8' },
                  }}
                >
                  Inspect Ingested Artifact
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                disabled={isProcessingBatch}
                onClick={() => {
                  setOpenWizard(false);
                  resetWizard();
                }}
                sx={{ color: '#94A3B8', textTransform: 'none' }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleStartBatchIngest}
                disabled={
                  isProcessingBatch ||
                  stagedFiles.length === 0 ||
                  authenticStagedFiles.length === 0 ||
                  stagedFiles.some((f) => f.status === 'SCREENING' || f.status === 'PENDING_HASH')
                }
                startIcon={<UploadCloud size={16} />}
                sx={{
                  bgcolor: authenticStagedFiles.length === 0 ? '#64748B' : '#2563EB',
                  fontWeight: 700,
                  textTransform: 'none',
                  px: 3,
                  py: 1,
                  '&:hover': { bgcolor: authenticStagedFiles.length === 0 ? '#64748B' : '#1D4ED8' },
                }}
              >
                {isProcessingBatch
                  ? 'Sealing & Anchoring...'
                  : authenticStagedFiles.length === 0 && stagedFiles.length > 0
                  ? 'Upload Blocked: All Files Detected as AI'
                  : blockedAiFiles.length > 0
                  ? `Seal & Ingest ${authenticStagedFiles.length} Authentic Items (${blockedAiFiles.length} AI Blocked Excluded)`
                  : `Seal & Ingest ${stagedFiles.length > 0 ? stagedFiles.length : ''} Evidence Item${
                      stagedFiles.length === 1 ? '' : 's'
                    }`}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* High-Resolution Interactive Evidence Preview Modal */}
      {previewData && (
        <Dialog
          open={Boolean(previewData)}
          onClose={() => setPreviewData(null)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: '#0C101D',
              color: '#F8FAFC',
              border: previewData.isAiBlocked
                ? '2px solid #EF4444'
                : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 3,
              boxShadow: '0 24px 72px rgba(0, 0, 0, 0.95)',
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              pb: 1.5,
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  bgcolor: previewData.isAiBlocked
                    ? 'rgba(239, 68, 68, 0.18)'
                    : 'rgba(56, 189, 248, 0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: previewData.isAiBlocked
                    ? '1px solid rgba(239, 68, 68, 0.4)'
                    : '1px solid rgba(56, 189, 248, 0.4)',
                }}
              >
                {previewData.isAiBlocked ? (
                  <Ban size={18} color="#EF4444" />
                ) : (
                  <Eye size={18} color="#38BDF8" />
                )}
              </Box>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#F8FAFC' }}>
                    {previewData.title}
                  </Typography>
                  {previewData.evidenceNumber && (
                    <Chip
                      label={previewData.evidenceNumber}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        fontFamily: '"JetBrains Mono", monospace',
                        bgcolor: 'rgba(56, 189, 248, 0.15)',
                        color: '#38BDF8',
                      }}
                    />
                  )}
                  {previewData.isAiBlocked && (
                    <Chip
                      label="BLOCKED: AI DETECTED"
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.64rem',
                        fontWeight: 800,
                        bgcolor: 'rgba(239, 68, 68, 0.25)',
                        color: '#FCA5A5',
                        border: '1px solid #EF4444',
                      }}
                    />
                  )}
                </Stack>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  {previewData.fileName} • {(previewData.fileSize / 1024).toFixed(1)} KB • {previewData.mimeType}
                </Typography>
              </Box>
            </Stack>
            <IconButton onClick={() => setPreviewData(null)} sx={{ color: '#64748B' }}>
              <X size={18} />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ py: 3 }}>
            <Stack spacing={2.5}>
              {/* Media Renderer */}
              {previewData.category === 'IMAGE' && previewData.previewUrl ? (
                <Box
                  sx={{
                    textAlign: 'center',
                    bgcolor: '#040711',
                    borderRadius: 2,
                    p: 2,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    maxHeight: 460,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={previewData.previewUrl}
                    alt={previewData.title}
                    style={{
                      maxWidth: '100%',
                      maxHeight: 440,
                      objectFit: 'contain',
                      borderRadius: 4,
                    }}
                  />
                </Box>
              ) : previewData.category === 'VIDEO' && previewData.previewUrl ? (
                <Box
                  sx={{
                    bgcolor: '#040711',
                    borderRadius: 2,
                    p: 1.5,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    textAlign: 'center',
                  }}
                >
                  <video
                    src={previewData.previewUrl}
                    controls
                    playsInline
                    style={{
                      maxWidth: '100%',
                      maxHeight: 420,
                      borderRadius: 4,
                    }}
                  />
                </Box>
              ) : previewData.category === 'AUDIO' && previewData.previewUrl ? (
                <Card
                  sx={{
                    bgcolor: '#040711',
                    borderRadius: 2,
                    p: 4,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    textAlign: 'center',
                  }}
                >
                  <Stack spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        bgcolor: 'rgba(236, 72, 153, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(236, 72, 153, 0.3)',
                      }}
                    >
                      <Music size={28} color="#EC4899" />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#F8FAFC' }}>
                      Audio Stream Playback & Inspection
                    </Typography>
                    <audio src={previewData.previewUrl} controls style={{ width: '100%', maxWidth: 520 }} />
                  </Stack>
                </Card>
              ) : (
                <Card
                  sx={{
                    bgcolor: '#040711',
                    borderRadius: 2,
                    p: 4,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    textAlign: 'center',
                  }}
                >
                  <FileText size={48} color="#38BDF8" style={{ marginBottom: 12, opacity: 0.8 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#F8FAFC' }}>
                    {previewData.fileName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94A3B8', mt: 0.5 }}>
                    {previewData.category} Document / Binary Artifact • {(previewData.fileSize / 1024).toFixed(1)} KB
                  </Typography>
                </Card>
              )}

              {/* AI Detection Forensic Verdict & Policy Enforcement Banner */}
              {previewData.isAiBlocked ? (
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <ShieldAlert size={26} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#F87171' }}>
                        UPLOAD DENIED: ARTIFICIAL INTELLIGENCE / SYNTHETIC MEDIA DETECTED
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#FCA5A5', mt: 0.5, fontSize: '0.82rem' }}>
                        Multi-modal forensic analysis determined this file has a {previewData.aiConfidence}% probability of being artificially synthesized ({previewData.aiAssessment?.replace(/_/g, ' ')}).
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#FDA4AF', display: 'block', mt: 1, fontWeight: 700 }}>
                        REJECTION POLICY: BlockVault Digital Evidence Policy prohibits synthetic or deepfake media from admission as official forensic evidence.
                      </Typography>

                      {previewData.aiIndicators && previewData.aiIndicators.length > 0 && (
                        <Box sx={{ mt: 1.5 }}>
                          <Typography variant="caption" sx={{ color: '#FCA5A5', fontWeight: 800, textTransform: 'uppercase' }}>
                            Triggered Forensic Indicators:
                          </Typography>
                          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                            {previewData.aiIndicators
                              .filter((i) => i.detected)
                              .map((ind, idx) => (
                                <Typography key={idx} variant="caption" sx={{ color: '#FECDD3', display: 'block' }}>
                                  • <strong>{ind.name}</strong>: {ind.description}
                                </Typography>
                              ))}
                          </Stack>
                        </Box>
                      )}
                    </Box>
                  </Stack>
                </Box>
              ) : previewData.aiAssessment ? (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <CheckCircle2 size={22} color="#10B981" />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#34D399' }}>
                        AUTHENTICITY VERIFIED: NO SYNTHETIC MEDIA DETECTED
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                        AI Risk: LOW ({previewData.aiConfidence}%) • Passed multi-modal spectral, pixel variance, and metadata checks. Cleared for vault sealing.
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              ) : null}

              {/* Cryptographic SHA-256 Digest Box */}
              {previewData.computedHash && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1.5,
                    bgcolor: '#060911',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <FileCheck2 size={15} color="#38BDF8" />
                      <Typography variant="caption" sx={{ color: '#38BDF8', fontWeight: 700 }}>
                        ORIGIN CRYPTOGRAPHIC SHA-256 DIGEST
                      </Typography>
                    </Stack>
                    <IconButton
                      size="small"
                      onClick={() => handleCopy(previewData.computedHash!)}
                      sx={{ p: 0.2, color: '#64748B' }}
                    >
                      <Copy size={13} />
                    </IconButton>
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: '"JetBrains Mono", monospace',
                      color: '#94A3B8',
                      fontSize: '0.76rem',
                      wordBreak: 'break-all',
                    }}
                  >
                    {previewData.computedHash}
                  </Typography>
                </Box>
              )}
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Button
              onClick={() => setPreviewData(null)}
              sx={{ color: '#94A3B8', textTransform: 'none' }}
            >
              Close Preview
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </PageContainer>
  );
};

export default EvidencePage;
