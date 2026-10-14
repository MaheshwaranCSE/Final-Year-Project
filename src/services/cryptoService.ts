/**
 * BlockVault Cryptographic Services
 * Implements real Web Crypto API primitives for digital forensic integrity.
 */

export interface HashVerificationResult {
  matches: boolean;
  expectedHash: string;
  calculatedHash: string;
  timestamp: string;
}

export interface EncryptionResult {
  encryptedBuffer: ArrayBuffer;
  keyFingerprint: string;
  algorithm: 'AES-256-GCM';
  ivHex: string;
}

export async function toSafeArrayBuffer(data: File | Blob | ArrayBuffer | Uint8Array): Promise<ArrayBuffer> {
  if (data instanceof ArrayBuffer) return data;
  if (data instanceof Uint8Array) return data.buffer as ArrayBuffer;
  if (typeof (data as any).arrayBuffer === 'function') {
    return (data as any).arrayBuffer();
  }
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error || new Error('Failed to read file buffer'));
    reader.readAsArrayBuffer(data as Blob);
  });
}

/**
 * Calculates a genuine cryptographic SHA-256 digest of any File, Blob, ArrayBuffer, Uint8Array, or string.
 */
export async function calculateSHA256(data: File | Blob | ArrayBuffer | Uint8Array | string): Promise<string> {
  let buffer: ArrayBuffer;

  if (typeof data === 'string') {
    buffer = new TextEncoder().encode(data).buffer;
  } else {
    buffer = await toSafeArrayBuffer(data);
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Alias for binary File/Blob SHA-256 calculation.
 */
export async function calculateFileSHA256(data: File | Blob | ArrayBuffer | Uint8Array): Promise<string> {
  return calculateSHA256(data);
}

/**
 * Verifies calculated hash against an expected hash.
 */
export async function verifyHash(
  expectedHash: string,
  data: File | Blob | ArrayBuffer | Uint8Array | string
): Promise<HashVerificationResult> {
  const calculatedHash = await calculateSHA256(data);
  const matches = expectedHash.trim().toLowerCase() === calculatedHash.trim().toLowerCase();

  return {
    matches,
    expectedHash: expectedHash.trim().toLowerCase(),
    calculatedHash,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Formats a 64-character SHA-256 hex string with human-readable 8-char block spacing.
 */
export function formatHashDisplay(hash: string): string {
  if (!hash) return '';
  return hash.match(/.{1,8}/g)?.join(' ') || hash;
}

/**
 * Performs real Web Crypto AES-256-GCM envelope encryption over an ArrayBuffer or File/Blob.
 */
export async function encryptEvidencePayload(data: ArrayBuffer | File | Blob): Promise<EncryptionResult> {
  const rawBuffer = await toSafeArrayBuffer(data);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ivHex = Array.from(iv).map((b) => b.toString(16).padStart(2, '0')).join('');

  // Generate an ephemeral forensic wrapping key for this object
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    rawBuffer
  );

  const rawKey = await crypto.subtle.exportKey('raw', key);
  const keyHash = await crypto.subtle.digest('SHA-256', rawKey);
  const keyFingerprint =
    'KEY-FPR-' +
    Array.from(new Uint8Array(keyHash))
      .slice(0, 4)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();

  return {
    encryptedBuffer,
    keyFingerprint,
    algorithm: 'AES-256-GCM',
    ivHex,
  };
}