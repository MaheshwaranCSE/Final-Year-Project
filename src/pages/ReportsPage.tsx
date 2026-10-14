import React, { useState } from 'react';
import {
  FileCheck,
  Printer,
  Shield,
  FileText,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import { useForensicStore } from '../stores/useForensicStore';
import { printForensicReport } from '../services/reportService';
import { ReportType } from '../types';
import { PageContainer } from '../components/common/PageContainer';
import { PageHeader } from '../components/common/PageHeader';

export const ReportsPage: React.FC = () => {
  const { cases, reports, generateReport } = useForensicStore();

  const [selectedCaseId, setSelectedCaseId] = useState<string>(
    cases[0]?.id || ''
  );
  const [selectedReportType, setSelectedReportType] = useState<ReportType>(
    'COMPLETE_FORENSIC_REPORT'
  );
  const [reportTitle, setReportTitle] = useState('');
  const [reportSummary, setReportSummary] = useState('');
  const [formError, setFormError] = useState('');

  const handleGenerateAndPrint = () => {
    if (!selectedCaseId || !reportTitle.trim() || !reportSummary.trim()) {
      setFormError(
        'Please select a Case Dossier and enter both a Report Title and Executive Summary.'
      );
      return;
    }
    setFormError('');
    const report = generateReport(
      selectedCaseId,
      selectedReportType,
      reportTitle.trim(),
      reportSummary.trim()
    );
    setReportTitle('');
    setReportSummary('');
    printForensicReport(report);
  };

  const handlePrintExisting = (rep: any) => {
    printForensicReport(rep);
  };

  return (
    <PageContainer>
      {/* 1. Standardized Page Header with Breadcrumbs */}
      <PageHeader
        breadcrumbs={[
          { label: 'BlockVault', href: '/dashboard' },
          { label: 'Forensic Reports' },
        ]}
        title="Forensic Reports"
        badge="ISO/IEC 27037"
        subtitle="Compile printable forensic examination reports with full SHA-256 digests, chain-of-custody chronology, and PoA ledger verification."
        actions={
          <div className="bg-[#0C101D] border border-white/[0.08] rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400">
                Compiled Dossiers
              </div>
              <div className="text-xs font-bold text-white font-mono">{reports.length} Reports</div>
            </div>
          </div>
        }
      />

      {/* Generator Workbench */}
      <div className="bg-[#0C101D] border border-white/[0.08] rounded-2xl overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
          <h2 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            Compile Authenticated Forensic Dossier
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            NATIVE SHA-256 ATTESTATION
          </span>
        </div>

        <div className="p-6 space-y-4">
          {formError && (
            <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Select Case Dossier *
              </label>
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="w-full bg-[#060911] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/60 transition"
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.caseNumber} — {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Report Dossier Type *
              </label>
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value as ReportType)}
                className="w-full bg-[#060911] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/60 transition"
              >
                <option value="COMPLETE_FORENSIC_REPORT">
                  Complete Judicial Forensic Dossier (Unified)
                </option>
                <option value="CASE_SUMMARY">Case Briefing Summary Report</option>
                <option value="EVIDENCE_REPORT">Evidence Artifacts & SHA-256 Registry</option>
                <option value="CHAIN_OF_CUSTODY_REPORT">Chain of Custody Certification</option>
                <option value="BLOCKCHAIN_VERIFICATION_REPORT">
                  PoA Ledger Cryptographic Certificate
                </option>
                <option value="AI_ANALYSIS_REPORT">
                  Forensic Signal & Media Authenticity Findings
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Official Report Title *
            </label>
            <input
              type="text"
              placeholder="e.g., Forensic Evidence Admissibility & Hash Verification Dossier"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full bg-[#060911] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Executive Findings & Examiner Certification Summary *
            </label>
            <textarea
              rows={3}
              placeholder="Enter examiner conclusions, methodology summary, and chain-of-custody attestation..."
              value={reportSummary}
              onChange={(e) => setReportSummary(e.target.value)}
              className="w-full bg-[#060911] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleGenerateAndPrint}
              disabled={!selectedCaseId}
              className="h-9 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs shadow-sm transition inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Compile & Print Dossier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Generated Reports Archive */}
      <div className="bg-[#0C101D] border border-white/[0.08] rounded-2xl overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
        <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
          <h2 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            Compiled Forensic Reports & Dossiers ({reports.length})
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            IMMUTABLE ARCHIVE
          </span>
        </div>

        {reports.length === 0 ? (
          <div className="p-12 text-center">
            <FileCheck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white mb-1">No Reports Compiled Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Select a case dossier above to compile and print court-admissible forensic documentation.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-white/[0.02]">
                  <th className="py-3.5 px-4">Report #</th>
                  <th className="py-3.5 px-4">Case</th>
                  <th className="py-3.5 px-4">Title & Type</th>
                  <th className="py-3.5 px-4">Evidence Items</th>
                  <th className="py-3.5 px-4">Author</th>
                  <th className="py-3.5 px-4">Generated At</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {reports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4 font-mono text-cyan-400 font-bold">
                      {rep.reportNumber}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-200">
                      {rep.caseNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{rep.title}</div>
                      <div className="mt-1">
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {rep.reportType.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {rep.evidenceCount} item(s)
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-white font-medium">{rep.authorName}</div>
                      <div className="text-[10px] font-mono text-slate-500">{rep.authorRole}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(rep.generatedAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handlePrintExisting(rep)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 font-medium text-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print / Export
                      </button>
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

export default ReportsPage;
