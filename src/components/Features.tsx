import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { FolderLock, Hash, Blocks, Brain, Link, ClipboardList } from 'lucide-react';
import { tokens } from '../theme/theme';
import SectionContainer from './common/SectionContainer';
import SectionHeading from './common/SectionHeading';
import GlassCard from './common/GlassCard';
import IconBox from './common/IconBox';
import AnimatedSection from './common/AnimatedSection';

const features = [
  {
    num: '01',
    icon: FolderLock,
    title: 'Evidence Management',
    desc: 'Securely organize evidence, cases, metadata and investigation records.',
    delay: 0,
  },
  {
    num: '02',
    icon: Hash,
    title: 'SHA-256 Integrity',
    desc: 'Generate cryptographic fingerprints for evidence verification.',
    delay: 100,
  },
  {
    num: '03',
    icon: Blocks,
    title: 'Blockchain Validation',
    desc: 'Anchor evidence hashes and relevant metadata in a permissioned blockchain.',
    delay: 200,
  },
  {
    num: '04',
    icon: Brain,
    title: 'AI-Assisted Analysis',
    desc: 'Support risk classification, OCR and malware-analysis workflows.',
    delay: 300,
  },
  {
    num: '05',
    icon: Link,
    title: 'Chain of Custody',
    desc: 'Maintain a transparent record of evidence lifecycle and authorized access.',
    delay: 400,
  },
  {
    num: '06',
    icon: ClipboardList,
    title: 'Audit Logs',
    desc: 'Maintain detailed evidence activity and security-event records.',
    delay: 500,
  },
];

export default function Features() {
  return (
    <SectionContainer id="features">
      <SectionHeading 
        badge="CAPABILITIES" 
        title="Everything Your Evidence Workflow Needs" 
        align="center" 
      />
      
      <Grid container spacing={3} sx={{ mt: 4 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <AnimatedSection delay={feature.delay}>
              <GlassCard
                hover
                glowColor={tokens.colors.accent.blue}
                sx={{
                  position: 'relative',
                  p: 4,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    '& .feature-icon': {
                      transform: 'scale(1.1)',
                    }
                  }
                }}
              >
                <Typography
                  sx={{
                    position: 'absolute',
                    top: 10,
                    left: 16,
                    fontSize: '4rem',
                    fontWeight: 900,
                    fontFamily: tokens.fonts.mono,
                    color: tokens.colors.text.secondary,
                    opacity: 0.05,
                    lineHeight: 1,
                    pointerEvents: 'none',
                  }}
                >
                  {feature.num}
                </Typography>
                
                <IconBox 
                  color={tokens.colors.accent.blue} 
                  sx={{ mb: 3, position: 'relative', zIndex: 1, transition: 'transform 0.3s ease' }}
                  className="feature-icon"
                >
                  <feature.icon size={28} color={tokens.colors.accent.blue} />
                </IconBox>
                
                <Typography variant="h5" sx={{ mb: 2, color: tokens.colors.text.primary, fontWeight: 600, position: 'relative', zIndex: 1 }}>
                  {feature.title}
                </Typography>
                
                <Typography variant="body2" sx={{ color: tokens.colors.text.secondary, position: 'relative', zIndex: 1, lineHeight: 1.6 }}>
                  {feature.desc}
                </Typography>
              </GlassCard>
            </AnimatedSection>
          </Grid>
        ))}
      </Grid>
    </SectionContainer>
  );
}
