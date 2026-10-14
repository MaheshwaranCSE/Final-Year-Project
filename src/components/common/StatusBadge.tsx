import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, LucideIcon } from 'lucide-react';

export type StatusVariant = 'success' | 'warning' | 'error' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  size?: 'small' | 'medium' | 'sm' | 'md';
  icon?: LucideIcon | React.ReactNode;
  pulse?: boolean;
  className?: string;
}

const variantStyles: Record<StatusVariant, { bg: string; border: string; text: string; dot: string; defaultIcon: LucideIcon }> = {
  success: {
    bg: 'bg-emerald-500/12',
    border: 'border-emerald-500/24',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    defaultIcon: CheckCircle2,
  },
  warning: {
    bg: 'bg-amber-500/12',
    border: 'border-amber-500/24',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    defaultIcon: AlertTriangle,
  },
  error: {
    bg: 'bg-rose-500/12',
    border: 'border-rose-500/24',
    text: 'text-rose-400',
    dot: 'bg-rose-400',
    defaultIcon: AlertCircle,
  },
  danger: {
    bg: 'bg-rose-500/12',
    border: 'border-rose-500/24',
    text: 'text-rose-400',
    dot: 'bg-rose-400',
    defaultIcon: AlertCircle,
  },
  info: {
    bg: 'bg-blue-500/12',
    border: 'border-blue-500/24',
    text: 'text-blue-400',
    dot: 'bg-blue-400',
    defaultIcon: Info,
  },
  neutral: {
    bg: 'bg-slate-500/12',
    border: 'border-slate-500/24',
    text: 'text-slate-400',
    dot: 'bg-slate-400',
    defaultIcon: Info,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'info',
  size = 'small',
  icon: CustomIcon,
  pulse = false,
  className = '',
}) => {
  const isSm = size === 'small' || size === 'sm';
  const cfg = variantStyles[variant] || variantStyles.info;
  const FallbackIcon = cfg.defaultIcon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-medium border transition-colors ${
        isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      } ${cfg.bg} ${cfg.border} ${cfg.text} ${className}`}
    >
      {CustomIcon ? (
        typeof CustomIcon === 'function' ? (
          <CustomIcon className="w-3.5 h-3.5 shrink-0" />
        ) : (
          CustomIcon
        )
      ) : pulse ? (
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse shrink-0`} />
      ) : (
        <FallbackIcon className="w-3 h-3 shrink-0" />
      )}
      <span className="truncate">{label}</span>
    </span>
  );
};

export default StatusBadge;
