import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { tokens } from '../theme/theme';
import SectionContainer from './common/SectionContainer';
import SectionHeading from './common/SectionHeading';
import GlassCard from './common/GlassCard';
import AnimatedSection from './common/AnimatedSection';

const challenges = [
  'Unauthorized modification of critical files',
  'Incomplete or fragmented custody tracking',
  'Scattered records across disparate systems',
  'Weak integrity verification over time',
  'Difficult, manual auditing processes'
];

export default function Introduction() {
  return (
    <SectionContainer id="introduction">
      <SectionHeading title="Digital Evidence Deserves More Than Ordinary Storage" align="left" />
      <Grid container spacing={6} sx={{ mt: 2 }}>
        <Grid item xs={12} md={7}>
          <AnimatedSection delay={100}>
            <Typography variant="body1" sx={{ color: tokens.colors.text.secondary, mb: 4, lineHeight: 1.8 }}>
              Traditional digital forensics management systems often lack the fundamental guarantees required to maintain true evidentiary integrity. Relying solely on centralized databases exposes investigations to critical vulnerabilities:
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              {challenges.map((challenge, idx) => (
                <Box
                  component="li"
                  key={idx}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                    color: tokens.colors.text.primary,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: idx % 2 === 0 ? tokens.colors.accent.red : tokens.colors.accent.amber,
                      mr: 2,
                      boxShadow: `0 0 8px ${idx % 2 === 0 ? tokens.colors.glow.red : tokens.colors.accent.amber}`,
                    }}
                  />
                  <Typography variant="body2">{challenge}</Typography>
                </Box>
              ))}
            </Box>
          </AnimatedSection>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <AnimatedSection delay={300}>
            <GlassCard
              sx={{
                p: 4,
                borderColor: tokens.colors.accent.blue,
                borderWidth: '1px',
                borderStyle: 'solid',
                backgroundColor: tokens.colors.bg.cardHover,
                boxShadow: tokens.shadows.glow(tokens.colors.accent.blue),
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h6" sx={{ color: tokens.colors.text.accent, mb: 2, fontWeight: 600 }}>
                The BlockVault Solution
              </Typography>
              <Typography variant="body2" sx={{ color: tokens.colors.text.secondary, lineHeight: 1.8 }}>
                BlockVault introduces a unified approach to forensic evidence management. By seamlessly integrating cryptographic hashing (SHA-256) with immutable blockchain anchoring, we ensure that from the moment of acquisition to final presentation, the absolute integrity and complete chain of custody of your evidence can be mathematically proven.
              </Typography>
            </GlassCard>
          </AnimatedSection>
        </Grid>
      </Grid>
    </SectionContainer>
  );
}
