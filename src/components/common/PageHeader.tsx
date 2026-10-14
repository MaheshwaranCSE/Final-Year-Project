import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  title: string | React.ReactNode;
  badge?: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  breadcrumbs,
  title,
  badge,
  subtitle,
  actions,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-white/[0.04]">
      <div className="space-y-1.5 min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-400">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <React.Fragment key={index}>
                  {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                  {item.href && !isLast ? (
                    <Link
                      to={item.href}
                      className="hover:text-cyan-400 transition-colors truncate"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className={isLast ? 'text-cyan-400 font-medium truncate' : 'truncate'}>
                      {item.label}
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
            {title}
          </h1>
          {badge && (
            typeof badge === 'string' ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
                {badge}
              </span>
            ) : (
              badge
            )
          )}
        </div>

        {subtitle && (
          <p className="text-sm text-slate-400 max-w-3xl leading-relaxed font-sans">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="shrink-0 flex items-center gap-2.5 flex-wrap self-start lg:self-center pt-1 lg:pt-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
