import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  helperText?: React.ReactNode;
  helper?: React.ReactNode;
  icon: LucideIcon;
  variant?: 'cyan' | 'emerald' | 'purple' | 'amber' | 'blue' | 'rose' | 'slate';
  accent?: 'cyan' | 'emerald' | 'purple' | 'amber' | 'blue' | 'rose' | 'slate' | string;
  badge?: React.ReactNode;
  className?: string;
}

const variantStyles = {
  cyan: {
    iconBg: 'bg-cyan-500/10',
    iconBorder: 'border-cyan-500/20',
    iconColor: 'text-cyan-400',
    valColor: 'text-white',
  },
  emerald: {
    iconBg: 'bg-emerald-500/10',
    iconBorder: 'border-emerald-500/20',
    iconColor: 'text-emerald-400',
    valColor: 'text-emerald-400',
  },
  purple: {
    iconBg: 'bg-purple-500/10',
    iconBorder: 'border-purple-500/20',
    iconColor: 'text-purple-400',
    valColor: 'text-white',
  },
  amber: {
    iconBg: 'bg-amber-500/10',
    iconBorder: 'border-amber-500/20',
    iconColor: 'text-amber-400',
    valColor: 'text-amber-400',
  },
  blue: {
    iconBg: 'bg-blue-500/10',
    iconBorder: 'border-blue-500/20',
    iconColor: 'text-blue-400',
    valColor: 'text-blue-400',
  },
  rose: {
    iconBg: 'bg-rose-500/10',
    iconBorder: 'border-rose-500/20',
    iconColor: 'text-rose-400',
    valColor: 'text-rose-400',
  },
  slate: {
    iconBg: 'bg-slate-500/10',
    iconBorder: 'border-slate-500/20',
    iconColor: 'text-slate-400',
    valColor: 'text-white',
  },
};

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  helperText,
  helper,
  icon: Icon,
  variant,
  accent,
  badge,
  className = '',
}) => {
  const chosenVariant = ((variant || accent) as keyof typeof variantStyles) || 'cyan';
  const styles = variantStyles[chosenVariant] || variantStyles.cyan;
  const displayHelper = helperText ?? helper;

  return (
    <div
      className={`bg-[#0C101D] border border-white/[0.08] rounded-xl p-5 flex items-start justify-between gap-4 transition-all hover:border-white/[0.14] h-[120px] ${className}`}
    >
      <div className="flex flex-col justify-between h-full min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-400 truncate">
            {label}
          </span>
          {badge}
        </div>
        <div className={`text-2xl sm:text-[28px] font-semibold tracking-tight tabular-nums leading-none ${styles.valColor}`}>
          {value}
        </div>
        {displayHelper && (
          <div className="text-xs text-slate-400 truncate flex items-center gap-1.5 pt-0.5">
            {displayHelper}
          </div>
        )}
      </div>

      <div
        className={`w-9 h-9 rounded-lg ${styles.iconBg} border ${styles.iconBorder} ${styles.iconColor} flex items-center justify-center shrink-0 mt-0.5`}
      >
        <Icon className="w-4 h-4" />
      </div>
    </div>
  );
};

export default KpiCard;
