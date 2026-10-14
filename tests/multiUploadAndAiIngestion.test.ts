import { describe, test, expect, beforeEach } from 'vitest';
import { useForensicStore } from '../src/stores/useForensicStore';
import { runForensicMediaAnalysis, computeBinaryMetrics } from '../src/services/aiAnalysisService';
import { Evidence } from '../src/types';

describe('Multi-Modal AI Forensic Media Analysis Algorithm', () => {
  test('detects synthetic generator markers in binary/media buffers', () => {
    const textEncoder = new TextEncoder();
    const syntheticBuffer = textEncoder.encode('prefix data... generated with Midjourney v6 and comfyui prompt metadata ...suffix').buffer;
    
    const metrics = computeBinaryMetrics(syntheticBuffer, 'test_synthetic_art.png');
    expect(metrics.embeddedSuspiciousTokens).toContain('midjourney');
    expect(metrics.embeddedSuspiciousTokens).toContain('comfyui');
  });

  test('computes accurate Shannon entropy for structured vs random data', () => {
    // Highly repetitive data (low entropy)
    const lowEntropyData = new Uint8Array(1024).fill(65).buffer; // all 'A'
    const lowMetrics = computeBinaryMetrics(lowEntropyData, 'repetitive.txt');
    expect(lowMetrics.shannonEntropy).toBe(0);

    // Uniformly distributed byte data (high entropy ~8 bits/byte)
    const randomBytes = new Uint8Array(2048);
    for (let i = 0; i < randomBytes.length; i++) {
      randomBytes[i] = i % 256;
    }
    const highMetrics = computeBinaryMetrics(randomBytes.buffer, 'compressed.bin');
    expect(highMetrics.shannonEntropy).toBeGreaterThan(7.5);
  });

  test('detects magic headers for images and documents', () => {
    // PNG magic header: 89 50 4E 47
    const pngHeader = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00]);
    const pngMetrics = computeBinaryMetrics(pngHeader.buffer, 'capture.png');
    expect(pngMetrics.signatureMatchesExtension).toBe(true);
    expect(pngMetrics.detectedMagicHex).toContain('89504E47');

    // PDF magic header: 25 50 44 46 (%PDF)
    const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x37]);
    const pdfMetrics = computeBinaryMetrics(pdfHeader.buffer, 'warrant.pdf');
    expect(pdfMetrics.signatureMatchesExtension).toBe(true);
    expect(pdfMetrics.detectedMagicHex).toContain('25504446');
  });

  test('runs multi-modal analysis on document evidence', async () => {
    const docData = new TextEncoder().encode('Confidential Forensic Investigation Report content.');
    const file = new File([docData], 'report.pdf', { type: 'application/pdf' });

    const analysis = await runForensicMediaAnalysis(
      file,
      'ev-test-01',
      'EVD-2026-T01',
      'DOCUMENT',
      'Lead Investigator',
      'report.pdf'
    );

    expect(analysis).toBeDefined();
    expect(analysis.evidenceId).toBe('ev-test-01');
    expect(analysis.evidenceNumber).toBe('EVD-2026-T01');
    expect(analysis.mediaType).toBe('DOCUMENT');
    expect(['NO_STRONG_SYNTHETIC_INDICATORS', 'INCONCLUSIVE', 'POTENTIALLY_SYNTHETIC', 'LIKELY_SYNTHETIC']).toContain(analysis.assessment);
    expect(analysis.binaryMetrics).toBeDefined();
    expect(analysis.confidenceScore).toBeGreaterThanOrEqual(0);
  });
});

describe('Store Automated AI Media Detection on Intake', () => {
  beforeEach(() => {
    // Ensure active case exists for evidence attachment
    const store = useForensicStore.getState();
    if (store.cases.length === 0) {
      store.createCase({
        caseNumber: 'CASE-2026-AI-TEST',
        title: 'AI Media Verification Unit Test Case',
        description: 'Test case for automated AI screening during evidence intake',
        type: 'CYBER_INCIDENT',
        priority: 'HIGH',
        classification: 'CONFIDENTIAL',
        leadInvestigatorId: store.currentUser.id,
        leadInvestigatorName: store.currentUser.name,
        supportingInvestigatorIds: [],
        reviewerId: store.currentUser.id,
        reviewerName: store.currentUser.name,
        status: 'ACTIVE',
        accessScope: 'RESTRICTED',
        retentionPeriodYears: 5,
      });
    }
  });

  test('addEvidence executes automated AI screening and attaches assessment & risk', async () => {
    const store = useForensicStore.getState();
    const testCase = store.cases[0];

    const fileContent = new TextEncoder().encode('Authentic sensor digital capture data stream.');
    const file = new File([fileContent], 'sensor_data.log', { type: 'text/plain' });

    const newEvidence: Evidence = {
      id: `ev-ai-auto-${Date.now()}`,
      evidenceNumber: 'EVD-AUTO-AI-01',
      caseId: testCase.id,
      caseNumber: testCase.caseNumber,
      title: 'Sensor Data Stream',
      description: 'Intake test for auto AI detection',
      category: 'DOCUMENT',
      originalFileName: 'sensor_data.log',
      fileSize: file.size,
      mimeType: 'text/plain',
      extension: 'log',
      sourceDevice: 'Physical Workstation Terminal',
      acquisitionMethod: 'PHYSICAL_EXTRACTION',
      acquisitionTool: 'BlockVault Ingestion Suite',
      acquisitionNotes: 'Automated test acquisition',
      collectedBy: store.currentUser.name,
      collectionDate: new Date().toISOString(),
      collectionLocation: 'Cyber Lab',
      sha256Original: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      sha256Current: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      integrityStatus: 'VERIFIED',
      lastVerifiedAt: new Date().toISOString(),
      isEncrypted: true,
      encryptionAlgorithm: 'AES-256-GCM',
      storageObjectKey: `vault/${testCase.caseNumber}/EVD-AUTO-AI-01/sensor_data.log.enc`,
      currentVersion: 1,
      versions: [],
      derivatives: [],
      metadata: {},
      aiAnalysisStatus: 'NOT_ANALYZED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { evidence: enriched, aiRecord } = await store.addEvidence(newEvidence, file, { autoAiScan: true });

    expect(enriched).toBeDefined();
    expect(enriched.aiAnalysisStatus).toBe('COMPLETED');
    expect(enriched.aiAssessment).toBeDefined();
    expect(enriched.aiConfidence).toBeGreaterThanOrEqual(0);
    expect(enriched.aiRiskLevel).toBeDefined();
    expect(enriched.aiAnalysisId).toBeDefined();
    expect(aiRecord).toBeDefined();

    // Verify AI analysis record was stored in state
    const latestAiRecords = useForensicStore.getState().aiRecords;
    expect(latestAiRecords.some((r) => r.evidenceNumber === 'EVD-AUTO-AI-01')).toBe(true);

    // Verify ANALYZED custody event was created
    const latestCustody = useForensicStore.getState().custodyEvents;
    expect(latestCustody.some((c) => c.evidenceNumber === 'EVD-AUTO-AI-01' && c.action === 'ANALYZED')).toBe(true);
  });

  test('addEvidence generates IntegrityAlert when synthetic media token is detected', async () => {
    const store = useForensicStore.getState();
    const testCase = store.cases[0];

    // Create file containing synthetic generator token
    const syntheticData = new TextEncoder().encode('Header bytes... generated with Stable Diffusion and Midjourney prompt payload.');
    const file = new File([syntheticData], 'deepfake_evidence.png', { type: 'image/png' });

    const newEvidence: Evidence = {
      id: `ev-ai-synthetic-${Date.now()}`,
      evidenceNumber: 'EVD-SYNTHETIC-FLAG',
      caseId: testCase.id,
      caseNumber: testCase.caseNumber,
      title: 'Flagged AI Deepfake Media',
      description: 'Intake test for synthetic media alert trigger',
      category: 'DOCUMENT',
      originalFileName: 'deepfake_evidence.png',
      fileSize: file.size,
      mimeType: 'image/png',
      extension: 'png',
      sourceDevice: 'Seized USB Drive',
      acquisitionMethod: 'PHYSICAL_EXTRACTION',
      acquisitionTool: 'BlockVault Ingestion Suite',
      acquisitionNotes: 'Synthetic media detection test',
      collectedBy: store.currentUser.name,
      collectionDate: new Date().toISOString(),
      collectionLocation: 'Cyber Lab',
      sha256Original: 'a'.repeat(64),
      sha256Current: 'a'.repeat(64),
      integrityStatus: 'VERIFIED',
      lastVerifiedAt: new Date().toISOString(),
      isEncrypted: true,
      encryptionAlgorithm: 'AES-256-GCM',
      storageObjectKey: `vault/${testCase.caseNumber}/EVD-SYNTHETIC-FLAG/deepfake_evidence.png.enc`,
      currentVersion: 1,
      versions: [],
      derivatives: [],
      metadata: {},
      aiAnalysisStatus: 'NOT_ANALYZED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Since enforceAiRejection is active by default, addEvidence rejects and refuses upload
    await expect(
      store.addEvidence(newEvidence, file, { autoAiScan: true })
    ).rejects.toThrow(/AI Evidence Rejection/);

    // Verify the synthetic item was BLOCKED and NOT added to active evidence
    const currentEvidence = useForensicStore.getState().evidence;
    expect(currentEvidence.some((e) => e.evidenceNumber === 'EVD-SYNTHETIC-FLAG')).toBe(false);

    // Verify IntegrityAlert was created documenting the rejection
    const latestAlerts = useForensicStore.getState().alerts;
    const alert = latestAlerts.find((a) => a.evidenceNumber === 'EVD-SYNTHETIC-FLAG');
    expect(alert).toBeDefined();
    expect(alert?.severity).toBe('CRITICAL');
    expect(alert?.message).toContain('AI EVIDENCE REJECTED');
  });

  test('detects and blocks AI-edited image with Photoshop Generative Fill or inpainting metadata', async () => {
    const store = useForensicStore.getState();
    const testCase = store.cases[0];

    // Simulate an image with camera hardware EXIF that was edited using Photoshop Generative Fill
    // (Contains standard IPTC DigitalSourceType compositeWithTrainedAlgorithmicMedia)
    const rawXmpData = new TextEncoder().encode(
      '<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>\n' +
      '<x:xmpmeta xmlns:x="adobe:ns:meta/">\n' +
      '  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n' +
      '    <rdf:Description rdf:about=""\n' +
      '      xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/"\n' +
      '      xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/"\n' +
      '      Iptc4xmpExt:DigitalSourceType="http://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia"\n' +
      '      photoshop:Credit="Adobe Firefly Generative Fill">\n' +
      '    </rdf:Description>\n' +
      '  </rdf:RDF>\n' +
      '</x:xmpmeta>'
    );
    const file = new File([rawXmpData], 'edited_scene_photo.jpg', { type: 'image/jpeg' });

    // 1. Direct analysis test
    const analysis = await runForensicMediaAnalysis(
      file,
      'ev-test-ai-edit',
      'EVD-2026-EDITED',
      'IMAGE',
      'Forensic Examiner',
      'edited_scene_photo.jpg'
    );
    expect(analysis.assessment).toBe('LIKELY_SYNTHETIC');
    expect(analysis.riskLevel).toBe('CRITICAL');
    expect(analysis.confidenceScore).toBeGreaterThanOrEqual(85);
    expect(
      analysis.indicators.some(
        (i) => i.detected && (i.name.includes('Generative') || i.name.includes('AI'))
      )
    ).toBe(true);

    // 2. Intake rejection test (must be blocked from upload)
    const newEvidence: Evidence = {
      id: `ev-ai-edit-${Date.now()}`,
      evidenceNumber: 'EVD-AI-EDIT-BLOCK',
      caseId: testCase.id,
      caseNumber: testCase.caseNumber,
      title: 'Tampered Scene Photo with Generative Fill',
      description: 'Image with localized generative fill modification',
      category: 'IMAGE',
      originalFileName: 'edited_scene_photo.jpg',
      fileSize: file.size,
      mimeType: 'image/jpeg',
      extension: 'jpg',
      sourceDevice: 'Suspect Mobile Phone',
      acquisitionMethod: 'PHYSICAL_EXTRACTION',
      acquisitionTool: 'BlockVault Ingestion Suite',
      acquisitionNotes: 'AI edit test',
      collectedBy: store.currentUser.name,
      collectionDate: new Date().toISOString(),
      collectionLocation: 'Crime Lab',
      sha256Original: 'c'.repeat(64),
      sha256Current: 'c'.repeat(64),
      integrityStatus: 'VERIFIED',
      lastVerifiedAt: new Date().toISOString(),
      isEncrypted: true,
      encryptionAlgorithm: 'AES-256-GCM',
      storageObjectKey: `vault/${testCase.caseNumber}/EVD-AI-EDIT-BLOCK/edited_scene_photo.jpg.enc`,
      currentVersion: 1,
      versions: [],
      derivatives: [],
      metadata: {},
      aiAnalysisStatus: 'NOT_ANALYZED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await expect(
      store.addEvidence(newEvidence, file, { autoAiScan: true })
    ).rejects.toThrow(/AI Evidence Rejection/);

    // Ensure it was not added to the evidence list
    expect(useForensicStore.getState().evidence.some((e) => e.evidenceNumber === 'EVD-AI-EDIT-BLOCK')).toBe(false);

    // Ensure a Critical alert was generated
    const editAlert = useForensicStore.getState().alerts.find((a) => a.evidenceNumber === 'EVD-AI-EDIT-BLOCK');
    expect(editAlert).toBeDefined();
    expect(editAlert?.severity).toBe('CRITICAL');
  });

  test('flags and blocks mobile AI tools (e.g. FaceApp, Remini, Object Eraser)', async () => {
    const mobileAiData = new TextEncoder().encode(
      'Binary capture data... software: FaceApp AI Editor / object eraser generative fill applied ...'
    );
    const file = new File([mobileAiData], 'faceapp_retouch.jpg', { type: 'image/jpeg' });

    const analysis = await runForensicMediaAnalysis(
      file,
      'ev-test-mobile-ai',
      'EVD-2026-MOBILE-AI',
      'IMAGE',
      'Forensic Examiner',
      'faceapp_retouch.jpg'
    );

    expect(analysis.assessment).toBe('LIKELY_SYNTHETIC');
    expect(analysis.confidenceScore).toBeGreaterThanOrEqual(85);
    expect(analysis.indicators.some((i) => i.detected && (i.name.includes('Generative') || i.name.includes('AI')))).toBe(true);
  });

  test('addEvidence successfully ingests authentic camera photos without false positives', async () => {
    const store = useForensicStore.getState();
    const testCase = store.cases[0];

    // Simulate authentic camera JPEG with digitalCapture IPTC metadata and valid JPEG magic header (FF D8 FF E1)
    const jpegHeader = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE1, 0x00, 0x20]);
    const xmpBytes = new TextEncoder().encode(
      '<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>\n' +
      '<x:xmpmeta xmlns:x="adobe:ns:meta/">\n' +
      '  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n' +
      '    <rdf:Description rdf:about=""\n' +
      '      Iptc4xmpExt:DigitalSourceType="http://cv.iptc.org/newscodes/digitalsourcetype/digitalCapture"\n' +
      '      tiff:Make="Canon"\n' +
      '      tiff:Model="EOS R5">\n' +
      '    </rdf:Description>\n' +
      '  </rdf:RDF>\n' +
      '</x:xmpmeta>'
    );
    const combinedBytes = new Uint8Array(jpegHeader.length + xmpBytes.length);
    combinedBytes.set(jpegHeader, 0);
    combinedBytes.set(xmpBytes, jpegHeader.length);

    const file = new File([combinedBytes], 'authentic_crime_scene.jpg', { type: 'image/jpeg' });

    const newEvidence: Evidence = {
      id: `ev-camera-ok-${Date.now()}`,
      evidenceNumber: 'EVD-CAMERA-OK',
      caseId: testCase.id,
      caseNumber: testCase.caseNumber,
      title: 'Authentic Crime Scene Camera Capture',
      description: 'Physical camera capture from investigator Canon EOS R5',
      category: 'IMAGE',
      originalFileName: 'authentic_crime_scene.jpg',
      fileSize: file.size,
      mimeType: 'image/jpeg',
      extension: 'jpg',
      sourceDevice: 'DSLR Camera Body 1',
      acquisitionMethod: 'PHYSICAL_EXTRACTION',
      acquisitionTool: 'BlockVault Ingestion Suite',
      acquisitionNotes: 'Authentic camera intake test',
      collectedBy: store.currentUser.name,
      collectionDate: new Date().toISOString(),
      collectionLocation: 'Crime Scene West',
      sha256Original: 'd'.repeat(64),
      sha256Current: 'd'.repeat(64),
      integrityStatus: 'VERIFIED',
      lastVerifiedAt: new Date().toISOString(),
      isEncrypted: true,
      encryptionAlgorithm: 'AES-256-GCM',
      storageObjectKey: `vault/${testCase.caseNumber}/EVD-CAMERA-OK/authentic_crime_scene.jpg.enc`,
      currentVersion: 1,
      versions: [],
      derivatives: [],
      metadata: {},
      aiAnalysisStatus: 'NOT_ANALYZED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { evidence: ingested, aiRecord } = await store.addEvidence(newEvidence, file, { autoAiScan: true });

    expect(ingested.aiAnalysisStatus).toBe('COMPLETED');
    expect(ingested.aiAssessment).toBe('NO_STRONG_SYNTHETIC_INDICATORS');
    expect(aiRecord).toBeDefined();
    expect(aiRecord?.assessment).toBe('NO_STRONG_SYNTHETIC_INDICATORS');
    expect(aiRecord?.confidenceScore).toBeLessThan(45);
    expect(useForensicStore.getState().evidence.some((e) => e.evidenceNumber === 'EVD-CAMERA-OK')).toBe(true);
  });

  test('flags and blocks AI-generated video during intake screening (EVD-AI-VIDEO-BLOCK)', async () => {
    const store = useForensicStore.getState();
    const testCase = store.cases[0];

    const ftyp = [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D];
    const metaBytes = new TextEncoder().encode(
      'moov udta ©too OpenAI Sora video generator v1.0 prompt: realistic street scene'
    );
    const combined = new Uint8Array(ftyp.length + metaBytes.length);
    combined.set(ftyp, 0);
    combined.set(metaBytes, ftyp.length);

    const file = new File([combined], 'suspect_sora_video.mp4', { type: 'video/mp4' });

    const newEvidence: Evidence = {
      id: `ev-ai-video-${Date.now()}`,
      evidenceNumber: 'EVD-AI-VIDEO-BLOCK',
      caseId: testCase.id,
      caseNumber: testCase.caseNumber,
      title: 'AI Generated Deepfake Video Evidence',
      description: 'Video synthesized using text-to-video AI generator',
      category: 'VIDEO',
      originalFileName: 'suspect_sora_video.mp4',
      fileSize: file.size,
      mimeType: 'video/mp4',
      extension: 'mp4',
      sourceDevice: 'Social Media Cloud Download',
      acquisitionMethod: 'NETWORK_CAPTURE',
      acquisitionTool: 'BlockVault Ingestion Suite',
      acquisitionNotes: 'AI video intake rejection test',
      collectedBy: store.currentUser.name,
      collectionDate: new Date().toISOString(),
      collectionLocation: 'Cyber Lab',
      sha256Original: 'e'.repeat(64),
      sha256Current: 'e'.repeat(64),
      integrityStatus: 'VERIFIED',
      lastVerifiedAt: new Date().toISOString(),
      isEncrypted: true,
      encryptionAlgorithm: 'AES-256-GCM',
      storageObjectKey: `vault/${testCase.caseNumber}/EVD-AI-VIDEO-BLOCK/suspect_sora_video.mp4.enc`,
      currentVersion: 1,
      versions: [],
      derivatives: [],
      metadata: {},
      aiAnalysisStatus: 'NOT_ANALYZED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await expect(
      store.addEvidence(newEvidence, file, { autoAiScan: true })
    ).rejects.toThrow(/AI Evidence Rejection/);

    expect(useForensicStore.getState().evidence.some((e) => e.evidenceNumber === 'EVD-AI-VIDEO-BLOCK')).toBe(false);
  });

  test('allows and approves authentic laptop webcam video during intake screening (EVD-WEBCAM-OK)', async () => {
    const store = useForensicStore.getState();
    const testCase = store.cases[0];

    const ftyp = new Uint8Array([
      0x00, 0x00, 0x00, 0x20,
      0x66, 0x74, 0x79, 0x70,
      0x69, 0x73, 0x6F, 0x6D,
      0x00, 0x00, 0x02, 0x00,
      0x69, 0x73, 0x6F, 0x6D,
      0x69, 0x73, 0x6F, 0x32,
      0x61, 0x76, 0x63, 0x31,
      0x6D, 0x70, 0x34, 0x31,
    ]);
    const cameraMeta = new TextEncoder().encode(
      'moov mvhd trak mdia hdlr vide Media Foundation Windows Camera Realtek Integrated Webcam colr nclx luma'
    );
    const combined = new Uint8Array(ftyp.length + cameraMeta.length);
    combined.set(ftyp, 0);
    combined.set(cameraMeta, ftyp.length);

    const file = new File([combined], 'WIN_20260928_10_30_00_Pro.mp4', { type: 'video/mp4' });

    const newEvidence: Evidence = {
      id: `ev-cam-video-${Date.now()}`,
      evidenceNumber: 'EVD-WEBCAM-OK',
      caseId: testCase.id,
      caseNumber: testCase.caseNumber,
      title: 'Integrated Laptop Camera Interview Recording',
      description: 'Interview recorded using laptop integrated camera',
      category: 'VIDEO',
      originalFileName: 'WIN_20260928_10_30_00_Pro.mp4',
      fileSize: file.size,
      mimeType: 'video/mp4',
      extension: 'mp4',
      sourceDevice: 'Dell Integrated Webcam',
      acquisitionMethod: 'DIRECT_ACQUISITION',
      acquisitionTool: 'BlockVault Ingestion Suite',
      acquisitionNotes: 'Laptop integrated webcam recording test',
      collectedBy: store.currentUser.name,
      collectionDate: new Date().toISOString(),
      collectionLocation: 'Interrogation Room B',
      sha256Original: 'c'.repeat(64),
      sha256Current: 'c'.repeat(64),
      integrityStatus: 'VERIFIED',
      lastVerifiedAt: new Date().toISOString(),
      isEncrypted: true,
      encryptionAlgorithm: 'AES-256-GCM',
      storageObjectKey: `vault/${testCase.caseNumber}/EVD-WEBCAM-OK/WIN_20260928_10_30_00_Pro.mp4.enc`,
      currentVersion: 1,
      versions: [],
      derivatives: [],
      metadata: {},
      aiAnalysisStatus: 'NOT_ANALYZED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await store.addEvidence(newEvidence, file, { autoAiScan: true });

    expect(result.evidence.evidenceNumber).toBe('EVD-WEBCAM-OK');
    expect(result.aiRecord).toBeDefined();
    expect(result.aiRecord?.assessment).toBe('NO_STRONG_SYNTHETIC_INDICATORS');
    expect(result.aiRecord?.confidenceScore).toBeLessThan(25);
    expect(useForensicStore.getState().evidence.some((e) => e.evidenceNumber === 'EVD-WEBCAM-OK')).toBe(true);
  });

  test('addEvidence skips AI screening when autoAiScan is explicitly disabled', async () => {
    const store = useForensicStore.getState();
    const testCase = store.cases[0];

    const fileContent = new TextEncoder().encode('Regular raw archive contents.');
    const file = new File([fileContent], 'raw_archive.tar', { type: 'application/x-tar' });

    const newEvidence: Evidence = {
      id: `ev-ai-skip-${Date.now()}`,
      evidenceNumber: 'EVD-SKIP-AI',
      caseId: testCase.id,
      caseNumber: testCase.caseNumber,
      title: 'Raw Archive Binary',
      description: 'Intake test skipping AI screening',
      category: 'ARCHIVE',
      originalFileName: 'raw_archive.tar',
      fileSize: file.size,
      mimeType: 'application/x-tar',
      extension: 'tar',
      sourceDevice: 'Server Backup Drive',
      acquisitionMethod: 'LOGICAL_IMAGE',
      acquisitionTool: 'BlockVault Ingestion Suite',
      acquisitionNotes: 'Skipped AI test',
      collectedBy: store.currentUser.name,
      collectionDate: new Date().toISOString(),
      collectionLocation: 'Data Center',
      sha256Original: 'b'.repeat(64),
      sha256Current: 'b'.repeat(64),
      integrityStatus: 'VERIFIED',
      lastVerifiedAt: new Date().toISOString(),
      isEncrypted: true,
      encryptionAlgorithm: 'AES-256-GCM',
      storageObjectKey: `vault/${testCase.caseNumber}/EVD-SKIP-AI/raw_archive.tar.enc`,
      currentVersion: 1,
      versions: [],
      derivatives: [],
      metadata: {},
      aiAnalysisStatus: 'NOT_ANALYZED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { evidence: enriched, aiRecord } = await store.addEvidence(newEvidence, file, { autoAiScan: false });

    expect(enriched.aiAnalysisStatus).toBe('NOT_ANALYZED');
    expect(aiRecord).toBeUndefined();
  });
});

describe('Multi-File Intake Category Detection & Tagging Logic', () => {
  test('correctly identifies media categories by MIME type and filename extension', () => {
    function detectCategory(name: string, type: string) {
      if (type.startsWith('image/')) return 'IMAGE';
      if (type.startsWith('video/')) return 'VIDEO';
      if (type.startsWith('audio/')) return 'AUDIO';
      if (/\.(zip|tar|gz|7z|rar)$/i.test(name)) return 'ARCHIVE';
      if (/\.(iso|dmg|e01|raw|dd|img)$/i.test(name)) return 'DISK_IMAGE';
      return 'DOCUMENT';
    }

    expect(detectCategory('scene_photo.jpg', 'image/jpeg')).toBe('IMAGE');
    expect(detectCategory('diagram.png', 'image/png')).toBe('IMAGE');
    expect(detectCategory('cctv_hallway.mp4', 'video/mp4')).toBe('VIDEO');
    expect(detectCategory('surveillance.mov', 'video/quicktime')).toBe('VIDEO');
    expect(detectCategory('wiretap_audio.wav', 'audio/wav')).toBe('AUDIO');
    expect(detectCategory('voice_memo.mp3', 'audio/mpeg')).toBe('AUDIO');
    expect(detectCategory('backup_logs.zip', 'application/zip')).toBe('ARCHIVE');
    expect(detectCategory('harddrive_clone.E01', 'application/octet-stream')).toBe('DISK_IMAGE');
    expect(detectCategory('warrant.pdf', 'application/pdf')).toBe('DOCUMENT');
    expect(detectCategory('witness_statement.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('DOCUMENT');
  });

  test('auto-sequences exhibit numbers for multi-file batches', () => {
    const base = 'EVD-2026-088';
    const files = ['photo1.jpg', 'photo2.jpg', 'audio.wav'];
    const tagged = files.map((_, idx) => `${base}-${String(idx + 1).padStart(2, '0')}`);

    expect(tagged).toEqual(['EVD-2026-088-01', 'EVD-2026-088-02', 'EVD-2026-088-03']);
  });
});
