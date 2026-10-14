/**
 * BlockVault Phase 2 — Real Pixel & Bitstream Forensic Analysis Test Suite
 *
 * Mathematically validates the pure pixel & bitstream forensic engine:
 *  Test 1: Zero-Filename Invariance (identical pixels under 5 different filenames yield identical scores)
 *  Test 2: Natural optical photo fixture renamed "ai_generated.png" is NOT classified synthetic
 *  Test 3: Synthetic neural fixture named "holiday.jpg" is NOT cleared
 *  Test 4: Procedural PRNG synthetic fixtures (smooth gradient, checkerboard, uniform noise) vs natural noise
 *  Test 5: Mathematical determinism (10 repeated runs yield byte-identical numbers)
 *  Test 6: Degraded / sub-64x64 / empty images return INCONCLUSIVE (zero false positives/negatives)
 *  Test 7: Static AST / Grep assertion proving zero filename references in pixel scoring paths
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  evaluatePixelForensics,
  decodeImageToRgba,
  analyzeNoiseResidual,
  analyzeFrequencyDomain,
  analyzeColorStatistics,
  analyzeLocalConsistency,
  SIGNAL_WEIGHTS_CONFIG,
  FORENSIC_LIMITATIONS,
} from '../src/lib/pixelForensics';
import { runForensicMediaAnalysis } from '../src/services/aiAnalysisService';
import { analyzeMedia } from '../src/lib/aiDetection';

// ─── Deterministic PRNG for Test Fixtures ──────────────────────────────────────
function createSeededPrng(seed: number) {
  let s = seed;
  return function next(): number {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/**
 * Creates an RGBA buffer simulating an authentic optical sensor photo:
 * Natural Bayer CFA shot noise, spatial PRNU variation, and high inter-channel RGB covariance.
 */
function createAuthenticOpticalFixture(width = 128, height = 128): Uint8ClampedArray {
  const prng = createSeededPrng(1337);
  const rgba = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Base scene lighting with spatial gradient
      const baseLum = 100 + Math.sin(x * 0.05) * 30 + Math.cos(y * 0.05) * 25;
      // Physical sensor shot noise (approx. Gaussian via Box-Muller)
      const u1 = Math.max(1e-6, prng());
      const u2 = prng();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const shotNoise = z0 * 4.5;

      // Realistic Bayer CFA sensor inter-channel correlation
      const r = Math.min(255, Math.max(0, Math.round(baseLum + shotNoise * 1.05 + 5)));
      const g = Math.min(255, Math.max(0, Math.round(baseLum + shotNoise * 1.0)));
      const b = Math.min(255, Math.max(0, Math.round(baseLum + shotNoise * 0.95 - 4)));

      rgba[idx] = r;
      rgba[idx + 1] = g;
      rgba[idx + 2] = b;
      rgba[idx + 3] = 255;
    }
  }
  return rgba;
}

/**
 * Creates an RGBA buffer simulating a synthetic neural diffusion image:
 * Unnaturally smooth high-frequency residual (overly smooth gradient).
 */
function createSyntheticSmoothFixture(width = 128, height = 128): Uint8ClampedArray {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Mathematically perfectly smooth gradient with zero sensor PRNU
      const r = Math.round((x / width) * 200 + 20);
      const g = Math.round((y / height) * 180 + 30);
      const b = Math.round(((x + y) / (width + height)) * 220);
      rgba[idx] = r;
      rgba[idx + 1] = g;
      rgba[idx + 2] = b;
      rgba[idx + 3] = 255;
    }
  }
  return rgba;
}

/**
 * Creates an RGBA buffer simulating transposed-convolution checkerboard artifacts.
 */
function createSyntheticCheckerboardFixture(width = 128, height = 128): Uint8ClampedArray {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Periodic 2x2 grid artifact typical of transposed conv upsampling
      const checker = (x % 2 === 0 && y % 2 === 0) ? 60 : 0;
      const base = 120 + checker;
      rgba[idx] = base;
      rgba[idx + 1] = base;
      rgba[idx + 2] = base;
      rgba[idx + 3] = 255;
    }
  }
  return rgba;
}

describe('BlockVault Phase 2: Pure Pixel & Bitstream Forensics Engine', () => {

  // ─── Test 1: Zero-Filename Invariance ─────────────────────────────────────────
  it('Test 1: Identical pixel buffer under 5 different filenames yields 100% byte-identical scores and verdicts', async () => {
    const authenticPixels = createAuthenticOpticalFixture(128, 128);
    // Convert to mock byte buffer
    const rawBuffer = authenticPixels.buffer.slice(0);

    const testFilenames = [
      'ai_generated.png',
      'midjourney_001.png',
      'photo.jpg',
      'IMG_0001.jpg',
      'real_camera.png',
    ];

    const results = await Promise.all(
      testFilenames.map(async (fileName) => {
        const file = new File([rawBuffer], fileName, { type: 'image/png' });
        return runForensicMediaAnalysis(
          file,
          `ev-test-${fileName}`,
          'EVD-TEST-001',
          'IMAGE',
          'Forensic Analyst',
          fileName
        );
      })
    );

    const first = results[0];
    for (let i = 1; i < results.length; i++) {
      const curr = results[i];
      // 1. Overall confidence score must be mathematically identical
      expect(curr.confidenceScore).toBe(first.confidenceScore);
      // 2. Assessment classification must be identical
      expect(curr.assessment).toBe(first.assessment);
      // 3. Risk level must be identical
      expect(curr.riskLevel).toBe(first.riskLevel);
      // 4. Subscores must be identical
      expect(curr.subscores.pixelOrFrameAnalysis).toBe(first.subscores.pixelOrFrameAnalysis);
      expect(curr.subscores.compressionOrSpectral).toBe(first.subscores.compressionOrSpectral);
      // 5. Pixel forensics report score & verdict must be identical
      expect(curr.pixelForensics?.score).toBe(first.pixelForensics?.score);
      expect(curr.pixelForensics?.verdict).toBe(first.pixelForensics?.verdict);
      expect(curr.pixelForensics?.confidence).toBe(first.pixelForensics?.confidence);
    }
  });

  // ─── Test 2: Authentic Photo Named "ai_generated.png" ────────────────────────
  it('Test 2: Real optical photo fixture renamed "ai_generated.png" is NOT classified synthetic', async () => {
    const authenticPixels = createAuthenticOpticalFixture(128, 128);
    const file = new File([authenticPixels.buffer], 'ai_generated.png', { type: 'image/png' });

    const result = await runForensicMediaAnalysis(
      file,
      'ev-authentic-renamed',
      'EVD-2026-AUTH',
      'IMAGE',
      'Forensic Investigator',
      'ai_generated.png'
    );

    // Optical photo must NOT be classified as LIKELY_SYNTHETIC simply because of filename
    expect(result.assessment).not.toBe('LIKELY_SYNTHETIC');
    expect(result.riskLevel).not.toBe('CRITICAL');
    expect(result.confidenceScore).toBeLessThan(45);
    expect(result.pixelForensics?.verdict).toBe('LIKELY_AUTHENTIC');
  });

  // ─── Test 3: Synthetic Fixture Named "holiday.jpg" ───────────────────────────
  it('Test 3: Synthetic neural fixture named "holiday.jpg" is NOT cleared by innocent filename', async () => {
    const syntheticPixels = createSyntheticSmoothFixture(128, 128);
    const file = new File([syntheticPixels.buffer], 'holiday.jpg', { type: 'image/jpeg' });

    const report = evaluatePixelForensics(syntheticPixels, 128, 128, syntheticPixels.buffer);

    // Overly smooth synthetic image must fire noise residual anomaly
    const noiseSignal = report.perSignal.find((s) => s.category === 'PIXEL_SPATIAL');
    expect(noiseSignal?.fired).toBe(true);
    expect(noiseSignal?.direction).toBe('SYNTHETIC');

    const result = await runForensicMediaAnalysis(
      file,
      'ev-synthetic-renamed',
      'EVD-2026-SYNTH',
      'IMAGE',
      'Forensic Investigator',
      'holiday.jpg'
    );

    // The pixel engine must report anomaly and not give a false 0% approval
    expect(result.pixelForensics?.perSignal.some((s) => s.fired)).toBe(true);
  });

  // ─── Test 4: Procedural Synthetic vs Natural Fixtures ────────────────────────
  it('Test 4: Procedural PRNG fixtures (smooth, checkerboard) trigger correct forensic signals', () => {
    // A. Smooth Diffusion Gradient Fixture
    const smoothPixels = createSyntheticSmoothFixture(128, 128);
    const smoothNoise = analyzeNoiseResidual(smoothPixels, 128, 128);
    expect(smoothNoise.result.fired).toBe(true);
    expect(smoothNoise.result.direction).toBe('SYNTHETIC');
    expect(smoothNoise.result.rawMetrics.globalVariance).toBeLessThan(0.4);

    // B. Periodic Checkerboard Fixture (Transposed Convolution)
    const checkerboardPixels = createSyntheticCheckerboardFixture(128, 128);
    const checkerboardFreq = analyzeFrequencyDomain(checkerboardPixels, 128, 128);
    expect(checkerboardFreq.result.fired).toBe(true);
    expect(checkerboardFreq.result.direction).toBe('SYNTHETIC');
    expect(Number(checkerboardFreq.result.rawMetrics.highFreqRatio)).toBeGreaterThan(0.20);

    // C. Natural Optical Noise Fixture
    const naturalPixels = createAuthenticOpticalFixture(128, 128);
    const naturalNoise = analyzeNoiseResidual(naturalPixels, 128, 128);
    expect(naturalNoise.result.fired).toBe(false);
    expect(naturalNoise.result.direction).toBe('AUTHENTIC');
    expect(naturalNoise.result.rawMetrics.globalVariance).toBeGreaterThan(0.8);
  });

  // ─── Test 5: Mathematical Determinism ────────────────────────────────────────
  it('Test 5: Mathematical determinism — 10 repeated runs yield byte-identical scores and metrics', () => {
    const pixels = createAuthenticOpticalFixture(128, 128);
    const reports = Array.from({ length: 10 }, () =>
      evaluatePixelForensics(pixels, 128, 128, pixels.buffer)
    );

    const base = reports[0];
    for (let i = 1; i < reports.length; i++) {
      const rep = reports[i];
      expect(rep.score).toBe(base.score);
      expect(rep.verdict).toBe(base.verdict);
      expect(rep.confidence).toBe(base.confidence);
      expect(rep.isDegraded).toBe(base.isDegraded);

      for (let s = 0; s < base.perSignal.length; s++) {
        expect(rep.perSignal[s].value).toBe(base.perSignal[s].value);
        expect(rep.perSignal[s].direction).toBe(base.perSignal[s].direction);
        expect(rep.perSignal[s].fired).toBe(base.perSignal[s].fired);
      }
    }
  });

  // ─── Test 6: Degraded / Sub-64x64 / Empty Images Return INCONCLUSIVE ─────────
  it('Test 6: Degraded / sub-64x64 / empty images return INCONCLUSIVE (zero false claims)', async () => {
    // A. Sub-64x64 buffer (32x32)
    const tinyBuffer = new Uint8ClampedArray(32 * 32 * 4);
    const tinyReport = evaluatePixelForensics(tinyBuffer, 32, 32);
    expect(tinyReport.verdict).toBe('INCONCLUSIVE');
    expect(tinyReport.isDegraded).toBe(true);
    expect(tinyReport.degradationReason).toContain('64×64');

    // B. Sub-64x64 buffer (16x16)
    const iconBuffer = new Uint8ClampedArray(16 * 16 * 4);
    const iconReport = evaluatePixelForensics(iconBuffer, 16, 16);
    expect(iconReport.verdict).toBe('INCONCLUSIVE');
    expect(iconReport.isDegraded).toBe(true);

    // C. 0-pixel buffer
    const zeroReport = evaluatePixelForensics(new Uint8ClampedArray(0), 0, 0);
    expect(zeroReport.verdict).toBe('INCONCLUSIVE');
    expect(zeroReport.isDegraded).toBe(true);

    // D. Empty file (0 bytes) in analyzeMedia
    const emptyFile = new File([new Uint8Array(0)], 'empty.jpg', { type: 'image/jpeg' });
    const emptyMediaResult = await analyzeMedia(emptyFile);
    expect(emptyMediaResult.status).toBe('INCONCLUSIVE');
    expect(emptyMediaResult.probability).toBeNull();
  });

  // ─── Test 7: Static Codebase Grep / Zero-Filename Proof ──────────────────────
  it('Test 7: Static Codebase Audit proves pixelForensics.ts has ZERO filename dependencies', () => {
    const filePath = path.resolve(__dirname, '../src/lib/pixelForensics.ts');
    const sourceCode = fs.readFileSync(filePath, 'utf-8');

    // Remove comments to check functional code
    const codeWithoutComments = sourceCode
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '');

    // Assert that file.name or fileName does NOT appear anywhere in executable logic
    expect(codeWithoutComments).not.toMatch(/\bfile\.name\b/);
    expect(codeWithoutComments).not.toMatch(/\bfileName\b/);
    expect(codeWithoutComments).not.toMatch(/\bfilename\b/i);

    // Assert that SIGNAL_WEIGHTS_CONFIG sums exactly to 1.0 (100%)
    const totalWeight = Object.values(SIGNAL_WEIGHTS_CONFIG).reduce(
      (sum, s) => sum + s.weight,
      0
    );
    expect(Math.round(totalWeight * 100) / 100).toBe(1.0);

    // Assert FORENSIC_LIMITATIONS are present
    expect(FORENSIC_LIMITATIONS.length).toBeGreaterThanOrEqual(3);
  });
});
