import React from 'react';
import { Box, Typography, Stack, useTheme, useMediaQuery } from '@mui/material';
import { AlertTriangle, Hash, ShieldAlert, ArrowRight, ArrowDown } from 'lucide-react';
import { tokens } from '../theme/theme';
import SectionContainer from './common/SectionContainer';
import SectionHeading from './common/SectionHeading';
import GlassCard from './common/GlassCard';
import StatusBadge from './common/StatusBadge';
import AnimatedSection from './common/AnimatedSection';

const FlowStep = ({ label, color = tokens.colors.border.subtle, active = false, isLast = false, icon: Icon = null }: any) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center' }}>
      <Box
        sx={{
          px: 2,
          py: 1,
          borderRadius: `${tokens.radius.sm}px`,
          border: `1px solid ${active ? color : tokens.colors.border.subtle}`,
          backgroundColor: active ? `${color}15` : tokens.glass.background,
          color: active ? color : tokens.colors.text.secondary,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontFamily: tokens.fonts.mono,
          fontSize: '0.75rem',
          whiteSpace: 'nowrap',
          boxShadow: active ? `0 0 10px ${color}30` : 'none',
        }}
      >
        {Icon && <Icon size={14} />}
        {label}
      </Box>
      {!isLast && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: tokens.colors.text.muted,
            my: isMobile ? 1 : 0,
            mx: isMobile ? 0 : 1,
          }}
        >
          {isMobile ? <ArrowDown size={16} /> : <ArrowRight size={16} />}
        </Box>
      )}
    </Box>
  );
};

const TamperDetection: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <SectionContainer id="tamper-detection">
      <AnimatedSection>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <StatusBadge label="DEMO SCENARIO" variant="warning" pulse />
        </Box>
        <SectionHeading
          badge="INTEGRITY VERIFICATION"
          title="Detect Integrity Violations Before They Become Evidence Problems"
          align="center"
        />

        <Box sx={{ mt: 6 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={4}
            alignItems="stretch"
            justifyContent="center"
          >
            {/* Original Hash */}
            <Box sx={{ flex: 1, display: 'flex' }}>
              <GlassCard
                sx={{
                  flex: 1,
                  borderTop: `4px solid ${tokens.colors.accent.green}`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="overline" sx={{ color: tokens.colors.text.secondary, fontWeight: 600 }}>
                    ORIGINAL / ANCHORED HASH
                  </Typography>
                  <StatusBadge label="ANCHORED" variant="success" size="small" />
                </Box>
                <Box
                  sx={{
                    fontFamily: tokens.fonts.mono,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    color: tokens.colors.accent.green,
                    wordBreak: 'break-all',
                    p: 2,
                    backgroundColor: `${tokens.colors.accent.green}08`,
                    borderRadius: `${tokens.radius.sm}px`,
                    border: `1px dashed ${tokens.colors.accent.green}40`,
                  }}
                >
                  8f4a92d7e1b3c5f6a8d2e4b7c9f1a3d5e7b2c4f6a8d1e3b5c7f9a2d4e6b8c1
                </Box>
              </GlassCard>
            </Box>

            {/* Current Hash */}
            <Box sx={{ flex: 1, display: 'flex' }}>
              <GlassCard
                glowColor={tokens.colors.glow.red}
                sx={{
                  flex: 1,
                  borderTop: `4px solid ${tokens.colors.accent.red}`,
                  position: 'relative',
                  overflow: 'hidden',
                  animation: 'pulse-border 2s infinite',
                  '@keyframes pulse-border': {
                    '0%': { borderColor: tokens.colors.accent.red, boxShadow: `0 0 0 ${tokens.colors.accent.red}00` },
                    '50%': { borderColor: '#ff6b6b', boxShadow: `0 0 15px ${tokens.colors.accent.red}60` },
                    '100%': { borderColor: tokens.colors.accent.red, boxShadow: `0 0 0 ${tokens.colors.accent.red}00` },
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="overline" sx={{ color: tokens.colors.text.secondary, fontWeight: 600 }}>
                    CURRENT / RECALCULATED HASH
                  </Typography>
                  <StatusBadge label="MODIFIED" variant="error" size="small" />
                </Box>
                <Box
                  sx={{
                    fontFamily: tokens.fonts.mono,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    color: tokens.colors.text.primary,
                    wordBreak: 'break-all',
                    p: 2,
                    backgroundColor: `${tokens.colors.accent.red}08`,
                    borderRadius: `${tokens.radius.sm}px`,
                    border: `1px dashed ${tokens.colors.accent.red}40`,
                  }}
                >
                  8f4a92d7e1b3c5f6a8d2e4b7c9f1a3d5e7b2c4f6a8d1e3b5c7f9a2d4e6b<Box component="span" sx={{ color: tokens.colors.accent.red, fontWeight: 'bold', backgroundColor: `${tokens.colors.accent.red}20`, px: 0.5, borderRadius: '2px' }}>883f1</Box>
                </Box>
              </GlassCard>
            </Box>
          </Stack>

          {/* Mismatch Alert Box */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <GlassCard
              sx={{
                maxWidth: '600px',
                width: '100%',
                backgroundColor: `${tokens.colors.accent.red}10`,
                borderColor: `${tokens.colors.accent.red}40`,
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                p: 3,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 64,
                  minHeight: 64,
                  borderRadius: '50%',
                  backgroundColor: `${tokens.colors.accent.red}20`,
                  color: tokens.colors.accent.red,
                }}
              >
                <AlertTriangle size={32} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ color: tokens.colors.accent.red, fontWeight: 700, mb: 0.5 }}>
                  HASH MISMATCH
                </Typography>
                <Typography variant="body1" sx={{ color: tokens.colors.text.secondary }}>
                  Potential evidence modification detected. The recalculated hash does not match the anchored hash.
                </Typography>
              </Box>
            </GlassCard>
          </Box>

          {/* Alert Flow */}
          <Box sx={{ mt: 6 }}>
            <Typography variant="subtitle2" align="center" sx={{ color: tokens.colors.text.muted, mb: 3, letterSpacing: 1 }}>
              AUTOMATED RESPONSE FLOW
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: { xs: 0, md: 0 },
              }}
            >
              <FlowStep label="Anchored Hash" icon={Hash} />
              <FlowStep label="Current Hash" icon={Hash} />
              <FlowStep label="Compare" />
              <FlowStep label="Mismatch" color={tokens.colors.accent.red} active />
              <FlowStep label="TAMPER ALERT" color={tokens.colors.accent.red} active icon={ShieldAlert} />
              <FlowStep label="AUDIT EVENT" color={tokens.colors.accent.amber} active isLast />
            </Box>
          </Box>
        </Box>
      </AnimatedSection>
    </SectionContainer>
  );
};

export default TamperDetection;
