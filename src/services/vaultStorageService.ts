/**
 * BLOCKVAULT — IndexedDB Binary Evidence Vault Service
 * Stores and retrieves real uploaded binary files and AES-256-GCM encrypted
 * payloads in IndexedDB so all cryptographic verifications, media previews,
 * and forensic signal analyses operate on actual user-uploaded bytes.
 */

export interface VaultBinaryRecord {
  evidenceId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  rawBuffer: ArrayBuffer;
  encryptedBuffer?: ArrayBuffer;
  ivHex?: string;
  keyFingerprint?: string;
  storedAt: string;
}

const DB_NAME = 'BlockVaultBinaryDB_v1';
const STORE_NAME = 'evidence_binaries';
const DB_VERSION = 1;

// In-memory fallback for environments without IndexedDB (e.g., Node/Vitest)
const memoryVault = new Map<string, VaultBinaryRecord>();

function openVaultDB(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'evidenceId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Store a real uploaded File/Blob and its encrypted representation in the binary vault.
 */
export async function storeEvidenceBinary(
  evidenceId: string,
  file: File | Blob | ArrayBuffer,
  encryptedPayload?: {
    encryptedBuffer: ArrayBuffer;
    ivHex: string;
    keyFingerprint: string;
  }
): Promise<VaultBinaryRecord> {
  let rawBuffer: ArrayBuffer;
  let fileName = `evidence-${evidenceId}`;
  let mimeType = 'application/octet-stream';

  if (file instanceof ArrayBuffer) {
    rawBuffer = file;
  } else {
    fileName = (file as any).name || `evidence-${evidenceId}`;
    mimeType = (file as any).type || 'application/octet-stream';
    if (typeof (file as any).arrayBuffer === 'function') {
      rawBuffer = await (file as any).arrayBuffer();
    } else {
      rawBuffer = await new Response(file as any).arrayBuffer();
    }
  }

  const record: VaultBinaryRecord = {
    evidenceId,
    fileName,
    mimeType,
    fileSize: rawBuffer.byteLength,
    rawBuffer,
    encryptedBuffer: encryptedPayload?.encryptedBuffer,
    ivHex: encryptedPayload?.ivHex,
    keyFingerprint: encryptedPayload?.keyFingerprint,
    storedAt: new Date().toISOString(),
  };

  memoryVault.set(evidenceId, record);

  try {
    const db = await openVaultDB();
    if (db) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(record);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      });
    }
  } catch (err) {
    console.warn('IndexedDB binary write fallback to memory:', err);
  }

  return record;
}

/**
 * Retrieve the stored binary record for an evidence item.
 */
export async function getEvidenceBinary(evidenceId: string): Promise<VaultBinaryRecord | null> {
  if (memoryVault.has(evidenceId)) {
    return memoryVault.get(evidenceId) || null;
  }

  try {
    const db = await openVaultDB();
    if (!db) return null;

    return await new Promise<VaultBinaryRecord | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(evidenceId);
      req.onsuccess = () => {
        const result = (req.result as VaultBinaryRecord) || null;
        if (result) {
          memoryVault.set(evidenceId, result);
        }
        db.close();
        resolve(result);
      };
      req.onerror = () => {
        db.close();
        reject(req.error);
      };
    });
  } catch {
    return null;
  }
}

/**
 * Retrieve a reconstructable Blob and Object URL for an evidence item from the vault.
 */
export async function getEvidenceBlob(evidenceId: string): Promise<{ blob: Blob; fileName: string; byteLength: number } | null> {
  const record = await getEvidenceBinary(evidenceId);
  if (!record) return null;
  const blob = new Blob([record.rawBuffer], { type: record.mimeType });
  return {
    blob,
    fileName: record.fileName,
    byteLength: record.fileSize,
  };
}

/**
 * Clear all stored binaries from IndexedDB and memory.
 */
export async function clearVaultBinaries(): Promise<void> {
  memoryVault.clear();
  try {
    const db = await openVaultDB();
    if (!db) return;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    // Ignore if IndexedDB unavailable
  }
}
