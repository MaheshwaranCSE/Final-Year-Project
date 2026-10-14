import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldAlert, Clock } from 'lucide-react';
import { CasePriority, IntegrityStatus } from '../../types';

interface ForensicBadgeProps {
  type: 'priority' | 'integrity' | 'blockchain' | 'custom';
  value: CasePriority | IntegrityStatus | string;
  size?: 'sm' | 'md';
  className?: string;
}

export const ForensicBadge: React.FC<ForensicBadgeProps> = ({
  type,
  value,
  size = 'sm',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs';

  if (type === 'priority') {
    switch (value) {
      case 'CRITICAL':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-rose-500/10 text-rose-400 border border-rose-500/25 ${sizeClasses} ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Critical
          </span>
        );
      case 'HIGH':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-amber-500/10 text-amber-400 border border-amber-500/25 ${sizeClasses} ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            High
          </span>
        );
      case 'MEDIUM':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-sky-500/10 text-sky-400 border border-sky-500/25 ${sizeClasses} ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            Medium
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-slate-800 text-slate-300 border border-slate-700 ${sizeClasses} ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Low
          </span>
        );
    }
  }

  if (type === 'integrity') {
    switch (value) {
      case 'VERIFIED':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 ${sizeClasses} ${className}`}>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            Verified Intact
          </span>
        );
      case 'TAMPERED':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30 ${sizeClasses} ${className}`}>
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            Tampered
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-amber-500/10 text-amber-400 border border-amber-500/25 ${sizeClasses} ${className}`}>
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            {String(value)}
          </span>
        );
    }
  }

  if (type === 'blockchain') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full font-mono font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 ${sizeClasses} ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        {value}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-white/[0.04] text-slate-300 border border-white/[0.08] ${sizeClasses} ${className}`}>
      {value}
    </span>
  );
};

export default ForensicBadge;
