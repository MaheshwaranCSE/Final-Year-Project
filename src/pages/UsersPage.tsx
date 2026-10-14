import React, { useState } from 'react';
import {
  Users,
  Shield,
  UserCheck,
  Key,
  CheckCircle2,
  XCircle,
  Plus,
  X,
  Building2,
  Mail,
  Hash,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { useForensicStore } from '../stores/useForensicStore';
import { UserRole } from '../types';
import { PageContainer } from '../components/common/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { KpiCard } from '../components/common/KpiCard';

const PERMISSION_MATRIX: {
  capability: string;
  category: string;
  INVESTIGATOR: boolean;
  REVIEWER: boolean;
  ADMIN: boolean;
  SUPER_ADMIN: boolean;
}[] = [
  { capability: 'Create & Manage Forensic Cases', category: 'Case Management', INVESTIGATOR: true, REVIEWER: false, ADMIN: true, SUPER_ADMIN: true },
  { capability: 'Upload & Cryptographically Seal Evidence', category: 'Evidence Vault', INVESTIGATOR: true, REVIEWER: false, ADMIN: true, SUPER_ADMIN: true },
  { capability: 'Verify SHA-256 & Blockchain Proof', category: 'Integrity & Ledger', INVESTIGATOR: true, REVIEWER: true, ADMIN: true, SUPER_ADMIN: true },
  { capability: 'Execute External Disk File Cryptographic Audit', category: 'Integrity & Ledger', INVESTIGATOR: false, REVIEWER: true, ADMIN: true, SUPER_ADMIN: true },
  { capability: 'Run AI Authenticity & Deepfake Diagnostics', category: 'Forensic AI Lab', INVESTIGATOR: true, REVIEWER: true, ADMIN: true, SUPER_ADMIN: true },
  { capability: 'Record Chain-of-Custody Transfers', category: 'Custody Ledger', INVESTIGATOR: true, REVIEWER: false, ADMIN: true, SUPER_ADMIN: true },
  { capability: 'Approve / Seal Court-Ready Dossiers', category: 'Legal & Compliance', INVESTIGATOR: false, REVIEWER: true, ADMIN: true, SUPER_ADMIN: true },
  { capability: 'Inspect Full Immutable Audit Logs', category: 'Security & Governance', INVESTIGATOR: false, REVIEWER: true, ADMIN: true, SUPER_ADMIN: true },
  { capability: 'Manage Operator Roles & System Policy', category: 'Security & Governance', INVESTIGATOR: false, REVIEWER: false, ADMIN: true, SUPER_ADMIN: true },
];

export const UsersPage: React.FC = () => {
  const {
    users,
    currentUser,
    registerUser,
    switchUser,
    updateUserRole,
    toggleUserStatus,
  } = useForensicStore();

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [name, setName] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [role, setRole] = useState<UserRole>('INVESTIGATOR');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleRegisterPersonnel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !badgeNumber.trim() || !department.trim() || !email.trim()) {
      showFeedback('All personnel identity fields are required.', 'error');
      return;
    }

    const newUser = registerUser({
      name: name.trim(),
      badgeNumber: badgeNumber.trim().toUpperCase(),
      role,
      department: department.trim(),
      email: email.trim(),
    });

    showFeedback(`Registered operator ${newUser.name} (${newUser.badgeNumber})`);
    setName('');
    setBadgeNumber('');
    setDepartment('');
    setEmail('');
    setShowRegisterModal(false);
  };

  const getInitials = (userName: string) => {
    return userName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'OP';
  };

  const getClearanceLabel = (userRole: UserRole) => {
    switch (userRole) {
      case 'SUPER_ADMIN':
        return 'LEVEL-5 ADMISSIBILITY ROOT';
      case 'ADMIN':
        return 'LEVEL-4 SYSTEM AUDIT';
      case 'REVIEWER':
        return 'LEVEL-3 JUDICIAL REVIEW';
      case 'INVESTIGATOR':
      default:
        return 'LEVEL-2 FORENSIC CUSTODIAN';
    }
  };

  return (
    <PageContainer>
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border flex items-center gap-2.5 shadow-2xl backdrop-blur-md transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
              : 'bg-rose-950/90 text-rose-200 border-rose-500/40'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-mono">{notification.message}</span>
        </div>
      )}
      {/* 1. Standardized Page Header with Breadcrumbs */}
      <PageHeader
        breadcrumbs={[
          { label: 'BlockVault', href: '/dashboard' },
          { label: 'Users & Roles' },
        ]}
        title="Users & Roles"
        badge="ISO/IEC 27037 RBAC"
        subtitle="Register authorized forensic personnel, enforce role-based access control (RBAC), and manage cryptographic signing identities across zero-trust investigation boundaries."
        actions={
          <button
            onClick={() => setShowRegisterModal(true)}
            className="h-9 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs shadow-sm transition inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Register Personnel</span>
          </button>
        }
      />

      {/* 2. Standardized KPI Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Authorized Personnel"
          value={users.length}
          helper="Cryptographically attested"
          icon={Users}
          accent="cyan"
        />
        <KpiCard
          label="Active Session"
          value={currentUser.name}
          helper={`Badge ${currentUser.badgeNumber}`}
          icon={UserCheck}
          accent="emerald"
        />
        <KpiCard
          label="Session Clearance"
          value={currentUser.role.replace(/_/g, ' ')}
          helper={getClearanceLabel(currentUser.role)}
          icon={Lock}
          accent="purple"
        />
        <KpiCard
          label="Governance Engine"
          value="Zero-Trust"
          helper="FIPS 140-3 compliant"
          icon={ShieldCheck}
          accent="blue"
        />
      </div>

      {/* 3. Directory Table Card */}
      <div className="bg-[#0C101D] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] rounded-2xl overflow-hidden">
        <div className="px-6 py-4.5 border-b border-white/[0.06] bg-white/[0.01] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
            <Users className="w-4 h-4 text-cyan-400" />
            Registered Forensic Personnel ({users.length})
          </h2>
          <span className="text-xs text-zinc-400 font-mono">
            Click &quot;Assume Identity&quot; to switch active signing credentials
          </span>
        </div>

        {users.length === 0 ? (
          <div className="p-16 text-center">
            <Users className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white mb-1">No Personnel Registered</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mb-4">
              Register investigators, reviewers, or admins to attribute custody transfers and cryptographic audits.
            </p>
            <button
              onClick={() => setShowRegisterModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs transition inline-flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              Register First Operator
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-wider text-zinc-400 bg-white/[0.02]">
                  <th className="py-3.5 px-5">Operator</th>
                  <th className="py-3.5 px-5">Badge & Clearance</th>
                  <th className="py-3.5 px-5">Assigned Role</th>
                  <th className="py-3.5 px-5">Department</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Session & Access Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {users.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  const isActive = u.status !== 'SUSPENDED';
                  return (
                    <tr
                      key={u.id}
                      className={`transition ${
                        isCurrent ? 'bg-cyan-500/[0.05]' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs border font-mono ${
                              isCurrent
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                                : 'bg-white/[0.04] text-zinc-300 border-white/[0.08]'
                            }`}
                          >
                            {getInitials(u.name)}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2">
                              {u.name}
                              {isCurrent && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                  Active Session
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400 font-mono">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-mono text-zinc-200 font-medium">{u.badgeNumber}</div>
                        <div className="text-[10px] font-mono text-zinc-500">
                          {getClearanceLabel(u.role)}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <select
                          aria-label={`Role for ${u.name}`}
                          value={u.role}
                          onChange={(e) => {
                            updateUserRole(u.id, e.target.value as UserRole);
                            showFeedback(`Updated ${u.name}'s role to ${e.target.value.replace(/_/g, ' ')}`);
                          }}
                          className="bg-[#080C16] border border-white/[0.08] rounded-xl px-2.5 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500/50"
                        >
                          <option value="INVESTIGATOR">INVESTIGATOR</option>
                          <option value="REVIEWER">REVIEWER</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        </select>
                      </td>
                      <td className="py-4 px-5 text-zinc-300 font-medium">{u.department}</td>
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-400' : 'bg-rose-400'
                            }`}
                          />
                          {u.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isCurrent ? (
                            <button
                              onClick={() => {
                                if (!isActive) {
                                  showFeedback('Cannot switch to a suspended operator account.', 'error');
                                  return;
                                }
                                switchUser(u.id);
                                showFeedback(`Switched active operator to ${u.name} (${u.role.replace(/_/g, ' ')})`);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium text-xs font-mono transition inline-flex items-center gap-1.5"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Assume Identity
                            </button>
                          ) : (
                            <span className="text-[11px] font-mono text-zinc-500 px-2">
                              Active Operator
                            </span>
                          )}

                          {!isCurrent && (
                            <button
                              onClick={() => {
                                toggleUserStatus(u.id);
                                showFeedback(`Updated account status for ${u.name}`);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 text-[11px] font-mono border border-white/[0.08] transition"
                            >
                              {isActive ? 'Suspend' : 'Activate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. RBAC Capability Matrix Card */}
      <div className="bg-[#0C101D] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] rounded-2xl overflow-hidden">
        <div className="px-6 py-4.5 border-b border-white/[0.06] bg-white/[0.01] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
            <Key className="w-4 h-4 text-cyan-400" />
            Role-Based Access Control (RBAC) Enforcement Matrix
          </h2>
          <span className="text-xs font-mono text-zinc-400">
            ISO/IEC 27037 ACCESS SEPARATION POLICY
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-wider text-zinc-400 bg-white/[0.02]">
                <th className="py-3.5 px-5">Forensic Capability</th>
                <th className="py-3.5 px-5">Domain</th>
                <th className="py-3.5 px-5 text-center">Investigator</th>
                <th className="py-3.5 px-5 text-center">Reviewer</th>
                <th className="py-3.5 px-5 text-center">Admin</th>
                <th className="py-3.5 px-5 text-center">Super Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs">
              {PERMISSION_MATRIX.map((row) => (
                <tr key={row.capability} className="hover:bg-white/[0.02] transition">
                  <td className="py-3.5 px-5 font-medium text-white">{row.capability}</td>
                  <td className="py-3.5 px-5 text-zinc-400 font-mono text-[11px]">{row.category}</td>
                  {(['INVESTIGATOR', 'REVIEWER', 'ADMIN', 'SUPER_ADMIN'] as UserRole[]).map(
                    (r) => (
                      <td
                        key={r}
                        className={`py-3.5 px-5 text-center ${
                          currentUser.role === r ? 'bg-cyan-500/[0.04]' : ''
                        }`}
                      >
                        {row[r] ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-zinc-700 mx-auto" />
                        )}
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Register Personnel Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0C101D] border border-white/[0.08] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-4.5 border-b border-white/[0.06] flex items-center justify-between bg-[#080C16]">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white tracking-tight">
                  Register Authorized Forensic Personnel
                </h3>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-zinc-400 hover:text-white transition p-1 rounded-lg hover:bg-white/[0.04]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterPersonnel} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Full Name & Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter operator full name"
                    className="w-full bg-[#080C16] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Badge / Credential ID *
                  </label>
                  <div className="relative">
                    <Hash className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={badgeNumber}
                      onChange={(e) => setBadgeNumber(e.target.value)}
                      placeholder="e.g., DFE-4012"
                      className="w-full bg-[#080C16] border border-white/[0.08] rounded-xl pl-8 pr-3.5 py-2.5 text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/60"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    RBAC Clearance Role *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-[#080C16] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/60"
                  >
                    <option value="INVESTIGATOR">INVESTIGATOR</option>
                    <option value="REVIEWER">REVIEWER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Department / Unit *
                  </label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Enter unit or division"
                      className="w-full bg-[#080C16] border border-white/[0.08] rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/60"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Official Agency Email *
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@agency.gov"
                    className="w-full bg-[#080C16] border border-white/[0.08] rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/60"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-zinc-300 text-xs font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Provision Operator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default UsersPage;
