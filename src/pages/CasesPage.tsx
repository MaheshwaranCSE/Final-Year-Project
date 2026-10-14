import React, { useState, useMemo } from 'react';
import {
  FolderOpen,
  Plus,
  Search,
  ArrowRight,
  User as UserIcon,
  X,
  Clock,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Link2,
  LayoutGrid,
  List,
  Sparkles,
  RotateCcw,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForensicStore } from '../stores/useForensicStore';
import { Case, CasePriority, CaseClassification } from '../types';
import { PageContainer } from '../components/common/PageContainer';
import { PageHeader } from '../components/common/PageHeader';
import { KpiCard } from '../components/common/KpiCard';
import { StatusBadge } from '../components/common/StatusBadge';

export const CasesPage: React.FC = () => {
  const navigate = useNavigate();
  const { cases, evidence, custodyEvents, createCase, currentUser } = useForensicStore();

  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [classificationFilter, setClassificationFilter] = useState<string>('ALL');
  const [statusTab, setStatusTab] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // New Case Modal State
  const [openModal, setOpenModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    caseNumber: '',
    title: '',
    description: '',
    type: 'CYBER_INCIDENT' as Case['type'],
    priority: 'HIGH' as CasePriority,
    classification: 'CONFIDENTIAL' as CaseClassification,
    accessScope: 'DEPARTMENTAL' as Case['accessScope'],
    retentionPeriodYears: '7',
    reviewerName: 'Magistrate Court Chambers / Supervisory Reviewer',
    reviewerId: 'REV-SUP-882',
  });

  const canCreateCase = currentUser.role !== 'REVIEWER';

  const applyPreset = (preset: 'CYBER' | 'FRAUD' | 'AUDIT') => {
    const randomDocket = Math.floor(100 + Math.random() * 900);
    if (preset === 'CYBER') {
      setFormData({
        caseNumber: `CAS-2026-${randomDocket}`,
        title: 'Advanced Persistent Threat (APT) Intrusion & Ransomware Exfiltration',
        description: 'Forensic acquisition and triage of infected network segment, memory dumps, and command-and-control communication logs.',
        type: 'CYBER_INCIDENT',
        priority: 'CRITICAL',
        classification: 'RESTRICTED',
        accessScope: 'DEPARTMENTAL',
        retentionPeriodYears: '10',
        reviewerName: 'Magistrate Cyber Division / Lead Reviewer',
        reviewerId: 'REV-CYBER-09',
      });
    } else if (preset === 'FRAUD') {
      setFormData({
        caseNumber: `CAS-2026-${randomDocket}`,
        title: 'Corporate Wire Fraud & Ledger Asset Laundering Investigation',
        description: 'Multi-jurisdictional financial fraud tracking, suspect accounting drive clones, and forged signature forensic authentication.',
        type: 'FINANCIAL_FRAUD',
        priority: 'HIGH',
        classification: 'CONFIDENTIAL',
        accessScope: 'DEPARTMENTAL',
        retentionPeriodYears: '7',
        reviewerName: 'Chief Forensic Accountant / Audit Magistrate',
        reviewerId: 'REV-FIN-44',
      });
    } else {
      setFormData({
        caseNumber: `CAS-2026-${randomDocket}`,
        title: 'Chain-of-Custody Statutory Re-Verification & Evidence Vault Audit',
        description: 'Annual ISO/IEC 27037 audit verifying bit-for-bit integrity of all vaulted SHA-256 evidence blocks and PoA ledger consensus.',
        type: 'EVIDENCE_AUDIT',
        priority: 'MEDIUM',
        classification: 'INTERNAL_LAW_ENFORCEMENT',
        accessScope: 'CROSS_AGENCY',
        retentionPeriodYears: '5',
        reviewerName: 'Internal Affairs & Judicial Inspector',
        reviewerId: 'REV-IA-101',
      });
    }
    setFormError('');
  };

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const matchSearch =
        c.caseNumber.toLowerCase().includes(search.toLowerCase()) ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.leadInvestigatorName.toLowerCase().includes(search.toLowerCase());

      const matchPriority =
        priorityFilter === 'ALL' || c.priority === priorityFilter;
      const matchClassification =
        classificationFilter === 'ALL' ||
        c.classification === classificationFilter;
      const matchStatus = statusTab === 'ALL' || c.status === statusTab;

      return (
        matchSearch && matchPriority && matchClassification && matchStatus
      );
    });
  }, [cases, search, priorityFilter, classificationFilter, statusTab]);

  const hasActiveFilters =
    search.trim() !== '' ||
    priorityFilter !== 'ALL' ||
    classificationFilter !== 'ALL' ||
    statusTab !== 'ALL';

  const resetFilters = () => {
    setSearch('');
    setPriorityFilter('ALL');
    setClassificationFilter('ALL');
    setStatusTab('ALL');
  };

  const handleCreateCase = () => {
    if (
      !formData.caseNumber.trim() ||
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.reviewerName.trim() ||
      !formData.retentionPeriodYears
    ) {
      setFormError(
        'Please complete all required case fields (Case Number, Title, Description, Supervisory Reviewer, and Retention Period).'
      );
      return;
    }

    const retentionYears = parseInt(formData.retentionPeriodYears, 10);
    if (isNaN(retentionYears) || retentionYears <= 0) {
      setFormError('Please enter a valid numeric retention period (in years).');
      return;
    }

    const newCase = createCase({
      caseNumber: formData.caseNumber.trim().toUpperCase(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      type: formData.type,
      priority: formData.priority,
      classification: formData.classification,
      accessScope: formData.accessScope,
      retentionPeriodYears: retentionYears,
      leadInvestigatorId: currentUser.id,
      leadInvestigatorName: currentUser.name,
      supportingInvestigatorIds: [],
      reviewerId: formData.reviewerId.trim() || `REV-${Date.now()}`,
      reviewerName: formData.reviewerName.trim(),
      status: 'ACTIVE',
    });

    setOpenModal(false);
    setFormData({
      caseNumber: '',
      title: '',
      description: '',
      type: 'CYBER_INCIDENT',
      priority: 'HIGH',
      classification: 'CONFIDENTIAL',
      accessScope: 'DEPARTMENTAL',
      retentionPeriodYears: '7',
      reviewerName: 'Magistrate Court Chambers / Supervisory Reviewer',
      reviewerId: 'REV-SUP-882',
    });

    navigate(`/cases/${newCase.id}`);
  };

  const getPriorityBadge = (priority: CasePriority) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-sky-500/10 text-sky-400 border border-sky-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            LOW
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ACTIVE
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            UNDER REVIEW
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            CLOSED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
            {status}
          </span>
        );
    }
  };

  const activeCasesCount = cases.filter((c) => c.status === 'ACTIVE').length;
  const expeditedCasesCount = cases.filter(
    (c) => c.priority === 'CRITICAL' || c.priority === 'HIGH'
  ).length;

  return (
    <PageContainer>
      {/* 1. Modern Page Header with Breadcrumb */}
      <PageHeader
        breadcrumbs={[
          { label: 'BlockVault', href: '/dashboard' },
          { label: 'Cases' },
        ]}
        title="Cases"
        badge="ISO/IEC 27037"
        subtitle="Cryptographically anchored investigation dockets tracking sealed digital evidence, chain of custody continuum, and multi-signature judicial attestation."
        actions={
          canCreateCase && (
            <button
              onClick={() => {
                setFormError('');
                setOpenModal(true);
              }}
              className="h-9 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs shadow-sm transition inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Case</span>
            </button>
          )
        }
      />

      {/* 2. Standardized KPI Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Active Cases"
          value={`${activeCasesCount} / ${cases.length}`}
          helper="Cryptographically tracked"
          icon={FolderOpen}
          accent="cyan"
        />
        <KpiCard
          label="Expedited Triage"
          value={expeditedCasesCount}
          helper="Critical / High priority"
          icon={ShieldAlert}
          accent={expeditedCasesCount > 0 ? 'amber' : 'neutral'}
        />
        <KpiCard
          label="Vaulted Evidence"
          value={evidence.length}
          helper="Bit-for-bit SHA-256 verified"
          icon={ShieldCheck}
          accent="emerald"
        />
        <KpiCard
          label="Custody Transfers"
          value={custodyEvents.length}
          helper="Immutable continuum trail"
          icon={Link2}
          accent="blue"
        />
      </div>

      {/* 3. Modern Capsule Toolbar & Segmented Tabs */}
      <div className="p-3 rounded-2xl bg-[#0C101D] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] space-y-3">
        {/* Top: Capsule Status Tabs + View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="bg-[#070A12] border border-white/[0.06] p-1 rounded-xl flex items-center gap-1 overflow-x-auto">
            {[
              { label: 'All Cases', count: cases.length, value: 'ALL' },
              {
                label: 'Active',
                count: activeCasesCount,
                value: 'ACTIVE',
              },
              {
                label: 'Under Review',
                count: cases.filter((c) => c.status === 'UNDER_REVIEW').length,
                value: 'UNDER_REVIEW',
              },
              {
                label: 'Closed',
                count: cases.filter((c) => c.status === 'CLOSED').length,
                value: 'CLOSED',
              },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusTab(tab.value)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                  statusTab === tab.value
                    ? 'bg-white/[0.1] text-white shadow-sm border border-white/[0.1]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    statusTab === tab.value
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                      : 'bg-white/[0.05] text-zinc-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* View Mode Capsule Switcher */}
          <div className="bg-[#070A12] border border-white/[0.06] p-1 rounded-xl flex items-center gap-1 self-start sm:self-auto shrink-0">
            <button
              onClick={() => setViewMode('table')}
              title="Dense Table View"
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-white/[0.1] text-cyan-400 shadow-sm border border-white/[0.1] font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Dossier Cards Grid View"
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-white/[0.1] text-cyan-400 shadow-sm border border-white/[0.1] font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>
        </div>

        {/* Bottom: Modern Search & Filter Selectors */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-white/[0.06]">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by docket #, case title, investigator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9.5 bg-[#070A12] border border-white/[0.08] focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 rounded-xl pl-10 pr-3.5 text-xs text-white placeholder-zinc-500 transition-all outline-none"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-9.5 bg-[#070A12] border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 text-xs font-mono text-zinc-300 transition-all outline-none cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>

            <select
              value={classificationFilter}
              onChange={(e) => setClassificationFilter(e.target.value)}
              className="h-9.5 bg-[#070A12] border border-white/[0.08] focus:border-cyan-500/50 rounded-xl px-3 text-xs font-mono text-zinc-300 transition-all outline-none cursor-pointer"
            >
              <option value="ALL">All Classifications</option>
              <option value="TOP_SECRET">Top Secret</option>
              <option value="RESTRICTED">Restricted</option>
              <option value="CONFIDENTIAL">Confidential</option>
              <option value="INTERNAL_LAW_ENFORCEMENT">Internal Law Enforcement</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                title="Reset all filters"
                className="h-9.5 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white border border-white/[0.08] text-xs font-mono transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Case Registry Content: Modern Table OR Cards */}
      {filteredCases.length === 0 ? (
        <div className="rounded-2xl p-16 text-center bg-[#0C101D] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-500 mx-auto mb-3">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">
            {cases.length === 0
              ? 'No Forensic Cases Registered'
              : 'No Cases Match Your Filter Criteria'}
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mb-5 leading-relaxed">
            {cases.length === 0
              ? 'Initialize an immutable digital investigation docket with statutory classification and judicial assignment.'
              : 'Try clearing your search query or adjusting priority and status filters to locate specific dockets.'}
          </p>
          {cases.length === 0 && canCreateCase ? (
            <button
              onClick={() => {
                setFormError('');
                setOpenModal(true);
              }}
              className="h-9 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs shadow-sm transition inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Create First Case
            </button>
          ) : (
            hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 text-xs font-mono transition-all inline-flex items-center gap-2 border border-white/[0.08]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear Active Filters
              </button>
            )
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* ================= MODERN DATA GRID TABLE ================= */
        <div className="rounded-2xl border border-white/[0.08] bg-[#0C101D] overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
          <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between bg-[#080B14]">
            <h2 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-2 font-mono">
              <FolderOpen className="w-4 h-4 text-cyan-400" />
              Registered Forensic Cases ({filteredCases.length})
            </h2>
            <span className="text-[11px] font-mono text-zinc-500">
              AUDITED UNDER ISO/IEC 27037
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-wider text-zinc-400 bg-[#080B14]/80">
                  <th className="py-3 px-4 w-[140px]">Case Number</th>
                  <th className="py-3 px-4 min-w-[240px]">Title & Classification</th>
                  <th className="py-3 px-4 w-[115px]">Priority</th>
                  <th className="py-3 px-4 w-[140px]">Access Scope</th>
                  <th className="py-3 px-4 w-[120px]">Vault Evidence</th>
                  <th className="py-3 px-4 w-[170px]">Lead Investigator</th>
                  <th className="py-3 px-4 w-[125px]">Status</th>
                  <th className="py-3 px-4 w-[125px] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {filteredCases.map((c) => {
                  const displayTitle =
                    c.title && c.title.trim().length > 2
                      ? c.title
                      : `Forensic Docket: ${c.caseNumber}`;

                  const displayInvestigator =
                    c.leadInvestigatorName && c.leadInvestigatorName.trim().length > 2
                      ? c.leadInvestigatorName
                      : (currentUser.name || 'Lead Forensic Examiner');

                  const caseEvCount = evidence.filter(
                    (e) => e.caseId === c.id || e.caseNumber === c.caseNumber
                  ).length;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/cases/${c.id}`)}
                      className="hover:bg-white/[0.03] transition-colors duration-150 cursor-pointer group"
                    >
                      {/* Case Number */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-semibold text-cyan-400 text-xs tracking-wide bg-cyan-500/[0.08] border border-cyan-500/25 px-2 py-0.5 rounded-md inline-block">
                          {c.caseNumber}
                        </span>
                      </td>

                      {/* Title & Category (Two-Level Hierarchy) */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-100 group-hover:text-cyan-300 transition-colors line-clamp-1">
                          {displayTitle}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                            {c.type.replace(/_/g, ' ').toLowerCase()}
                          </span>
                          <span className="text-zinc-600">•</span>
                          <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.2 rounded">
                            {c.classification.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getPriorityBadge(c.priority)}
                      </td>

                      {/* Access Scope */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-[11px] font-mono text-zinc-400">
                          {c.accessScope.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Evidence Count */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-zinc-300 font-mono text-xs">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{caseEvCount} item{caseEvCount === 1 ? '' : 's'}</span>
                        </div>
                      </td>

                      {/* Lead Investigator */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 text-zinc-300">
                          <div className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold font-mono shrink-0">
                            {displayInvestigator.charAt(0).toUpperCase()}
                          </div>
                          <span className="truncate max-w-[130px] font-medium text-xs">
                            {displayInvestigator}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(c.status)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/cases/${c.id}`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-cyan-500/15 text-zinc-300 hover:text-cyan-300 border border-white/[0.08] hover:border-cyan-500/30 text-xs font-medium transition-all inline-flex items-center gap-1.5"
                        >
                          View Dossier
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ================= MODERN DOSSIER CARDS GRID VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCases.map((c) => {
            const displayTitle =
              c.title && c.title.trim().length > 2
                ? c.title
                : `Forensic Docket: ${c.caseNumber}`;

            const displayInvestigator =
              c.leadInvestigatorName && c.leadInvestigatorName.trim().length > 2
                ? c.leadInvestigatorName
                : (currentUser.name || 'Lead Forensic Examiner');

            const displayDesc =
              c.description && c.description.trim().length > 3
                ? c.description
                : 'Official digital forensic investigation docket registered under ISO/IEC 27037 standards.';

            const caseEvCount = evidence.filter(
              (e) => e.caseId === c.id || e.caseNumber === c.caseNumber
            ).length;

            return (
              <div
                key={c.id}
                onClick={() => navigate(`/cases/${c.id}`)}
                className="group rounded-2xl p-5 bg-[#0C101D] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:border-cyan-500/40 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-200 cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  {/* Top Bar: Docket & Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-cyan-400 font-semibold text-xs px-2.5 py-0.5 rounded-md bg-cyan-500/[0.08] border border-cyan-500/25">
                      {c.caseNumber}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getPriorityBadge(c.priority)}
                      {getStatusBadge(c.status)}
                    </div>
                  </div>

                  {/* Title & Classification Tag */}
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {displayTitle}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                        {c.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.2 rounded">
                        {c.classification.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Incident Summary Brief */}
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed bg-[#070A12] p-3 rounded-xl border border-white/[0.05]">
                    {displayDesc}
                  </p>

                  {/* Metadata HUD */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/[0.06] text-[11px] font-mono">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <UserIcon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="text-zinc-300 truncate text-xs">
                        {displayInvestigator}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-400 justify-end">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-zinc-200 font-medium">{caseEvCount} exhibits</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <Link2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>{c.retentionPeriodYears || 7}y Retention</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-400 justify-end">
                      <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span>
                        {new Date(c.dateCreated).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-500">
                    ID: {c.id.substring(0, 10)}...
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/cases/${c.id}`);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-cyan-500/15 text-zinc-300 hover:text-cyan-300 border border-white/[0.08] hover:border-cyan-500/30 text-xs font-medium transition-all inline-flex items-center gap-1.5"
                  >
                    View Dossier
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Modern Initialize New Case Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#0C101D] border border-white/[0.1] rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-white/[0.08] flex items-center justify-between bg-[#080B14]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight">
                    Initialize Forensic Case Dossier
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ISO/IEC 27037 standard docket registration
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpenModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.05] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Presets */}
              <div className="bg-[#070A12] border border-white/[0.06] rounded-xl p-3">
                <div className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Quick Incident Presets
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('CYBER')}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/25 text-xs font-medium transition"
                  >
                    + Cyber Intrusion
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('FRAUD')}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/25 text-xs font-medium transition"
                  >
                    + Financial Fraud
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('AUDIT')}
                    className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/25 text-xs font-medium transition"
                  >
                    + Vault Audit
                  </button>
                </div>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Docket # *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., CAS-2026-904"
                    value={formData.caseNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, caseNumber: e.target.value })
                    }
                    className="w-full h-9 bg-[#070A12] border border-white/[0.08] focus:border-cyan-500/50 rounded-lg px-3 text-xs font-mono text-cyan-400 placeholder-zinc-600 uppercase outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Case Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter case investigation title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full h-9 bg-[#070A12] border border-white/[0.08] focus:border-cyan-500/50 rounded-lg px-3 text-xs text-white placeholder-zinc-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Investigation Scope & Incident Summary *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter factual scope, warrant reference, affected systems, and digital forensic objectives..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-[#070A12] border border-white/[0.08] focus:border-cyan-500/50 rounded-lg p-3 text-xs text-white placeholder-zinc-600 leading-relaxed outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as Case['type'],
                      })
                    }
                    className="w-full h-9 bg-[#070A12] border border-white/[0.08] focus:border-cyan-500/50 rounded-lg px-3 text-xs text-zinc-300 outline-none cursor-pointer"
                  >
                    <option value="CYBER_INCIDENT">Cyber Incident / Intrusion</option>
                    <option value="FINANCIAL_FRAUD">Financial Fraud & AML</option>
                    <option value="DIGITAL_ESPIONAGE">Digital Espionage</option>
                    <option value="HOMICIDE_INVESTIGATION">Homicide Investigation</option>
                    <option value="NARCOTICS">Narcotics & Smuggling</option>
                    <option value="IP_THEFT">IP Theft / Corporate</option>
                    <option value="EVIDENCE_AUDIT">Evidence Audit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Priority Level *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: e.target.value as CasePriority,
                      })
                    }
                    className="w-full h-9 bg-[#070A12] border border-white/[0.08] focus:border-cyan-500/50 rounded-lg px-3 text-xs text-zinc-300 outline-none cursor-pointer"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Security Classification *
                  </label>
                  <select
                    value={formData.classification}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        classification: e.target.value as CaseClassification,
                      })
                    }
                    className="w-full h-9 bg-[#070A12] border border-white/[0.08] focus:border-cyan-500/50 rounded-lg px-3 text-xs text-zinc-300 outline-none cursor-pointer"
                  >
                    <option value="TOP_SECRET">Top Secret</option>
                    <option value="RESTRICTED">Restricted</option>
                    <option value="CONFIDENTIAL">Confidential</option>
                    <option value="INTERNAL_LAW_ENFORCEMENT">
                      Internal Law Enforcement
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Access Scope *
                  </label>
                  <select
                    value={formData.accessScope}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        accessScope: e.target.value as Case['accessScope'],
                      })
                    }
                    className="w-full h-9 bg-[#070A12] border border-white/[0.08] focus:border-cyan-500/50 rounded-lg px-3 text-xs text-zinc-300 outline-none cursor-pointer"
                  >
                    <option value="RESTRICTED">Restricted to Lead</option>
                    <option value="DEPARTMENTAL">Departmental Access</option>
                    <option value="CROSS_AGENCY">Cross-Agency Inter-Op</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Supervisory Reviewer *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter reviewer name"
                    value={formData.reviewerName}
                    onChange={(e) =>
                      setFormData({ ...formData, reviewerName: e.target.value })
                    }
                    className="w-full h-9 bg-[#070A12] border border-white/[0.08] focus:border-cyan-500/50 rounded-lg px-3 text-xs text-white placeholder-zinc-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Statutory Retention (Years) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g., 7"
                    value={formData.retentionPeriodYears}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        retentionPeriodYears: e.target.value,
                      })
                    }
                    className="w-full h-9 bg-[#070A12] border border-white/[0.08] focus:border-cyan-500/50 rounded-lg px-3 text-xs text-white placeholder-zinc-600 outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-cyan-500/[0.07] border border-cyan-500/25 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300 leading-relaxed">
                  Attestation:{' '}
                  <strong className="text-white font-mono">{currentUser.name}</strong> ({currentUser.badgeNumber || currentUser.role}). Case docket initialization cryptographically anchors the genesis custody block on the PoA ledger with SHA-256 integrity verification.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-white/[0.08] flex items-center justify-end gap-3 bg-[#080B14]">
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="h-9 px-4 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCase}
                className="h-9 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs shadow-sm transition inline-flex items-center gap-2 cursor-pointer"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Initialize Docket</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default CasesPage;
