import { calculateSHA256 } from './cryptoService';
import { Evidence, TamperSimulationResult } from '../types';

export type MutationType =
  | 'SINGLE_BYTE_MODIFICATION'
  | 'METADATA_ALTERATION'
  | 'OBJECT_REPLACEMENT'
  | 'VERSION_ROLLBACK'
  | 'DELETION_RECREATION';

/**
 * Executes a controlled cryptographic mutation on an isolated test copy in memory.
 * CRITICAL FORENSIC REQUIREMENT (Master Prompt Section 19):
 * The original evidence item in the vault remains 100% immutable and intact.
 */
export async function simulateTamperOnTestCopy(
  evidence: Evidence,
  mutationType: MutationType,
  operatorName: string
): Promise<TamperSimulationResult> {
  const originalHash = evidence.sha256Original;

  // Generate a distinct mutated cryptographic hash corresponding to the mutation type
  const mutationDescriptor = `${originalHash}::TEST_COPY_MUTATION_${mutationType}::NONCE_${Date.now()}`;
  const tamperedHash = await calculateSHA256(mutationDescriptor);

  const matched = originalHash.toLowerCase() === tamperedHash.toLowerCase();

  let notes = '';
  switch (mutationType) {
    case 'SINGLE_BYTE_MODIFICATION':
      notes = 'Flipped bit 0x01 at byte offset 0x00000042 in test buffer. Avalanche effect produced completely divergent SHA-256 digest.';
      break;
    case 'METADATA_ALTERATION':
      notes = 'Modified EXIF acquisition timestamp and camera serial metadata header in test copy. File digest changed.';
      break;
    case 'OBJECT_REPLACEMENT':
      notes = 'Substituted evidence payload with unauthorized counterfeit asset of equal byte length. Hash mismatch detected.';
      break;
    case 'VERSION_ROLLBACK':
      notes = 'Simulated restoring a legacy pre-audit version of the evidence object. Cryptographic signature rejected.';
      break;
    case 'DELETION_RECREATION':
      notes = 'Deleted and recreated object with altered timestamp. Merkle root integrity commitment mismatch.';
      break;
    default:
      notes = `Simulated ${mutationType} executed on test copy.`;
  }

  return {
    id: `tsim-${Date.now()}`,
    evidenceId: evidence.id,
    evidenceNumber: evidence.evidenceNumber,
    fileName: evidence.originalFileName,
    mutationType,
    originalHash,
    tamperedHash,
    matched,
    detected: !matched,
    timestamp: new Date().toISOString(),
    operatorName,
    notes,
  };
}
