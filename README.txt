================================================================================
                                BLOCKVAULT
   A Blockchain-Based Framework for Secure Digital Forensic Evidence Management
================================================================================
Tagline: Secure Evidence. Verified Integrity. Complete Chain of Custody.
Standards: ISO/IEC 27037:2012 | NIST SP 800-86 | FIPS 180-4 | NIST SP 800-38D | FRE 901/902
Version: 2.0.0 (High-Performance Modern Enterprise Forensic Architecture)
================================================================================

1. INTRODUCTION & OVERVIEW
--------------------------------------------------------------------------------
BlockVault is an enterprise-grade digital forensic evidence management system
engineered for law enforcement agencies, cyber incident response teams (CIRT/DFIR),
digital crime laboratories, and judicial authorities.

The platform guarantees non-repudiation, tamper-evident preservation, and an
unbroken cryptographic chain-of-custody from initial acquisition at the incident
scene through analysis, peer review, and courtroom presentation.

Key Distinctions:
- ZERO PRE-SEEDED DUMMY DATA: The system boots into a clean, deterministic state
  starting at mathematical Genesis Block #0. Users configure their real operator
  profile or click "Load Demo Environment" to explore verified forensic records.
- 100% REAL CRYPTOGRAPHY: Hardware-accelerated Web Crypto API native SHA-256
  digesting and AES-256-GCM envelope encryption. Zero simulated hashes or mock delays.
- FORENSIC SIGNAL LAB & AI AUTHENTICITY: Client-side mathematical Shannon byte
  entropy (0-8 bits/byte), magic-byte header verification, C2PA/JUMBF provenance tags,
  HTML5 Canvas pixel variance, video frame Mean Absolute Difference (MAD) tracking,
  and Web Audio API PCM waveform decoding (ZCR, RMS energy).
- ISOLATED DERIVATIVE & TAMPER SIMULATION WORKBENCH: Executes controlled mutations
  (bit-flips, metadata alteration, payload substitution) on isolated in-memory test
  copies while guaranteeing the original vault evidence remains 100% immutable.
- PERSISTENT BINARY VAULT: Client-side IndexedDB storage (BlockVaultBinaryDB_v1)
  storing actual binary blobs alongside AES-256-GCM encrypted representations.


2. MODERN UI/UX ARCHITECTURE & DESIGN SYSTEM
--------------------------------------------------------------------------------
BlockVault features a bespoke "Dark Obsidian" design language inspired by elite
modern developer and cybersecurity tools (Linear, Raycast, Stripe Dark).

Core UI/UX Design Principles:
1. Palette & Surface Hierarchy:
   - Base Canvas: #060911 (Ultra-deep cosmic obsidian)
   - High-Clarity Card Surfaces: #0C101D (Chamfered, high-contrast dark slate)
   - Capsule & Sub-Bar Surfaces: #070A12/60 with blur backdrop filters
   - Accents: Electric Cyan (#06B6D4 / #22D3EE) and Forensic Blue (#2563EB / #3B82F6)
   - Integrity Signals: Emerald (#10B981), Amber Warning (#F59E0B), Crimson Alert (#EF4444)

2. Component & Layout Structure:
   - Global Container: Standardized `max-w-7xl mx-auto` layout across all views
     preventing edge stretching on ultra-wide monitors.
   - Breadcrumb Navigation: Unified breadcrumb paths (`BlockVault / Section / View`)
     providing immediate situational awareness across all 11 core modules.
   - Chamfered Highlight Borders: Subtle `border-white/[0.08]` with inner depth
     highlights `shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]`.
   - Native Button & Form Element Resets: Eliminated browser default white
     ButtonFace rectangular artifacts in Tailwind v4 with root-level element resets.
   - Dual-Stop Action CTAs: High-prominence actions feature cyan-to-blue gradients:
     `bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500`
     paired with soft colored glow shadows.
   - Capsule Navigation Bars: Horizontal tabs formatted as rounded-xl capsules
     with active cyan borders and glow indicators.

3. Typography & Data Density:
   - Primary Font: Inter for readable, high-contrast enterprise typography.
   - Monospace Font: JetBrains Mono / Fira Code for cryptographic digests, block
     heights, timestamps, and hex signatures.
   - Hash Display Format: 64-character SHA-256 digests formatted with 8-character
     chunk spacing and instant 1-click clipboard copying.


3. CORE FORENSIC MODULES & WORKFLOWS
--------------------------------------------------------------------------------
1. MISSION CONTROL DASHBOARD (`/dashboard`)
   - Real-time telemetry, 4 KPI statistic cards, ledger height status.
   - Live cryptographic ledger continuity audit with one-click verification.
   - Recent cases and quick intake jump-gates.

2. FORENSIC CASE DOCKETS (`/cases`, `/cases/:id`)
   - Complete investigation dossier management with jurisdictional scoping.
   - Multi-tab dossier view: Overview, Evidence Vault, Custody Continuum,
     Blockchain Proofs, AI Media Diagnostics, Audit Trail, and Court Reports.

3. DIGITAL EVIDENCE VAULT (`/evidence`, `/evidence/:id`)
   - Multi-category ingestion: Images, Video, Audio, Documents, Logs, Archives,
     and raw Disk Images (.iso, .bin, .dd, .pcap).
   - Automated Web Crypto SHA-256 digital fingerprinting upon file selection.
   - AES-256-GCM envelope encryption with 12-byte random IVs and 256-bit keys.
   - Persistent storage in IndexedDB (BlockVaultBinaryDB_v1) with offline access.

4. FORENSIC SIGNAL LAB (`/ai-analysis`, `/signal-lab`)
   - Shannon Byte Entropy: H(X) = -SUM(P(x) * log2(P(x))) across 0-8 bits/byte.
   - Magic Header Scanner: Validates byte headers (PNG, JPEG, PDF, PCAP, etc.).
   - C2PA / JUMBF Marker Scanner: Content Credentials and AI synthesis tags.
   - Image Analysis: Canvas RGB channel variance and 8x8 DCT block boundaries.
   - Video Analysis: HTML5 video timestamp seeking with inter-frame MAD delta.
   - Audio Analysis: Web Audio API PCM waveform decoding (ZCR, RMS energy flux).
   - Adaptive Security Policy: Automated intake rejection for synthetic media
     exceeding forensic confidence thresholds (>=45%).

5. CHAIN OF CUSTODY CONTINUUM (`/custody`)
   - ISO/IEC 27037 compliant lifecycle events: ACQUIRED, UPLOADED, VERIFIED,
     TRANSFERRED, ACCESSED, ANALYZED, REVIEWED, EXPORTED, ARCHIVED.
   - Authenticated operator attribution with badge number, role, timestamps,
     locker locations, and transfer purpose.

6. CONSORTIUM LEDGER / BLOCKCHAIN EXPLORER (`/blockchain`)
   - Local Proof-of-Authority (PoA) Consortium MiniChain.
   - 5 Institutional Validator Nodes:
       VAL-NODE-01 (DFIR National Root Node)
       VAL-NODE-02 (Judicial Authority Node)
       VAL-NODE-03 (Federal Forensics Lab)
       VAL-NODE-04 (Cybercrime Investigation Wing)
       VAL-NODE-05 (Auditing & Integrity Node)
   - Mathematical Genesis Block (#0) with zero dummy transactions.
   - Binary Merkle Tree Root computation for each mined block.
   - One-click full-chain continuity verification from Genesis to latest block.

7. INTEGRITY MONITOR & TAMPER WORKBENCH (`/integrity`)
   - Stored Binary Re-Verification: Recalculates SHA-256 directly from raw
     IndexedDB binary buffers.
   - External Disk File Audit: Drag-and-drop any off-ledger file from disk to
     compute its live SHA-256 and confirm bit-for-bit equality against origin.
   - Isolated Tamper Simulation: Controlled test copy mutations demonstrating
     immediate hash divergence, alert generation, and audit logging.

8. IMMUTABLE AUDIT LOGS (`/audit`)
   - Full append-only trail of all security actions, logins, uploads,
     handoffs, and verifications with IP host attestation.

9. COURT DOSSIER COMPILER (`/reports`)
   - 7 Report Types: Case Summary, Evidence Inventory, Evidence Integrity,
     Chain of Custody, Blockchain Verification, AI Media Analysis, and
     Complete Forensic Dossier.
   - Federal Rules of Evidence (FRE 901/902) format with examiner sign-offs.
   - Dedicated print-friendly / court-admissible layout.

10. PERSONNEL DIRECTORY & RBAC GOVERNANCE (`/users`)
    - 4 Clearance Roles:
        * SUPER_ADMIN: Full system governance, policy configuration.
        * ADMIN: Case oversight, investigator assignment, security audits.
        * REVIEWER: Judicial/legal oversight, dossier review, audit access.
        * INVESTIGATOR: Case intake, evidence upload, signal analysis, handoffs.
    - Clearance matrix and operator provisioning.

11. PLATFORM CONFIGURATION & POLICIES (`/settings`)
    - Cryptographic engine specifications, validator endpoints, and
      evidence vault database management.


4. CORE ALGORITHMIC IMPLEMENTATIONS
--------------------------------------------------------------------------------
1. SHA-256 DUAL-STAGE EVIDENCE HASHING ALGORITHM
   - Stage 1: Computes H_orig = SHA-256(RawBytes) on untouched payload.
   - Stage 2: Computes AES-256-GCM ciphertext, generates 16-char SHA-256 key
     fingerprint (KEY-FPR-...), and commits transaction to the PoA block.
   - Location: `src/services/cryptoService.ts` & `src/stores/useForensicStore.ts`

2. PROOF-OF-AUTHORITY CONSENSUS & BLOCK COMMIT PROTOCOL
   - 5 validator consortium nodes execute pairwise Merkle tree reduction:
     Root = H(H(tx1 || tx2) || H(tx3 || tx4)).
   - BlockHash = SHA-256(Height || PrevHash || Timestamp || MerkleRoot || Validator || "POA-V1").
   - Continuous chain integrity verification traverses Genesis to Head.
   - Location: `src/services/blockchainService.ts`

3. AI-ASSISTED EVIDENCE RISK CLASSIFICATION & ADAPTIVE SECURITY ENGINE
   - Multi-signal heuristic inspection (Shannon entropy, C2PA, DCT, MAD, PCM).
   - Dynamically evaluates risk (LOW, MEDIUM, HIGH, CRITICAL).
   - Strict rejection policy blocks automated ingestion of synthetic media (>=45%).
   - Location: `src/services/aiAnalysisService.ts` & `src/stores/useForensicStore.ts`

4. ISOLATED DERIVATIVE PROCESSING ALGORITHM
   - Derives OCR transcripts, frames, thumbnails, and malware screening results
     strictly into isolated `EvidenceDerivative` data models.
   - Guarantees original vault blobs remain untouched in memory and storage.
   - Location: `src/types/index.ts` & `src/services/tamperService.ts`


5. TECHNOLOGY STACK
--------------------------------------------------------------------------------
Frontend:
  - React 18.3.1
  - TypeScript 5.6.2
  - Tailwind CSS v4 (with strict custom component & button resets)
  - Material-UI (MUI) 6.4.0 + Lucide React Icons
  - Zustand 5.0.15 (Persistent Storage)
  - IndexedDB (BlockVaultBinaryDB_v1)
  - Vite 6.0.0 (Fast HMR development and optimized bundling)

Cryptography & Signal Diagnostics:
  - Web Crypto API (Native hardware-accelerated SubtleCrypto)
  - SHA-256 (FIPS PUB 180-4)
  - AES-256-GCM (NIST SP 800-38D)
  - HTML5 Canvas 2D + HTML5 Video Media Element APIs
  - Web Audio API (AudioContext PCM Sample Decoding)

Backend:
  - Spring Boot 3
  - Java 21 LTS
  - Spring Security with JWT Authentication
  - H2 In-Memory Database (/h2-console) & SQL Server Ready
  - Port: 8080


6. INSTALLATION & RUNNING
--------------------------------------------------------------------------------
Prerequisites:
  - Node.js >= 18.x (Node 20+ recommended)
  - Java JDK 21 (for Spring Boot backend API)
  - PowerShell (on Windows)

Starting the Backend Server:
  Command: .\start-backend.ps1
  URL:     http://localhost:8080
  Health:  http://localhost:8080/api/health
  H2 UI:   http://localhost:8080/h2-console

Starting the Frontend Development Server:
  Command: npm run dev -- --host 127.0.0.1
  URL:     http://localhost:3000

Testing & Quality Verification:
  - Run Unit Test Suite:   npm test -- --run   (76/76 tests passing, 100%)
  - TypeScript Validation: npx tsc --noEmit    (0 errors, clean build)
  - Production Bundle:     npm run build       (compiled to dist/)


7. COMPLIANCE & LEGAL ADMISSIBILITY
--------------------------------------------------------------------------------
- ISO/IEC 27037:2012: Guidelines for identification, collection, acquisition,
  and preservation of digital forensic evidence.
- NIST SP 800-86: Guide to Integrating Forensic Techniques into Incident Response.
- Federal Rules of Evidence (FRE):
    * Rule 901: Authenticating or Identifying Evidence.
    * Rule 902(13)/(14): Certified Records Generated by an Electronic Process /
      Certified Data Copied from an Electronic Device.
- Disclaimer: Technical verification provides mathematical proof of bit-level
  integrity. Legal admissibility remains subject to jurisdictional rules
  and judicial evaluation.

================================================================================
          BLOCKVAULT — SECURE EVIDENCE. VERIFIED INTEGRITY.
================================================================================
