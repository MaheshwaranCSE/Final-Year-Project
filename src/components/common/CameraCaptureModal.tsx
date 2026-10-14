import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Camera,
  RefreshCw,
  Check,
  X,
  FlipHorizontal,
  VideoOff,
  ShieldCheck,
  Maximize2,
} from 'lucide-react';

interface CameraCaptureModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  open,
  onClose,
  onCapture,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isMirrored, setIsMirrored] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraLabel, setCameraLabel] = useState<string>('Optical Camera');
  const [liveTimestamp, setLiveTimestamp] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Live timestamp timer
  useEffect(() => {
    if (!open) return;
    const updateTime = () => {
      setLiveTimestamp(new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [open]);

  // Start Camera Stream
  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    setError(null);
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      let newStream: MediaStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch {
        // Fallback to any available video device
        newStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      setStream(newStream);

      // Track label
      const videoTrack = newStream.getVideoTracks()[0];
      if (videoTrack) {
        setCameraLabel(videoTrack.label || (mode === 'environment' ? 'Rear Camera' : 'Front / Webcam'));
      }

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error('Camera initialization error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera device detected on this workstation.');
      } else {
        setError(`Unable to access camera: ${err.message || 'Unknown device error'}`);
      }
    }
  }, [stream]);

  // Manage stream lifecycle on open/close
  useEffect(() => {
    if (open) {
      setCapturedBlob(null);
      setCapturedUrl(null);
      startCamera(facingMode);
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      if (capturedUrl) {
        URL.revokeObjectURL(capturedUrl);
        setCapturedUrl(null);
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [open]);

  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture frame
  const handleSnap = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setCapturedBlob(blob);
        const url = URL.createObjectURL(blob);
        setCapturedUrl(url);
      },
      'image/jpeg',
      0.95
    );
  };

  const handleRetake = () => {
    if (capturedUrl) {
      URL.revokeObjectURL(capturedUrl);
    }
    setCapturedBlob(null);
    setCapturedUrl(null);
    startCamera(facingMode);
  };

  const handleConfirm = () => {
    if (!capturedBlob) return;
    const timestampStr = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '_')
      .slice(0, 15);
    const filename = `camera_optical_capture_${timestampStr}.jpg`;

    const file = new File([capturedBlob], filename, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });

    onCapture(file);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#0C101D',
          color: '#F8FAFC',
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.1)',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              bgcolor: 'rgba(6,182,212,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(6,182,212,0.3)',
            }}
          >
            <Camera size={20} color="#22D3EE" />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#F8FAFC' }}>
              Forensic Optical Camera Capture
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
              Direct physical evidence acquisition via optical camera sensor
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: '#94A3B8' }}>
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error ? (
          <Alert
            severity="error"
            icon={<VideoOff size={20} />}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => startCamera(facingMode)}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Retry
              </Button>
            }
            sx={{
              bgcolor: 'rgba(239, 68, 68, 0.12)',
              color: '#FCA5A5',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              mb: 2,
            }}
          >
            {error}
          </Alert>
        ) : null}

        {/* Viewfinder Area */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: 440,
            bgcolor: '#040711',
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid rgba(6,182,212,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {capturedUrl ? (
            // Captured photo review
            <img
              src={capturedUrl}
              alt="Captured Forensic Evidence"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          ) : (
            // Live video stream
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: isMirrored ? 'scaleX(-1)' : 'none',
                }}
              />

              {/* Forensic Viewfinder Overlay / Reticle */}
              <Box
                sx={{
                  position: 'absolute',
                  inset: 20,
                  border: '1px dashed rgba(6,182,212,0.4)',
                  borderRadius: 1.5,
                  pointerEvents: 'none',
                }}
              >
                {/* Corner markers */}
                <Box sx={{ position: 'absolute', top: -1, left: -1, width: 16, height: 16, borderTop: '3px solid #22D3EE', borderLeft: '3px solid #22D3EE' }} />
                <Box sx={{ position: 'absolute', top: -1, right: -1, width: 16, height: 16, borderTop: '3px solid #22D3EE', borderRight: '3px solid #22D3EE' }} />
                <Box sx={{ position: 'absolute', bottom: -1, left: -1, width: 16, height: 16, borderBottom: '3px solid #22D3EE', borderLeft: '3px solid #22D3EE' }} />
                <Box sx={{ position: 'absolute', bottom: -1, right: -1, width: 16, height: 16, borderBottom: '3px solid #22D3EE', borderRight: '3px solid #22D3EE' }} />

                {/* Center crosshair */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Box sx={{ width: 12, height: 1, bgcolor: 'rgba(34,211,238,0.7)' }} />
                  <Box sx={{ width: 1, height: 12, bgcolor: 'rgba(34,211,238,0.7)', position: 'absolute' }} />
                </Box>
              </Box>

              {/* Live Info Bar on Top */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  right: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 1.5,
                  py: 0.75,
                  bgcolor: 'rgba(6,9,17,0.75)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 1,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: '#EF4444',
                      animation: 'pulse 1.5s infinite',
                    }}
                  />
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#F8FAFC' }}>
                    LIVE SENSOR
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.72rem' }}>
                    • {cameraLabel}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#22D3EE', fontSize: '0.75rem' }}>
                  {liveTimestamp}
                </Typography>
              </Box>

              {/* Viewfinder Controls on Bottom */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 12,
                  left: 12,
                  display: 'flex',
                  gap: 1,
                }}
              >
                <Tooltip title="Switch Camera (Front/Rear)">
                  <IconButton
                    size="small"
                    onClick={handleToggleFacingMode}
                    sx={{
                      bgcolor: 'rgba(6,9,17,0.75)',
                      color: '#F8FAFC',
                      border: '1px solid rgba(255,255,255,0.15)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
                    }}
                  >
                    <RefreshCw size={14} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Toggle Mirror View">
                  <IconButton
                    size="small"
                    onClick={() => setIsMirrored(!isMirrored)}
                    sx={{
                      bgcolor: isMirrored ? 'rgba(6,182,212,0.3)' : 'rgba(6,9,17,0.75)',
                      color: isMirrored ? '#22D3EE' : '#F8FAFC',
                      border: '1px solid rgba(255,255,255,0.15)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
                    }}
                  >
                    <FlipHorizontal size={14} />
                  </IconButton>
                </Tooltip>
              </Box>
            </>
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </Box>

        {/* Status Caption */}
        <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShieldCheck size={14} color="#10B981" />
            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.75rem' }}>
              Images acquired live inherit genuine optical sensor characteristics (PRNU & noise variance)
            </Typography>
          </Box>
          {capturedBlob && (
            <Typography variant="caption" sx={{ color: '#22D3EE', fontFamily: 'monospace', fontWeight: 600 }}>
              {(capturedBlob.size / 1024).toFixed(1)} KB (High Quality JPEG)
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {capturedBlob ? (
          <>
            <Button
              variant="outlined"
              onClick={handleRetake}
              startIcon={<RefreshCw size={15} />}
              sx={{
                color: '#94A3B8',
                borderColor: 'rgba(255,255,255,0.2)',
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Retake Photo
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirm}
              startIcon={<Check size={16} />}
              sx={{
                bgcolor: '#06B6D4',
                color: '#060911',
                textTransform: 'none',
                fontWeight: 700,
                '&:hover': { bgcolor: '#22D3EE' },
              }}
            >
              Accept & Stage in Evidence Vault
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="text"
              onClick={onClose}
              sx={{ color: '#94A3B8', textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSnap}
              disabled={Boolean(error) || !stream}
              startIcon={<Camera size={16} />}
              sx={{
                bgcolor: '#2563EB',
                color: '#F8FAFC',
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
                '&:hover': { bgcolor: '#1D4ED8' },
              }}
            >
              Capture Evidence Photo
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};
