import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Shield,
  Clock,
  ChevronRight,
  Activity,
  FileCheck,
} from 'lucide-react';
import { useForensicStore } from '../stores/useForensicStore';
import { AuditLog } from '../types';
import { PageContainer } from '../components/common/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { KpiCard } from '../components/common/KpiCard';

export const AuditLogsPage: React.FC = () => {
  const { auditLogs } = useForensicStore();

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [resourceFilter, setResourceFilter] = useState<string>('ALL');
  const [resultFilter, setResultFilter] = useState<string>('ALL');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchSearch =
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.userName.toLowerCase().includes(search.toLowerCase()) ||
        log.details.toLowerCase().includes(search.toLowerCase()) ||
        log.resourceId.toLowerCase().includes(search.toLowerCase()) ||
        log.ipAddress.toLowerCase().includes(search.toLowerCase());

      const matchAction = actionFilter === 'ALL' || log.action === actionFilter;
      const matchResource =
        resourceFilter === 'ALL' || log.resourceType === resourceFilter;
      const matchResult = resultFilter === 'ALL' || log.result === resultFilter;

      return matchSearch && matchAction && matchResource && matchResult;
    });
  }, [auditLogs, search, actionFilter, resourceFilter, resultFilter]);

  const handleExportJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `blockvault-audit-trail-${Date.now()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getResultBadge = (result: AuditLog['result']) => {
    switch (result) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            SUCCESS
          </span>
        );
      case 'FAILURE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-red-500/10 text-red-400 border border-red-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            FAILURE
          </span>
        );
      case 'WARNING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            WARNING
          </span>
        );
    }
  };

  return (
    <PageContainer>
      {/* 1. Standardized Page Header with Breadcrumbs */}
      <PageHeader
        breadcrumbs={[
          { label: 'BlockVault', href: '/dashboard' },
          { label: 'Audit Logs' },
        ]}
        title="Audit Logs"
        badge="WORM APPEND-ONLY"
        subtitle="Unmodifiable evidentiary ledger recording every user action, cryptographic verification, decryption, and export operation under CJIS & ISO/IEC 27037 policies."
        actions={
          <button
            onClick={handleExportJSON}
            className="h-9 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs shadow-sm transition inline-flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Export Audit Trail (.JSON)</span>
          </button>
        }
      />

      {/* 2. Standardized KPI Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Recorded Events"
          value={auditLogs.length}
          helper="Append-only ledger"
          icon={FileText}
          accent="cyan"
        />
        <KpiCard
          label="Successful Actions"
          value={auditLogs.filter((l) => l.result === 'SUCCESS').length}
          helper="Cryptographically sealed"
          icon={CheckCircle2}
          accent="emerald"
        />
        <KpiCard
          label="Anomalies / Failures"
          value={auditLogs.filter((l) => l.result !== 'SUCCESS').length}
          helper="Monitored in real-time"
          icon={AlertTriangle}
          accent={auditLogs.filter((l) => l.result !== 'SUCCESS').length > 0 ? 'amber' : 'neutral'}
        />
        <KpiCard
          label="Policy Compliance"
          value="CJIS Level 4"
          helper="FIPS 140-3 cryptography"
          icon={Shield}
          accent="blue"
        />
      </div>

      {/* 3. Filter Toolbar */}
      <div className="bg-[#0C101D] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] rounded-2xl p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by action, operator, resource ID, IP address, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#080C16] border border-white/[0.08] rounded-xl pl-9 pr-3.5 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-[#080C16] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="ALL">All Actions</option>
            <option value="REGISTER_USER">REGISTER_USER</option>
            <option value="LOGIN">LOGIN</option>
            <option value="CREATE_CASE">CREATE_CASE</option>
            <option value="UPLOAD_EVIDENCE">UPLOAD_EVIDENCE</option>
            <option value="VERIFY_EVIDENCE">VERIFY_EVIDENCE</option>
            <option value="DISK_FILE_VERIFICATION">DISK_FILE_VERIFICATION</option>
            <option value="ANALYZE_EVIDENCE">ANALYZE_EVIDENCE</option>
            <option value="BLOCKCHAIN_ANCHOR">BLOCKCHAIN_ANCHOR</option>
            <option value="EXPORT_REPORT">EXPORT_REPORT</option>
          </select>

          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="bg-[#080C16] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="ALL">All Resources</option>
            <option value="CASE">CASE</option>
            <option value="EVIDENCE">EVIDENCE</option>
            <option value="BLOCKCHAIN">BLOCKCHAIN</option>
            <option value="USER">USER</option>
            <option value="SYSTEM">SYSTEM</option>
          </select>

          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="bg-[#080C16] border border-white/[0.08] rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="ALL">All Results</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILURE">FAILURE</option>
            <option value="WARNING">WARNING</option>
          </select>
        </div>
      </div>

      {/* 4. Audit Log Table Card */}
      <div className="bg-[#0C101D] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] rounded-2xl overflow-hidden">
        <div className="px-6 py-4.5 border-b border-white/[0.06] bg-white/[0.01] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 font-mono">
            <Shield className="w-4 h-4 text-cyan-400" />
            Audit Ledger Chronology ({filteredLogs.length} Records)
          </h2>
          <span className="text-xs font-mono text-zinc-400">
            CRYPTOGRAPHIC RECORD HASHING
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white mb-1">No Matching Audit Entries</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              No audit logs match the specified search query and action filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-wider text-zinc-400 bg-white/[0.02]">
                  <th className="py-3.5 px-5">Timestamp</th>
                  <th className="py-3.5 px-5">Operator</th>
                  <th className="py-3.5 px-5">Action</th>
                  <th className="py-3.5 px-5">Resource</th>
                  <th className="py-3.5 px-5">IP Address</th>
                  <th className="py-3.5 px-5">Event Details</th>
                  <th className="py-3.5 px-5 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-4 px-5 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-semibold text-white text-xs">{log.userName}</div>
                      <div className="text-[10px] font-mono text-zinc-500">{log.userRole}</div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-white font-medium text-xs font-mono">{log.resourceType}</div>
                      <div className="text-[10px] font-mono text-zinc-500 break-all">{log.resourceId}</div>
                    </td>
                    <td className="py-4 px-5 text-zinc-400 font-mono text-[11px]">
                      {log.ipAddress}
                    </td>
                    <td className="py-4 px-5 text-zinc-300 max-w-sm text-xs">
                      {log.details}
                    </td>
                    <td className="py-4 px-5 text-right">
                      {getResultBadge(log.result)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default AuditLogsPage;
