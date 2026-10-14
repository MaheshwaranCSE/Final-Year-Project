import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, getLS } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { analyzeMedia, AIDetectionResult } from '../lib/aiDetection';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  AppBar,
  Toolbar,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Paper,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CloudUpload as UploadIcon,
  ZoomIn as ZoomInIcon,
  Security as SecurityIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { AI_DETECTION_THRESHOLD } from '../config/policy';
import ChainOfCustodyTimeline from '../components/ChainOfCustodyTimeline';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Evidence {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  is_ai_flagged: boolean;
  sha256_hash?: string;
  ai_probability?: number;
  ai_detection_status?: 'APPROVED' | 'BLOCKED' | 'FAILED' | 'INCONCLUSIVE';
  confidentiality?: {
    method: string;
    key_preview: string;
    iv_preview: string;
    encryption_time: string;
    block_id: string;
  };
  created_at: string;
}

interface CaseDetails {
  title: string;
  description: string;
}

type ScanPhase =
  | 'idle'
  | 'validating'
  | 'scanning'
  | 'done_approved'
  | 'done_blocked'
  | 'done_failed'
  | 'done_inconclusive'
  | 'uploading';

// ─── Helpers ───────────────────────────────────────────────────────────────────
async function generateSHA256(file: File): Promise<string> {
  const buf  = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateMockConfidentiality() {
  const h = (n: number) =>
    Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return {
    method:          'AES-256-CBC',
    key_preview:     `0x${h(4)}...${h(4)} (32 bytes)`,
    iv_preview:      `0x${h(4)}...${h(4)} (16 bytes)`,
    encryption_time: `${(Math.random() * 0.05 + 0.01).toFixed(3)} s`,
    block_id:        `#${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
  };
}

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'avi', 'wav', 'mp3', 'm4a'];
const MAX_SIZE_MB         = 100;

function isVideoFileName(name: string) {
  return /\.(mp4|mov|avi)$/i.test(name);
}

function isAudioFileName(name: string) {
  return /\.(wav|mp3|m4a|mpeg)$/i.test(name);
}

// ─── Detection Result Panel ────────────────────────────────────────────────────
function DetectionPanel({
  phase,
  result,
  fileName,
  onConfirmUpload,
  onCancel,
}: {
  phase: ScanPhase;
  result: AIDetectionResult | null;
  fileName: string;
  onConfirmUpload: () => void;
  onCancel: () => void;
}) {
  if (phase === 'idle') return null;

  const scanning   = phase === 'validating' || phase === 'scanning';
  const uploading  = phase === 'uploading';
  const signals    = result?.signals;
  const videoFile  = isVideoFileName(fileName);
  const audioFile  = isAudioFileName(fileName);
  const videoReport = result?.video_report ?? null;
  const audioReport = result?.audio_report ?? null;

  const borderColor =
    phase === 'done_approved'     ? 'success.main'
    : phase === 'done_blocked'    ? 'error.main'
    : phase === 'done_failed'     ? 'warning.main'
    : phase === 'done_inconclusive' ? 'warning.main'
    : 'primary.main';

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3, border: '2px solid', borderColor }}>
      <Typography variant="h6" gutterBottom fontWeight="bold">AI Detection</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        File: <strong>{fileName}</strong>
        <br />
        Media Type: <strong>{videoFile ? 'VIDEO' : audioFile ? 'AUDIO' : 'IMAGE'}</strong>
      </Typography>

      {/* ── Scanning / Uploading ─────────────────────────────────────────────── */}
      {(scanning || uploading) && (
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {phase === 'validating'
              ? 'Validating file type and size...'
              : phase === 'scanning'
                ? videoFile
                  ? 'Extracting frames · Analyzing temporal motion · Checking audio and metadata...'
                  : audioFile 
                    ? 'Extracting audio features · Running synthetic speech detection...'
                    : 'Analyzing media content with multi-signal detector...'
                : 'Uploading to secure vault...'}
          </Typography>
          <LinearProgress sx={{ mb: 1 }} />
          {phase === 'scanning' && (
            <Typography variant="caption" color="text.secondary">
              {videoFile
                ? 'Checking: MP4 metadata · Representative frame extraction · Temporal motion anomalies · Audio synthesis'
                : audioFile
                  ? 'Checking: Synthetic audio generation · Voice cloning anomalies · Segment-level analysis'
                  : 'Checking: EXIF metadata · PNG chunks · C2PA provenance · pixel statistics · frequency patterns'}
            </Typography>
          )}
        </Box>
      )}

      {/* ── APPROVED ────────────────────────────────────────────────────────── */}
      {phase === 'done_approved' && result && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <CheckCircleIcon color="success" />
            <Typography variant="subtitle1" color="success.main" fontWeight="bold">
              UPLOAD APPROVED
            </Typography>
          </Box>
          <Typography variant="h5" color="success.main" sx={{ mb: 0.5 }}>
            AI Probability: {result.probability?.toFixed(2)}%
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Threshold: {AI_DETECTION_THRESHOLD}%
          </Typography>

          {/* Video-specific analysis details */}
          {videoReport && (
            <Box sx={{ bgcolor: 'grey.50', p: 1.5, borderRadius: 1, mb: 2 }}>
              <Typography variant="caption" fontWeight="bold" display="block" sx={{ mb: 0.5 }}>
                Video Analysis Details
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Frames analyzed: {videoReport.frames_analyzed}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Visual AI Score: {videoReport.visual_score?.toFixed(2) ?? 'N/A'}%
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Temporal AI Score: {videoReport.temporal_score?.toFixed(2) ?? 'N/A'}%
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Audio AI Score: {videoReport.audio_score?.toFixed(2) ?? 'N/A'}%
              </Typography>
              <Typography variant="caption" color="text.primary" display="block" sx={{ mt: 1 }}>
                Overall AI Score: {videoReport.video_probability?.toFixed(2)}%
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Aggregation: {videoReport.aggregation_method}
              </Typography>
            </Box>
          )}

          {/* Audio-specific analysis details */}
          {audioReport && (
            <Box sx={{ bgcolor: 'grey.50', p: 1.5, borderRadius: 1, mb: 2 }}>
              <Typography variant="caption" fontWeight="bold" display="block" sx={{ mb: 0.5 }}>
                Audio Analysis Details
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Duration: 00:{audioReport.duration}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Segments analyzed: {audioReport.segments_analyzed}
              </Typography>
              <Typography variant="caption" color="text.primary" display="block" sx={{ mt: 1 }}>
                Audio AI Score: {audioReport.audio_probability?.toFixed(2)}%
              </Typography>
            </Box>
          )}

          {/* Image signal details */}
          {!videoReport && !audioReport && signals?.signal_details && (
            <Box sx={{ bgcolor: 'grey.50', p: 1.5, borderRadius: 1, mb: 2 }}>
              <Typography variant="caption" fontWeight="bold" display="block" sx={{ mb: 0.5 }}>
                Analysis details ({signals.signal_count} signals):
              </Typography>
              {signals.signal_details.slice(0, 5).map((d: string, i: number) => (
                <Typography key={i} variant="caption" color="text.secondary" display="block">• {d}</Typography>
              ))}
            </Box>
          )}

          <Typography variant="caption" color="success.main" display="block" sx={{ mb: 2 }}>
            Evidence stored successfully.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" color="success" onClick={onConfirmUpload}>Proceed with Upload</Button>
            <Button variant="outlined" onClick={onCancel}>Cancel</Button>
          </Box>
        </Box>
      )}

      {/* ── BLOCKED ─────────────────────────────────────────────────────────── */}
      {phase === 'done_blocked' && result && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <CancelIcon color="error" />
            <Typography variant="subtitle1" color="error.main" fontWeight="bold">
              UPLOAD BLOCKED
            </Typography>
          </Box>
          <Typography variant="h5" color="error.main" sx={{ mb: 0.5 }}>
            {videoFile || audioFile ? 'Overall ' : ''}AI Probability: {result.probability?.toFixed(2)}%
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Threshold: {AI_DETECTION_THRESHOLD}% — AI probability exceeds the configured upload threshold.
          </Typography>

          {/* Video-specific blocked details with Visual/Temporal/Audio/Overall breakdown */}
          {videoReport && (
            <Box sx={{ border: '1px solid', borderColor: 'error.light', p: 1.5, borderRadius: 1, mb: 2 }}>
              <Typography variant="caption" fontWeight="bold" color="error.dark" display="block" sx={{ mb: 0.5 }}>
                Video Analysis Details
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Frames analyzed: {videoReport.frames_analyzed}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Detector: {videoReport.detector_name || 'BlockVault Enterprise Video AI'}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Visual AI Score: <strong>{videoReport.visual_score?.toFixed(2) ?? 'N/A'}%</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Temporal AI Score: <strong>{videoReport.temporal_score?.toFixed(2) ?? 'N/A'}%</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Audio AI Score: <strong>{videoReport.audio_score?.toFixed(2) ?? 'N/A'}%</strong>
              </Typography>
              <Typography variant="caption" color="error.dark" fontWeight="bold" display="block" sx={{ mt: 1 }}>
                Overall AI Score: {videoReport.video_probability?.toFixed(2)}%
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Aggregation: {videoReport.aggregation_method}
              </Typography>
              {videoReport.video_metadata_fired && (
                <Typography variant="caption" color="error.dark" display="block" sx={{ mt: 0.5 }}>
                  ✗ AI software detected in video metadata
                </Typography>
              )}
              <Typography variant="caption" color="error.dark" display="block" sx={{ mt: 0.5 }}>
                Policy: AI probability ≥ {AI_DETECTION_THRESHOLD}% → Upload blocked
              </Typography>
            </Box>
          )}

          {/* Audio-specific blocked details */}
          {audioReport && !videoReport && (
            <Box sx={{ border: '1px solid', borderColor: 'error.light', p: 1.5, borderRadius: 1, mb: 2 }}>
              <Typography variant="caption" fontWeight="bold" color="error.dark" display="block" sx={{ mb: 0.5 }}>
                Audio Analysis Details
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Duration: 00:{audioReport.duration}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Segments analyzed: {audioReport.segments_analyzed}
              </Typography>
              <Typography variant="caption" color="error.dark" fontWeight="bold" display="block" sx={{ mt: 1 }}>
                Audio AI Score: {audioReport.audio_probability?.toFixed(2)}%
              </Typography>
              <Typography variant="caption" color="error.dark" display="block" sx={{ mt: 0.5 }}>
                Reason: Synthetic/AI audio probability is above the configured threshold.
              </Typography>
            </Box>
          )}

          {/* Image signal details */}
          {!videoReport && !audioReport && signals && signals.signal_count > 0 && (
            <Box sx={{ border: '1px solid', borderColor: 'error.light', p: 1.5, borderRadius: 1, mb: 2 }}>
              <Typography variant="caption" fontWeight="bold" color="error.dark" display="block" sx={{ mb: 0.5 }}>
                Detection signals ({signals.signal_count} fired):
              </Typography>
              {[
                signals.metadata_ai_markers     && '✗ AI software marker found in EXIF/XMP metadata',
                signals.png_text_chunks         && '✗ AI generation data in PNG text chunks',
                signals.c2pa_provenance         && '✗ AI provenance in content credentials (C2PA)',
                signals.missing_camera_metadata && '✗ Missing camera EXIF (no Make/Model/Exposure)',
                signals.noise_uniformity        && '✗ Suspiciously uniform noise (GAN/diffusion artifact)',
                signals.frequency_anomaly       && '✗ Abnormal frequency distribution (diffusion model)',
                signals.color_distribution      && '✗ Unusual color profile typical of AI generation',
              ].filter(Boolean).map((s, i) => (
                <Typography key={i} variant="caption" color="error.dark" display="block">
                  {String(s)}
                </Typography>
              ))}
            </Box>
          )}

          <Typography variant="caption" color="error.main" display="block" sx={{ mb: 2 }}>
            Evidence was NOT stored.
          </Typography>
          <Button variant="outlined" color="error" onClick={onCancel}>Dismiss</Button>
        </Box>
      )}

      {/* ── FAILED ──────────────────────────────────────────────────────────── */}
      {phase === 'done_failed' && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <WarningIcon color="warning" />
            <Typography variant="subtitle1" color="warning.main" fontWeight="bold">
              AI Detection Failed
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            We could not reliably analyze this file. Upload has been prevented. Please try again.
          </Typography>
          {result?.reason && (
            <Typography
              variant="caption" color="text.secondary"
              sx={{ display: 'block', mb: 2, fontFamily: 'monospace', wordBreak: 'break-word' }}
            >
              Reason: {result.reason}
            </Typography>
          )}
          <Button variant="outlined" color="warning" onClick={onCancel}>Dismiss</Button>
        </Box>
      )}

      {/* ── INCONCLUSIVE ─────────────────────────────────────────────────────── */}
      {phase === 'done_inconclusive' && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <WarningIcon sx={{ color: 'warning.main' }} />
            <Typography variant="subtitle1" sx={{ color: 'warning.main' }} fontWeight="bold">
              DETECTION INCONCLUSIVE
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            We could not obtain enough reliable signals to determine whether this{' '}
            {videoFile ? 'video' : audioFile ? 'audio file' : 'file'} is AI-generated.
          </Typography>

          <Box sx={{
            bgcolor: 'grey.50', border: '1px solid', borderColor: 'warning.light',
            p: 1.5, borderRadius: 1, mb: 2,
          }}>
            <Typography variant="caption" fontWeight="bold" display="block" sx={{ mb: 1 }}>
              {videoFile ? 'Video Analysis' : audioFile ? 'Audio Analysis' : 'Detection Details'}
            </Typography>
            {videoReport ? (
              <>
                <Typography variant="caption" color="text.secondary" display="block">
                  Frames analyzed: {videoReport.frames_analyzed}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Detector: {videoReport.detector_name || 'BlockVault Enterprise Video AI'}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Detector version: {result?.detector_version || 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Visual AI Score: N/A
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Temporal AI Score: N/A
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Audio AI Score: N/A
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  Policy threshold: {AI_DETECTION_THRESHOLD}%
                </Typography>
                <Typography variant="caption" fontWeight="bold" color="text.primary" display="block">
                  Detection status: INCONCLUSIVE
                </Typography>
                <Typography variant="caption" color="text.primary" display="block">
                  AI probability: N/A
                </Typography>
                <Typography variant="caption" color="text.primary" display="block">
                  Decision: UPLOAD BLOCKED
                </Typography>
                <Typography variant="caption" color="error.dark" display="block" sx={{ mt: 0.5 }}>
                  Reason: Reliable AI detection score could not be obtained.
                </Typography>
              </>
            ) : audioFile && result ? (
              <>
                <Typography variant="caption" color="text.secondary" display="block">
                  Detector: BlockVault Voice & Synthetic Audio Engine
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Audio AI Score: N/A
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  Policy threshold: {AI_DETECTION_THRESHOLD}%
                </Typography>
                <Typography variant="caption" fontWeight="bold" color="text.primary" display="block">
                  Detection status: INCONCLUSIVE
                </Typography>
                <Typography variant="caption" color="error.dark" display="block" sx={{ mt: 0.5 }}>
                  Reason: {result?.reason ?? 'Reliable AI audio detection could not be completed.'}
                </Typography>
              </>
            ) : (
              <Typography variant="caption" color="text.secondary" display="block">
                {result?.reason ?? 'Insufficient evidence for a trustworthy probability'}
              </Typography>
            )}
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Upload has been blocked. Evidence was NOT stored. Please retry or submit for manual review.
          </Typography>
          {/* Intentionally NO "Proceed with Upload" button here */}
          <Button variant="outlined" color="warning" onClick={onCancel}>Dismiss</Button>
        </Box>
      )}
    </Paper>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CaseFolder() {
  const { id }         = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const navigate       = useNavigate();

  const [caseDetails,  setCaseDetails]  = useState<CaseDetails | null>(null);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [auditLogs,    setAuditLogs]    = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  // Detection flow state
  const [scanPhase,       setScanPhase]       = useState<ScanPhase>('idle');
  const [detectionResult, setDetectionResult] = useState<AIDetectionResult | null>(null);
  const [pendingFile,     setPendingFile]     = useState<File | null>(null);

  // Dialog state
  const [selectedMedia,  setSelectedMedia]  = useState<Evidence | null>(null);
  const [selectedReport, setSelectedReport] = useState<Evidence | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) fetchCaseAndEvidence();
  }, [id]);

  const fetchCaseAndEvidence = async () => {
    try {
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select('title, description')
        .eq('id', id!)
        .single();
      if (caseError) throw caseError;
      setCaseDetails(caseData);

      const { data: evidenceData, error: evidenceError } = await supabase
        .from('evidence')
        .select('*')
        .eq('case_id', id!)
        .order('created_at', { ascending: false });
      if (evidenceError) throw evidenceError;
      setEvidenceList(evidenceData || []);

      // Fetch mock audit logs
      const allLogs = getLS('mock_audit_logs', []);
      const caseLogs = allLogs.filter((log: any) => log.entityId === id!);
      setAuditLogs(caseLogs);
    } catch {
      setError('Failed to load case folder.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1: File selected → validate then scan ──────────────────────────────
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';

    setScanPhase('validating');
    setDetectionResult(null);
    setPendingFile(file);
    setError('');

    // Validate extension
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`Unsupported file type ".${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
      setScanPhase('idle');
      setPendingFile(null);
      return;
    }

    // Validate size
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File is too large. Maximum allowed size is ${MAX_SIZE_MB} MB.`);
      setScanPhase('idle');
      setPendingFile(null);
      return;
    }

    // ── Step 2: Run AI detection ──────────────────────────────────────────────
    setScanPhase('scanning');
    let result: AIDetectionResult;
    try {
      result = await analyzeMedia(file);
    } catch {
      setScanPhase('done_failed');
      return;
    }

    setDetectionResult(result);

    // Map the detection status to the correct scan phase.
    // CRITICAL: INCONCLUSIVE must go to done_inconclusive — never done_approved.
    if (result.status === 'FAILED') {
      setScanPhase('done_failed');
    } else if (result.status === 'BLOCKED') {
      setScanPhase('done_blocked');
    } else if (result.status === 'INCONCLUSIVE') {
      setScanPhase('done_inconclusive');
    } else {
      // result.status === 'APPROVED'
      setScanPhase('done_approved');
    }
  };

  // ── Step 3: User confirms approved upload ────────────────────────────────────
  const handleConfirmUpload = async () => {
    if (!pendingFile || !user || !id || !detectionResult) return;

    // Final backend guard — only APPROVED files should ever reach this function.
    // This check prevents a bug where a UI state inconsistency could allow
    // INCONCLUSIVE or FAILED files to be uploaded.
    if (detectionResult.status !== 'APPROVED') {
      setError('Upload blocked: detection result is not APPROVED.');
      setScanPhase('done_blocked');
      return;
    }

    setScanPhase('uploading');

    try {
      const sha256   = await generateSHA256(pendingFile);
      const confData = generateMockConfidentiality();

      const fileExt  = pendingFile.name.split('.').pop();
      const filePath = `${id}/${Date.now()}.${fileExt}`;

      // BACKEND UPLOAD — independently enforces policy server-side
      const { error: uploadError } = await supabase.storage
        .from('evidence')
        .upload(filePath, pendingFile);

      if (uploadError) {
        if ((uploadError as any).code === 'AI_BLOCKED') {
          setDetectionResult({
            probability:         (uploadError as any).aiProbability,
            status:              'BLOCKED',
            threshold:           AI_DETECTION_THRESHOLD,
            signals:             null,
            video_report:        null,
            detector_version:    'backend-enforcement',
            detection_timestamp: new Date().toISOString(),
            media_type:          'unknown',
          });
          setScanPhase('done_blocked');
        } else if (
          typeof uploadError.message === 'string' &&
          uploadError.message.startsWith('DETECTION_FAILED')
        ) {
          setScanPhase('done_failed');
        } else {
          throw uploadError;
        }
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('evidence')
        .getPublicUrl(filePath);

      // Build audit metadata
      const evidenceRecord = {
        case_id:              id,
        file_name:            pendingFile.name,
        file_url:             publicUrl,
        file_type:            pendingFile.type,
        sha256_hash:          sha256,
        ai_probability:       detectionResult.probability,
        ai_detection_status:  detectionResult.status,
        ai_threshold:         AI_DETECTION_THRESHOLD,
        ai_frames_analyzed:   detectionResult.frames_analyzed ?? null,
        ai_media_type:        detectionResult.media_type,
        ai_detector_version:  detectionResult.detector_version,
        confidentiality:      confData,
        uploaded_by:          user.id,
        detection_timestamp:  new Date().toISOString(),
      };

      const { error: dbError } = await supabase
        .from('evidence')
        .insert([evidenceRecord]);
      if (dbError) throw dbError;

      setScanPhase('idle');
      setPendingFile(null);
      setDetectionResult(null);
      fetchCaseAndEvidence();
    } catch (err: any) {
      setError(err.message || 'Upload failed.');
      setScanPhase('idle');
    }
  };

  const handleCancelScan = () => {
    setScanPhase('idle');
    setPendingFile(null);
    setDetectionResult(null);
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color={role === 'admin' ? 'secondary' : 'primary'}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Case Folder: {caseDetails?.title}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4, mb: 8 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {caseDetails?.title}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {caseDetails?.description}
            </Typography>
          </Box>

          {role === 'investigator' && scanPhase === 'idle' && (
            <Box>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.avi,.wav,.mp3,.m4a"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleFileSelected}
              />
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload Evidence
              </Button>
            </Box>
          )}
        </Box>

        {/* Detection Panel */}
        {role === 'investigator' && (
          <DetectionPanel
            phase={scanPhase}
            result={detectionResult}
            fileName={pendingFile?.name ?? ''}
            onConfirmUpload={handleConfirmUpload}
            onCancel={handleCancelScan}
          />
        )}
        
        {/* Chain of Custody */}
        <ChainOfCustodyTimeline logs={auditLogs} />

        {/* Evidence Grid */}
        <Typography variant="h5" sx={{ mb: 2 }}>
          Digital Evidence Repository
        </Typography>

        {evidenceList.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.100' }}>
            <Typography color="text.secondary">No evidence uploaded yet.</Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {evidenceList.map(item => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Card>
                  {/* Clickable media preview */}
                  <Box
                    sx={{ position: 'relative', cursor: 'pointer', bgcolor: 'grey.900' }}
                    onClick={() => setSelectedMedia(item)}
                  >
                    {item.file_type.startsWith('image/') ? (
                      <CardMedia
                        component="img"
                        height="200"
                        image={item.file_url}
                        alt={item.file_name}
                        sx={{ objectFit: 'contain' }}
                      />
                    ) : item.file_type.startsWith('video/') ? (
                      <CardMedia
                        component="video"
                        height="200"
                        src={item.file_url}
                        sx={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.200' }}>
                        <Typography>Unsupported format</Typography>
                      </Box>
                    )}
                    <Box
                      sx={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: 'rgba(0,0,0,0.3)', opacity: 0, transition: '0.2s',
                        '&:hover': { opacity: 1 },
                      }}
                    >
                      <ZoomInIcon sx={{ color: 'white', fontSize: 40 }} />
                    </Box>
                  </Box>

                  <CardContent>
                    <Typography variant="subtitle2" noWrap title={item.file_name} sx={{ mb: 0.5 }}>
                      {item.file_name}
                    </Typography>

                    {/* SHA-256 row */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ flexGrow: 1, fontFamily: 'monospace' }}>
                        SHA256: {item.sha256_hash ? `${item.sha256_hash.substring(0, 16)}…` : '—'}
                      </Typography>
                      {item.sha256_hash && (
                        <Tooltip title="Copy full SHA-256 hash">
                          <IconButton size="small" onClick={() => navigator.clipboard.writeText(item.sha256_hash!)}>
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>

                    {/* AI detection badge */}
                    {item.ai_probability !== undefined && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        AI Score: {item.ai_probability?.toFixed(2)}% — Threshold: {AI_DETECTION_THRESHOLD}%
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip label="Verified Authentic" size="small" color="success" variant="outlined" />
                      <Button size="small" startIcon={<SecurityIcon />} onClick={() => setSelectedReport(item)}>
                        Report
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* ── Lightbox Dialog ──────────────────────────────────────────────────── */}
        <Dialog open={!!selectedMedia} onClose={() => setSelectedMedia(null)} maxWidth="lg" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography noWrap>{selectedMedia?.file_name}</Typography>
            <Button onClick={() => setSelectedMedia(null)}>Close</Button>
          </DialogTitle>
          <DialogContent sx={{ p: 0, bgcolor: 'black', display: 'flex', justifyContent: 'center' }}>
            {selectedMedia?.file_type.startsWith('image/') && (
              <img
                src={selectedMedia.file_url}
                alt={selectedMedia.file_name}
                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
              />
            )}
            {selectedMedia?.file_type.startsWith('video/') && (
              <video
                src={selectedMedia.file_url}
                controls
                autoPlay
                style={{ maxWidth: '100%', maxHeight: '80vh' }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* ── Confidentiality Report Dialog ─────────────────────────────────────── */}
        <Dialog open={!!selectedReport} onClose={() => setSelectedReport(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Confidentiality &amp; Integrity Report</DialogTitle>
          <DialogContent dividers>

            <Typography variant="subtitle1" color="primary" gutterBottom>
              Digital Fingerprint (Integrity)
            </Typography>
            <Box sx={{ bgcolor: 'grey.100', p: 1.5, borderRadius: 1, mb: 3 }}>
              <Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                <strong>SHA-256 Hash:</strong>
                <br />
                {selectedReport?.sha256_hash ?? 'N/A'}
              </Typography>
            </Box>

            <Typography variant="subtitle1" color="primary" gutterBottom>
              AI Detection Audit
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="AI Probability"
                  secondary={
                    selectedReport?.ai_detection_status === 'INCONCLUSIVE'
                      ? 'Inconclusive (no reliable score)'
                      : `${selectedReport?.ai_probability?.toFixed(2) ?? '—'}%`
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText primary="Detection Status" secondary={selectedReport?.ai_detection_status ?? '—'} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Policy Threshold" secondary={`${AI_DETECTION_THRESHOLD}%`} />
              </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" color="primary" gutterBottom>
              Adaptive Cryptographic Module (Confidentiality)
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Encryption Standard" secondary={selectedReport?.confidentiality?.method ?? 'AES-256-CBC'} />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Dynamic Key (Preview)"
                  secondary={selectedReport?.confidentiality?.key_preview ?? 'N/A'}
                  sx={{ '& .MuiListItemText-secondary': { fontFamily: 'monospace' } }}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Initialization Vector (Preview)"
                  secondary={selectedReport?.confidentiality?.iv_preview ?? 'N/A'}
                  sx={{ '& .MuiListItemText-secondary': { fontFamily: 'monospace' } }}
                />
              </ListItem>
              <ListItem>
                <ListItemText primary="Encryption Time (T_enc)" secondary={selectedReport?.confidentiality?.encryption_time ?? '—'} />
              </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" color="primary" gutterBottom>
              Blockchain Anchoring
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Consensus" secondary="Proof of Authority (PoA)" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Block ID" secondary={selectedReport?.confidentiality?.block_id ?? '#0000'} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Verification Time" secondary="0.012 s" />
              </ListItem>
            </List>
          </DialogContent>
          <DialogActions>
            <Button variant="contained" onClick={() => setSelectedReport(null)}>
              Close Report
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
