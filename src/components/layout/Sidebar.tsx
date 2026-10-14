import React from 'react';
import {
  LayoutDashboard,
  FolderOpen,
  ShieldCheck,
  Link2,
  Blocks,
  ScanEye,
  AlertTriangle,
  FileText,
  FileCheck,
  Users,
  Settings,
  Shield,
  Server,
  Video,
  X,
  LucideIcon,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForensicStore } from '../../stores/useForensicStore';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  count?: number;
  badge?: string;
  alert?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const { cases, evidence, blocks } = useForensicStore();
  const blockHeight = blocks.length > 0 ? blocks[blocks.length - 1].blockHeight : 0;
  const tamperedCount = evidence.filter((e) => e.integrityStatus === 'TAMPERED').length;

  const navSections: NavSection[] = [
    {
      title: 'MAIN',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Cases', path: '/cases', icon: FolderOpen, count: cases.length },
        { label: 'Evidence Vault', path: '/evidence', icon: ShieldCheck, count: evidence.length },
      ],
    },
    {
      title: 'FORENSICS',
      items: [
        { label: 'Chain of Custody', path: '/custody', icon: Link2 },
        { label: 'Blockchain Explorer', path: '/blockchain', icon: Blocks, badge: `#${blockHeight}` },
        { label: 'Forensic Signal Lab', path: '/ai-analysis', icon: ScanEye },
        {
          label: 'Integrity Monitor',
          path: '/integrity',
          icon: AlertTriangle,
          alert: tamperedCount > 0 ? `${tamperedCount}` : undefined,
        },
        { label: 'Camera Monitor', path: '/cameras', icon: Video, badge: 'LIVE' },
      ],
    },
    {
      title: 'MANAGEMENT',
      items: [
        { label: 'Audit Logs', path: '/audit', icon: FileText },
        { label: 'Forensic Reports', path: '/reports', icon: FileCheck },
      ],
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { label: 'Users & Roles', path: '/users', icon: Users },
        { label: 'Platform Settings', path: '/settings', icon: Settings },
      ],
    },
  ];

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const renderNavContent = (isMobileDrawer = false) => (
    <div className="flex flex-col h-full bg-[#080C16] text-[#E6EAF2] select-none">
      {/* Brand Header */}
      <div
        onClick={() => handleNav('/dashboard')}
        className="h-14 px-4 flex items-center justify-between border-b border-white/[0.08] cursor-pointer hover:bg-white/[0.02] transition-colors shrink-0"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div className={`min-w-0 ${!isMobileDrawer ? 'show-on-expanded' : 'block'}`}>
            <div className="font-bold text-sm tracking-wide text-white leading-tight">
              BLOCKVAULT
            </div>
            <div className="text-[10px] font-semibold text-slate-400 tracking-wider">
              FORENSIC OS
            </div>
          </div>
        </div>

        {isMobileDrawer && (
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav Items Container */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3 scrollbar-none">
        {navSections.map((section, sIdx) => (
          <div key={section.title} className="space-y-0.5">
            {/* Section Heading */}
            <div
              className={`text-[10px] font-semibold text-slate-400 tracking-wider uppercase px-2.5 py-1 ${
                !isMobileDrawer ? 'show-on-expanded' : 'block'
              }`}
            >
              {section.title}
            </div>
            {!isMobileDrawer && sIdx > 0 && (
              <div className="hide-on-expanded border-t border-white/[0.06] my-1.5 mx-1" />
            )}

            {/* Section Items */}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  title={item.label}
                  className={`w-full h-9 px-2.5 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors cursor-pointer group ${
                    isActive
                      ? 'bg-white/[0.08] text-white border border-white/[0.08] shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  } justify-start`}
                >
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />

                  <span
                    className={`truncate text-[13px] ${
                      !isMobileDrawer ? 'show-on-expanded' : 'block'
                    }`}
                  >
                    {item.label}
                  </span>

                  {/* Badges / Counts */}
                  {(item.count !== undefined || item.badge || item.alert) && (
                    <div
                      className={`ml-auto ${
                        !isMobileDrawer ? 'flex-on-expanded' : 'flex'
                      } items-center`}
                    >
                      {item.alert ? (
                        <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          {item.alert}
                        </span>
                      ) : item.badge ? (
                        <span className="px-1.5 py-0.5 rounded text-[11px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20">
                          {item.badge}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[11px] font-mono text-slate-400 bg-white/[0.04] border border-white/[0.06]">
                          {item.count}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer: Single 48px row */}
      <div className="h-12 border-t border-white/[0.08] px-3 flex items-center justify-between gap-2 bg-[#060911]/60 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex items-center justify-center shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
          </div>
          <div
            className={`min-w-0 ${
              !isMobileDrawer ? 'show-on-expanded' : 'block'
            }`}
          >
            <div className="text-xs font-medium text-slate-300 truncate">
              Validator Node #01
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              PoA Consensus · Online
            </div>
          </div>
        </div>

        <div
          className={`shrink-0 ${
            !isMobileDrawer ? 'show-on-expanded' : 'block'
          }`}
        >
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            PoA
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop permanent sidebar: 72px rail at 1024-1439px, 248px at >= 1440px */}
      <aside className="hidden lg:flex flex-col fixed top-0 bottom-0 left-0 z-30 border-r border-white/[0.08] sidebar-responsive-width select-none transition-all duration-200">
        {renderNavContent(false)}
      </aside>

      {/* Mobile drawer: < 1024px */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 w-[248px] shadow-2xl z-10">
            {renderNavContent(true)}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
