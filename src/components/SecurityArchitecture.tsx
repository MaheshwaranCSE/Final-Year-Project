import React from 'react';
import { Box, Typography, Stack, Grid, useTheme, useMediaQuery } from '@mui/material';
import { 
  User, 
  Users, 
  FileSearch, 
  Lock, 
  Hash, 
  Blocks, 
  HardDrive, 
  ClipboardList, 
  ShieldAlert 
} from 'lucide-react';

import { tokens } from '../theme/theme';
import AnimatedSection from './common/AnimatedSection';
import SectionContainer from './common/SectionContainer';
import SectionHeading from './common/SectionHeading';
import GlassCard from './common/GlassCard';

const securityLayers = [
  { label: 'Authentication', icon: User },
  { label: 'Role-Based Access Control', icon: Users },
  { label: 'Evidence Processing', icon: FileSearch },
  { label: 'Encryption', icon: Lock },
  { label: 'SHA-256 Integrity', icon: Hash },
  { label: 'Blockchain Validation', icon: Blocks },
  { label: 'Secure Storage', icon: HardDrive },
  { label: 'Audit Trail', icon: ClipboardList },
  { label: 'Tamper Detection', icon: ShieldAlert },
];

export default function SecurityArchitecture() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <SectionContainer id="security">
      {/* PART A: Defense in Depth Visualization */}
      <Box sx={{ mb: 10 }}>
        <SectionHeading 
          badge="SECURITY MODEL" 
          title="Defense in Depth for Digital Evidence" 
          align="center"
        />
        
        <AnimatedSection>
          <Box 
            sx={{ 
              maxWidth: 800, 
              mx: 'auto', 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              mt: 6
            }}
          >
            {/* Vertical connecting line */}
            <Box 
              sx={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 2,
                background: `linear-gradient(to bottom, ${tokens.colors.accent.blue}20, ${tokens.colors.accent.cyan}80, ${tokens.colors.accent.blue}20)`,
                zIndex: 0
              }}
            />

            {securityLayers.map((layer, index) => {
              const Icon = layer.icon;
              const width = 100 - (index * 5); // Progressively slightly narrower, or keep equal
              // Let's use equal or slightly varying width, request says "progressively wider or maintain equal width"
              // Let's maintain equal width for a cleaner stack, or progressively wider from top to bottom
              const layerWidth = isMobile ? '100%' : `${60 + (index * 4)}%`;
              
              return (
                <Box
                  key={index}
                  sx={{
                    width: layerWidth,
                    minWidth: isMobile ? '100%' : 400,
                    p: 2,
                    mb: index === securityLayers.length - 1 ? 0 : 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    bgcolor: tokens.colors.card,
                    border: `1px solid ${tokens.colors.border.subtle}`,
                    borderRadius: tokens.radius.md,
                    zIndex: 1,
                    position: 'relative',
                    background: `linear-gradient(90deg, ${tokens.colors.card} 0%, ${tokens.colors.elevated} 50%, ${tokens.colors.card} 100%)`,
                    boxShadow: tokens.shadows.card,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: tokens.colors.accent.blue,
                      boxShadow: tokens.shadows.glow('blue')
                    }
                  }}
                >
                  <Icon size={24} color={tokens.colors.accent.cyan} />
                  <Typography sx={{ color: tokens.colors.text.primary, fontWeight: 600, fontFamily: tokens.fonts.mono }}>
                    {layer.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </AnimatedSection>
      </Box>

      {/* PART B: Architecture Split */}
      <AnimatedSection delay={200}>
        <Box sx={{ mt: 10 }}>
          <Typography variant="h3" sx={{ textAlign: 'center', mb: 1, color: tokens.colors.text.primary }}>
            Architecture Separation
          </Typography>
          <Typography sx={{ textAlign: 'center', mb: 6, color: tokens.colors.text.secondary }}>
            Clear separation of responsibilities between application logic and evidential validation
          </Typography>
          
          <Grid container spacing={4}>
            {/* Column 1 - Application Layer */}
            <Grid item xs={12} md={4}>
              <GlassCard 
                sx={{ 
                  height: '100%',
                  borderTop: `4px solid ${tokens.colors.accent.blue}`
                }}
              >
                <Typography variant="h5" sx={{ color: tokens.colors.accent.blue, mb: 1, fontWeight: 'bold' }}>
                  Application Layer
                </Typography>
                <Typography variant="body2" sx={{ color: tokens.colors.text.muted, mb: 3, fontFamily: tokens.fonts.mono }}>
                  Supabase · PostgreSQL
                </Typography>
                
                <Stack spacing={2}>
                  {['Authentication', 'Cases', 'Users', 'Metadata', 'Audit Logs'].map((item, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: tokens.colors.accent.blue }} />
                      <Typography sx={{ color: tokens.colors.text.secondary }}>{item}</Typography>
                    </Box>
                  ))}
                </Stack>
              </GlassCard>
            </Grid>

            {/* Column 2 - Evidence Layer */}
            <Grid item xs={12} md={4}>
              <GlassCard 
                sx={{ 
                  height: '100%',
                  borderTop: `4px solid ${tokens.colors.accent.cyan}`
                }}
              >
                <Typography variant="h5" sx={{ color: tokens.colors.accent.cyan, mb: 4, fontWeight: 'bold' }}>
                  Evidence Layer
                </Typography>
                
                <Stack spacing={2}>
                  {['Encrypted Evidence', 'Secure Storage', 'File References', 'Backup'].map((item, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: tokens.colors.accent.cyan }} />
                      <Typography sx={{ color: tokens.colors.text.secondary }}>{item}</Typography>
                    </Box>
                  ))}
                </Stack>
              </GlassCard>
            </Grid>

            {/* Column 3 - Blockchain Layer */}
            <Grid item xs={12} md={4}>
              <GlassCard 
                sx={{ 
                  height: '100%',
                  borderTop: `4px solid ${tokens.colors.accent.green}`
                }}
              >
                <Typography variant="h5" sx={{ color: tokens.colors.accent.green, mb: 4, fontWeight: 'bold' }}>
                  Blockchain Layer
                </Typography>
                
                <Stack spacing={2}>
                  {['SHA-256 Hash', 'Evidence Metadata', 'Custody Reference', 'Validation', 'Transaction Reference'].map((item, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: tokens.colors.accent.green }} />
                      <Typography sx={{ color: tokens.colors.text.secondary }}>{item}</Typography>
                    </Box>
                  ))}
                </Stack>
              </GlassCard>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4, p: 2, borderRadius: tokens.radius.md, bgcolor: tokens.colors.card, border: `1px solid ${tokens.colors.border.subtle}` }}>
            <Typography variant="body2" sx={{ color: tokens.colors.text.muted, textAlign: 'center' }}>
              <strong>IMPORTANT:</strong> Supabase manages application data and user sessions, while the blockchain provides a separate, tamper-evident validation layer. They are fundamentally separate systems working in tandem.
            </Typography>
          </Box>
        </Box>
      </AnimatedSection>
    </SectionContainer>
  );
}
