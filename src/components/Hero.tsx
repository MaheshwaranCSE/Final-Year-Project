import React from 'react';
import { Box, Typography, Button, Container, Stack } from '@mui/material';
import AnimatedSection from './common/AnimatedSection';
import SectionContainer from './common/SectionContainer';
import { tokens } from '../theme/theme';
import HeroVisualization from './HeroVisualization';

export default function Hero() {
  return (
    <SectionContainer id="home" disablePadding>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: tokens.colors.bg.primary,
          backgroundImage: `
            radial-gradient(circle at center, rgba(59,130,246,0.08) 0%, transparent 60%),
            repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.02) 40px, rgba(255,255,255,0.02) 40px),
            repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.02) 40px, rgba(255,255,255,0.02) 40px)
          `,
          pt: { xs: 12, md: 0 },
          pb: { xs: 8, md: 0 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 6 }}>
            
            {/* Left Content */}
            <Box sx={{ width: { xs: '100%', md: '55%' } }}>
              <AnimatedSection>
                <Stack spacing={4} alignItems={{ xs: 'center', md: 'flex-start' }} textAlign={{ xs: 'center', md: 'left' }}>
                  
                  {/* Badge */}
                  <Box
                    sx={{
                      display: 'inline-flex',
                      px: 2,
                      py: 0.75,
                      borderRadius: 12,
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      border: `1px solid ${tokens.colors.accent.blue}40`,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: tokens.colors.accent.blue, fontWeight: 700, letterSpacing: 1.2 }}>
                      BLOCKCHAIN • DIGITAL FORENSICS • SECURITY
                    </Typography>
                  </Box>

                  {/* Heading */}
                  <Typography variant="h1" component="h1" sx={{ color: tokens.colors.text.primary, fontWeight: 800, fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' }, lineHeight: 1.2 }}>
                    Secure Digital Evidence.<br />
                    <Box
                      component="span"
                      sx={{
                        background: `linear-gradient(90deg, ${tokens.colors.accent.blue}, ${tokens.colors.accent.cyan})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Verified. Protected. Immutable.
                    </Box>
                  </Typography>

                  {/* Description */}
                  <Typography variant="body1" sx={{ color: tokens.colors.text.secondary, fontSize: { xs: '1rem', md: '1.125rem' }, lineHeight: 1.6, maxWidth: 500 }}>
                    BlockVault provides secure digital forensic evidence management with cryptographic integrity verification, blockchain validation, encrypted storage, AI-assisted analysis, and complete chain-of-custody tracking.
                  </Typography>

                  {/* CTAs */}
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', sm: 'auto' }, pt: 2 }}>
                    <Button
                      variant="contained"
                      href="/signup"
                      sx={{
                        background: `linear-gradient(90deg, ${tokens.colors.accent.blue}, ${tokens.colors.accent.cyan})`,
                        color: '#fff',
                        px: 4,
                        py: 1.5,
                        borderRadius: tokens.radius.md,
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '1rem',
                        boxShadow: `0 8px 16px ${tokens.colors.accent.blue}30`,
                        '&:hover': {
                          background: `linear-gradient(90deg, ${tokens.colors.accent.cyan}, ${tokens.colors.accent.blue})`,
                          boxShadow: `0 8px 24px ${tokens.colors.accent.blue}50`,
                        }
                      }}
                    >
                      Get Started →
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                      sx={{
                        borderColor: tokens.colors.border.accent,
                        color: tokens.colors.text.primary,
                        px: 4,
                        py: 1.5,
                        borderRadius: tokens.radius.md,
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '1rem',
                        backgroundColor: tokens.colors.card,
                        '&:hover': {
                          borderColor: tokens.colors.accent.cyan,
                          backgroundColor: tokens.colors.cardHover,
                        }
                      }}
                    >
                      Explore Platform
                    </Button>
                  </Stack>
                </Stack>
              </AnimatedSection>
            </Box>

            {/* Right Visualization */}
            <Box sx={{ width: { xs: '100%', md: '45%' }, display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
              <AnimatedSection delay={0.2}>
                <HeroVisualization />
              </AnimatedSection>
            </Box>
            
          </Box>
        </Container>
      </Box>
    </SectionContainer>
  );
};
