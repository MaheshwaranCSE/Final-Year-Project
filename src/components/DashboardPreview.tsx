import React from 'react';
import { Box, Typography, Grid, Stack, Divider } from '@mui/material';
import { Briefcase, FileText, ShieldCheck, AlertTriangle } from 'lucide-react';
import SectionContainer from './common/SectionContainer';
import SectionHeading from './common/SectionHeading';
import StatusBadge from './common/StatusBadge';
import GlassCard from './common/GlassCard';
import AnimatedSection from './common/AnimatedSection';
import IconBox from './common/IconBox';
import { tokens } from '../theme/theme';

export default function DashboardPreview() {
  return (
    <SectionContainer>
      <Box sx={{ position: 'relative', mb: 6 }}>
        <Box sx={{ position: 'absolute', top: 0, right: 0, zIndex: 2 }}>
          <StatusBadge label="SAMPLE DATA" variant="warning" />
        </Box>
        <SectionHeading
          badge="PLATFORM PREVIEW"
          title="Forensic Evidence Dashboard"
        />
      </Box>

      <AnimatedSection>
        <Stack spacing={4}>
          {/* Top Stats Row */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <GlassCard hover sx={{ p: 3, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <IconBox color={tokens.colors.accent.blue} size={48}>
                    <Briefcase size={24} color={tokens.colors.accent.blue} />
                  </IconBox>
                </Box>
                <Typography variant="h3" sx={{ color: tokens.colors.text.primary, mb: 1, fontWeight: 700 }}>
                  124
                </Typography>
                <Typography variant="body2" sx={{ color: tokens.colors.text.secondary }}>
                  Total Cases
                </Typography>
              </GlassCard>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <GlassCard hover sx={{ p: 3, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <IconBox color={tokens.colors.accent.cyan} size={48}>
                    <FileText size={24} color={tokens.colors.accent.cyan} />
                  </IconBox>
                </Box>
                <Typography variant="h3" sx={{ color: tokens.colors.text.primary, mb: 1, fontWeight: 700 }}>
                  1,842
                </Typography>
                <Typography variant="body2" sx={{ color: tokens.colors.text.secondary }}>
                  Evidence Files
                </Typography>
              </GlassCard>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <GlassCard hover sx={{ p: 3, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <IconBox color={tokens.colors.accent.green} size={48}>
                    <ShieldCheck size={24} color={tokens.colors.accent.green} />
                  </IconBox>
                </Box>
                <Typography variant="h3" sx={{ color: tokens.colors.text.primary, mb: 1, fontWeight: 700 }}>
                  1,796
                </Typography>
                <Typography variant="body2" sx={{ color: tokens.colors.text.secondary }}>
                  Verified Evidence
                </Typography>
              </GlassCard>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <GlassCard hover sx={{ p: 3, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <IconBox color={tokens.colors.accent.red} size={48}>
                    <AlertTriangle size={24} color={tokens.colors.accent.red} />
                  </IconBox>
                </Box>
                <Typography variant="h3" sx={{ color: tokens.colors.text.primary, mb: 1, fontWeight: 700 }}>
                  03
                </Typography>
                <Typography variant="body2" sx={{ color: tokens.colors.text.secondary }}>
                  Security Alerts
                </Typography>
              </GlassCard>
            </Grid>
          </Grid>

          {/* Bottom 2-Column Layout */}
          <Grid container spacing={4}>
            {/* Left Panel - Recent Evidence */}
            <Grid item xs={12} md={7}>
              <GlassCard sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ color: tokens.colors.text.primary, mb: 3 }}>
                  Recent Evidence
                </Typography>
                <Stack spacing={2} divider={<Divider sx={{ borderColor: tokens.colors.border.subtle }} />}>
                  {[
                    { id: 'EVD-2026-0248', file: 'evidence_0248.dat', status: 'Verified', size: '2.48 MB' },
                    { id: 'EVD-2026-0247', file: 'network_capture.pcap', status: 'Verified', size: '15.7 MB' },
                    { id: 'EVD-2026-0246', file: 'memory_dump.raw', status: 'Pending', size: '4.2 GB' },
                    { id: 'EVD-2026-0245', file: 'email_archive.pst', status: 'Verified', size: '892 MB' },
                  ].map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
                      <Box sx={{ minWidth: 0, flex: 1, pr: 2 }}>
                        <Typography variant="body2" sx={{ color: tokens.colors.text.primary, fontFamily: tokens.fonts.mono, mb: 0.5 }}>
                          {item.id}
                        </Typography>
                        <Typography variant="body2" sx={{ color: tokens.colors.text.secondary, fontFamily: tokens.fonts.mono, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.file}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <StatusBadge
                          label={item.status}
                          variant={item.status === 'Verified' ? 'success' : 'warning'}
                          size="sm"
                        />
                        <Typography variant="body2" sx={{ color: tokens.colors.text.muted, fontFamily: tokens.fonts.mono, minWidth: 70, textAlign: 'right' }}>
                          {item.size}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </GlassCard>
            </Grid>

            {/* Right Panel - Recent Activity */}
            <Grid item xs={12} md={5}>
              <GlassCard sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ color: tokens.colors.text.primary, mb: 3 }}>
                  Recent Activity
                </Typography>
                <Stack spacing={3}>
                  {[
                    { msg: 'Evidence EVD-2026-0248 verified successfully', time: '2 min ago', type: 'success' },
                    { msg: 'New case CSE-2026-089 created', time: '15 min ago', type: 'info' },
                    { msg: 'Blockchain anchor confirmed for EVD-2026-0247', time: '1 hr ago', type: 'info' },
                    { msg: 'Security alert: Failed login attempt', time: '3 hr ago', type: 'error' },
                  ].map((activity, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 2 }}>
                      <Box sx={{ mt: 0.5 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: tokens.colors.accent[activity.type === 'success' ? 'green' : activity.type === 'error' ? 'red' : 'blue'],
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: tokens.colors.text.primary, mb: 0.5 }}>
                          {activity.msg}
                        </Typography>
                        <Typography variant="caption" sx={{ color: tokens.colors.text.muted }}>
                          {activity.time}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </GlassCard>
            </Grid>
          </Grid>
        </Stack>
      </AnimatedSection>
    </SectionContainer>
  );
};
