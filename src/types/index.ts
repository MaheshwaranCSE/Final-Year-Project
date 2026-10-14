export type Role = 'user' | 'police' | 'doctor' | 'court' | 'admin' | 'investigator';

// ─── User & Roles ─────────────────────────────────────────────────────────────
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'INVESTIGATOR' | 'REVIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  badgeNumber: string;
  department: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  assignedCases: string[];
  lastLogin: string;
  avatarUrl?: string;
  createdAt: string;
}

// ─── Case Management ──────────────────────────────────────────────────────────
export type CaseStatus = 'ACTIVE' | 'UNDER_REVIEW' | 'CLOSED' | 'ARCHIVED';
export type CasePriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type CaseClassification = 'TOP_SECRET' | 'RESTRICTED' | 'CONFIDENTIAL' | 'INTERNAL_LAW_ENFORCEMENT';

export interface Case {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  type: 'CYBER_INCIDENT' | 'FINANCIAL_FRAUD' | 'DIGITAL_ESPIONAGE' | 'HOMICIDE_INVESTIGATION' | 'NARCOTICS' | 'IP_THEFT' | 'EVIDENCE_AUDIT';
  priority: CasePriority;
  classification: CaseClassification;
  leadInvestigatorId: string;
  leadInvestigatorName: string;
  supportingInvestigatorIds: string[];
  reviewerId: string;
  reviewerName: string;
  dateCreated: string;
  status: CaseStatus;
  accessScope: 'RESTRICTED' | 'DEPARTMENTAL' | 'CROSS_AGENCY';
  retentionPeriodYears: number;
  evidenceCount: number;
  lastActivityAt: string;
}

// ─── Evidence ─────────────────────────────────────────────────────────────────
export type EvidenceCategory = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'ARCHIVE' | 'DISK_IMAGE' | 'OTHER';
export type IntegrityStatus = 'VERIFIED' | 'TAMPERED' | 'WARNING' | 'PENDING';
export type AIAssessment = 
  | 'POTENTIALLY_SYNTHETIC' 
  | 'LIKELY_SYNTHETIC' 
  | 'NO_STRONG_SYNTHETIC_INDICATORS' 
  | 'INCONCLUSIVE' 
  | 'INSUFFICIENT_EVIDENCE';

export type AIRiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface EvidenceDerivative {
  id: string;
  type: 'THUMBNAIL' | 'EXTRACTED_FRAME' | 'METADATA_EXTRACT' | 'TRANSCRIPT_OCR' | 'AI_REPORT';
  title: string;
  sha256: string;
  createdAt: string;
  fileSize: number;
  mimeType: string;
  url?: string;
}

export interface EvidenceVersion {
  id: string;
  versionNumber: number;
  label: string;
  sha256: string;
  createdAt: string;
  createdBy: string;
  changeDescription: string;
  isOriginal: boolean;
  fileSize: number;
}

export interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;
  codec?: string;
  frameRate?: number;
  audioChannels?: number;
  sampleRate?: number;
  cameraMake?: string;
  cameraModel?: string;
  software?: string;
  dateTaken?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  contentCredentialsPresent?: boolean;
}

export interface Evidence {
  id: string;
  caseId: string;
  caseNumber: string;
  evidenceNumber: string;
  title: string;
  description: string;
  category: EvidenceCategory;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  extension: string;
  sourceDevice: string;
  acquisitionMethod: 'PHYSICAL_EXTRACTION' | 'LOGICAL_IMAGE' | 'NETWORK_PCAP' | 'WITNESS_UPLOAD' | 'CCTV_EXPORT' | 'CLOUD_API_SUBMISSION';
  acquisitionTool: string;
  acquisitionNotes: string;
  collectedBy: string;
  collectionDate: string;
  collectionLocation: string;
  sha256Original: string;
  sha256Current: string;
  integrityStatus: IntegrityStatus;
  lastVerifiedAt: string;
  isEncrypted: boolean;
  encryptionAlgorithm: 'AES-256-GCM' | 'CHACHA20-POLY1305';
  storageObjectKey: string;
  currentVersion: number;
  versions: EvidenceVersion[];
  derivatives: EvidenceDerivative[];
  metadata: MediaMetadata;
  blockchainTxId?: string;
  blockchainBlockNumber?: number;
  aiAnalysisStatus: 'NOT_ANALYZED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  aiAssessment?: AIAssessment;
  aiConfidence?: number;
  aiRiskLevel?: AIRiskLevel;
  aiAnalysisId?: string;
  fileBlobUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Custody Events ───────────────────────────────────────────────────────────
export type CustodyAction = 
  | 'ACQUIRED' 
  | 'UPLOADED' 
  | 'VERIFIED' 
  | 'TRANSFERRED' 
  | 'ACCESSED' 
  | 'ANALYZED' 
  | 'REVIEWED' 
  | 'EXPORTED' 
  | 'ARCHIVED';

export interface CustodyEvent {
  id: string;
  evidenceId: string;
  evidenceNumber: string;
  caseId: string;
  caseNumber: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: CustodyAction;
  previousState: string;
  newState: string;
  hash: string;
  verificationResult: 'SUCCESS' | 'WARNING' | 'FAILED' | 'INFO';
  notes: string;
  location: string;
}

// ─── Blockchain ───────────────────────────────────────────────────────────────
export interface BlockchainTransaction {
  txId: string;
  blockHeight: number;
  timestamp: string;
  evidenceId: string;
  evidenceNumber: string;
  caseId: string;
  evidenceHash: string;
  payloadType: 'EVIDENCE_ANCHOR' | 'INTEGRITY_VERIFICATION' | 'CUSTODY_TRANSFER' | 'GENESIS';
  anchoredBy: string;
  status: 'CONFIRMED' | 'PENDING';
}

export interface BlockchainBlock {
  blockHeight: number;
  blockHash: string;
  previousHash: string;
  timestamp: string;
  merkleRoot: string;
  validator: string;
  signature: string;
  consensus: 'Proof of Authority (PoA)';
  transactions: BlockchainTransaction[];
}

export interface BlockchainVerificationResult {
  isValid: boolean;
  totalBlocksChecked: number;
  totalTransactionsVerified: number;
  invalidBlockHeight?: number;
  errorDetail?: string;
  verifiedAt: string;
}

// ─── AI Analysis ──────────────────────────────────────────────────────────────
export interface AIIndicator {
  name: string;
  detected: boolean;
  score: number;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface SuspiciousFrame {
  frameNumber: number;
  timestampSeconds: number;
  anomalyScore: number;
  anomalyReason: string;
}

export interface AIAnalysisRecord {
  id: string;
  evidenceId: string;
  evidenceNumber: string;
  mediaType: EvidenceCategory;
  analyzedAt: string;
  analyzedBy: string;
  modelMethod: 'Heuristic + Metadata & FFT/DCT Spectral Verification Engine' | 'C2PA & Statistical Frame Coherence Suite';
  assessment: AIAssessment;
  confidenceScore: number;
  riskLevel: AIRiskLevel;
  indicators: AIIndicator[];
  subscores: {
    metadataAnalysis: number;
    pixelOrFrameAnalysis: number;
    compressionOrSpectral: number;
    contentCredentials: 'NOT_AVAILABLE' | 'VALID' | 'TAMPERED';
  };
  suspiciousFrames?: SuspiciousFrame[];
  audioMetrics?: {
    spectralFlux: number;
    zeroCrossingRate: number;
    harmonicRatio: number;
    pitchStability: number;
  };
  binaryMetrics?: {
    shannonEntropy: number;
    printableAsciiRatio: number;
    nullByteRatio: number;
    detectedMagicHex: string;
    signatureMatchesExtension: boolean;
  };
  pixelForensics?: import('../lib/pixelForensics').PixelForensicsReport;
  reasoningSummary: string[];
}

// ─── Integrity & Cryptographic File Verification ──────────────────────────────
export interface IntegrityAlert {
  id: string;
  timestamp: string;
  evidenceId: string;
  evidenceNumber: string;
  caseId: string;
  caseNumber: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  type: 'HASH_MISMATCH' | 'UNAUTHORIZED_ACCESS' | 'CHAIN_CONTINUITY_BREAK' | 'METADATA_TAMPERING' | 'TAMPER_SIMULATION';
  message: string;
  expectedHash: string;
  actualHash: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  investigatorNotes?: string;
}

export interface TamperSimulationResult {
  id: string;
  evidenceId: string;
  evidenceNumber: string;
  fileName: string;
  mutationType: 'SINGLE_BYTE_MODIFICATION' | 'METADATA_ALTERATION' | 'OBJECT_REPLACEMENT' | 'VERSION_ROLLBACK' | 'DELETION_RECREATION';
  originalHash: string;
  tamperedHash: string;
  matched: boolean;
  detected: boolean;
  timestamp: string;
  operatorName: string;
  alertGeneratedId?: string;
  auditLogId?: string;
  notes: string;
}

export interface FileVerificationResult {
  evidenceId: string;
  evidenceNumber: string;
  fileName: string;
  fileSize: number;
  expectedHash: string;
  computedHash: string;
  matched: boolean;
  source: 'VAULT_STORAGE' | 'EXTERNAL_DISK_FILE';
  verifiedAt: string;
  alertGeneratedId?: string;
}

// ─── Audit Log ────────────────────────────────────────────────────────────────
export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 
    | 'LOGIN' 
    | 'LOGOUT' 
    | 'REGISTER_USER'
    | 'CREATE_CASE' 
    | 'UPDATE_CASE'
    | 'CLOSE_CASE'
    | 'UPLOAD_EVIDENCE' 
    | 'VERIFY_EVIDENCE' 
    | 'DISK_FILE_VERIFICATION'
    | 'ANALYZE_EVIDENCE' 
    | 'VIEW_EVIDENCE' 
    | 'TRANSFER_EVIDENCE' 
    | 'EXPORT_REPORT' 
    | 'ARCHIVE_EVIDENCE' 
    | 'BLOCKCHAIN_ANCHOR' 
    | 'TAMPER_SIMULATION'
    | 'PERMISSION_CHANGE';
  resourceType: 'CASE' | 'EVIDENCE' | 'BLOCKCHAIN' | 'USER' | 'SYSTEM';
  resourceId: string;
  caseId?: string;
  evidenceId?: string;
  result: 'SUCCESS' | 'FAILURE' | 'WARNING';
  ipAddress: string;
  details: string;
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export type ReportType = 
  | 'CASE_SUMMARY' 
  | 'EVIDENCE_REPORT' 
  | 'INTEGRITY_REPORT' 
  | 'CHAIN_OF_CUSTODY_REPORT' 
  | 'BLOCKCHAIN_VERIFICATION_REPORT' 
  | 'AI_ANALYSIS_REPORT' 
  | 'COMPLETE_FORENSIC_REPORT';

export interface ForensicReport {
  id: string;
  reportNumber: string;
  caseId: string;
  caseNumber: string;
  caseTitle: string;
  reportType: ReportType;
  title: string;
  authorName: string;
  authorRole: UserRole;
  generatedAt: string;
  summary: string;
  evidenceCount: number;
  content: any;
}

// ─── Notifications ────────────────────────────────────────────────────────────
export interface PlatformNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'CRITICAL' | 'WARNING' | 'SUCCESS' | 'INFO';
  link?: string;
  read: boolean;
}