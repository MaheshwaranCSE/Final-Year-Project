import React from 'react';
import { Box, Typography, Stack, useTheme, useMediaQuery } from '@mui/material';
import { FileText, Hash, GitCompare, ShieldCheck, AlertTriangle, ArrowRight, ArrowDown } from 'lucide-react';
import { tokens } from '../theme/theme';
import SectionContainer from './common/SectionContainer';
import SectionHeading from './common/SectionHeading';
import GlassCard from './common/GlassCard';
import AnimatedSection from './common/AnimatedSection';

const FlowBox = ({ icon: Icon, title, activeColor }: { icon: any, title: string, activeColor?: string }) => (
  <GlassCard
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      p: 3,
      width: '180px',
      height: '140px',
      textAlign: 'center',
      position: 'relative',
      zIndex: 2,
      borderColor: activeColor ? `${activeColor}60` : tokens.colors.border.subtle,
      boxShadow: activeColor ? `0 0 20px ${activeColor}20` : tokens.shadows.card,
      backgroundColor: activeColor ? `${activeColor}08` : tokens.glass.background,
    }}
  >
    <Box
      sx={{
        color: activeColor || tokens.colors.accent.blue,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        height: 48,
        borderRadius: '50%',
        backgroundColor: activeColor ? `${activeColor}20` : `${tokens.colors.accent.blue}15`,
      }}
    >
      <Icon size={24} />
    </Box>
    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: activeColor ? activeColor : tokens.colors.text.primary, lineHeight: 1.2 }}>
      {title}
    </Typography>
  </GlassCard>
);

const VerificationSection: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const Arrow = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.colors.text.muted, zIndex: 1, py: isMobile ? 2 : 0, px: isMobile ? 0 : 2 }}>
      {isMobile ? <ArrowDown size={24} /> : <ArrowRight size={24} />}
    </Box>
  );

  return (
    <SectionContainer id="verification-flow">
      <AnimatedSection>
        <SectionHeading
          badge="CRYPTOGRAPHIC VERIFICATION"
          title="Evidence Integrity Through Hash Comparison"
          subtitle="Cryptographic verification creates confidence in evidence integrity."
          align="center"
        />

        <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row', 
            alignItems: 'center', 
            justifyContent: 'center',
            position: 'relative'
          }}>
            <FlowBox icon={FileText} title="Stored Evidence" />
            <Arrow />
            <FlowBox icon={Hash} title="Calculate SHA-256" />
            <Arrow />
            
            {/* Decision Node */}
            <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <GlassCard
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 3,
                  width: '160px',
                  height: '160px',
                  textAlign: 'center',
                  zIndex: 2,
                  transform: 'rotate(45deg)',
                  borderRadius: `${tokens.radius.md}px`,
                  '& > *': {
                    transform: 'rotate(-45deg)',
                  }
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <GitCompare size={24} color={tokens.colors.accent.blue} />
                  <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                    Compare<br/>With<br/>Anchored<br/>Hash
                  </Typography>
                </Box>
              </GlassCard>
              
              {isMobile && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
                   <ArrowDown size={24} color={tokens.colors.text.muted} />
                </Box>
              )}
            </Box>

            {!isMobile && (
              <Box sx={{ 
                width: 60, 
                height: 2, 
                backgroundColor: tokens.colors.text.muted,
                position: 'absolute',
                right: -60,
                top: '50%',
                zIndex: 0
              }} />
            )}
          </Box>

          {/* Branching Paths */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row', 
            gap: 4, 
            mt: isMobile ? 4 : 8,
            position: 'relative',
            width: '100%',
            justifyContent: 'center'
          }}>
            {!isMobile && (
              <>
                {/* Horizontal branch lines */}
                <Box sx={{ 
                  position: 'absolute',
                  top: -64,
                  left: '50%',
                  width: '320px',
                  transform: 'translateX(-50%)',
                  height: 64,
                  borderLeft: `2px solid ${tokens.colors.text.muted}`,
                  borderRight: `2px solid ${tokens.colors.text.muted}`,
                  borderTop: `2px solid ${tokens.colors.text.muted}`,
                  borderTopLeftRadius: tokens.radius.lg,
                  borderTopRightRadius: tokens.radius.lg,
                  zIndex: 0,
                  borderBottom: 'none'
                }} />
                
                {/* Down arrows to outcomes */}
                <Box sx={{ position: 'absolute', top: 0, left: 'calc(50% - 160px)', transform: 'translate(-50%, -50%)', color: tokens.colors.text.muted }}><ArrowDown size={24}/></Box>
                <Box sx={{ position: 'absolute', top: 0, right: 'calc(50% - 160px)', transform: 'translate(50%, -50%)', color: tokens.colors.text.muted }}><ArrowDown size={24}/></Box>
              </>
            )}

            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: 2,
              width: isMobile ? '100%' : 'auto'
            }}>
              <Typography variant="overline" sx={{ color: tokens.colors.accent.green, fontWeight: 700, letterSpacing: 1 }}>
                MATCH
              </Typography>
              <FlowBox icon={ShieldCheck} title="VERIFIED" activeColor={tokens.colors.accent.green} />
            </Box>

            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: 2,
              width: isMobile ? '100%' : 'auto'
            }}>
              <Typography variant="overline" sx={{ color: tokens.colors.accent.red, fontWeight: 700, letterSpacing: 1 }}>
                MISMATCH
              </Typography>
              <FlowBox icon={AlertTriangle} title="TAMPER ALERT" activeColor={tokens.colors.accent.red} />
            </Box>
          </Box>
        </Box>
      </AnimatedSection>
    </SectionContainer>
  );
};

export default VerificationSection;
