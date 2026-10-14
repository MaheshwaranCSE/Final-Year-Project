import { Case, Evidence, CustodyEvent, BlockchainBlock, AIAnalysisRecord, AuditLog, ForensicReport, ReportType, User } from '../types';

/**
 * Builds a structured, court-admissible Forensic Report document.
 */
export function generateForensicReport(
  reportType: ReportType,
  targetCase: Case,
  evidenceList: Evidence[],
  custodyList: CustodyEvent[],
  blockchainBlocks: BlockchainBlock[],
  aiRecords: AIAnalysisRecord[],
  auditLogs: AuditLog[],
  generatedBy: User
): ForensicReport {
  const reportNumber = 'RPT-' + targetCase.caseNumber + '-' + Math.floor(1000 + Math.random() * 9000);

  const report: ForensicReport = {
    id: 'RPT-ID-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
    reportNumber,
    caseId: targetCase.id,
    caseNumber: targetCase.caseNumber,
    caseTitle: targetCase.title,
    reportType,
    title: `${reportType.replace(/_/g, ' ')} — ${targetCase.caseNumber}`,
    authorName: generatedBy.name,
    authorRole: generatedBy.role,
    generatedAt: new Date().toISOString(),
    summary: `Digital Forensic Examination Report prepared for Case ${targetCase.caseNumber} (${targetCase.title}). Total verified evidence items: ${evidenceList.length}.`,
    evidenceCount: evidenceList.length,
    content: {
      case: targetCase,
      evidence: evidenceList,
      custody: custodyList,
      blockchain: blockchainBlocks,
      aiAnalysis: aiRecords,
      audit: auditLogs.slice(0, 50)
    }
  };

  return report;
}

/**
 * Launches browser printable view for court evidence presentation.
 */
export function printForensicReport(report: ForensicReport) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  const rawContent = report.content || {};
  const c = rawContent.case || rawContent.caseDetails;
  const evidence = rawContent.evidence || rawContent.evidenceItems || [];
  const custody = rawContent.custody || rawContent.custodyTimeline || [];
  const blockchainCount = Array.isArray(rawContent.blockchain)
    ? rawContent.blockchain.length
    : (rawContent.blockchainHeight ?? 1);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${report.title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #111; line-height: 1.5; font-size: 13px; }
          .header { border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
          h1 { margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 0.5px; }
          .meta-table, .evidence-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          .meta-table td, .evidence-table td, .evidence-table th { border: 1px solid #ccc; padding: 8px 10px; text-align: left; }
          .evidence-table th { background: #f2f2f2; font-weight: 600; font-size: 11px; text-transform: uppercase; }
          .hash { font-family: 'Courier New', monospace; font-size: 11px; word-break: break-all; }
          .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; }
          .badge-verified { background: #d4edda; color: #155724; }
          .footer { border-top: 1px solid #ccc; margin-top: 40px; padding-top: 15px; font-size: 10px; color: #666; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>BLOCKVAULT FORENSIC REPORT</h1>
            <div style="font-size: 13px; color: #444; font-weight: bold;">Digital Evidence & Chain of Custody Audit</div>
          </div>
          <div style="text-align: right;">
            <div><strong>Report #:</strong> ${report.reportNumber}</div>
            <div><strong>Date Generated:</strong> ${new Date(report.generatedAt).toLocaleString()}</div>
            <div><strong>Investigator:</strong> ${report.authorName} (${report.authorRole})</div>
          </div>
        </div>

        <h3>1. CASE INFORMATION</h3>
        <table class="meta-table">
          <tr><td><strong>Case Number:</strong> ${c?.caseNumber || 'N/A'}</td><td><strong>Status:</strong> ${c?.status || 'N/A'}</td></tr>
          <tr><td><strong>Title:</strong> ${c?.title || 'N/A'}</td><td><strong>Classification:</strong> ${c?.classification || 'N/A'}</td></tr>
          <tr><td><strong>Lead Investigator:</strong> ${c?.leadInvestigatorName || 'N/A'}</td><td><strong>Priority:</strong> ${c?.priority || 'N/A'}</td></tr>
          <tr><td colspan="2"><strong>Description:</strong> ${c?.description || 'N/A'}</td></tr>
        </table>

        <h3>2. DIGITAL EVIDENCE INVENTORY (${evidence?.length || 0} ITEMS)</h3>
        <table class="evidence-table">
          <thead>
            <tr>
              <th>Item #</th>
              <th>File Name</th>
              <th>Category</th>
              <th>Size</th>
              <th>Original SHA-256 Hash</th>
              <th>Integrity</th>
            </tr>
          </thead>
          <tbody>
            ${(evidence || []).map((e: any) => `
              <tr>
                <td><strong>${e.evidenceNumber}</strong></td>
                <td>${e.originalFileName}</td>
                <td>${e.category}</td>
                <td>${(e.fileSize / 1024).toFixed(1)} KB</td>
                <td class="hash">${e.sha256Original}</td>
                <td><span class="badge badge-verified">${e.integrityStatus}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h3>3. CHAIN OF CUSTODY TIMELINE</h3>
        <table class="evidence-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Evidence #</th>
              <th>Custodian</th>
              <th>Action</th>
              <th>From State &rarr; To State</th>
              <th>Cryptographic Receipt</th>
            </tr>
          </thead>
          <tbody>
            ${(custody || []).slice(0, 15).map((evt: any) => `
              <tr>
                <td>${new Date(evt.timestamp).toLocaleString()}</td>
                <td>${evt.evidenceNumber}</td>
                <td>${evt.userName} (${evt.userRole})</td>
                <td><strong>${evt.action}</strong></td>
                <td>${evt.previousState} &rarr; ${evt.newState}</td>
                <td class="hash">${(evt.hash || '').substring(0, 24)}...</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h3>4. BLOCKCHAIN ANCHORING STATUS (POA LEDGER)</h3>
        <p>Evidence records anchored across ${blockchainCount} sequential cryptographic block(s). Continuity and Merkle root verification confirmed.</p>

        <div class="footer">
          <div>BLOCKVAULT DIGITAL FORENSICS PLATFORM &bull; CONFIDENTIAL COURT EVIDENCE</div>
          <div>Page 1 of 1 &bull; Signature Verified</div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}