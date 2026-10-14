import React, { useState } from 'react';
import {
  Shield,
  Blocks,
  Trash2,
  CheckCircle2,
  Save,
  Lock,
  HardDrive,
  AlertCircle,
} from 'lucide-react';
import { useForensicStore } from '../stores/useForensicStore';
import { clearVaultBinaries } from '../services/vaultStorageService';
import { PageContainer } from '../components/common/PageContainer';
import { PageHeader } from '../components/common/PageHeader';

export const SettingsPage: React.FC = () => {
  const { clearWorkspaceData, loadDemonstrationData, cases, evidence, blocks } = useForensicStore();

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [hashAlgorithm, setHashAlgorithm] = useState('SHA-256 (FIPS 180-4)');
  const [encryptionCipher, setEncryptionCipher] = useState('AES-256-GCM (WebCrypto Native)');
  const [autoAnchor, setAutoAnchor] = useState(true);
  const [autoAiScan, setAutoAiScan] = useState(true);
  const [strictCustodySignoff, setStrictCustodySignoff] = useState(true);
  const [retentionYears, setRetentionYears] = useState('10');
  const [nodeEndpoint, setNodeEndpoint] = useState('wss://poa-validator-01.blockvault.local:8546');
  const [ipfsGateway, setIpfsGateway] = useState('IndexedDB Local Vault + AES-256-GCM');
  const [confirmPurge, setConfirmPurge] = useState(false);

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSave = () => {
    showFeedback('Forensic platform security & governance policies saved');
  };

  const handlePurgeWorkspace = async () => {
    await clearVaultBinaries();
    await clearWorkspaceData();
    setConfirmPurge(false);
    showFeedback('All local cases, evidence binaries, and ledger blocks purged.');
  };

  return (
    <PageContainer>
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border flex items-center gap-2.5 shadow-2xl backdrop-blur-md transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
              : 'bg-red-950/90 text-red-200 border-red-500/40'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span className="text-xs font-mono">{notification.message}</span>
        </div>
      )}

      {/* 1. Standardized Page Header with Breadcrumbs */}
      <PageHeader
        breadcrumbs={[
          { label: 'BlockVault', href: '/dashboard' },
          { label: 'Platform Settings' },
        ]}
        title="Platform Settings"
        badge="FIPS 140-3 • ISO/IEC 27037"
        subtitle="Configure cryptographic hashing standards, IndexedDB binary storage, blockchain anchoring policies, and workspace data retention."
        actions={
          <button
            onClick={handleSave}
            className="h-9 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs shadow-sm transition inline-flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cryptographic Engine */}
        <div className="bg-[#0C101D] border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
          <h2 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/[0.06] pb-3">
            <Lock className="w-4 h-4 text-cyan-400" />
            Cryptographic Hashing & Vault Encryption
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Primary Evidence Digest Algorithm
            </label>
            <select
              value={hashAlgorithm}
              onChange={(e) => setHashAlgorithm(e.target.value)}
              className="w-full bg-[#060911] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/60 transition"
            >
              <option>SHA-256 (FIPS 180-4)</option>
              <option>SHA-384 (FIPS 180-4)</option>
              <option>SHA-512 (FIPS 180-4)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Evidence Payload At-Rest Encryption Cipher
            </label>
            <select
              value={encryptionCipher}
              onChange={(e) => setEncryptionCipher(e.target.value)}
              className="w-full bg-[#060911] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/60 transition"
            >
              <option>AES-256-GCM (WebCrypto Native)</option>
              <option>ChaCha20-Poly1305 (RFC 8439)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Statutory Evidence Retention Period (Years)
            </label>
            <input
              type="number"
              value={retentionYears}
              onChange={(e) => setRetentionYears(e.target.value)}
              className="w-full bg-[#060911] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/60 transition"
            />
          </div>
        </div>

        {/* Blockchain & Storage */}
        <div className="bg-[#0C101D] border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
          <h2 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/[0.06] pb-3">
            <Blocks className="w-4 h-4 text-cyan-400" />
            Consortium Ledger & Binary Vault Storage
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Proof-of-Authority (PoA) Validator RPC Endpoint
            </label>
            <input
              type="text"
              value={nodeEndpoint}
              onChange={(e) => setNodeEndpoint(e.target.value)}
              className="w-full bg-[#060911] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm font-mono text-cyan-400 focus:outline-none focus:border-blue-500/60 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Encrypted Binary Storage Engine
            </label>
            <input
              type="text"
              value={ipfsGateway}
              onChange={(e) => setIpfsGateway(e.target.value)}
              className="w-full bg-[#060911] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500/60 transition"
            />
          </div>

          <div className="pt-2 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-slate-300">
                Automatically anchor SHA-256 evidence seal to blockchain on intake
              </span>
              <input
                type="checkbox"
                checked={autoAnchor}
                onChange={(e) => setAutoAnchor(e.target.checked)}
                className="accent-cyan-500 w-4 h-4"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-slate-300">
                Execute signal & byte-entropy authenticity inspection upon upload
              </span>
              <input
                type="checkbox"
                checked={autoAiScan}
                onChange={(e) => setAutoAiScan(e.target.checked)}
                className="accent-cyan-500 w-4 h-4"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-slate-300">
                Require cryptographic hash re-verification before custody handoff
              </span>
              <input
                type="checkbox"
                checked={strictCustodySignoff}
                onChange={(e) => setStrictCustodySignoff(e.target.checked)}
                className="accent-cyan-500 w-4 h-4"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Workspace Storage Status & Purge */}
      <div className="bg-[#0C101D] border border-white/[0.08] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <div>
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            Local Forensic Workspace & IndexedDB Binary Vault
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Currently storing <span className="text-white font-mono">{cases.length}</span> cases,{' '}
            <span className="text-white font-mono">{evidence.length}</span> encrypted evidence files, and{' '}
            <span className="text-white font-mono">{blocks.length}</span> ledger blocks in persistent browser storage.
          </p>
        </div>

        {!confirmPurge ? (
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={async () => {
                await loadDemonstrationData();
                showFeedback('Fictional demonstration forensic cases, evidence, and ledger loaded.');
              }}
              className="px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 font-medium text-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Blocks className="w-4 h-4" />
              Load Demonstration Dataset
            </button>
            <button
              onClick={() => setConfirmPurge(true)}
              className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-medium text-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Purge Workspace Data
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-red-400 font-mono">Confirm permanent purge?</span>
            <button
              onClick={handlePurgeWorkspace}
              className="px-3.5 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-slate-950 font-bold text-xs transition cursor-pointer"
            >
              Yes, Purge All
            </button>
            <button
              onClick={() => setConfirmPurge(false)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default SettingsPage;
