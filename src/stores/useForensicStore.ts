import { create } from 'zustand';
import {
  User,
  UserRole,
  Case,
  Evidence,
  CustodyEvent,
  CustodyAction,
  BlockchainBlock,
  BlockchainTransaction,
  BlockchainVerificationResult,
  AIAnalysisRecord,
  IntegrityAlert,
  AuditLog,
  ForensicReport,
  ReportType,
  PlatformNotification,
  FileVerificationResult,
  TamperSimulationResult,
} from '../types';
import {
  createAnchoredBlock,
  createGenesisBlock,
  verifyBlockchainIntegrity,
  POA_VALIDATORS,
} from '../services/blockchainService';
import {
  calculateSHA256,
  calculateFileSHA256,
  encryptEvidencePayload,
} from '../services/cryptoService';
import { runForensicMediaAnalysis } from '../services/aiAnalysisService';
import {
  storeEvidenceBinary,
  getEvidenceBinary,
  getEvidenceBlob,
  clearVaultBinaries,
} from '../services/vaultStorageService';
import {
  DEMO_USERS,
  DEMO_CASES,
  DEMO_EVIDENCE,
  DEMO_CUSTODY_EVENTS,
  DEMO_BLOCKS,
  DEMO_AI_RECORDS,
  DEMO_ALERTS,
  DEMO_AUDIT_LOGS,
} from '../data/demonstrationDataset';
import { simulateTamperOnTestCopy as executeTamperSimulation } from '../services/tamperService';

interface ForensicStoreState {
  // Entities
  users: User[];
  currentUser: User;
  isOperatorConfigured: boolean;
  cases: Case[];
  evidence: Evidence[];
  custodyEvents: CustodyEvent[];
  blocks: BlockchainBlock[];
  aiRecords: AIAnalysisRecord[];
  alerts: IntegrityAlert[];
  auditLogs: AuditLog[];
  reports: ForensicReport[];
  notifications: PlatformNotification[];
  chainVerification: BlockchainVerificationResult | null;

  // UI Global State
  searchQuery: string;
  isSearchModalOpen: boolean;

  // Actions
  setSearchQuery: (q: string) => void;
  setSearchModalOpen: (open: boolean) => void;
  registerUser: (
    userData: {
      name: string;
      email: string;
      role: UserRole;
      badgeNumber: string;
      department: string;
    },
    setAsActive?: boolean
  ) => User;
  switchUser: (userId: string) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  toggleUserStatus: (userId: string) => void;

  // Case Actions
  createCase: (
    caseData: Omit<Case, 'id' | 'dateCreated' | 'evidenceCount' | 'lastActivityAt'>
  ) => Case;
  updateCaseStatus: (caseId: string, status: Case['status']) => void;

  addEvidence: (
    newEvidence: Evidence,
    rawFile?: File | Blob,
    options?: { autoAiScan?: boolean; enforceAiRejection?: boolean }
  ) => Promise<{ evidence: Evidence; aiRecord?: AIAnalysisRecord }>;
  verifyEvidence: (evidenceId: string) => Promise<FileVerificationResult>;
  verifyEvidenceWithFile: (
    evidenceId: string,
    externalFile: File
  ) => Promise<FileVerificationResult>;
  verifyAllEvidence: () => Promise<{
    total: number;
    verified: number;
    mismatched: number;
  }>;
  recordCustodyTransfer: (params: {
    evidenceId: string;
    action: CustodyAction;
    toUserName: string;
    location: string;
    notes: string;
    newState: string;
  }) => Promise<void>;
  runAIAnalysis: (
    evidenceId: string,
    fileOverride?: File | Blob
  ) => Promise<AIAnalysisRecord>;

  // Blockchain Actions
  anchorEvidenceToBlockchain: (
    evidenceId: string,
    payloadType?: BlockchainTransaction['payloadType']
  ) => Promise<BlockchainBlock>;
  verifyChain: () => Promise<BlockchainVerificationResult>;

  // Integrity Actions
  resolveAlert: (alertId: string, notes: string) => void;

  // Report Actions
  generateReport: (
    caseId: string,
    reportType: ReportType,
    title: string,
    summary: string
  ) => ForensicReport;

  // Notification Actions
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // System Actions
  clearWorkspaceData: () => Promise<void>;
  initializeLedger: () => Promise<void>;
  loadDemonstrationData: () => Promise<void>;
  simulateTamperOnTestCopy: (
    evidenceId: string,
    mutationType: 'SINGLE_BYTE_MODIFICATION' | 'METADATA_ALTERATION' | 'OBJECT_REPLACEMENT' | 'VERSION_ROLLBACK' | 'DELETION_RECREATION'
  ) => Promise<TamperSimulationResult>;
}

const STORAGE_PREFIX = 'bv_prod_v1_';

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const saveToStorage = <T,>(key: string, data: T): void => {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage quota warning:', e);
  }
};

const UNCONFIGURED_OPERATOR: User = {
  id: 'unconfigured-operator',
  name: '',
  email: '',
  role: 'SUPER_ADMIN',
  badgeNumber: '',
  department: '',
  status: 'ACTIVE',
  assignedCases: [],
  lastLogin: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

const DETERMINISTIC_GENESIS_FALLBACK: BlockchainBlock = {
  blockHeight: 0,
  blockHash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
  previousHash: '0'.repeat(64),
  timestamp: '2025-01-01T00:00:00.000Z',
  merkleRoot: '0'.repeat(64),
  validator: POA_VALIDATORS[0],
  signature: 'POA-SIG-8F434346648F6B96DF89DDA9',
  consensus: 'Proof of Authority (PoA)',
  transactions: [],
};

function getClientHostIdentifier(): string {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return window.location.hostname;
  }
  return 'local-workstation';
}

const storedUsers = loadFromStorage<User[]>('users', []);
const storedCurrentUser = loadFromStorage<User | null>('currentUser', null);
const initialActiveUser =
  storedCurrentUser && storedUsers.some((u) => u.id === storedCurrentUser.id)
    ? storedCurrentUser
    : storedUsers[0] || UNCONFIGURED_OPERATOR;

export const useForensicStore = create<ForensicStoreState>((set, get) => ({
  users: storedUsers,
  currentUser: initialActiveUser,
  isOperatorConfigured: storedUsers.length > 0 && Boolean(initialActiveUser.name),
  cases: loadFromStorage<Case[]>('cases', []),
  evidence: loadFromStorage<Evidence[]>('evidence', []),
  custodyEvents: loadFromStorage<CustodyEvent[]>('custodyEvents', []),
  blocks: loadFromStorage<BlockchainBlock[]>('blocks', [DETERMINISTIC_GENESIS_FALLBACK]),
  aiRecords: loadFromStorage<AIAnalysisRecord[]>('aiRecords', []),
  alerts: loadFromStorage<IntegrityAlert[]>('alerts', []),
  auditLogs: loadFromStorage<AuditLog[]>('auditLogs', []),
  reports: loadFromStorage<ForensicReport[]>('reports', []),
  notifications: loadFromStorage<PlatformNotification[]>('notifications', []),
  chainVerification: null,

  searchQuery: '',
  isSearchModalOpen: false,

  setSearchQuery: (q) => set({ searchQuery: q }),
  setSearchModalOpen: (open) => set({ isSearchModalOpen: open }),

  initializeLedger: async () => {
    const state = get();
    if (
      state.blocks.length === 1 &&
      state.blocks[0].blockHeight === 0 &&
      state.blocks[0].transactions.length === 0
    ) {
      const genesis = await createGenesisBlock(POA_VALIDATORS[0]);
      if (genesis.blockHash !== state.blocks[0].blockHash) {
        const updatedBlocks = [genesis];
        saveToStorage('blocks', updatedBlocks);
        set({ blocks: updatedBlocks });
      }
    }
  },

  registerUser: (userData, setAsActive = false) => {
    const state = get();
    const now = new Date().toISOString();
    const newUser: User = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: userData.name.trim(),
      email: userData.email.trim(),
      role: userData.role,
      badgeNumber: userData.badgeNumber.trim(),
      department: userData.department.trim(),
      status: 'ACTIVE',
      assignedCases: [],
      lastLogin: now,
      createdAt: now,
    };

    const updatedUsers = [...state.users, newUser];
    const shouldActivate = setAsActive || !state.isOperatorConfigured;
    const activeUser = shouldActivate ? newUser : state.currentUser;

    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: now,
      userId: activeUser.id,
      userName: activeUser.name,
      userRole: activeUser.role,
      action: 'REGISTER_USER',
      resourceType: 'USER',
      resourceId: newUser.id,
      result: 'SUCCESS',
      ipAddress: getClientHostIdentifier(),
      details: `Registered personnel profile: ${newUser.name} (${newUser.badgeNumber}) with role ${newUser.role} in ${newUser.department}.`,
    };

    const updatedLogs = [newLog, ...state.auditLogs];
    saveToStorage('users', updatedUsers);
    saveToStorage('currentUser', activeUser);
    saveToStorage('auditLogs', updatedLogs);

    set({
      users: updatedUsers,
      currentUser: activeUser,
      isOperatorConfigured: true,
      auditLogs: updatedLogs,
    });

    return newUser;
  },

  switchUser: (userId) => {
    const state = get();
    const found = state.users.find((u) => u.id === userId);
    if (!found) return;

    const updatedUser: User = {
      ...found,
      lastLogin: new Date().toISOString(),
    };
    const updatedUsers = state.users.map((u) => (u.id === userId ? updatedUser : u));

    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: updatedUser.id,
      userName: updatedUser.name,
      userRole: updatedUser.role,
      action: 'LOGIN',
      resourceType: 'SYSTEM',
      resourceId: 'AUTH-SESSION',
      result: 'SUCCESS',
      ipAddress: getClientHostIdentifier(),
      details: `Active operator session switched to ${updatedUser.name} (${updatedUser.role} — Badge ${updatedUser.badgeNumber}).`,
    };

    const updatedLogs = [newLog, ...state.auditLogs];
    saveToStorage('users', updatedUsers);
    saveToStorage('currentUser', updatedUser);
    saveToStorage('auditLogs', updatedLogs);

    set({
      users: updatedUsers,
      currentUser: updatedUser,
      auditLogs: updatedLogs,
    });
  },

  updateUserRole: (userId, role) => {
    const state = get();
    const target = state.users.find((u) => u.id === userId);
    if (!target) return;

    const updatedUsers = state.users.map((u) => (u.id === userId ? { ...u, role } : u));
    const currentUser =
      state.currentUser.id === userId ? { ...state.currentUser, role } : state.currentUser;

    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userRole: state.currentUser.role,
      action: 'PERMISSION_CHANGE',
      resourceType: 'USER',
      resourceId: userId,
      result: 'SUCCESS',
      ipAddress: getClientHostIdentifier(),
      details: `Updated RBAC role for ${target.name} (${target.badgeNumber}) from ${target.role} to ${role}.`,
    };

    const updatedLogs = [newLog, ...state.auditLogs];
    saveToStorage('users', updatedUsers);
    saveToStorage('currentUser', currentUser);
    saveToStorage('auditLogs', updatedLogs);
    set({ users: updatedUsers, currentUser, auditLogs: updatedLogs });
  },

  toggleUserStatus: (userId) => {
    const state = get();
    const target = state.users.find((u) => u.id === userId);
    if (!target) return;

    const nextStatus = target.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const updatedUsers = state.users.map((u) =>
      u.id === userId ? { ...u, status: nextStatus as User['status'] } : u
    );

    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userRole: state.currentUser.role,
      action: 'PERMISSION_CHANGE',
      resourceType: 'USER',
      resourceId: userId,
      result: 'WARNING',
      ipAddress: getClientHostIdentifier(),
      details: `Account status for ${target.name} (${target.badgeNumber}) set to ${nextStatus}.`,
    };

    const updatedLogs = [newLog, ...state.auditLogs];
    saveToStorage('users', updatedUsers);
    saveToStorage('auditLogs', updatedLogs);
    set({ users: updatedUsers, auditLogs: updatedLogs });
  },

  createCase: (caseData) => {
    const state = get();
    const now = new Date().toISOString();
    const newCase: Case = {
      ...caseData,
      id: `case-${Date.now()}`,
      dateCreated: now,
      evidenceCount: 0,
      lastActivityAt: now,
    };

    const updatedCases = [newCase, ...state.cases];
    const updatedUsers = state.users.map((u) =>
      u.id === newCase.leadInvestigatorId && !u.assignedCases.includes(newCase.caseNumber)
        ? { ...u, assignedCases: [...u.assignedCases, newCase.caseNumber] }
        : u
    );

    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: now,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userRole: state.currentUser.role,
      action: 'CREATE_CASE',
      resourceType: 'CASE',
      resourceId: newCase.caseNumber,
      caseId: newCase.id,
      result: 'SUCCESS',
      ipAddress: getClientHostIdentifier(),
      details: `Initialized forensic case ${newCase.caseNumber}: "${newCase.title}" [${newCase.classification}].`,
    };

    const newNotif: PlatformNotification = {
      id: `notif-${Date.now()}`,
      timestamp: now,
      title: `Case Created: ${newCase.caseNumber}`,
      message: `${newCase.title} initialized by ${state.currentUser.name}.`,
      type: 'INFO',
      link: `/cases/${newCase.id}`,
      read: false,
    };

    const updatedLogs = [newLog, ...state.auditLogs];
    const updatedNotifs = [newNotif, ...state.notifications];

    saveToStorage('cases', updatedCases);
    saveToStorage('users', updatedUsers);
    saveToStorage('auditLogs', updatedLogs);
    saveToStorage('notifications', updatedNotifs);

    set({
      cases: updatedCases,
      users: updatedUsers,
      auditLogs: updatedLogs,
      notifications: updatedNotifs,
    });

    return newCase;
  },

  updateCaseStatus: (caseId, status) => {
    const state = get();
    const target = state.cases.find((c) => c.id === caseId);
    if (!target) return;

    const now = new Date().toISOString();
    const updatedCases = state.cases.map((c) =>
      c.id === caseId ? { ...c, status, lastActivityAt: now } : c
    );

    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: now,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userRole: state.currentUser.role,
      action: status === 'CLOSED' ? 'CLOSE_CASE' : 'UPDATE_CASE',
      resourceType: 'CASE',
      resourceId: target.caseNumber,
      caseId,
      result: 'SUCCESS',
      ipAddress: getClientHostIdentifier(),
      details: `Case ${target.caseNumber} status updated from ${target.status} to ${status}.`,
    };

    const updatedLogs = [newLog, ...state.auditLogs];
    saveToStorage('cases', updatedCases);
    saveToStorage('auditLogs', updatedLogs);
    set({ cases: updatedCases, auditLogs: updatedLogs });
  },

  addEvidence: async (newEvidence, rawFile, options) => {
    // 1. Encrypt & store actual binary in IndexedDB Vault if rawFile provided
    if (rawFile) {
      const fileForCrypto =
        rawFile instanceof File
          ? rawFile
          : new File([rawFile], newEvidence.originalFileName || 'evidence.bin', {
              type: newEvidence.mimeType || 'application/octet-stream',
            });
      const encryptedPayload = await encryptEvidencePayload(fileForCrypto);
      await storeEvidenceBinary(newEvidence.id, rawFile, encryptedPayload);
    }

    const state = get();
    const now = new Date().toISOString();

    // 2. Automated AI Forensic Media & Synthetic Content Screening
    let aiRecord: AIAnalysisRecord | undefined;
    const shouldRunAi = options?.autoAiScan !== false && Boolean(rawFile);
    if (shouldRunAi && rawFile) {
      try {
        aiRecord = await runForensicMediaAnalysis(
          rawFile,
          newEvidence.id,
          newEvidence.evidenceNumber,
          newEvidence.category,
          `${state.currentUser.name} (${state.currentUser.role})`,
          newEvidence.originalFileName
        );
      } catch (err) {
        console.warn('Auto AI screening encountered non-fatal error during ingestion:', err);
      }
    }

    // 2b. Strict AI Detection Rejection Policy:
    // If AI generation is detected, strictly prohibit evidence from being uploaded or anchored to the ledger!
    if (
      aiRecord &&
      (aiRecord.assessment === 'LIKELY_SYNTHETIC' ||
        aiRecord.riskLevel === 'CRITICAL' ||
        aiRecord.confidenceScore >= 45) &&
      options?.enforceAiRejection !== false
    ) {
      const rejectionAlert: IntegrityAlert = {
        id: `alt-${Date.now()}`,
        timestamp: now,
        evidenceId: newEvidence.id,
        evidenceNumber: newEvidence.evidenceNumber,
        caseId: newEvidence.caseId,
        caseNumber: newEvidence.caseNumber,
        severity: 'CRITICAL',
        type: 'METADATA_TAMPERING',
        message: `[AI EVIDENCE REJECTED] Ingestion denied! Evidence artifact "${newEvidence.title}" (${newEvidence.evidenceNumber}) was identified as AI-generated/synthetic media (${aiRecord.confidenceScore}% confidence, ${aiRecord.assessment}) and blocked from being uploaded into the evidence vault.`,
        expectedHash: newEvidence.sha256Original,
        actualHash: newEvidence.sha256Original,
        status: 'OPEN',
        investigatorNotes: `Rejected by BlockVault AI Policy (Threshold: 45%). Detected indicators: ${aiRecord.indicators.filter((i) => i.detected).map((i) => `${i.name}: ${i.description}`).join('; ')}`,
      };

      const rejectionLog: AuditLog = {
        id: `aud-${Date.now()}`,
        timestamp: now,
        userId: state.currentUser.id,
        userName: state.currentUser.name,
        userRole: state.currentUser.role,
        action: 'UPLOAD_EVIDENCE',
        resourceType: 'EVIDENCE',
        resourceId: newEvidence.evidenceNumber,
        caseId: newEvidence.caseId,
        evidenceId: newEvidence.id,
        result: 'FAILURE',
        ipAddress: getClientHostIdentifier(),
        details: `BLOCKED INGESTION: Artifact "${newEvidence.title}" (${newEvidence.originalFileName}) failed AI authenticity verification (${aiRecord.confidenceScore}% probability, assessment: ${aiRecord.assessment}). Upload prohibited by forensic integrity policy.`,
      };

      const rejectionNotif: PlatformNotification = {
        id: `notif-${Date.now()}`,
        timestamp: now,
        title: `EVIDENCE UPLOAD BLOCKED (AI DETECTED): ${newEvidence.evidenceNumber}`,
        message: `"${newEvidence.title}" was blocked from upload because it was detected as AI-generated media (${aiRecord.confidenceScore}%).`,
        type: 'CRITICAL',
        link: '/alerts',
        read: false,
      };

      const updatedAlerts = [rejectionAlert, ...state.alerts];
      const updatedLogs = [rejectionLog, ...state.auditLogs];
      const updatedNotifs = [rejectionNotif, ...state.notifications];
      const updatedAIRecords = [aiRecord, ...state.aiRecords];

      saveToStorage('alerts', updatedAlerts);
      saveToStorage('auditLogs', updatedLogs);
      saveToStorage('notifications', updatedNotifs);
      saveToStorage('aiRecords', updatedAIRecords);

      set({
        alerts: updatedAlerts,
        auditLogs: updatedLogs,
        notifications: updatedNotifs,
        aiRecords: updatedAIRecords,
      });

      throw new Error(
        `AI Evidence Rejection: "${newEvidence.originalFileName}" was detected as AI-generated synthetic media (${aiRecord.confidenceScore}% confidence, ${aiRecord.assessment}) and blocked from upload per BlockVault evidence policy.`
      );
    }

    // 3. Anchor SHA-256 in a new PoA Blockchain Block
    const latestBlock =
      state.blocks[state.blocks.length - 1] || (await createGenesisBlock(POA_VALIDATORS[0]));
    const txId = `0x${(
      await calculateSHA256(`${newEvidence.id}:${newEvidence.sha256Original}:${now}`)
    ).substring(0, 32)}`;

    const newTx: BlockchainTransaction = {
      txId,
      blockHeight: latestBlock.blockHeight + 1,
      timestamp: now,
      evidenceId: newEvidence.id,
      evidenceNumber: newEvidence.evidenceNumber,
      caseId: newEvidence.caseId,
      evidenceHash: newEvidence.sha256Original,
      payloadType: 'EVIDENCE_ANCHOR',
      anchoredBy: `${state.currentUser.name} (${state.currentUser.badgeNumber || state.currentUser.role})`,
      status: 'CONFIRMED',
    };

    const newBlock = await createAnchoredBlock(
      latestBlock,
      [newTx],
      POA_VALIDATORS[newBlockHeightMod(latestBlock.blockHeight + 1)]
    );

    const enrichedEvidence: Evidence = {
      ...newEvidence,
      blockchainTxId: txId,
      blockchainBlockNumber: newBlock.blockHeight,
      ...(aiRecord
        ? {
            aiAnalysisStatus: 'COMPLETED' as const,
            aiAssessment: aiRecord.assessment,
            aiConfidence: aiRecord.confidenceScore,
            aiRiskLevel: aiRecord.riskLevel,
            aiAnalysisId: aiRecord.id,
          }
        : {
            aiAnalysisStatus: newEvidence.aiAnalysisStatus || 'NOT_ANALYZED',
          }),
      updatedAt: now,
    };

    // 4. Custody Events (ACQUIRED + UPLOADED + ANALYZED if AI detected)
    const acquireEvent: CustodyEvent = {
      id: `cust-${Date.now()}-1`,
      evidenceId: enrichedEvidence.id,
      evidenceNumber: enrichedEvidence.evidenceNumber,
      caseId: enrichedEvidence.caseId,
      caseNumber: enrichedEvidence.caseNumber,
      timestamp: enrichedEvidence.collectionDate || now,
      userId: state.currentUser.id,
      userName: enrichedEvidence.collectedBy || state.currentUser.name,
      userRole: state.currentUser.role,
      action: 'ACQUIRED',
      previousState: 'UNCOLLECTED',
      newState: `Collected (${enrichedEvidence.sourceDevice})`,
      hash: enrichedEvidence.sha256Original,
      verificationResult: 'SUCCESS',
      notes:
        enrichedEvidence.acquisitionNotes ||
        `Acquired via ${enrichedEvidence.acquisitionMethod} using ${enrichedEvidence.acquisitionTool}.`,
      location: enrichedEvidence.collectionLocation,
    };

    const uploadEvent: CustodyEvent = {
      id: `cust-${Date.now()}-2`,
      evidenceId: enrichedEvidence.id,
      evidenceNumber: enrichedEvidence.evidenceNumber,
      caseId: enrichedEvidence.caseId,
      caseNumber: enrichedEvidence.caseNumber,
      timestamp: now,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userRole: state.currentUser.role,
      action: 'UPLOADED',
      previousState: `Collected (${enrichedEvidence.sourceDevice})`,
      newState: `BlockVault AES-256-GCM Encrypted Vault (Block #${newBlock.blockHeight})`,
      hash: enrichedEvidence.sha256Original,
      verificationResult: 'SUCCESS',
      notes: `SHA-256 computed (${enrichedEvidence.sha256Original.substring(0, 16)}...), AES-256-GCM sealed, and anchored in Block #${newBlock.blockHeight} (Tx: ${txId}).`,
      location: enrichedEvidence.collectionLocation,
    };

    const extraCustodyEvents: CustodyEvent[] = [];
    if (aiRecord) {
      extraCustodyEvents.push({
        id: `cust-${Date.now()}-3`,
        evidenceId: enrichedEvidence.id,
        evidenceNumber: enrichedEvidence.evidenceNumber,
        caseId: enrichedEvidence.caseId,
        caseNumber: enrichedEvidence.caseNumber,
        timestamp: now,
        userId: state.currentUser.id,
        userName: state.currentUser.name,
        userRole: state.currentUser.role,
        action: 'ANALYZED',
        previousState: 'Vault Ingested Binary',
        newState: `Automated AI Media Detection: ${aiRecord.assessment} (${aiRecord.confidenceScore}%)`,
        hash: enrichedEvidence.sha256Original,
        verificationResult:
          aiRecord.riskLevel === 'CRITICAL' || aiRecord.riskLevel === 'HIGH' ? 'WARNING' : 'SUCCESS',
        notes: `Intake multi-modal AI screening (${aiRecord.modelMethod}): ${aiRecord.assessment}. Risk Score: ${aiRecord.confidenceScore}%. Findings: ${aiRecord.indicators.filter((i) => i.detected).map((i) => i.name).join(', ') || 'No synthetic anomalies detected'}.`,
        location: 'BlockVault Ingestion Gateway AI Screening Unit',
      });
    }

    // 5. Automated Alert & Notification if AI flags synthetic media
    let updatedAlerts = state.alerts;
    let syntheticAlertGenerated = false;
    if (
      aiRecord &&
      (aiRecord.riskLevel === 'CRITICAL' ||
        aiRecord.riskLevel === 'HIGH' ||
        aiRecord.assessment === 'LIKELY_SYNTHETIC' ||
        aiRecord.assessment === 'POTENTIALLY_SYNTHETIC')
    ) {
      syntheticAlertGenerated = true;
      const newAlert: IntegrityAlert = {
        id: `alt-${Date.now()}`,
        timestamp: now,
        evidenceId: enrichedEvidence.id,
        evidenceNumber: enrichedEvidence.evidenceNumber,
        caseId: enrichedEvidence.caseId,
        caseNumber: enrichedEvidence.caseNumber,
        severity: aiRecord.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
        type: 'METADATA_TAMPERING',
        message: `[AI DETECTION ALERT] Synthetic or manipulated media detected during intake on ${enrichedEvidence.evidenceNumber} ("${enrichedEvidence.title}"). Assessed as ${aiRecord.assessment} (${aiRecord.confidenceScore}% confidence).`,
        expectedHash: enrichedEvidence.sha256Original,
        actualHash: enrichedEvidence.sha256Original,
        status: 'OPEN',
        investigatorNotes: `Indicators: ${aiRecord.indicators.filter((i) => i.detected).map((i) => `${i.name}: ${i.description}`).join('; ')}`,
      };
      updatedAlerts = [newAlert, ...state.alerts];
      saveToStorage('alerts', updatedAlerts);
    }

    const updatedEvidence = [enrichedEvidence, ...state.evidence];
    const updatedCases = state.cases.map((c) =>
      c.id === enrichedEvidence.caseId
        ? { ...c, evidenceCount: c.evidenceCount + 1, lastActivityAt: now }
        : c
    );
    const updatedBlocks = [...state.blocks, newBlock];
    const updatedCustody = [...extraCustodyEvents, uploadEvent, acquireEvent, ...state.custodyEvents];
    const updatedAIRecords = aiRecord ? [aiRecord, ...state.aiRecords] : state.aiRecords;

    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: now,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userRole: state.currentUser.role,
      action: 'UPLOAD_EVIDENCE',
      resourceType: 'EVIDENCE',
      resourceId: enrichedEvidence.evidenceNumber,
      caseId: enrichedEvidence.caseId,
      evidenceId: enrichedEvidence.id,
      result: 'SUCCESS',
      ipAddress: getClientHostIdentifier(),
      details: `Ingested "${enrichedEvidence.title}" (${enrichedEvidence.originalFileName}, ${enrichedEvidence.fileSize.toLocaleString()} bytes). SHA-256: ${enrichedEvidence.sha256Original}. Anchored Block #${newBlock.blockHeight}.${aiRecord ? ` AI Screening: ${aiRecord.assessment} (${aiRecord.confidenceScore}%).` : ''}`,
    };

    const newNotif: PlatformNotification = {
      id: `notif-${Date.now()}`,
      timestamp: now,
      title: syntheticAlertGenerated
        ? `Evidence Ingested with AI Warning: ${enrichedEvidence.evidenceNumber}`
        : `Evidence Sealed & Anchored: ${enrichedEvidence.evidenceNumber}`,
      message: `${enrichedEvidence.title} hashed, AES-256-GCM encrypted, and anchored at Block #${newBlock.blockHeight}.${aiRecord ? ` AI Detection: ${aiRecord.assessment} (${aiRecord.confidenceScore}%).` : ''}`,
      type: syntheticAlertGenerated ? 'WARNING' : 'SUCCESS',
      link: `/evidence/${enrichedEvidence.id}`,
      read: false,
    };

    const updatedLogs = [newLog, ...state.auditLogs];
    const updatedNotifs = [newNotif, ...state.notifications];

    saveToStorage('evidence', updatedEvidence);
    saveToStorage('cases', updatedCases);
    saveToStorage('blocks', updatedBlocks);
    saveToStorage('custodyEvents', updatedCustody);
    saveToStorage('auditLogs', updatedLogs);
    saveToStorage('notifications', updatedNotifs);
    if (aiRecord) saveToStorage('aiRecords', updatedAIRecords);

    set({
      evidence: updatedEvidence,
      cases: updatedCases,
      blocks: updatedBlocks,
      custodyEvents: updatedCustody,
      auditLogs: updatedLogs,
      notifications: updatedNotifs,
      aiRecords: updatedAIRecords,
      alerts: updatedAlerts,
    });

    return { evidence: enrichedEvidence, aiRecord };
  },

  verifyEvidence: async (evidenceId) => {
    const state = get();
    const item = state.evidence.find((e) => e.id === evidenceId);
    if (!item) {
      throw new Error(`Evidence ${evidenceId} not found.`);
    }

    const now = new Date().toISOString();
    let computedHash = item.sha256Current;

    // Retrieve actual binary from IndexedDB vault and recompute SHA-256
    const vaultRecord = await getEvidenceBinary(evidenceId);
    if (vaultRecord && vaultRecord.rawBuffer) {
      const blob = new Blob([vaultRecord.rawBuffer], { type: vaultRecord.mimeType });
      computedHash = await calculateFileSHA256(blob);
    }

    const isMatched = computedHash.toLowerCase() === item.sha256Original.toLowerCase();
    const newStatus = isMatched ? 'VERIFIED' : 'TAMPERED';

    const updatedEvidence = state.evidence.map((e) =>
      e.id === evidenceId
        ? {
            ...e,
            sha256Current: computedHash,
            lastVerifiedAt: now,
            integrityStatus: newStatus as Evidence['integrityStatus'],
          }
        : e
    );

    const newCustody: CustodyEvent = {
      id: `cust-${Date.now()}`,
      evidenceId: item.id,
      evidenceNumber: item.evidenceNumber,
      caseId: item.caseId,
      caseNumber: item.caseNumber,
      timestamp: now,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userRole: state.currentUser.role,
      action: 'VERIFIED',
      previousState: `Vault Integrity (${item.integrityStatus})`,
      newState: isMatched
        ? 'Cryptographically Verified (SHA-256 Match)'
        : 'CRITICAL: SHA-256 Digest Mismatch Detected',
      hash: computedHash,
      verificationResult: isMatched ? 'SUCCESS' : 'FAILED',
      notes: isMatched
        ? `Recomputed SHA-256 over vaulted binary (${item.fileSize.toLocaleString()} bytes) matches original intake digest.`
        : `MISMATCH: Expected ${item.sha256Original}, computed ${computedHash}.`,
      location: 'BlockVault Cryptographic Verification Engine',
    };

    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: now,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userRole: state.currentUser.role,
      action: 'VERIFY_EVIDENCE',
      resourceType: 'EVIDENCE',
      resourceId: item.evidenceNumber,
      caseId: item.caseId,
      evidenceId: item.id,
      result: isMatched ? 'SUCCESS' : 'FAILURE',
      ipAddress: getClientHostIdentifier(),
      details: isMatched
        ? `Verified SHA-256 integrity for ${item.evidenceNumber} (${computedHash}).`
        : `SHA-256 mismatch on ${item.evidenceNumber}! Expected ${item.sha256Original}, got ${computedHash}.`,
    };

    const updatedCustody = [newCustody, ...state.custodyEvents];
    const updatedLogs = [newLog, ...state.auditLogs];

    saveToStorage('evidence', updatedEvidence);
    saveToStorage('custodyEvents', updatedCustody);
    saveToStorage('auditLogs', updatedLogs);

    set({
      evidence: updatedEvidence,
      custodyEvents: updatedCustody,
      auditLogs: updatedLogs,
    });

    return {
      evidenceId: item.id,
      evidenceNumber: item.evidenceNumber,
      fileName: item.originalFileName,
      fileSize: vaultRecord?.fileSize ?? item.fileSize,
      expectedHash: item.sha256Original,
      computedHash,
      matched: isMatched,
      source: 'VAULT_STORAGE',
      verifiedAt: now,
    };
  },

  verifyEvidenceWithFile: async (evidenceId, externalFile) => {
    const state = get();
    const item = state.evidence.find((e) => e.id === evidenceId);
    if (!item) {
      throw new Error(`Evidence ${evidenceId} not found.`);
    }

    const now = new Date().toISOString();
    const computedHash = await calculateFileSHA256(externalFile);
    const matched = computedHash.toLowerCase() === item.sha256Original.toLowerCase();

    let alertGeneratedId: string | undefined;
    let updatedAlerts = state.alerts;
    let updatedNotifs = state.notifications;

    const updatedEvidence = state.evidence.map((e) =>
      e.id === evidenceId
        ? {
            ...e,
            sha256Current: computedHash,
            lastVerifiedAt: now,
            integrityStatus: (matched ? 'VERIFIED' : 'TAMPERED') as Evidence['integrityStatus'],
          }
        : e
    );

    if (!matched) {
      alertGeneratedId = `alt-${Date.now()}`;
      const newAlert: IntegrityAlert = {
        id: alertGeneratedId,
        timestamp: now,
        evidenceId: item.id,
        evidenceNumber: item.evidenceNumber,
        caseId: item.caseId,
        caseNumber: item.caseNumber,
        severity: 'CRITICAL',
        type: 'HASH_MISMATCH',
        message: `Cryptographic verification against external file "${externalFile.name}" (${externalFile.size.toLocaleString()} bytes) failed! Computed SHA-256 does not match the anchored intake hash.`,
        expectedHash: item.sha256Original,
        actualHash: computedHash,
        status: 'OPEN',
      };

      const newNotif: PlatformNotification = {
        id: `notif-${Date.now()}`,
        timestamp: now,
        title: `CRITICAL: Hash Mismatch on ${item.evidenceNumber}`,
        message: `File "${externalFile.name}" failed SHA-256 verification against anchored evidence ${item.evidenceNumber}.`,
        type: 'CRITICAL',
        link: `/integrity`,
        read: false,
      };

      updatedAlerts = [newAlert, ...state.alerts];
      updatedNotifs = [newNotif, ...state.notifications];
      saveToStorage('alerts', updatedAlerts);
      saveToStorage('notifications', updatedNotifs);
    }

    const newCustody: CustodyEvent = {
      id: `cust-${Date.now()}`,
      evidenceId: item.id,
      evidenceNumber: item.evidenceNumber,
      caseId: item.caseId,
      caseNumber: item.caseNumber,
      timestamp: now,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userRole: state.currentUser.role,
      action: 'VERIFIED',
      previousState: `Anchored Hash (${item.sha256Original.substring(0, 12)}...)`,
      newState: matched
        ? `Verified Against Disk File (${externalFile.name})`
        : `TAMPER DETECTED on Disk File (${externalFile.name})`,
      hash: computedHash,
      verificationResult: matched ? 'SUCCESS' : 'FAILED',
      notes: matched
        ? `External disk file "${externalFile.name}" (${externalFile.size.toLocaleString()} bytes) matches anchored SHA-256 bit-for-bit.`
        : `HASH MISMATCH: External disk file "${externalFile.name}" (${externalFile.size.toLocaleString()} bytes) produced SHA-256 ${computedHash}, diverging from anchored hash ${item.sha256Original}.`,
      location: 'Cryptographic Disk File Verification Workbench',
    };

    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: now,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userRole: state.currentUser.role,
      action: 'DISK_FILE_VERIFICATION',
      resourceType: 'EVIDENCE',
      resourceId: item.evidenceNumber,
      caseId: item.caseId,
      evidenceId: item.id,
      result: matched ? 'SUCCESS' : 'FAILURE',
      ipAddress: getClientHostIdentifier(),
      details: matched
        ? `External file "${externalFile.name}" verified against ${item.evidenceNumber}. SHA-256 matched: ${computedHash}.`
        : `CRITICAL HASH MISMATCH: External file "${externalFile.name}" compared against ${item.evidenceNumber}. Expected ${item.sha256Original}, computed ${computedHash}.`,
    };

    const updatedCustody = [newCustody, ...state.custodyEvents];
    const updatedLogs = [newLog, ...state.auditLogs];

    saveToStorage('evidence', updatedEvidence);
    saveToStorage('custodyEvents', updatedCustody);
    saveToStorage('auditLogs', updatedLogs);

    set({
      evidence: updatedEvidence,
      alerts: updatedAlerts,
      notifications: updatedNotifs,
      custodyEvents: updatedCustody,
      auditLogs: updatedLogs,
    });

    return {
      evidenceId: item.id,
      evidenceNumber: item.evidenceNumber,
      fileName: externalFile.name,
      fileSize: externalFile.size,
      expectedHash: item.sha256Original,
      computedHash,
      matched,
      source: 'EXTERNAL_DISK_FILE',
      verifiedAt: now,
      alertGeneratedId,
    };
  },

  verifyAllEvidence: async () => {
    const state = get();
    let verifiedCount = 0;
    let mismatchCount = 0;

    for (const item of state.evidence) {
      const res = await get().verifyEvidence(item.id);
      if (res.matched) {
        verifiedCount++;
      } else {
        mismatchCount++;
      }
    }

    return {
      total: state.evidence.length,
      verified: verifiedCount,
      mismatched: mismatchCount,
    };
  },

  recordCustodyTransfer: async ({
    evidenceId,
    action,
    toUserName,
    location,
    notes,
    newState,
  }) => {
    const state = get();
    const item = state.evidence.find((e) => e.id === evidenceId);
    if (!item) return;

    const now = new Date().toISOString();
    const eventChainHash = await calculateSHA256(
      `${item.sha256Current}:${action}:${toUserName}:${location}:${now}`
    );

    const newEvent: CustodyEvent = {
      id: `cust-${Date.now()}`,
      evidenceId: item.id,
      evidenceNumber: item.evidenceNumber,
      caseId: item.caseId,
      caseNumber: item.caseNumber,
      timestamp: now,
      userId: state.currentUser.id,
      userName: `${state.currentUser.name} → ${toUserName}`,
      userRole: state.currentUser.role,
      action,
      previousState: 'BlockVault Custody',
      newState,
      hash: item.sha256Current,
      verificationResult: 'SUCCESS',
      notes: `${notes} [Custody Transition Digest: ${eventChainHash.substring(0, 16)}]`,
      location,
    };

    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: now,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userRole: state.currentUser.role,
      action: 'TRANSFER_EVIDENCE',
      resourceType: 'EVIDENCE',
      resourceId: item.evidenceNumber,
      caseId: item.caseId,
      evidenceId: item.id,
      result: 'SUCCESS',
      ipAddress: getClientHostIdentifier(),
      details: `Custody event (${action}) logged for ${item.evidenceNumber} to ${toUserName} at ${location}.`,
    };

    const updatedCustody = [newEvent, ...state.custodyEvents];
    const updatedLogs = [newLog, ...state.auditLogs];

    saveToStorage('custodyEvents', updatedCustody);
    saveToStorage('auditLogs', updatedLogs);

    set({ custodyEvents: updatedCustody, auditLogs: updatedLogs });
  },

  runAIAnalysis: async (evidenceId, fileOverride) => {
    const state = get();
    const item = state.evidence.find((e) => e.id === evidenceId);
    if (!item) throw new Error('Evidence not found');

    set({
      evidence: state.evidence.map((e) =>
        e.id === evidenceId ? { ...e, aiAnalysisStatus: 'RUNNING' } : e
      ),
    });

    let targetBlob: File | Blob | null = fileOverride || null;
    if (!targetBlob) {
      const vaultObj = await getEvidenceBlob(evidenceId);
      if (vaultObj) {
        targetBlob = vaultObj.blob;
      }
    }

    if (!targetBlob) {
      set({
        evidence: get().evidence.map((e) =>
          e.id === evidenceId ? { ...e, aiAnalysisStatus: 'FAILED' } : e
        ),
      });
      throw new Error(
        'Binary payload not found in local IndexedDB vault. Please provide the source file to execute signal analysis.'
      );
    }

    const record = await runForensicMediaAnalysis(
      targetBlob,
      item.id,
      item.evidenceNumber,
      item.category,
      `${ state.currentUser.name } (${ state.currentUser.role })`,
      item.originalFileName
    );

    const latestState = get();
    const now = new Date().toISOString();

    const updatedEvidence = latestState.evidence.map((e) =>
      e.id === evidenceId
        ? {
            ...e,
            aiAnalysisStatus: 'COMPLETED' as const,
            aiAssessment: record.assessment,
            aiConfidence: record.confidenceScore,
            aiRiskLevel: record.riskLevel,
            aiAnalysisId: record.id,
            updatedAt: now,
          }
        : e
    );

    const filteredRecords = latestState.aiRecords.filter((r) => r.evidenceId !== evidenceId);
    const updatedAIRecords = [record, ...filteredRecords];

    const newCustody: CustodyEvent = {
      id: `cust-${Date.now()}`,
      evidenceId: item.id,
      evidenceNumber: item.evidenceNumber,
      caseId: item.caseId,
      caseNumber: item.caseNumber,
      timestamp: now,
      userId: latestState.currentUser.id,
      userName: latestState.currentUser.name,
      userRole: latestState.currentUser.role,
      action: 'ANALYZED',
      previousState: 'Vaulted Binary',
      newState: `Forensic Signal Analysis: ${record.assessment} (${record.confidenceScore}%)`,
      hash: item.sha256Current,
      verificationResult: record.riskLevel === 'CRITICAL' ? 'WARNING' : 'SUCCESS',
      notes: `Executed ${record.modelMethod} on ${item.originalFileName}. Risk: ${record.riskLevel}.`,
      location: 'BlockVault Forensic Signal & Media Lab',
    };

    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: now,
      userId: latestState.currentUser.id,
      userName: latestState.currentUser.name,
      userRole: latestState.currentUser.role,
      action: 'ANALYZE_EVIDENCE',
      resourceType: 'EVIDENCE',
      resourceId: item.evidenceNumber,
      caseId: item.caseId,
      evidenceId: item.id,
      result: 'SUCCESS',
      ipAddress: getClientHostIdentifier(),
      details: `Completed forensic signal analysis on ${item.evidenceNumber}: ${record.assessment} (Score: ${record.confidenceScore}%, Risk: ${record.riskLevel}).`,
    };

    const updatedCustody = [newCustody, ...latestState.custodyEvents];
    const updatedLogs = [newLog, ...latestState.auditLogs];

    saveToStorage('evidence', updatedEvidence);
    saveToStorage('aiRecords', updatedAIRecords);
    saveToStorage('custodyEvents', updatedCustody);
    saveToStorage('auditLogs', updatedLogs);

    set({
      evidence: updatedEvidence,
      aiRecords: updatedAIRecords,
      custodyEvents: updatedCustody,
      auditLogs: updatedLogs,
    });

    return record;
  },

  anchorEvidenceToBlockchain: async (evidenceId, payloadType = 'INTEGRITY_VERIFICATION') => {
    const state = get();
    const item = state.evidence.find((e) => e.id === evidenceId);
    if (!item) throw new Error('Evidence not found');

    const latestBlock =
      state.blocks[state.blocks.length - 1] || (await createGenesisBlock(POA_VALIDATORS[0]));
    const now = new Date().toISOString();
    const txId = `0x${(
      await calculateSHA256(`${item.id}:${item.sha256Current}:${now}`)
    ).substring(0, 32)}`;

    const newTx: BlockchainTransaction = {
      txId,
      blockHeight: latestBlock.blockHeight + 1,
      timestamp: now,
      evidenceId: item.id,
      evidenceNumber: item.evidenceNumber,
      caseId: item.caseId,
      evidenceHash: item.sha256Current,
      payloadType,
      anchoredBy: `${state.currentUser.name} (${state.currentUser.badgeNumber || state.currentUser.role})`,
      status: 'CONFIRMED',
    };

    const newBlock = await createAnchoredBlock(
      latestBlock,
      [newTx],
      POA_VALIDATORS[newBlockHeightMod(latestBlock.blockHeight + 1)]
    );

    const updatedBlocks = [...state.blocks, newBlock];
    const updatedEvidence = state.evidence.map((e) =>
      e.id === evidenceId
        ? {
            ...e,
            blockchainTxId: txId,
            blockchainBlockNumber: newBlock.blockHeight,
          }
        : e
    );

    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: now,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userRole: state.currentUser.role,
      action: 'BLOCKCHAIN_ANCHOR',
      resourceType: 'BLOCKCHAIN',
      resourceId: `Block #${newBlock.blockHeight}`,
      caseId: item.caseId,
      evidenceId: item.id,
      result: 'SUCCESS',
      ipAddress: getClientHostIdentifier(),
      details: `Anchored ${item.evidenceNumber} SHA-256 (${item.sha256Current.substring(0, 16)}...) in Block #${newBlock.blockHeight} (Merkle Root: ${newBlock.merkleRoot.substring(0, 16)}...).`,
    };

    const updatedLogs = [newLog, ...state.auditLogs];
    saveToStorage('blocks', updatedBlocks);
    saveToStorage('evidence', updatedEvidence);
    saveToStorage('auditLogs', updatedLogs);

    set({
      blocks: updatedBlocks,
      evidence: updatedEvidence,
      auditLogs: updatedLogs,
    });

    return newBlock;
  },

  verifyChain: async () => {
    const state = get();
    const result = await verifyBlockchainIntegrity(state.blocks);
    set({ chainVerification: result });
    return result;
  },

  resolveAlert: (alertId, notes) => {
    const state = get();
    const targetAlert = state.alerts.find((a) => a.id === alertId);
    const updatedAlerts = state.alerts.map((a) =>
      a.id === alertId
        ? { ...a, status: 'RESOLVED' as const, investigatorNotes: notes }
        : a
    );

    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userRole: state.currentUser.role,
      action: 'VERIFY_EVIDENCE',
      resourceType: 'EVIDENCE',
      resourceId: targetAlert?.evidenceNumber || alertId,
      caseId: targetAlert?.caseId,
      evidenceId: targetAlert?.evidenceId,
      result: 'SUCCESS',
      ipAddress: getClientHostIdentifier(),
      details: `Resolved integrity alert ${alertId}: ${notes}`,
    };

    const updatedLogs = [newLog, ...state.auditLogs];
    saveToStorage('alerts', updatedAlerts);
    saveToStorage('auditLogs', updatedLogs);
    set({ alerts: updatedAlerts, auditLogs: updatedLogs });
  },

  generateReport: (caseId, reportType, title, summary) => {
    const state = get();
    const targetCase = state.cases.find((c) => c.id === caseId);
    if (!targetCase) {
      throw new Error('Selected case not found.');
    }

    const caseEvidence = state.evidence.filter((e) => e.caseId === caseId);
    const caseCustody = state.custodyEvents.filter((ce) => ce.caseId === caseId);
    const caseAI = state.aiRecords.filter((ai) =>
      caseEvidence.some((e) => e.id === ai.evidenceId)
    );

    const now = new Date().toISOString();
    const newReport: ForensicReport = {
      id: `rep-${Date.now()}`,
      reportNumber: `REP-${new Date().getFullYear()}-${String(state.reports.length + 1).padStart(4, '0')}`,
      caseId,
      caseNumber: targetCase.caseNumber,
      caseTitle: targetCase.title,
      reportType,
      title,
      authorName: state.currentUser.name,
      authorRole: state.currentUser.role,
      generatedAt: now,
      summary,
      evidenceCount: caseEvidence.length,
      content: {
        caseDetails: targetCase,
        evidenceItems: caseEvidence,
        custodyTimeline: caseCustody,
        aiFindings: caseAI,
        blockchainHeight:
          state.blocks[state.blocks.length - 1]?.blockHeight || 0,
      },
    };

    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: now,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userRole: state.currentUser.role,
      action: 'EXPORT_REPORT',
      resourceType: 'CASE',
      resourceId: newReport.reportNumber,
      caseId,
      result: 'SUCCESS',
      ipAddress: getClientHostIdentifier(),
      details: `Generated forensic dossier ${newReport.reportNumber} (${reportType}) for case ${targetCase.caseNumber}.`,
    };

    const updatedReports = [newReport, ...state.reports];
    const updatedLogs = [newLog, ...state.auditLogs];

    saveToStorage('reports', updatedReports);
    saveToStorage('auditLogs', updatedLogs);

    set({ reports: updatedReports, auditLogs: updatedLogs });
    return newReport;
  },

  markNotificationRead: (id) => {
    const state = get();
    const updated = state.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    saveToStorage('notifications', updated);
    set({ notifications: updated });
  },

  markAllNotificationsRead: () => {
    const state = get();
    const updated = state.notifications.map((n) => ({ ...n, read: true }));
    saveToStorage('notifications', updated);
    set({ notifications: updated });
  },

  clearWorkspaceData: async () => {
    await clearVaultBinaries();
    if (typeof localStorage !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('bv_') || k.startsWith(STORAGE_PREFIX))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    }

    const genesis = await createGenesisBlock(POA_VALIDATORS[0]);
    saveToStorage('blocks', [genesis]);

    set({
      users: [],
      currentUser: UNCONFIGURED_OPERATOR,
      isOperatorConfigured: false,
      cases: [],
      evidence: [],
      custodyEvents: [],
      blocks: [genesis],
      aiRecords: [],
      alerts: [],
      auditLogs: [],
      reports: [],
      notifications: [],
      chainVerification: null,
    });
  },

  loadDemonstrationData: async () => {
    saveToStorage('users', DEMO_USERS);
    saveToStorage('cases', DEMO_CASES);
    saveToStorage('evidence', DEMO_EVIDENCE);
    saveToStorage('custodyEvents', DEMO_CUSTODY_EVENTS);
    saveToStorage('blocks', DEMO_BLOCKS);
    saveToStorage('aiRecords', DEMO_AI_RECORDS);
    saveToStorage('alerts', DEMO_ALERTS);
    saveToStorage('auditLogs', DEMO_AUDIT_LOGS);

    const initialNotification: PlatformNotification = {
      id: `notif-${Date.now()}`,
      title: 'Demonstration Dataset Loaded',
      message: 'Fictional forensic cases, evidence artifacts, PoA ledger blocks, and AI analyses initialized.',
      type: 'INFO',
      timestamp: new Date().toISOString(),
      read: false,
      link: '/dashboard',
    };
    saveToStorage('notifications', [initialNotification]);

    set({
      users: DEMO_USERS,
      currentUser: DEMO_USERS[1], // Detective Marcus Vance (Investigator)
      isOperatorConfigured: true,
      cases: DEMO_CASES,
      evidence: DEMO_EVIDENCE,
      custodyEvents: DEMO_CUSTODY_EVENTS,
      blocks: DEMO_BLOCKS,
      aiRecords: DEMO_AI_RECORDS,
      alerts: DEMO_ALERTS,
      auditLogs: DEMO_AUDIT_LOGS,
      notifications: [initialNotification],
      chainVerification: null,
    });
  },

  simulateTamperOnTestCopy: async (evidenceId, mutationType) => {
    const state = get();
    const ev = state.evidence.find((e) => e.id === evidenceId);
    if (!ev) {
      throw new Error(`Evidence item ${evidenceId} not found for tamper simulation.`);
    }

    const simResult = await executeTamperSimulation(ev, mutationType, state.currentUser.name);

    const newAlert: IntegrityAlert = {
      id: `alt-sim-${Date.now()}`,
      timestamp: simResult.timestamp,
      evidenceId: ev.id,
      evidenceNumber: ev.evidenceNumber,
      caseId: ev.caseId,
      caseNumber: ev.caseNumber,
      severity: 'CRITICAL',
      type: 'TAMPER_SIMULATION',
      message: `[SIMULATION DETECTED] Controlled ${mutationType.replace(/_/g, ' ')} on test copy of ${ev.evidenceNumber} produced cryptographic mismatch. Original vault file remains immutable.`,
      expectedHash: simResult.originalHash,
      actualHash: simResult.tamperedHash,
      status: 'OPEN',
      investigatorNotes: simResult.notes,
    };

    const newLog: AuditLog = {
      id: `aud-sim-${Date.now()}`,
      timestamp: simResult.timestamp,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userRole: state.currentUser.role,
      action: 'TAMPER_SIMULATION',
      resourceType: 'EVIDENCE',
      resourceId: ev.evidenceNumber,
      caseId: ev.caseId,
      result: 'WARNING',
      ipAddress: getClientHostIdentifier(),
      details: `Executed controlled tamper simulation (${mutationType}) on an isolated memory copy of ${ev.evidenceNumber}. Mismatch verified against anchored ledger block.`,
    };

    const newNotif: PlatformNotification = {
      id: `notif-sim-${Date.now()}`,
      title: 'Tamper Simulation Alert Triggered',
      message: `Controlled mutation (${mutationType}) on test copy of ${ev.evidenceNumber} successfully flagged by integrity engine.`,
      type: 'WARNING',
      timestamp: simResult.timestamp,
      read: false,
      link: '/integrity',
    };

    const updatedAlerts = [newAlert, ...state.alerts];
    const updatedLogs = [newLog, ...state.auditLogs];
    const updatedNotifs = [newNotif, ...state.notifications];

    saveToStorage('alerts', updatedAlerts);
    saveToStorage('auditLogs', updatedLogs);
    saveToStorage('notifications', updatedNotifs);

    set({
      alerts: updatedAlerts,
      auditLogs: updatedLogs,
      notifications: updatedNotifs,
    });

    return {
      ...simResult,
      alertGeneratedId: newAlert.id,
      auditLogId: newLog.id,
    };
  },
}));

function newBlockHeightMod(height: number): number {
  return Math.abs(height) % POA_VALIDATORS.length;
}