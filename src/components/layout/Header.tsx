import React, { useState } from 'react';
import {
  Menu as MenuIcon,
  Search,
  CheckCircle2,
  AlertTriangle,
  Blocks,
  ChevronDown,
  UserCheck,
  Shield,
} from 'lucide-react';
import {
  Menu,
  MenuItem,
  Avatar,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useForensicStore } from '../../stores/useForensicStore';
import { NotificationCenter } from './NotificationCenter';
import { GlobalSearchModal } from './GlobalSearchModal';
import { User, UserRole } from '../../types';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { currentUser, users, switchUser, blocks, evidence } = useForensicStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  const blockHeight = blocks.length > 0 ? blocks[blocks.length - 1].blockHeight : 0;
  const tamperedCount = evidence.filter((e) => e.integrityStatus === 'TAMPERED').length;

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setUserMenuAnchor(null);
  };

  const handleSelectUser = (user: User) => {
    switchUser(user.id);
    handleCloseUserMenu();
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/25' };
      case 'ADMIN':
        return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/25' };
      case 'INVESTIGATOR':
        return { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/25' };
      case 'REVIEWER':
      default:
        return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/25' };
    }
  };

  const roleStyle = getRoleBadgeStyle(currentUser.role);
  const displayOperatorName = currentUser.name || 'Forensic Examiner';

  return (
    <>
      <header className="sticky top-0 z-20 h-14 bg-[#060911]/90 backdrop-blur-md border-b border-white/[0.06] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 select-none">
        {/* Left: Mobile hamburger + Search trigger */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0 max-w-[420px]">
          <button
            onClick={onToggleSidebar}
            aria-label="Open navigation menu"
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors shrink-0"
          >
            <MenuIcon className="w-5 h-5" />
          </button>

          {/* Search Input Button */}
          <div
            onClick={() => setSearchOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setSearchOpen(true)}
            className="w-full min-w-0 h-9 px-2.5 sm:px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.16] hover:bg-white/[0.06] transition-all flex items-center gap-2 sm:gap-2.5 cursor-pointer text-slate-400 group"
          >
            <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-300 transition-colors shrink-0" />
            <span className="text-xs sm:text-sm text-slate-400 group-hover:text-slate-300 truncate flex-1 font-normal">
              Search cases, SHA-256, exhibits...
            </span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-white/[0.06] border border-white/[0.08] shrink-0">
              Ctrl K
            </kbd>
          </div>
        </div>

        {/* Right: Unified Status Pill + Notifications + User Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Unified 28px Status Pill */}
          <div
            onClick={() => navigate(tamperedCount > 0 ? '/integrity' : '/blockchain')}
            title="Proof-of-Authority Ledger & SHA-256 Integrity Monitor"
            className="h-7 px-2.5 rounded-full bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.18] transition-colors cursor-pointer hidden md:flex items-center gap-2 text-xs text-slate-300"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                tamperedCount > 0
                  ? 'bg-rose-500 animate-pulse'
                  : 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
              }`}
            />
            <span className="font-mono text-[11px] font-medium text-slate-200">
              Ledger #{blockHeight}
            </span>
            <span className="text-white/20">·</span>
            {tamperedCount > 0 ? (
              <span className="text-rose-400 font-medium text-[11px] flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {tamperedCount} alerts
              </span>
            ) : (
              <span className="text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </span>
            )}
          </div>

          {/* Notifications Center */}
          <NotificationCenter />

          {/* User / Operator Dropdown */}
          <button
            type="button"
            onClick={handleOpenUserMenu}
            className="h-9 px-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.16] hover:bg-white/[0.06] transition-all flex items-center gap-2 text-left cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-cyan-600/30 border border-cyan-400/40 text-cyan-300 text-xs font-semibold flex items-center justify-center shrink-0">
              {displayOperatorName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block min-w-0 max-w-[140px]">
              <div className="text-xs font-medium text-white truncate leading-tight">
                {displayOperatorName}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {currentUser.badgeNumber || currentUser.role}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {/* User Menu Modal / Dropdown */}
          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={handleCloseUserMenu}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                width: 280,
                bgcolor: '#0B101E',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 2,
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.7)',
                mt: 1,
                p: 0.5,
              },
            }}
          >
            <div className="px-3 py-2">
              <div className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                AUTHENTICATED OPERATOR
              </div>
              <div className="text-sm font-semibold text-white mt-0.5 truncate">
                {displayOperatorName}
              </div>
              <div className="text-xs text-slate-400 truncate">
                {currentUser.department || 'Digital Forensics Unit'} · {currentUser.badgeNumber || 'OPERATOR'}
              </div>
            </div>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 0.5 }} />

            <div className="px-3 py-1">
              <div className="text-[10px] font-semibold text-cyan-400 tracking-wider uppercase">
                SWITCH OPERATOR ({users.length})
              </div>
            </div>

            {users.map((u) => {
              const isSelected = u.id === currentUser.id;
              const uStyle = getRoleBadgeStyle(u.role);

              return (
                <MenuItem
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  sx={{
                    borderRadius: 1.5,
                    mx: 0.5,
                    my: 0.2,
                    py: 0.8,
                    bgcolor: isSelected ? 'rgba(255,255,255,0.06)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                  }}
                >
                  <div className="w-full flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-white truncate">
                        {u.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {u.badgeNumber ? `${u.badgeNumber} · ` : ''}{u.role}
                      </div>
                    </div>
                    {isSelected && (
                      <UserCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    )}
                  </div>
                </MenuItem>
              );
            })}
          </Menu>
        </div>
      </header>

      {/* Global Search Dialog */}
      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default Header;
