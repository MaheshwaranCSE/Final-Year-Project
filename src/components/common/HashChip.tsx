import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface HashChipProps {
  hash: string;
  leadLength?: number;
  tailLength?: number;
  lead?: number;
  tail?: number;
  className?: string;
  mono?: boolean;
}

export const HashChip: React.FC<HashChipProps> = ({
  hash,
  leadLength,
  tailLength,
  lead,
  tail,
  className = '',
}) => {
  const effectiveLead = leadLength ?? lead ?? 8;
  const effectiveTail = tailLength ?? tail ?? 6;
  const [copied, setCopied] = useState(false);

  if (!hash) {
    return <span className="text-xs text-slate-500 font-mono">None</span>;
  }

  const cleanHash = hash.trim().toLowerCase();
  const truncated =
    cleanHash.length > effectiveLead + effectiveTail
      ? `${cleanHash.slice(0, effectiveLead)}...${cleanHash.slice(-effectiveTail)}`
      : cleanHash;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cleanHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      title={cleanHash}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.16] transition-colors group cursor-pointer max-w-full ${className}`}
      onClick={handleCopy}
    >
      <span className="font-mono text-xs text-slate-300 tracking-tight select-all truncate">
        {truncated}
      </span>
      <button
        type="button"
        aria-label="Copy hash"
        className="text-slate-400 group-hover:text-cyan-400 transition-colors p-0.5 rounded shrink-0"
      >
        {copied ? (
          <Check className="w-3 h-3 text-emerald-400" />
        ) : (
          <Copy className="w-3 h-3" />
        )}
      </button>
    </div>
  );
};

export default HashChip;
