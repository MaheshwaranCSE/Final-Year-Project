import React from 'react';
import { Box, Typography, Chip, Stack } from '@mui/material';
import { Shield, Lock, Blocks, Cloud, BrainCircuit, ScanSearch } from 'lucide-react';
import { tokens } from '../theme/theme';
import SectionContainer from './common/SectionContainer';
import SectionHeading from './common/SectionHeading';
import AnimatedSection from './common/AnimatedSection';

const techPills = [
  { label: 'Cybersecurity', icon: Shield },
  { label: 'Cryptography', icon: Lock },
  { label: 'Blockchain', icon: Blocks },
  { label: 'Cloud Storage', icon: Cloud },
  { label: 'AI-Assisted Analysis', icon: BrainCircuit },
  { label: 'Forensic Traceability', icon: ScanSearch },
];

export const About: React.FC = () => {
  return (
    <SectionContainer id="about">
      <SectionHeading badge="ABOUT THE PROJECT" title="Built for the Future of Digital Forensics" align="center" />
      
      <Box sx={{ maxWidth: 800, mx: 'auto', textAlign: 'center' }}>
        <AnimatedSection>
          <Typography variant="body1" sx={{ color: tokens.colors.text.secondary, mb: 4, lineHeight: 1.8 }}>
            BlockVault is a final-year engineering project focused on improving secure digital evidence management. By addressing the critical challenges of data manipulation and unauthorized access, we are exploring modern approaches to preserve the integrity and chain of custody of digital forensics through:
          </Typography>
        </AnimatedSection>

        <AnimatedSection delay={200}>
          <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={2} sx={{ mb: 4 }}>
            {techPills.map((pill, index) => {
              const Icon = pill.icon;
              return (
                <Chip
                  key={index}
                  icon={<Icon size={16} />}
                  label={pill.label}
                  sx={{
                    backgroundColor: tokens.colors.cardHover,
                    color: tokens.colors.text.primary,
                    border: `1px solid ${tokens.colors.border.subtle}`,
                    px: 1,
                    py: 2.5,
                    borderRadius: '8px',
                    '& .MuiChip-icon': {
                      color: tokens.colors.accent.blue,
                    }
                  }}
                />
              );
            })}
          </Stack>
        </AnimatedSection>

        <AnimatedSection delay={400}>
          <Typography variant="body1" sx={{ color: tokens.colors.text.secondary, lineHeight: 1.8 }}>
            The project's goal is to explore modern approaches to digital forensic evidence management, leveraging state-of-the-art technologies to ensure uncompromised data fidelity and auditable transparency.
          </Typography>
        </AnimatedSection>
      </Box>
    </SectionContainer>
  );
};

export default About;
