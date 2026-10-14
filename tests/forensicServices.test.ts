import { describe, it, expect } from 'vitest';
import {
  calculateSHA256,
  verifyHash,
  encryptEvidencePayload,
} from '../src/services/cryptoService';
import {
  createGenesisBlock,
  calculateMerkleRoot,
  createAnchoredBlock,
  verifyBlockchainIntegrity,
  POA_VALIDATORS,
} from '../src/services/blockchainService';
import {
  storeEvidenceBinary,
  getEvidenceBinary,
  clearVaultBinaries,
} from '../src/services/vaultStorageService';
import { computeBinaryMetrics } from '../src/services/aiAnalysisService';
import { generateForensicReport } from '../src/services/reportService';
import { BlockchainBlock, BlockchainTransaction, ForensicCase, EvidenceItem, User } from '../src/types';

describe('BlockVault Forensic Cryptography Engine', () => {
  it('computes accurate SHA-256 hash for string data', async () => {
    const text = 'BlockVault Forensic Evidence';
    const hash = await calculateSHA256(text);

    expect(hash).toBeDefined();
    expect(hash).toHaveLength(64);
    expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true);

    const matchRes = await verifyHash(hash, text);
    expect(matchRes.matches).toBe(true);
    expect(matchRes.expectedHash).toBe(hash);

    const mismatchRes = await verifyHash(hash, text + ' modified');
    expect(mismatchRes.matches).toBe(false);
  });

  it('computes accurate SHA-256 for binary ArrayBuffer data', async () => {
    const bytes = new Uint8Array([0x42, 0x4c, 0x4f, 0x43, 0x4b, 0x56, 0x41, 0x55, 0x4c, 0x54]);
    const hash = await calculateSHA256(bytes.buffer);

    expect(hash).toBeDefined();
    expect(hash).toHaveLength(64);

    const res = await verifyHash(hash, bytes.buffer);
    expect(res.matches).toBe(true);
  });

  it('encrypts binary evidence payloads using AES-256-GCM', async () => {
    const plainBytes = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80]);
    const encrypted = await encryptEvidencePayload(plainBytes.buffer);

    expect(encrypted.algorithm).toBe('AES-256-GCM');
    expect(encrypted.ivHex).toHaveLength(24);
    expect(encrypted.keyFingerprint.startsWith('KEY-FPR-')).toBe(true);
    expect(encrypted.encryptedBuffer.byteLength).toBeGreaterThan(plainBytes.byteLength);
  });
});

describe('Proof-of-Authority (PoA) Ledger Service', () => {
  it('constructs a valid mathematical Genesis Block (#0) with zero dummy transactions', async () => {
    const genesis = await createGenesisBlock();
    expect(genesis.blockHeight).toBe(0);
    expect(genesis.previousHash).toBe('0'.repeat(64));
    expect(genesis.transactions).toHaveLength(0);
    expect(genesis.blockHash).toHaveLength(64);
  });

  it('computes deterministic Merkle root and verifies chain continuity from genesis', async () => {
    const genesisBlock = await createGenesisBlock();

    const block1Txs: BlockchainTransaction[] = [
      {
        txId: 'TX-EVD-001',
        blockHeight: 1,
        timestamp: new Date().toISOString(),
        evidenceId: 'EV-100',
        evidenceNumber: 'EVD-0001',
        caseId: 'CAS-01',
        evidenceHash: await calculateSHA256('sample-evidence-payload'),
        payloadType: 'EVIDENCE_ANCHOR',
        anchoredBy: 'Operator-01',
        status: 'CONFIRMED',
      },
    ];

    const root1 = await calculateMerkleRoot(block1Txs);
    const root2 = await calculateMerkleRoot(block1Txs);
    expect(root1).toBe(root2);
    expect(root1).toHaveLength(64);

    const block1 = await createAnchoredBlock(genesisBlock, block1Txs, POA_VALIDATORS[1]);
    const chain: BlockchainBlock[] = [genesisBlock, block1];

    const verification = await verifyBlockchainIntegrity(chain);
    expect(verification.isValid).toBe(true);
    expect(verification.totalBlocksChecked).toBe(2);
    expect(verification.totalTransactionsVerified).toBe(1);

    // Mutate previousHash to verify tamper detection
    const brokenChain: BlockchainBlock[] = [
      genesisBlock,
      { ...block1, previousHash: 'f'.repeat(64) },
    ];
    const failedVerification = await verifyBlockchainIntegrity(brokenChain);
    expect(failedVerification.isValid).toBe(false);
  });
});

describe('Binary Vault Storage & Real Byte Entropy Analysis', () => {
  it('stores and retrieves real binary evidence buffers for cryptographic re-verification', async () => {
    await clearVaultBinaries();
    const rawBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01, 0x02]);

    await storeEvidenceBinary('EVD-TEST-BIN', rawBytes.buffer);

    const retrieved = await getEvidenceBinary('EVD-TEST-BIN');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.fileSize).toBe(rawBytes.byteLength);
    const retrievedArray = new Uint8Array(retrieved!.rawBuffer);
    expect(Array.from(retrievedArray)).toEqual(Array.from(rawBytes));
  });

  it('computes real Shannon byte entropy and magic-header signature consistency', () => {
    // PNG magic header: 89 50 4E 47 0D 0A 1A 0A
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff, 0x41, 0x42]);
    const metrics = computeBinaryMetrics(pngBytes.buffer, 'evidence.png');

    expect(metrics.shannonEntropy).toBeGreaterThan(0);
    expect(metrics.shannonEntropy).toBeLessThanOrEqual(8);
    expect(metrics.detectedMagicHex.startsWith('89504E47')).toBe(true);
    expect(metrics.signatureMatchesExtension).toBe(true);

    // Mismatched extension test (.jpg file with PNG magic bytes)
    const mismatchMetrics = computeBinaryMetrics(pngBytes.buffer, 'spoofed.jpg');
    expect(mismatchMetrics.signatureMatchesExtension).toBe(false);
  });
});

describe('Court-Admissible Report Generator', () => {
  it('generates a complete forensic dossier from user-provided case and evidence records', () => {
    const testUser: User = {
      id: 'USR-1',
      name: 'Investigator A. Mercer',
      email: 'mercer@agency.gov',
      role: 'INVESTIGATOR',
      badgeNumber: 'DFE-101',
      department: 'Digital Forensics Unit',
      avatar: 'AM',
    };

    const testCase: ForensicCase = {
      id: 'CASE-1',
      caseNumber: 'DF-2026-1001',
      title: 'Server Intrusion Investigation',
      description: 'Forensic acquisition of compromised host artifacts.',
      status: 'OPEN',
      priority: 'HIGH',
      category: 'Network Intrusion',
      leadInvestigatorId: testUser.id,
      leadInvestigatorName: testUser.name,
      assignedAgency: testUser.department,
      jurisdiction: 'Federal District',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['intrusion', 'syslog'],
      evidenceCount: 1,
      verifiedCount: 1,
      compromisedCount: 0,
    };

    const testEvidence: EvidenceItem[] = [
      {
        id: 'EVD-1',
        evidenceNumber: 'EVD-2026-0001',
        caseId: testCase.id,
        caseNumber: testCase.caseNumber,
        title: 'Kernel Audit Log',
        description: 'Raw audit.log captured from host',
        fileName: 'audit.log',
        fileType: 'text/plain',
        mimeType: 'text/plain',
        fileExtension: 'log',
        fileSize: 4096,
        category: 'SYSTEM_LOG',
        sha256Original: 'a'.repeat(64),
        sha256Current: 'a'.repeat(64),
        blockchainTxId: '0x1234',
        blockNumber: 1,
        blockTimestamp: new Date().toISOString(),
        merkleRoot: 'b'.repeat(64),
        integrityStatus: 'VERIFIED',
        aiAnalysisStatus: 'AUTHENTIC',
        aiConfidenceScore: 98,
        uploadedById: testUser.id,
        uploadedByName: testUser.name,
        uploadedByRole: testUser.role,
        uploadedAt: new Date().toISOString(),
        collectionTimestamp: new Date().toISOString(),
        collectionLocation: 'Data Center Rack 4',
        collectorBadge: testUser.badgeNumber,
        currentCustodian: testUser.name,
        storageLocation: 'IndexedDB Local Vault',
        encryptionStatus: 'AES-256-GCM',
        tags: ['log'],
        version: 1,
        verificationCount: 1,
        lastVerifiedAt: new Date().toISOString(),
      },
    ];

    const report = generateForensicReport(
      'COMPLETE_FORENSIC_REPORT',
      testCase,
      testEvidence,
      [],
      [],
      [],
      [],
      testUser
    );

    expect(report.reportNumber).toBeDefined();
    expect(report.title).toContain(testCase.caseNumber);
    expect(report.content).toBeDefined();
    expect(report.evidenceCount).toBe(1);
  });
});

describe('Tamper Simulation Workbench (Isolated Test Copy)', () => {
  it('mutates an isolated test copy without altering the original evidence hash', async () => {
    const { simulateTamperOnTestCopy } = await import('../src/services/tamperService');
    const originalHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const mockEvidence: any = {
      id: 'EVD-TEST-TAMPER',
      evidenceNumber: 'EVD-2026-9999',
      originalFileName: 'test_artifact.bin',
      sha256Original: originalHash,
      sha256Current: originalHash,
    };

    const result = await simulateTamperOnTestCopy(mockEvidence, 'SINGLE_BYTE_MODIFICATION', 'Agent Test');

    expect(result.detected).toBe(true);
    expect(result.matched).toBe(false);
    expect(result.originalHash).toBe(originalHash);
    expect(result.tamperedHash).not.toBe(originalHash);
    expect(mockEvidence.sha256Original).toBe(originalHash); // Original remains unchanged
  });
});

