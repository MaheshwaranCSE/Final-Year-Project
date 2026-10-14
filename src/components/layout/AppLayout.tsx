import React, { useState, useEffect } from 'react';
import {
  Box,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Typography,
  Stack,
} from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useForensicStore } from '../../stores/useForensicStore';
import { AlertOctagon, ArrowRight, Shield, UserCheck } from 'lucide-react';
import { UserRole } from '../../types';

export const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const {
    evidence,
    isOperatorConfigured,
    registerUser,
    initializeLedger,
  } = useForensicStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Operator Credential Provisioning state (user-provided only, zero defaults)
  const [opName, setOpName] = useState('');
  const [opEmail, setOpEmail] = useState('');
  const [opBadge, setOpBadge] = useState('');
  const [opDepartment, setOpDepartment] = useState('');
  const [opRole, setOpRole] = useState<UserRole>('INVESTIGATOR');
  const [opError, setOpError] = useState('');

  useEffect(() => {
    initializeLedger();
  }, [initializeLedger]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProvisionOperator = () => {
    if (!opName.trim() || !opEmail.trim() || !opBadge.trim() || !opDepartment.trim()) {
      setOpError('All operator credential fields are required to initialize an authenticated forensic session.');
      return;
    }
    setOpError('');
    registerUser(
      {
        name: opName.trim(),
        email: opEmail.trim(),
        badgeNumber: opBadge.trim(),
        department: opDepartment.trim(),
        role: opRole,
      },
      true
    );
  };

  const tamperedCount = evidence.filter((e) => e.integrityStatus === 'TAMPERED').length;
  const isIntegrityPage = location.pathname.includes('/integrity');

  return (
    <div className="min-h-screen bg-[#060911] text-[#E6EAF2] flex w-full overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 main-shell-padding transition-[padding] duration-200">
        <Header onToggleSidebar={handleDrawerToggle} />

        {/* Global Security Alert Banner if any evidence failed verification */}
        {tamperedCount > 0 && !isIntegrityPage && (
          <div className="px-4 sm:px-6 lg:px-8 pt-4">
            <div className="max-w-7xl mx-auto">
              <Alert
                severity="error"
                icon={<AlertOctagon size={20} color="#EF4444" />}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => navigate('/integrity')}
                    endIcon={<ArrowRight size={14} />}
                    sx={{ fontWeight: 600, textTransform: 'none', borderRadius: 1.5 }}
                  >
                    Open Integrity Workbench
                  </Button>
                }
                sx={{
                  bgcolor: 'rgba(239, 68, 68, 0.1)',
                  color: '#FCA5A5',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: 2,
                  fontWeight: 600,
                  '& .MuiAlert-icon': { alignItems: 'center' },
                }}
              >
                CRYPTOGRAPHIC INTEGRITY ALERT: {tamperedCount} evidence record(s) reported a SHA-256 verification mismatch.
              </Alert>
            </div>
          </div>
        )}

        {/* Content Outlet */}
        <main className="flex-1 flex flex-col bg-[#060911]">
          <Outlet />
        </main>
      </div>

      {/* Initial Operator Credential Provisioning Modal (Required when no operator exists) */}
      <Dialog
        open={!isOperatorConfigured}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            bgcolor: '#0C101D',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 3,
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.85), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
            color: '#F8FAFC',
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            pb: 2.2,
            pt: 2.5,
            px: 3,
          }}
        >
          <Stack direction="row" spacing={1.75} alignItems="center">
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                bgcolor: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                shrink: 0,
              }}
            >
              <Shield size={20} color="#06B6D4" strokeWidth={2.2} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2, color: '#FFFFFF', fontSize: '1.05rem' }}>
                Operator Credential Provisioning
              </Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '0.78rem' }}>
                Initialize authenticated examiner identity for this session
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ pt: '24px !important', px: 3 }}>
          <Typography variant="body2" sx={{ color: '#94A3B8', mb: 2.5, lineHeight: 1.6, fontSize: '0.82rem' }}>
            Enter your investigator credentials to initialize the forensic workspace. Your identity, badge number, and department will be cryptographically bound to all case records, SHA-256 evidence intakes, chain-of-custody transfers, and Proof-of-Authority blockchain blocks.
          </Typography>

          {opError && (
            <Alert severity="error" sx={{ mb: 2.5, bgcolor: 'rgba(239, 68, 68, 0.12)', color: '#FCA5A5', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 2 }}>
              {opError}
            </Alert>
          )}

          <Stack spacing={2.2}>
            <TextField
              label="Full Legal Name & Rank / Title"
              placeholder="Enter your full name"
              fullWidth
              required
              size="small"
              value={opName}
              onChange={(e) => setOpName(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#060911',
                  borderRadius: 2,
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.08)' },
                  '&:hover fieldset': { borderColor: 'rgba(6, 182, 212, 0.4)' },
                  '&.Mui-focused fieldset': { borderColor: '#06B6D4' },
                },
                '& .MuiInputLabel-root': { color: '#94A3B8' },
                '& .MuiInputBase-input': { color: '#FFFFFF', fontSize: '0.85rem' }
              }}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Badge / Credential Number"
                placeholder="Enter badge or credential ID"
                fullWidth
                required
                size="small"
                value={opBadge}
                onChange={(e) => setOpBadge(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#060911',
                    borderRadius: 2,
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.08)' },
                    '&:hover fieldset': { borderColor: 'rgba(6, 182, 212, 0.4)' },
                    '&.Mui-focused fieldset': { borderColor: '#06B6D4' },
                  },
                  '& .MuiInputLabel-root': { color: '#94A3B8' },
                  '& .MuiInputBase-input': { color: '#FFFFFF', fontSize: '0.85rem' }
                }}
              />
              <TextField
                select
                label="Operational Role"
                fullWidth
                required
                size="small"
                value={opRole}
                onChange={(e) => setOpRole(e.target.value as UserRole)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#060911',
                    borderRadius: 2,
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.08)' },
                    '&:hover fieldset': { borderColor: 'rgba(6, 182, 212, 0.4)' },
                    '&.Mui-focused fieldset': { borderColor: '#06B6D4' },
                  },
                  '& .MuiInputLabel-root': { color: '#94A3B8' },
                  '& .MuiInputBase-input': { color: '#FFFFFF', fontSize: '0.85rem' }
                }}
              >
                <MenuItem value="SUPER_ADMIN">SUPER_ADMIN (Full System & Ledger Authority)</MenuItem>
                <MenuItem value="ADMIN">ADMIN (Case & User Administration)</MenuItem>
                <MenuItem value="INVESTIGATOR">INVESTIGATOR (Evidence Intake, Custody & Analysis)</MenuItem>
                <MenuItem value="REVIEWER">REVIEWER (Judicial / Audit Verification & Read-Only)</MenuItem>
              </TextField>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Department / Forensic Unit"
                placeholder="Enter agency or laboratory division"
                fullWidth
                required
                size="small"
                value={opDepartment}
                onChange={(e) => setOpDepartment(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#060911',
                    borderRadius: 2,
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.08)' },
                    '&:hover fieldset': { borderColor: 'rgba(6, 182, 212, 0.4)' },
                    '&.Mui-focused fieldset': { borderColor: '#06B6D4' },
                  },
                  '& .MuiInputLabel-root': { color: '#94A3B8' },
                  '& .MuiInputBase-input': { color: '#FFFFFF', fontSize: '0.85rem' }
                }}
              />
              <TextField
                label="Official Email Address"
                placeholder="Enter official email"
                type="email"
                fullWidth
                required
                size="small"
                value={opEmail}
                onChange={(e) => setOpEmail(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#060911',
                    borderRadius: 2,
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.08)' },
                    '&:hover fieldset': { borderColor: 'rgba(6, 182, 212, 0.4)' },
                    '&.Mui-focused fieldset': { borderColor: '#06B6D4' },
                  },
                  '& .MuiInputLabel-root': { color: '#94A3B8' },
                  '& .MuiInputBase-input': { color: '#FFFFFF', fontSize: '0.85rem' }
                }}
              />
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2.2,
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            bgcolor: 'rgba(6, 9, 17, 0.6)',
          }}
        >
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={<UserCheck size={18} />}
            onClick={handleProvisionOperator}
            sx={{
              bgcolor: '#2563EB',
              color: '#FFFFFF',
              fontWeight: 600,
              py: 1.2,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '0.88rem',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#1D4ED8',
                boxShadow: 'none',
              },
            }}
          >
            Initialize Forensic Session
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
