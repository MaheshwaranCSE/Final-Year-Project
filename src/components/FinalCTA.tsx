import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { tokens } from '../theme/theme';
import AnimatedSection from './common/AnimatedSection';

export const FinalCTA: React.FC = () => {
  return (
    <Box
      component="section"
      sx={{
        width: '100%',
        py: { xs: 10, md: 14 },
        position: 'relative',
        background: `radial-gradient(circle at center, rgba(59,130,246,0.12) 0%, ${tokens.colors.bg.primary} 70%)`,
        backgroundImage: `radial-gradient(circle at center, rgba(59,130,246,0.12) 0%, ${tokens.colors.bg.primary} 70%), linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
        backgroundSize: '100% 100%, 30px 30px, 30px 30px',
        backgroundPosition: 'center center',
        borderTop: `1px solid ${tokens.colors.border.subtle}`,
        borderBottom: `1px solid ${tokens.colors.border.subtle}`,
      }}
    >
      <Box sx={{ maxWidth: 800, mx: 'auto', textAlign: 'center', px: 3 }}>
        <AnimatedSection>
          <Typography
            variant="h2"
            sx={{
              color: tokens.colors.text.primary,
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: '2rem', md: '3rem' },
            }}
          >
            Protect Every Piece of Digital Evidence
          </Typography>
          
          <Typography
            variant="h6"
            sx={{
              color: tokens.colors.text.secondary,
              mb: 5,
              fontWeight: 400,
            }}
          >
            Preserve integrity. Maintain transparency. Strengthen forensic investigations.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              component={RouterLink}
              to="/signup"
              variant="contained"
              size="large"
              sx={{
                background: `linear-gradient(90deg, ${tokens.colors.accent.blue}, ${tokens.colors.accent.cyan})`,
                color: '#fff',
                px: 4,
                py: 1.5,
                fontWeight: 600,
                borderRadius: tokens.radius.md,
                '&:hover': {
                  background: `linear-gradient(90deg, ${tokens.colors.accent.cyan}, ${tokens.colors.accent.blue})`,
                  boxShadow: tokens.shadows.glow(tokens.colors.accent.blue),
                },
              }}
            >
              Get Started →
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              href="#security"
              sx={{
                color: tokens.colors.text.primary,
                borderColor: tokens.colors.border.accent,
                px: 4,
                py: 1.5,
                fontWeight: 600,
                borderRadius: tokens.radius.md,
                '&:hover': {
                  borderColor: tokens.colors.text.primary,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              Explore Security
            </Button>
          </Stack>
        </AnimatedSection>
      </Box>
    </Box>
  );
};

export default FinalCTA;
