import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { Fingerprint, Eye, Lock, ClipboardList, Blocks, AlertTriangle } from 'lucide-react';
import { tokens } from '../theme/theme';
import SectionContainer from './common/SectionContainer';
import SectionHeading from './common/SectionHeading';
import GlassCard from './common/GlassCard';
import IconBox from './common/IconBox';
import AnimatedSection from './common/AnimatedSection';

const whyFeatures = [
  {
    title: 'Integrity',
    description: 'Cryptographic verification through SHA-256.',
    icon: Fingerprint,
    color: tokens.colors.accent.blue,
  },
  {
    title: 'Transparency',
    description: 'Traceable evidence lifecycle.',
    icon: Eye,
    color: tokens.colors.accent.cyan,
  },
  {
    title: 'Security',
    description: 'Encryption and role-based access control.',
    icon: Lock,
    color: tokens.colors.accent.green,
  },
  {
    title: 'Accountability',
    description: 'Detailed audit records.',
    icon: ClipboardList,
    color: tokens.colors.accent.amber,
  },
  {
    title: 'Validation',
    description: 'Permissioned blockchain anchoring.',
    icon: Blocks,
    color: '#8B5CF6',
  },
  {
    title: 'Detection',
    description: 'Hash mismatch alerts.',
    icon: AlertTriangle,
    color: tokens.colors.accent.red,
  },
];

export const WhyBlockVault: React.FC = () => {
  return (
    <SectionContainer>
      <SectionHeading badge="ADVANTAGES" title="Why BlockVault?" />
      
      <Grid container spacing={3}>
        {whyFeatures.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <AnimatedSection delay={index * 100}>
                <GlassCard hover sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
                  <IconBox color={feature.color} size="large" sx={{ mb: 2 }}>
                    <Icon size={24} color={feature.color} />
                  </IconBox>
                  <Typography variant="h5" sx={{ mb: 1, color: tokens.colors.text.primary, fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: tokens.colors.text.secondary }}>
                    {feature.description}
                  </Typography>
                </GlassCard>
              </AnimatedSection>
            </Grid>
          );
        })}
      </Grid>
    </SectionContainer>
  );
};

export default WhyBlockVault;
