import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { Shield, Blocks, Lock, FileSearch } from 'lucide-react';
import { tokens } from '../theme/theme';
import SectionContainer from './common/SectionContainer';
import GlassCard from './common/GlassCard';
import IconBox from './common/IconBox';
import AnimatedSection from './common/AnimatedSection';

const indicators = [
  {
    icon: Shield,
    label: 'SHA-256',
    subtitle: 'Cryptographic Integrity',
    color: tokens.colors.accent.blue,
    delay: 0,
  },
  {
    icon: Blocks,
    label: 'BLOCKCHAIN',
    subtitle: 'Tamper-Evident Validation',
    color: tokens.colors.accent.cyan,
    delay: 100,
  },
  {
    icon: Lock,
    label: 'ENCRYPTION',
    subtitle: 'Secure Evidence Protection',
    color: tokens.colors.accent.green,
    delay: 200,
  },
  {
    icon: FileSearch,
    label: 'AUDIT TRAIL',
    subtitle: 'Complete Chain of Custody',
    color: tokens.colors.accent.amber,
    delay: 300,
  },
];

export default function TrustIndicators() {
  return (
    <SectionContainer id="trust" sx={{ py: { xs: 4, md: 6 } }}>
      <Grid container spacing={3}>
        {indicators.map((indicator, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <AnimatedSection delay={indicator.delay}>
              <GlassCard
                hover
                glowColor={indicator.color}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  p: 3,
                  height: '100%',
                }}
              >
                <IconBox color={indicator.color} sx={{ mb: 2 }}>
                  <indicator.icon size={32} color={indicator.color} />
                </IconBox>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: tokens.fonts.mono,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: indicator.color,
                    mb: 1,
                    display: 'block',
                  }}
                >
                  {indicator.label}
                </Typography>
                <Typography variant="body2" color={tokens.colors.text.secondary}>
                  {indicator.subtitle}
                </Typography>
              </GlassCard>
            </AnimatedSection>
          </Grid>
        ))}
      </Grid>
    </SectionContainer>
  );
}
