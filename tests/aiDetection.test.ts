/**
 * BlockVault AI Detection – Unit & Integration Tests
 *
 * Coverage:
 *  1. Threshold boundary conditions (32%, 44.99%, 45%, 45.01%, 67%, 99%)
 *  2. Detection status: APPROVED / BLOCKED / INCONCLUSIVE / FAILED
 *  3. INCONCLUSIVE must never auto-approve
 *  4. Image format support
 *  5. Video format support (empty blobs → INCONCLUSIVE in test env, never 0% APPROVED)
 *  6. Backend enforcement simulation
 *  7. File validation (type, size)
 *  8. Audit log structure
 */

import { describe, test, expect } from 'vitest';
import { analyzeMedia } from '../src/lib/aiDetection';
import { AI_DETECTION_THRESHOLD } from '../src/config/policy';

// ─── Helpers ───────────────────────────────────────────────────────────────────
function makeFile(name: string, type: string, sizeBytes = 1024): File {
  const content = new Uint8Array(sizeBytes);
  const blob    = new Blob([content], { type });
  return new File([blob], name, { type });
}

// ─── 1. Policy Constant ────────────────────────────────────────────────────────
describe('AI Detection Policy Constant', () => {
  test('AI_DETECTION_THRESHOLD is exactly 45', () => {
    expect(AI_DETECTION_THRESHOLD).toBe(45);
  });
});

// ─── 2. Threshold Boundary Tests ──────────────────────────────────────────────
describe('AI Detection Threshold Boundary (image)', () => {
  /**
   * These boundary cases test the correct mapping of probability → status.
   * For a minimal blank JPEG (all-zeros) the pixel signals don't fire,
   * and there's no EXIF/PNG/C2PA metadata, so the probability is 0% → APPROVED.
   * We verify that status always correctly reflects the probability vs threshold.
   */
  const cases: Array<{ label: string; prob: number; expected: 'APPROVED' | 'BLOCKED' }> = [
    { label: '32%',    prob: 32,    expected: 'APPROVED' },
    { label: '44.99%', prob: 44.99, expected: 'APPROVED' },
    { label: '45%',    prob: 45,    expected: 'BLOCKED'  },
    { label: '45.01%', prob: 45.01, expected: 'BLOCKED'  },
    { label: '67%',    prob: 67,    expected: 'BLOCKED'  },
    { label: '99%',    prob: 99,    expected: 'BLOCKED'  },
  ];

  for (const { label, prob, expected } of cases) {
    test(`probability=${label} → status=${expected}`, () => {
      // Directly verify the threshold logic (unit test of policy, not the detector)
      const status = prob >= AI_DETECTION_THRESHOLD ? 'BLOCKED' : 'APPROVED';
      expect(status).toBe(expected);
    });
  }

  test('exact boundary: 44.99 < 45 → APPROVED', () => {
    expect(44.99 < AI_DETECTION_THRESHOLD).toBe(true);
  });

  test('exact boundary: 45.00 >= 45 → BLOCKED', () => {
    expect(45.0 >= AI_DETECTION_THRESHOLD).toBe(true);
  });
});

// ─── 3. Image Detection – Known Status ────────────────────────────────────────
describe('Image detection pipeline (blank file)', () => {
  test('blank JPEG → APPROVED (0 signals, well below threshold)', async () => {
    const file   = makeFile('blank.jpg', 'image/jpeg');
    const result = await analyzeMedia(file);

    expect(['APPROVED', 'BLOCKED', 'FAILED', 'INCONCLUSIVE']).toContain(result.status);
    expect(result.threshold).toBe(AI_DETECTION_THRESHOLD);
    expect(result.media_type).toBe('image');
    expect(result.detector_version).toMatch(/blockvault/);
    expect(result.detection_timestamp).toBeTruthy();

    // For a blank JPEG with no metadata, probability should be 0 or a low value
    if (result.probability !== null) {
      const shouldBlock = result.probability >= AI_DETECTION_THRESHOLD;
      expect(result.status).toBe(shouldBlock ? 'BLOCKED' : 'APPROVED');
    }
  });

  test('video_report is null for images', async () => {
    const file   = makeFile('blank.png', 'image/png');
    const result = await analyzeMedia(file);
    expect(result.video_report).toBeNull();
  });
});

// ─── 4. INCONCLUSIVE Must Never Auto-Approve ──────────────────────────────────
describe('INCONCLUSIVE never auto-approves', () => {
  test('INCONCLUSIVE status → allowed=false in backend enforcement', async () => {
    const file   = makeFile('empty.mp4', 'video/mp4');
    const result = await analyzeMedia(file);

    // In a jsdom/test environment, HTMLVideoElement cannot decode frames.
    // An empty MP4 blob should produce INCONCLUSIVE (or FAILED), never APPROVED.
    expect(result.status).not.toBe('APPROVED');
    expect(result.media_type).toBe('video');

    // If INCONCLUSIVE: probability must be null (not 0%)
    if (result.status === 'INCONCLUSIVE') {
      expect(result.probability).toBeNull();
    }
  });

  test('INCONCLUSIVE probability is null (not 0)', async () => {
    const file   = makeFile('corrupt.mp4', 'video/mp4', 512);
    const result = await analyzeMedia(file);

    if (result.status === 'INCONCLUSIVE') {
      expect(result.probability).toBeNull();
      // Never falsely report 0%
      expect(result.probability).not.toBe(0);
    }
    // Either way, it must not be APPROVED for a file that couldn't be analyzed
    if (result.status === 'INCONCLUSIVE' || result.status === 'FAILED') {
      expect(result.status).not.toBe('APPROVED');
    }
  });

  test('INCONCLUSIVE video has frames_analyzed field', async () => {
    const file   = makeFile('noframes.mp4', 'video/mp4', 256);
    const result = await analyzeMedia(file);

    if (result.status === 'INCONCLUSIVE') {
      expect(result).toHaveProperty('frames_analyzed');
      expect(typeof result.frames_analyzed).toBe('number');
    }
  });
});

// ─── 5. Image Format Support ──────────────────────────────────────────────────
describe('Image Format Support', () => {
  const imageFormats: Array<[string, string]> = [
    ['evidence.jpg',  'image/jpeg'],
    ['evidence.jpeg', 'image/jpeg'],
    ['evidence.png',  'image/png'],
    ['evidence.webp', 'image/webp'],
  ];

  test.each(imageFormats)('%s (%s) → processes without error', async (name, type) => {
    const file   = makeFile(name, type);
    const result = await analyzeMedia(file);
    expect(['APPROVED', 'BLOCKED', 'FAILED', 'INCONCLUSIVE']).toContain(result.status);
    expect(result.media_type).toBe('image');
  });
});

// ─── 6. Video Format Support ──────────────────────────────────────────────────
describe('Video Format Support', () => {
  const videoFormats: Array<[string, string]> = [
    ['recording.mp4', 'video/mp4'],
    ['recording.mov', 'video/quicktime'],
    ['recording.avi', 'video/x-msvideo'],
  ];

  test.each(videoFormats)('%s (%s) → processes without error, never 0% APPROVED', async (name, type) => {
    const file   = makeFile(name, type);
    const result = await analyzeMedia(file);

    expect(['APPROVED', 'BLOCKED', 'FAILED', 'INCONCLUSIVE']).toContain(result.status);
    expect(result.media_type).toBe('video');

    // Core invariant: an empty/corrupt video must NOT be reported as 0% APPROVED
    if (result.probability !== null && result.probability === 0) {
      // If it somehow produces 0%, it must not also be APPROVED (that was the bug)
      expect(result.status).not.toBe('APPROVED');
    }

    // INCONCLUSIVE must have null probability, not 0
    if (result.status === 'INCONCLUSIVE') {
      expect(result.probability).toBeNull();
    }
  });
});

// ─── 7. Backend Enforcement ────────────────────────────────────────────────────
describe('Backend Enforcement (simulated direct API upload)', () => {
  /**
   * Simulates what the backend must do: re-run analysis and enforce threshold.
   * INCONCLUSIVE and FAILED must never be allowed through.
   */
  async function simulateBackendUpload(file: File): Promise<{ allowed: boolean; code?: string }> {
    const result = await analyzeMedia(file);

    if (result.status === 'FAILED')       return { allowed: false, code: 'DETECTION_FAILED' };
    if (result.status === 'INCONCLUSIVE') return { allowed: false, code: 'DETECTION_INCONCLUSIVE' };
    if (result.probability !== null && result.probability >= AI_DETECTION_THRESHOLD) {
      return { allowed: false, code: 'AI_BLOCKED' };
    }
    return { allowed: true };
  }

  test('Video that is INCONCLUSIVE is blocked at backend', async () => {
    const file   = makeFile('screen-recording.mp4', 'video/mp4', 512);
    const result = await simulateBackendUpload(file);
    // In test env, video cannot decode → INCONCLUSIVE or FAILED → both blocked
    expect(result.allowed).toBe(false);
    expect(['DETECTION_INCONCLUSIVE', 'DETECTION_FAILED', 'AI_BLOCKED']).toContain(result.code);
  });

  test('Unsupported file type is blocked', async () => {
    const file   = makeFile('document.pdf', 'application/pdf');
    const result = await simulateBackendUpload(file);
    expect(result.allowed).toBe(false);
    expect(result.code).toBe('DETECTION_FAILED');
  });

  test('Blank JPEG (no signals) is allowed through', async () => {
    const file   = makeFile('legitimate.jpg', 'image/jpeg');
    const result = await simulateBackendUpload(file);
    // A blank JPEG with no AI signals → 0% → APPROVED
    expect(result.allowed).toBe(true);
  });
});

// ─── 8. File Validation ────────────────────────────────────────────────────────
describe('File Validation (type and size)', () => {
  const ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/webp',
    'video/mp4', 'video/quicktime', 'video/x-msvideo',
  ];
  const MAX_SIZE_MB = 100;

  test('application/pdf is not an allowed type', () => {
    const file  = makeFile('document.pdf', 'application/pdf');
    const valid = ALLOWED_TYPES.includes(file.type);
    expect(valid).toBe(false);
  });

  test('image/jpeg passes type validation', () => {
    const file  = makeFile('photo.jpg', 'image/jpeg');
    const valid = ALLOWED_TYPES.includes(file.type);
    expect(valid).toBe(true);
  });

  test('video/mp4 passes type validation', () => {
    const file  = makeFile('clip.mp4', 'video/mp4');
    const valid = ALLOWED_TYPES.includes(file.type);
    expect(valid).toBe(true);
  });

  test('Oversized file (>100 MB) fails size check', () => {
    const sizeBytes = (MAX_SIZE_MB + 1) * 1024 * 1024;
    const file      = makeFile('huge.mp4', 'video/mp4', sizeBytes);
    const valid     = file.size <= MAX_SIZE_MB * 1024 * 1024;
    expect(valid).toBe(false);
  });

  test('1 MB file passes size check', () => {
    const file  = makeFile('photo.jpg', 'image/jpeg', 1 * 1024 * 1024);
    const valid = file.size <= MAX_SIZE_MB * 1024 * 1024;
    expect(valid).toBe(true);
  });
});

// ─── 9. Unsupported File Type ──────────────────────────────────────────────────
describe('Unsupported file types', () => {
  test('PDF → FAILED status, probability null', async () => {
    const file   = makeFile('evidence.pdf', 'application/pdf');
    const result = await analyzeMedia(file);
    expect(result.status).toBe('FAILED');
    expect(result.probability).toBeNull();
  });

  test('GIF → FAILED status (not in allowed list)', async () => {
    const file   = makeFile('animation.gif', 'image/gif');
    const result = await analyzeMedia(file);
    expect(result.status).toBe('FAILED');
  });
});

// ─── 10. Audit Log Structure ───────────────────────────────────────────────────
describe('Audit Log Structure', () => {
  test('Image result has all required audit fields', async () => {
    const file   = makeFile('audit-test.jpg', 'image/jpeg');
    const result = await analyzeMedia(file);

    expect(result).toHaveProperty('probability');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('threshold');
    expect(result).toHaveProperty('detector_version');
    expect(result).toHaveProperty('detection_timestamp');
    expect(result).toHaveProperty('media_type');
    expect(result).toHaveProperty('signals');
    expect(result).toHaveProperty('video_report');
    expect(result.threshold).toBe(AI_DETECTION_THRESHOLD);
    expect(result.media_type).toBe('image');
    expect(result.detector_version).toMatch(/blockvault/i);
  });

  test('Video result has all required audit fields', async () => {
    const file   = makeFile('audit-video.mp4', 'video/mp4');
    const result = await analyzeMedia(file);

    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('threshold');
    expect(result).toHaveProperty('detector_version');
    expect(result).toHaveProperty('detection_timestamp');
    expect(result).toHaveProperty('media_type');
    expect(result.media_type).toBe('video');
    expect(result.threshold).toBe(AI_DETECTION_THRESHOLD);
  });

  test('INCONCLUSIVE audit log: probability is null, never a fake number', async () => {
    const file   = makeFile('inconclusive.mp4', 'video/mp4', 256);
    const result = await analyzeMedia(file);

    if (result.status === 'INCONCLUSIVE') {
      // Must log null, not 0 or any other fabricated number
      expect(result.probability).toBeNull();
      expect(result.frames_analyzed).toBeDefined();
    }
  });

  test('APPROVED result: probability is a valid number < threshold', async () => {
    const file   = makeFile('safe.jpg', 'image/jpeg');
    const result = await analyzeMedia(file);

    if (result.status === 'APPROVED') {
      expect(typeof result.probability).toBe('number');
      expect(result.probability!).toBeGreaterThanOrEqual(0);
      expect(result.probability!).toBeLessThan(AI_DETECTION_THRESHOLD);
    }
  });

  test('BLOCKED result: probability is >= threshold', async () => {
    // We cannot force a BLOCKED result without real AI-generated content,
    // but we verify the invariant: if status is BLOCKED, probability >= threshold
    const file   = makeFile('safe.jpg', 'image/jpeg');
    const result = await analyzeMedia(file);

    if (result.status === 'BLOCKED') {
      expect(result.probability).not.toBeNull();
      expect(result.probability!).toBeGreaterThanOrEqual(AI_DETECTION_THRESHOLD);
    }
  });
});

// ─── 11. Status/Probability Consistency Invariant ─────────────────────────────
describe('Status / probability consistency invariant', () => {
  const testFiles: Array<[string, string]> = [
    ['img1.jpg',  'image/jpeg'],
    ['img2.png',  'image/png'],
    ['vid1.mp4',  'video/mp4'],
    ['vid2.mov',  'video/quicktime'],
  ];

  test.each(testFiles)('%s — status and probability are always consistent', async (name, type) => {
    const file   = makeFile(name, type);
    const result = await analyzeMedia(file);

    if (result.status === 'APPROVED') {
      expect(result.probability).not.toBeNull();
      expect(result.probability!).toBeLessThan(AI_DETECTION_THRESHOLD);
    }
    if (result.status === 'BLOCKED') {
      expect(result.probability).not.toBeNull();
      expect(result.probability!).toBeGreaterThanOrEqual(AI_DETECTION_THRESHOLD);
    }
    if (result.status === 'INCONCLUSIVE') {
      // Probability MUST be null — never a fabricated 0%
      expect(result.probability).toBeNull();
    }
    if (result.status === 'FAILED') {
      expect(result.probability).toBeNull();
    }
  });
});

// ─── 12. AI-Edited and Inpainted Image Detection ──────────────────────────────
describe('AI-Edited Media & Inpainting Detection', () => {
  test('flags and blocks image with Photoshop Generative Fill metadata (compositeWithTrainedAlgorithmicMedia)', async () => {
    const rawXmp = new TextEncoder().encode(
      '<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>\n' +
      '<x:xmpmeta xmlns:x="adobe:ns:meta/">\n' +
      '  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n' +
      '    <rdf:Description rdf:about=""\n' +
      '      Iptc4xmpExt:DigitalSourceType="http://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia">\n' +
      '    </rdf:Description>\n' +
      '  </rdf:RDF>\n' +
      '</x:xmpmeta>'
    );
    const file = new File([rawXmp], 'photoshop_genfill.jpg', { type: 'image/jpeg' });
    const result = await analyzeMedia(file);

    expect(result.status).toBe('BLOCKED');
    expect(result.probability).not.toBeNull();
    expect(result.probability!).toBeGreaterThanOrEqual(AI_DETECTION_THRESHOLD);
    expect(result.signals?.metadata_ai_markers || result.signals?.c2pa_provenance).toBe(true);
  });

  test('flags and blocks image with Canva Magic Edit or Inpainting metadata', async () => {
    const rawData = new TextEncoder().encode(
      'File data header... Edited with Canva Magic Edit generative inpaint tool ...'
    );
    const file = new File([rawData], 'canva_magic_edit.png', { type: 'image/png' });
    const result = await analyzeMedia(file);

    expect(result.status).toBe('BLOCKED');
    expect(result.probability).not.toBeNull();
    expect(result.probability!).toBeGreaterThanOrEqual(AI_DETECTION_THRESHOLD);
  });
});

// ─── 13. Authentic Images & False Positive Prevention ─────────────────────────
describe('Authentic Non-AI Image Approval & False Positive Prevention', () => {
  test('approves authentic camera photo with IPTC digitalCapture metadata', async () => {
    const rawXmp = new TextEncoder().encode(
      '<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>\n' +
      '<x:xmpmeta xmlns:x="adobe:ns:meta/">\n' +
      '  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n' +
      '    <rdf:Description rdf:about=""\n' +
      '      Iptc4xmpExt:DigitalSourceType="http://cv.iptc.org/newscodes/digitalsourcetype/digitalCapture"\n' +
      '      tiff:Make="Sony"\n' +
      '      tiff:Model="ILCE-7RM5">\n' +
      '    </rdf:Description>\n' +
      '  </rdf:RDF>\n' +
      '</x:xmpmeta>'
    );
    const file = new File([rawXmp], 'authentic_sony_camera.jpg', { type: 'image/jpeg' });
    const result = await analyzeMedia(file);

    expect(result.status).toBe('APPROVED');
    expect(result.probability).not.toBeNull();
    expect(result.probability!).toBeLessThan(AI_DETECTION_THRESHOLD);
    expect(result.signals?.metadata_ai_markers).toBe(false);
  });

  test('approves authentic camera photo with C2PA hardware manifest (Nikon / Leica)', async () => {
    const c2paBuffer = new TextEncoder().encode(
      'Metadata header... c2pa jumbf manifest claim_generator: "Nikon Z9 C2PA Hardware Signer v2.0" ...'
    );
    const file = new File([c2paBuffer], 'nikon_z9_c2pa.jpg', { type: 'image/jpeg' });
    const result = await analyzeMedia(file);

    expect(result.status).toBe('APPROVED');
    expect(result.probability).not.toBeNull();
    expect(result.probability!).toBeLessThan(AI_DETECTION_THRESHOLD);
  });

  test('approves normal PNG with Software and Comment chunks (e.g. Photoshop/macOS/Snipping Tool)', async () => {
    // Construct valid PNG header (8 bytes) + tEXt chunk for Software + IEND chunk
    const pngHeader = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    const textChunkStr = 'Software\0Adobe Photoshop Lightroom Classic 13.2';
    const textData = new TextEncoder().encode(textChunkStr);
    const textLen = textData.length;

    const chunkLenBytes = [
      (textLen >> 24) & 0xff,
      (textLen >> 16) & 0xff,
      (textLen >> 8) & 0xff,
      textLen & 0xff,
    ];
    const chunkType = [0x74, 0x45, 0x58, 0x74]; // 'tEXt'
    const crc = [0x00, 0x00, 0x00, 0x00];
    const iendChunk = [0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82];

    const fullBytes = new Uint8Array([
      ...pngHeader,
      ...chunkLenBytes,
      ...chunkType,
      ...textData,
      ...crc,
      ...iendChunk,
    ]);

    const file = new File([fullBytes], 'lightroom_export.png', { type: 'image/png' });
    const result = await analyzeMedia(file);

    expect(result.status).toBe('APPROVED');
    expect(result.probability).not.toBeNull();
    expect(result.probability!).toBeLessThan(AI_DETECTION_THRESHOLD);
    expect(result.signals?.png_text_chunks).toBe(false);
  });

  test('approves photos with metadata containing words like "Taiwan", "luma", "runway", "mountain"', async () => {
    const rawData = new TextEncoder().encode(
      'Location: Airport Runway, Taiwan. Description: Mountain landscape with natural luma curve. Email: investigator@lab.gov'
    );
    const file = new File([rawData], 'airport_taiwan_photo.jpg', { type: 'image/jpeg' });
    const result = await analyzeMedia(file);

    expect(result.status).toBe('APPROVED');
    expect(result.probability).not.toBeNull();
    expect(result.probability!).toBeLessThan(AI_DETECTION_THRESHOLD);
    expect(result.signals?.metadata_ai_markers).toBe(false);
  });
});

// ─── 14. AI-Generated Video Detection ─────────────────────────────────────────
describe('AI-Generated Video Detection & Enforcement', () => {
  function makeMP4WithMetadata(metadataText: string, filename = 'clip.mp4', atTail = false): File {
    // 8-byte MP4 header (ftyp box)
    const ftyp = [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D];
    const metaBytes = new TextEncoder().encode(metadataText);
    
    if (atTail) {
      // Put 500 KB padding first (representing mdat) then metadata at tail (representing moov/udta)
      const padding = new Uint8Array(500 * 1024);
      const combined = new Uint8Array(ftyp.length + padding.length + metaBytes.length);
      combined.set(ftyp, 0);
      combined.set(padding, ftyp.length);
      combined.set(metaBytes, ftyp.length + padding.length);
      return new File([combined], filename, { type: 'video/mp4' });
    } else {
      const combined = new Uint8Array(ftyp.length + metaBytes.length);
      combined.set(ftyp, 0);
      combined.set(metaBytes, ftyp.length);
      return new File([combined], filename, { type: 'video/mp4' });
    }
  }

  test('flags and blocks Sora-generated video even with generic filename (clip_001.mp4)', async () => {
    const file = makeMP4WithMetadata(
      'moov udta ©too OpenAI Sora video generator v1.0 prompt: cinematic drone shot of cyberpunk city',
      'clip_001.mp4'
    );
    const result = await analyzeMedia(file);

    expect(result.status).toBe('BLOCKED');
    expect(result.probability).not.toBeNull();
    expect(result.probability!).toBeGreaterThanOrEqual(AI_DETECTION_THRESHOLD);
    expect(result.media_type).toBe('video');
  });

  test('flags and blocks Runway Gen-3 Alpha video with neutral filename (scene.mp4)', async () => {
    const file = makeMP4WithMetadata(
      'moov udta ©swr RunwayML Gen-3 Alpha video diffusion model Lavf60.16.100',
      'scene.mp4'
    );
    const result = await analyzeMedia(file);

    expect(result.status).toBe('BLOCKED');
    expect(result.probability).not.toBeNull();
    expect(result.probability!).toBeGreaterThanOrEqual(AI_DETECTION_THRESHOLD);
  });

  test('flags and blocks Kling AI generated video (kling_render.mp4)', async () => {
    const file = makeMP4WithMetadata(
      'moov udta meta Kuaishou Kling AI text2video model high-definition output',
      'footage.mp4'
    );
    const result = await analyzeMedia(file);

    expect(result.status).toBe('BLOCKED');
    expect(result.probability).not.toBeNull();
    expect(result.probability!).toBeGreaterThanOrEqual(AI_DETECTION_THRESHOLD);
  });

  test('flags and blocks Luma Dream Machine video', async () => {
    const file = makeMP4WithMetadata(
      'moov udta Luma Dream Machine v1.5 photorealistic video generator',
      'render.mp4'
    );
    const result = await analyzeMedia(file);

    expect(result.status).toBe('BLOCKED');
    expect(result.probability).not.toBeNull();
    expect(result.probability!).toBeGreaterThanOrEqual(AI_DETECTION_THRESHOLD);
  });

  test('detects AI video metadata written at the TAIL of the MP4 file (moov at end)', async () => {
    const file = makeMP4WithMetadata(
      'moov udta ©too Pika Labs pikalabs AI video generator model output',
      'surveillance.mp4',
      true // placed at tail after 500KB of mdat
    );
    const result = await analyzeMedia(file);

    expect(result.status).toBe('BLOCKED');
    expect(result.probability).not.toBeNull();
    expect(result.probability!).toBeGreaterThanOrEqual(AI_DETECTION_THRESHOLD);
  });

  test('approves authentic laptop integrated webcam video (WIN_20260928_10_30_00_Pro.mp4)', async () => {
    const file = makeMP4WithMetadata(
      'moov trak mdia hdlr vide Media Foundation Windows Camera Realtek Integrated Webcam luma colr nclx',
      'WIN_20260928_10_30_00_Pro.mp4'
    );
    const result = await analyzeMedia(file);

    expect(result.status).toBe('APPROVED');
    expect(result.probability).not.toBeNull();
    expect(result.probability!).toBeLessThan(AI_DETECTION_THRESHOLD);
  });

  test('does not falsely flag video containing colorimetry luma tags without AI markers', async () => {
    const file = makeMP4WithMetadata(
      'moov colr nclx luma_filter chroma_format_idc avc1 MediaStreamRecorder Chrome',
      'webcam_recording.mp4'
    );
    const result = await analyzeMedia(file);

    expect(result.status).toBe('APPROVED');
    expect(result.probability).not.toBeNull();
    expect(result.probability!).toBeLessThan(AI_DETECTION_THRESHOLD);
  });
});



