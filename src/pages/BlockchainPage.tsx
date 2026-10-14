import React, { useState } from 'react';
import {
  Blocks,
  RefreshCw,
  CheckCircle2,
  AlertOctagon,
  Copy,
  Check,
  ArrowRight,
  Server,
  Layers,
  X,
  ChevronRight,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForensicStore } from '../stores/useForensicStore';
import { BlockchainBlock, BlockchainVerificationResult } from '../types';
import { PageContainer } from '../components/common/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { KpiCard } from '../components/common/KpiCard';
import { HashChip } from '../components/common/HashChip';

export const BlockchainPage: React.FC = () => {
  const navigate = useNavigate();
  const { blocks, verifyChain } = useForensicStore();

  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<BlockchainVerificationResult | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<BlockchainBlock | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const blockHeight = blocks.length > 0 ? blocks[blocks.length - 1].blockHeight : 0;
  const totalTransactions = blocks.reduce((acc, b) => acc + b.transactions.length, 0);

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleVerifyChain = async () => {
    setVerifying(true);
    try {
      const result = await verifyChain();
      setVerificationResult(result);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <PageContainer>
      {/* 1. Standardized Page Header with Breadcrumbs */}
      <PageHeader
        breadcrumbs={[
          { label: 'BlockVault', href: '/dashboard' },
          { label: 'Blockchain Explorer' },
        ]}
        title="Blockchain Explorer"
        badge="POA CONSENSUS"
        subtitle="Deterministic cryptographic block ledger anchoring evidence digests with SHA-256 Merkle root trees, continuous hash-pointer chains, and multi-validator attestations."
        actions={
          <button
            onClick={handleVerifyChain}
            disabled={verifying}
            className="h-9 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs shadow-sm transition inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
            <span>{verifying ? 'Auditing Continuity...' : 'Audit Ledger Continuity'}</span>
          </button>
        }
      />

      {/* 2. Verification Result Banner */}
      {verificationResult && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] ${
            verificationResult.isValid
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
          }`}
        >
          {verificationResult.isValid ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="text-xs font-bold font-mono uppercase tracking-wider">
              {verificationResult.isValid
                ? 'MINICHAIN CONTINUITY VERIFIED INTACT'
                : 'BLOCKCHAIN INTEGRITY FAILURE DETECTED'}
            </div>
            <div className="text-xs mt-1 text-zinc-300 font-mono">
              {verificationResult.isValid
                ? `Audited all ${verificationResult.totalBlocksChecked} blocks (Genesis #0 to #${blockHeight}). All ${verificationResult.totalTransactionsVerified} transactions, previous hash pointers, and Merkle root trees cryptographically match.`
                : `Continuity severed at Block #${verificationResult.invalidBlockHeight}: ${verificationResult.errorDetail}`}
            </div>
          </div>
        </div>
      )}

      {/* 3. Standardized KPI Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Ledger Height"
          value={`#${blockHeight}`}
          helper={`${blocks.length} confirmed blocks`}
          icon={Blocks}
          accent="cyan"
        />
        <KpiCard
          label="Anchored Proofs"
          value={totalTransactions}
          helper="Bit-for-bit evidence sealed"
          icon={ShieldCheck}
          accent="emerald"
        />
        <KpiCard
          label="Consensus Engine"
          value="PoA Engine"
          helper="Deterministic Merkle tree"
          icon={Layers}
          accent="purple"
        />
        <KpiCard
          label="Consensus State"
          value="Synchronized"
          helper="Authority seal intact"
          icon={Activity}
          accent="emerald"
        />
      </div>

      {/* 4. Linked Blocks Explorer Card */}
      <div className="bg-[#0C101D] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] rounded-2xl overflow-hidden">
        <div className="px-6 py-4.5 border-b border-white/[0.06] bg-white/[0.01] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
            <Blocks className="w-4 h-4 text-cyan-400" />
            Cryptographic Chain Sequence (Genesis #0 to Tip #{blockHeight})
          </h2>
          <span className="text-xs font-mono text-zinc-400">
            {blocks.length} SEALED BLOCKS
          </span>
        </div>

        <div className="p-6 space-y-3.5">
          {blocks.map((b) => (
            <div
              key={b.blockHeight}
              onClick={() => setSelectedBlock(b)}
              className="bg-[#080C16] border border-white/[0.06] hover:border-cyan-500/30 rounded-2xl p-5 transition cursor-pointer group shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition">
                    <Blocks className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      Block #{b.blockHeight}
                      {b.blockHeight === 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          GENESIS BLOCK
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400">
                      Timestamp: {new Date(b.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    {b.transactions.length} Transaction(s)
                  </span>
                  <span className="text-xs font-medium font-mono text-cyan-400 flex items-center gap-1 group-hover:translate-x-0.5 transition">
                    Inspect <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-[#0C101D] border border-white/[0.06] rounded-xl p-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    Previous Block Hash
                  </div>
                  <div className="font-mono text-zinc-300 text-[11px] break-all mt-0.5">
                    {b.previousHash}
                  </div>
                </div>

                <div className="bg-[#0C101D] border border-cyan-500/20 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                      Current Block Hash
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(b.blockHash);
                      }}
                      className="text-zinc-400 hover:text-cyan-400 p-0.5 transition"
                    >
                      {copiedHash === b.blockHash ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-cyan-200 text-[11px] break-all mt-0.5">
                    {b.blockHash}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <span className="text-zinc-500">Merkle Root:</span>
                  <HashChip hash={b.merkleRoot} lead={8} tail={6} />
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                  <span className="text-zinc-500">VALIDATOR:</span>
                  <span className="text-zinc-300">{b.validator} (PoA Sealed)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Block Detail Modal */}
      {selectedBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0C101D] border border-white/[0.08] rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-4.5 border-b border-white/[0.06] flex items-center justify-between bg-[#080C16]">
              <div className="flex items-center gap-2.5">
                <Blocks className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white tracking-tight">
                  Block #{selectedBlock.blockHeight} Full Ledger Entry
                </h3>
              </div>
              <button
                onClick={() => setSelectedBlock(null)}
                className="text-zinc-400 hover:text-white transition p-1 rounded-lg hover:bg-white/[0.04]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-3">
                <div className="bg-[#080C16] border border-white/[0.06] rounded-xl p-3.5">
                  <div className="text-[10px] font-mono uppercase text-zinc-500">Block Hash</div>
                  <div className="font-mono text-xs text-cyan-400 break-all mt-1">
                    {selectedBlock.blockHash}
                  </div>
                </div>

                <div className="bg-[#080C16] border border-white/[0.06] rounded-xl p-3.5">
                  <div className="text-[10px] font-mono uppercase text-zinc-500">Previous Block Hash</div>
                  <div className="font-mono text-xs text-zinc-300 break-all mt-1">
                    {selectedBlock.previousHash}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#080C16] border border-white/[0.06] rounded-xl p-3.5">
                    <div className="text-[10px] font-mono uppercase text-zinc-500">Merkle Root</div>
                    <div className="font-mono text-xs text-zinc-300 break-all mt-1">
                      {selectedBlock.merkleRoot}
                    </div>
                  </div>
                  <div className="bg-[#080C16] border border-white/[0.06] rounded-xl p-3.5">
                    <div className="text-[10px] font-mono uppercase text-zinc-500">Validator Signature</div>
                    <div className="font-mono text-xs text-zinc-300 break-all mt-1">
                      {selectedBlock.signature}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/[0.06] pt-4">
                <div className="text-xs font-bold text-white uppercase tracking-wider mb-2.5 flex items-center justify-between font-mono">
                  <span>Transactions Sealed in Block ({selectedBlock.transactions.length})</span>
                  <span className="text-[10px] text-cyan-400">PO-AUTHORITY PROOF</span>
                </div>

                <div className="border border-white/[0.06] rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-wider text-zinc-400 bg-white/[0.02]">
                        <th className="py-2.5 px-3">Transaction ID</th>
                        <th className="py-2.5 px-3">Payload Type</th>
                        <th className="py-2.5 px-3">Evidence ID</th>
                        <th className="py-2.5 px-3">Evidence Hash</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04] text-xs font-mono">
                      {selectedBlock.transactions.map((tx, idx) => (
                        <tr key={tx.txId || idx} className="hover:bg-white/[0.02] transition">
                          <td className="py-2.5 px-3 text-cyan-400 text-[11px] font-bold">
                            {tx.txId.slice(0, 16)}...
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                              {tx.payloadType}
                            </span>
                          </td>
                          <td
                            onClick={() => {
                              setSelectedBlock(null);
                              navigate(`/evidence/${tx.evidenceId}`);
                            }}
                            className="py-2.5 px-3 text-cyan-400 hover:underline cursor-pointer font-semibold text-[11px]"
                          >
                            {tx.evidenceNumber}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                            {tx.evidenceHash ? `${tx.evidenceHash.slice(0, 18)}...` : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-white/[0.06] flex items-center justify-end bg-[#080C16]">
              <button
                onClick={() => setSelectedBlock(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 text-xs font-medium border border-white/[0.08] transition"
              >
                Close Explorer
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default BlockchainPage;
