import { calculateSHA256 } from './cryptoService';
import { BlockchainBlock, BlockchainTransaction, BlockchainVerificationResult } from '../types';

export const POA_VALIDATORS = [
  'VAL-NODE-01 (DFIR National Root Node)',
  'VAL-NODE-02 (Judicial Authority Node)',
  'VAL-NODE-03 (Federal Forensics Lab)',
  'VAL-NODE-04 (Cybercrime Investigation Wing)',
  'VAL-NODE-05 (Auditing & Integrity Node)',
];

/**
 * Calculates deterministic Merkle Root from an array of transactions.
 */
export async function calculateMerkleRoot(transactions: BlockchainTransaction[]): Promise<string> {
  if (transactions.length === 0) {
    return '0'.repeat(64);
  }

  let hashes = await Promise.all(
    transactions.map(tx => calculateSHA256(JSON.stringify({
      txId: tx.txId,
      evidenceId: tx.evidenceId,
      evidenceHash: tx.evidenceHash,
      timestamp: tx.timestamp
    })))
  );

  while (hashes.length > 1) {
    if (hashes.length % 2 !== 0) {
      hashes.push(hashes[hashes.length - 1]);
    }
    const nextLevel: string[] = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const combined = await calculateSHA256(hashes[i] + hashes[i + 1]);
      nextLevel.push(combined);
    }
    hashes = nextLevel;
  }

  return hashes[0];
}

/**
 * Calculates authentic SHA-256 block hash for a given block header.
 */
export async function calculateBlockHash(
  blockHeight: number,
  previousHash: string,
  timestamp: string,
  merkleRoot: string,
  validator: string
): Promise<string> {
  const headerPayload = `${blockHeight}:${previousHash}:${timestamp}:${merkleRoot}:${validator}:POA-V1`;
  return calculateSHA256(headerPayload);
}

/**
 * Deterministically generates the mathematical Genesis Block (#0) with zero transactions.
 */
export async function createGenesisBlock(validator: string = POA_VALIDATORS[0]): Promise<BlockchainBlock> {
  const blockHeight = 0;
  const previousHash = '0'.repeat(64);
  const timestamp = '2025-01-01T00:00:00.000Z';
  const merkleRoot = '0'.repeat(64);
  const blockHash = await calculateBlockHash(blockHeight, previousHash, timestamp, merkleRoot, validator);
  const signature = 'POA-SIG-' + blockHash.substring(0, 24).toUpperCase();

  return {
    blockHeight,
    blockHash,
    previousHash,
    timestamp,
    merkleRoot,
    validator,
    signature,
    consensus: 'Proof of Authority (PoA)',
    transactions: [],
  };
}

/**
 * Creates and mines a new Block anchored to the preceding block in the MiniChain.
 */
export async function createAnchoredBlock(
  previousBlock: BlockchainBlock,
  transactions: BlockchainTransaction[],
  validator: string = POA_VALIDATORS[0]
): Promise<BlockchainBlock> {
  const blockHeight = previousBlock.blockHeight + 1;
  const timestamp = new Date().toISOString();
  const merkleRoot = await calculateMerkleRoot(transactions);
  const blockHash = await calculateBlockHash(blockHeight, previousBlock.blockHash, timestamp, merkleRoot, validator);
  const signature = 'POA-SIG-' + blockHash.substring(0, 24).toUpperCase();

  return {
    blockHeight,
    blockHash,
    previousHash: previousBlock.blockHash,
    timestamp,
    merkleRoot,
    validator,
    signature,
    consensus: 'Proof of Authority (PoA)',
    transactions,
  };
}

/**
 * Verifies strict cryptographic continuity of the entire blockchain.
 * Recomputes all Merkle roots and block hashes from genesis to latest height.
 */
export async function verifyBlockchainIntegrity(blocks: BlockchainBlock[]): Promise<BlockchainVerificationResult> {
  if (!blocks || blocks.length === 0) {
    return {
      isValid: false,
      totalBlocksChecked: 0,
      totalTransactionsVerified: 0,
      errorDetail: 'No blockchain blocks available for inspection.',
      verifiedAt: new Date().toISOString(),
    };
  }

  let totalTx = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    totalTx += block.transactions.length;

    // 1. Verify Merkle root matches transactions
    const expectedMerkle = await calculateMerkleRoot(block.transactions);
    if (expectedMerkle !== block.merkleRoot) {
      return {
        isValid: false,
        totalBlocksChecked: i + 1,
        totalTransactionsVerified: totalTx,
        invalidBlockHeight: block.blockHeight,
        errorDetail: `Block #${block.blockHeight} Merkle Root discrepancy! Transactions may have been altered.`,
        verifiedAt: new Date().toISOString(),
      };
    }

    // 2. Verify Block Hash matches header components
    const calculatedHash = await calculateBlockHash(
      block.blockHeight,
      block.previousHash,
      block.timestamp,
      block.merkleRoot,
      block.validator
    );

    if (calculatedHash !== block.blockHash) {
      return {
        isValid: false,
        totalBlocksChecked: i + 1,
        totalTransactionsVerified: totalTx,
        invalidBlockHeight: block.blockHeight,
        errorDetail: `Block #${block.blockHeight} hash mismatch. Computed: ${calculatedHash.substring(0, 16)}..., Recorded: ${block.blockHash.substring(0, 16)}...`,
        verifiedAt: new Date().toISOString(),
      };
    }

    // 3. Verify Chain Continuity with previous block
    if (i > 0) {
      const prev = blocks[i - 1];
      if (block.previousHash !== prev.blockHash) {
        return {
          isValid: false,
          totalBlocksChecked: i + 1,
          totalTransactionsVerified: totalTx,
          invalidBlockHeight: block.blockHeight,
          errorDetail: `Chain Continuity Broken at Block #${block.blockHeight}! previousHash does not match Block #${prev.blockHeight} blockHash.`,
          verifiedAt: new Date().toISOString(),
        };
      }
    }
  }

  return {
    isValid: true,
    totalBlocksChecked: blocks.length,
    totalTransactionsVerified: totalTx,
    verifiedAt: new Date().toISOString(),
  };
}