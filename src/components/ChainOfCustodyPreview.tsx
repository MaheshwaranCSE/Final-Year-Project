import React from 'react';
import { Box, Typography, Stack, useTheme, useMediaQuery } from '@mui/material';
import SectionContainer from './common/SectionContainer';
import SectionHeading from './common/SectionHeading';
import StatusBadge from './common/StatusBadge';
import GlassCard from './common/GlassCard';
import AnimatedSection from './common/AnimatedSection';
import { tokens } from '../theme/theme';

interface CustodyEvent {
  timestamp: string;
  actor: string;
  action: string;
  evidenceId: string;
  status: 'success' | 'info' | 'error' | 'warning' | 'neutral';
}

const DEMO_EVENTS: CustodyEvent[] = [
  {
    timestamp: '2026-03-15 09:24:18 UTC',
    actor: 'Det. Sarah Chen',
    action: 'Evidence Acquired',
    evidenceId: 'EVD-2026-0248',
    status: 'success',
  },
  {
    timestamp: '2026-03-15 09:24:19 UTC',
    actor: 'System',
    action: 'SHA-256 Hash Generated',
    evidenceId: 'EVD-2026-0248',
    status: 'success',
  },
  {
    timestamp: '2026-03-15 09:24:22 UTC',
    actor: 'System',
    action: 'Evidence Encrypted (AES-256)',
    evidenceId: 'EVD-2026-0248',
    status: 'success',
  },
  {
    timestamp: '2026-03-15 09:24:31 UTC',
    actor: 'System',
    action: 'Blockchain Anchored',
    evidenceId: 'EVD-2026-0248',
    status: 'info',
  },
  {
    timestamp: '2026-03-15 14:12:05 UTC',
    actor: 'Forensic Analyst M. Torres',
    action: 'Evidence Accessed',
    evidenceId: 'EVD-2026-0248',
    status: 'info',
  },
  {
    timestamp: '2026-03-15 14:12:06 UTC',
    actor: 'System',
    action: 'Integrity Verification — PASSED',
    evidenceId: 'EVD-2026-0248',
    status: 'success',
  },
];

export default function ChainOfCustodyPreview() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <SectionContainer>
      <Box sx={{ position: 'relative', mb: 6 }}>
        <Box sx={{ position: 'absolute', top: 0, right: 0, zIndex: 2 }}>
          <StatusBadge label="DEMO DATA" variant="warning" />
        </Box>
        <SectionHeading
          badge="CHAIN OF CUSTODY"
          title="Every Evidence Event. Accounted For."
        />
      </Box>

      <AnimatedSection>
        <GlassCard sx={{ p: { xs: 2, sm: 4, md: 5 } }}>
          <Box sx={{ position: 'relative' }}>
            {/* Timeline Line */}
            <Box
              sx={{
                position: 'absolute',
                top: 24,
                bottom: 24,
                left: { xs: 16, sm: 24 },
                width: 2,
                backgroundColor: tokens.colors.border.subtle,
                zIndex: 0,
              }}
            />

            <Stack spacing={4}>
              {DEMO_EVENTS.map((event, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {/* Timeline Dot */}
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor:
                        event.status === 'success'
                          ? tokens.colors.accent.green
                          : event.status === 'info'
                          ? tokens.colors.accent.blue
                          : tokens.colors.accent.amber,
                      border: `2px solid ${tokens.colors.card}`,
                      mt: 3,
                      ml: { xs: '11px', sm: '19px' },
                      mr: { xs: 2, sm: 4 },
                      flexShrink: 0,
                      boxShadow: `0 0 8px ${
                        event.status === 'success'
                          ? tokens.colors.glow.green
                          : event.status === 'info'
                          ? tokens.colors.glow.blue
                          : tokens.colors.accent.amber
                      }`,
                    }}
                  />

                  {/* Event Content */}
                  <GlassCard
                    hover
                    sx={{
                      flex: 1,
                      p: 3,
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    }}
                  >
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      spacing={{ xs: 2, md: 4 }}
                      alignItems={{ xs: 'flex-start', md: 'center' }}
                      justifyContent="space-between"
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            color: tokens.colors.text.primary,
                            fontWeight: 600,
                            mb: 0.5,
                          }}
                        >
                          {event.action}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: tokens.fonts.mono,
                            color: tokens.colors.text.secondary,
                            fontSize: '0.8125rem',
                            mb: { xs: 1, md: 0 },
                          }}
                        >
                          {event.timestamp}
                        </Typography>
                      </Box>

                      {!isMobile && (
                        <>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="body2"
                              sx={{ color: tokens.colors.text.muted, mb: 0.5 }}
                            >
                              Actor
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: tokens.colors.text.primary }}
                            >
                              {event.actor}
                            </Typography>
                          </Box>

                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="body2"
                              sx={{ color: tokens.colors.text.muted, mb: 0.5 }}
                            >
                              Evidence ID
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: tokens.fonts.mono,
                                color: tokens.colors.text.primary,
                              }}
                            >
                              {event.evidenceId}
                            </Typography>
                          </Box>
                        </>
                      )}

                      <Box sx={{ flexShrink: 0 }}>
                        <StatusBadge
                          label={event.status === 'success' ? 'VERIFIED' : 'SYSTEM'}
                          variant={event.status}
                          size="sm"
                        />
                      </Box>
                    </Stack>
                  </GlassCard>
                </Box>
              ))}
            </Stack>
          </Box>
        </GlassCard>
      </AnimatedSection>
    </SectionContainer>
  );
};
