# BlockVault — Blockchain-Based Digital Forensic Evidence Management System

> **Tagline:** Secure Evidence. Verified Integrity. Complete Chain of Custody.  
> **Compliance Standards:** ISO/IEC 27037:2012 • NIST SP 800-86 • FIPS 180-4 (SHA-256) • NIST SP 800-38D (AES-256-GCM) • FRE 901/902  
> **Version:** 2.1.0 (Pixel-Level Signal Forensics & Refined Dark Obsidian UI/UX)

---

## 1. Overview & Key Distinctions

**BlockVault** is an enterprise-grade digital forensic evidence management platform engineered for law enforcement agencies, cyber incident response teams (CIRT/DFIR), digital crime laboratories, and judicial authorities.

The platform guarantees non-repudiation, tamper-evident preservation, and an unbroken cryptographic chain of custody from initial acquisition through analysis, peer review, and courtroom presentation.

### Core Distinctions
* **Zero Pre-Seeded Dummy Data:** Boots into a deterministic mathematical state starting at Genesis Block #0. All cases, files, and operator identities are user-provided.
* **100% Real Cryptography:** Hardware-accelerated Web Crypto API native `SHA-256` digest computation, `AES-256-GCM` envelope encryption, and binary Merkle tree validation.
* **Genuine Pixel-Level & Bitstream Forensics (Zero Filename Cheating):** Replaced all filename-based AI heuristics with real mathematical pixel noise residual analysis, 2D Discrete Cosine Transform (DCT) frequency power spectrum calculations, Shannon byte entropy ($0-8$ bits/byte), magic header bytes, and C2PA/JUMBF manifest scanning.
* **Refined Dark Obsidian Design System:** Premium enterprise SaaS aesthetic with Inter typography, unified design tokens, standardized responsive page containers, and balanced telemetry cards with zero empty viewport dead space.
* **Isolated Derivative & Tamper Simulation Workbench:** Executes controlled mutations on isolated in-memory test copies while mathematically ensuring original vault evidence remains 100% immutable.
* **Persistent Encrypted Binary Vault:** Client-side IndexedDB storage (`BlockVaultBinaryDB_v1`) storing binary blobs alongside AES-256-GCM encrypted representations for offline re-verification.

---

## 2. Refined UI/UX Architecture & Design System

BlockVault features a bespoke **Dark Obsidian** design system inspired by elite modern cybersecurity and developer tools (Linear, Raycast, Stripe Dark).

### 2.1 Color Palette & Surface Tokens
* **Base Canvas (`--color-obsidian-950`):** `#060911` (Deep cosmic obsidian background)
* **Inset Well (`--color-obsidian-900`):** `#080C16` (Deep input and nested container wells)
* **Sidebar Surface (`--color-obsidian-850`):** `#0B101E` (Permanent sidebar background)
* **High-Clarity Card Surfaces (`--color-obsidian-800`):** `#0C101D` (Chamfered dark slate surfaces)
* **Borders (`--color-obsidian-border`):** `rgba(255, 255, 255, 0.08)` hairline borders with subtle inner bevel highlights (`shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]`)
* **Brand Accents:** Electric Cyan (`#06B6D4` / `#22D3EE`) & Forensic Blue (`#2563EB` / `#3B82F6`)
* **Integrity Signals:** Emerald (`#10B981` Verified), Amber (`#F59E0B` Warning), Crimson (`#EF4444` Critical / Tampered)

### 2.2 Standard Layout & Component Architecture
* **`PageContainer`:** Reusable container component enforcing consistent `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6` across all views, eliminating awkward edge-to-edge stretching on ultrawide viewports (1920px) while maintaining fluid responsiveness on laptop (1366px) and mobile (390px) screens.
* **`PageHeader`:** Standardized header component with breadcrumb hierarchy, title, status indicator badge, subtitle, and responsive action button slots that prevent wrapping collisions.
* **`ForensicBadge`:** High-contrast, standardized badge component for Case Priority, Cryptographic Integrity (`VERIFIED`, `TAMPERED`), and PoA Blockchain block heights.
* **Readable Typography Hierarchy:** Interface body copy uses `Inter` at readable sizes ($\ge 13-14\text{px}$), strictly reserving monospace fonts for SHA-256 digests, block heights, and timestamps.
* **Optimized Sidebar Navigation:** Compact navigation items with high-contrast custom scrollbars (`#25334A` thumb) and a streamlined validator node status card that ensures all items remain accessible on 768px laptop viewports.
* **Zero Viewport Dead Space:** Redesigned Mission Control Dashboard featuring equal-height split panels and an expanded Proof-of-Authority consensus telemetry block visualizer.

---

## 3. Core Forensic Modules

| Module | Route | Primary Responsibilities |
| :--- | :--- | :--- |
| **Mission Control Dashboard** | `/dashboard` | System telemetry, 4 KPI statistic cards, ledger height status, one-click ledger integrity audit, consensus telemetry. |
| **Forensic Case Dockets** | `/cases`, `/cases/:id` | Case lifecycle management, multi-tab dossier (Overview, Evidence, Custody, Proofs, AI, Audit, Reports). |
| **Digital Evidence Vault** | `/evidence`, `/evidence/:id` | Intake of all file types, automated SHA-256 digesting, AES-256-GCM envelope encryption, IndexedDB persistence. |
| **Forensic Signal Lab** | `/ai-analysis`, `/signal-lab` | Shannon entropy, 2D DCT spectral analysis, high-pass noise residuals, C2PA tags, Web Audio PCM decoding. |
| **Chain of Custody Continuum** | `/custody` | ISO/IEC 27037 event logging (Acquired, Transferred, Analyzed), operator attribution, interactive timeline. |
| **Consortium Ledger Explorer** | `/blockchain` | Proof-of-Authority (PoA) MiniChain with 5 validator nodes, Merkle tree root visualization, full chain verification. |
| **Integrity Monitor & Disk Audit** | `/integrity` | Live IndexedDB re-verification, off-ledger disk file drop audit, isolated tamper mutation workbench. |
| **Immutable Audit Logs** | `/audit` | Chronological append-only record of all operator actions, access attempts, and verification results with IP attribution. |
| **Court Dossier Compiler** | `/reports` | FRE 901/902 compliant dossier generator, 7 report formats, print-ready court layouts. |
| **Personnel Directory & RBAC** | `/users` | 4-tier clearance governance (Super Admin, Admin, Reviewer, Investigator), session switcher. |
| **Platform Settings** | `/settings` | Cryptographic engine configuration, validator node endpoints, workspace database controls. |

---

## 4. Core Algorithmic Implementations

### 1. SHA-256 Dual-Stage Evidence Hashing Algorithm
* **Stage 1 (Raw Acquisition Hash):** Computes $H_{\text{orig}} = \text{SHA-256}(\text{RawBytes})$ on the pristine payload before any storage or transformation.
* **Stage 2 (Envelope Encryption & Key-Fingerprinting):** Encrypts payload with AES-256-GCM, generates a 16-char SHA-256 key fingerprint (`KEY-FPR-...`), and commits the transaction hash to the blockchain block.
* **Files:** [`src/services/cryptoService.ts`](file:///e:/BlockVault%20–%20A%20Blockchain-Based%20Framework%20for%20Secure%20Digital%20Forensic%20Evidence%20Management/src/services/cryptoService.ts), [`src/stores/useForensicStore.ts`](file:///e:/BlockVault%20–%20A%20Blockchain-Based%20Framework%20for%20Secure%20Digital%20Forensic%20Evidence%20Management/src/stores/useForensicStore.ts)

### 2. Proof-of-Authority (PoA) Consensus & Block Commit Protocol
* **Consensus Engine:** 5 institutional validator consortium nodes execute pairwise binary Merkle tree root calculations:
  $$\text{Root} = H(H(tx_1 \parallel tx_2) \parallel H(tx_3 \parallel tx_4))$$
* **Block Header Hashing:**
  $$\text{BlockHash} = \text{SHA-256}(\text{Height} \parallel \text{PrevHash} \parallel \text{Timestamp} \parallel \text{MerkleRoot} \parallel \text{Validator} \parallel \text{"POA-V1"})$$
* **Continuous Verification:** Recursively verifies parent-child block continuity and transaction Merkle roots from Genesis (#0) to the head block.
* **Files:** [`src/services/blockchainService.ts`](file:///e:/BlockVault%20–%20A%20Blockchain-Based%20Framework%20for%20Secure%20Digital%20Forensic%20Evidence%20Management/src/services/blockchainService.ts)

### 3. Real Pixel-Level Noise & Frequency Spectral Forensics (Zero Filename Heuristics)
* **High-Frequency Spatial Noise Residual Analysis:** Computes local high-pass residual filter $r(x,y) = Y(x,y) - \bar{Y}_{4}(x,y)$, evaluating residual standard deviation $\sigma_{\text{noise}}$ and cross-channel RGB covariance. Natural sensors display correlated Bayer CFA noise ($\sigma \ge 1.0$), while generative diffusion models exhibit unnatural high-frequency smoothing.
* **2D 8×8 Discrete Cosine Transform (DCT) Power Spectrum:** Measures frequency energy distribution across sampled macroblocks, identifying anomalous transposed convolution checkerboard artifacts and artificial spectral falloff.
* **8×8 Quantization Seam Discontinuity:** Evaluates intra-block vs inter-block luminance gradients to detect localized inpainting re-compression.
* **Shannon Byte Entropy & C2PA Provenance:** Computes $H = -\sum p_i \log_2 p_i$ and parses JUMBF metadata boxes.
* **Zero Filename Cheating:** Eliminated all filename keyword/extension checks (`win_`, `cam_`, `sora`, `runway`, etc.)—all scores are derived 100% from actual bitstream and raster data.
* **Files:** [`src/services/aiAnalysisService.ts`](file:///e:/BlockVault%20–%20A%20Blockchain-Based%20Framework%20for%20Secure%20Digital%20Forensic%20Evidence%20Management/src/services/aiAnalysisService.ts), [`src/lib/detectors/externalAIDetector.ts`](file:///e:/BlockVault%20–%20A%20Blockchain-Based%20Framework%20for%20Secure%20Digital%20Forensic%20Evidence%20Management/src/lib/detectors/externalAIDetector.ts)

### 4. Isolated Derivative Processing Algorithm for OCR and Malware Screening
* **Architecture:** Original evidence payloads are never directly modified. Derivative assets (OCR text transcripts, extracted video frames, thumbnails, malware reports) are stored strictly as distinct `EvidenceDerivative` models.
* **Sandbox Mutation Testing:** Executes controlled bit-flips and header alterations on isolated test copies in memory while the vault master file remains 100% unaltered.
* **Files:** [`src/types/index.ts`](file:///e:/BlockVault%20–%20A%20Blockchain-Based%20Framework%20for%20Secure%20Digital%20Forensic%20Evidence%20Management/src/types/index.ts), [`src/services/tamperService.ts`](file:///e:/BlockVault%20–%20A%20Blockchain-Based%20Framework%20for%20Secure%20Digital%20Forensic%20Evidence%20Management/src/services/tamperService.ts)

---

## 5. Technology Stack

* **Frontend:** React 18.3.1, TypeScript 5.6.2, Tailwind CSS v4, Material-UI 6.4.0, Lucide Icons, Zustand 5.0.15, Vite 6.0.0
* **Cryptography:** Web Crypto API (SubtleCrypto native SHA-256 & AES-256-GCM), IndexedDB (`BlockVaultBinaryDB_v1`)
* **Signal Diagnostics:** HTML5 Canvas API (ImageData raster analysis), HTML5 Video Element, Web Audio API (`AudioContext`)
* **Backend:** Spring Boot 3, Java 21 LTS, Spring Security with JWT, H2 Database / SQL Server compatible (Port 8080)
* **Testing:** Vitest 2.1.9 (76/76 unit and integration tests passing in 1.2s)

---

## 6. Installation & Running

### Starting the Backend Server
```powershell
.\start-backend.ps1
# API URL:    http://localhost:8080
# Health:     http://localhost:8080/api/health
# H2 Console: http://localhost:8080/h2-console
```

### Starting the Frontend Server
```powershell
npm run dev -- --host 127.0.0.1
# Accessible at: http://localhost:3000
```

### Verification & Quality Checks
```powershell
npx tsc --noEmit          # 0 errors, clean TypeScript build
npm test -- --run         # 76 / 76 unit & integration tests passing (100%)
npm run build             # Compiles production distribution bundle to dist/
```

---

## 7. Legal Admissibility & Standards Compliance

* **ISO/IEC 27037:2012:** Guidelines for identification, collection, acquisition, and preservation of digital evidence.
* **NIST SP 800-86:** Guide to Integrating Forensic Techniques into Incident Response.
* **Federal Rules of Evidence (FRE):**
  * **Rule 901:** Authenticating or Identifying Evidence.
  * **Rule 902(13)/(14):** Certified Records Generated by an Electronic Process / Certified Data Copied from an Electronic Device.
