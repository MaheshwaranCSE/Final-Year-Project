import React from 'react';
import { Box, Typography, Grid, Link, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { tokens } from '../theme/theme';
import BlockVaultLogo from './common/BlockVaultLogo';

export const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        width: '100%',
        backgroundColor: '#050914', // Slightly darker than primary bg
        borderTop: `1px solid ${tokens.colors.border.subtle}`,
        pt: 8,
        pb: 4,
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3 }}>
        <Grid container spacing={4} sx={{ mb: 6 }}>
          {/* Brand Column */}
          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <BlockVaultLogo size={32} />
                <Typography variant="h6" sx={{ color: tokens.colors.text.primary, fontWeight: 700, letterSpacing: '0.05em' }}>
                  BlockVault
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: tokens.colors.text.secondary, lineHeight: 1.6, maxWidth: 300 }}>
                Blockchain-Based Secure Digital Forensic Evidence Management
              </Typography>
            </Stack>
          </Grid>

          {/* Navigation Column */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle1" sx={{ color: tokens.colors.text.primary, fontWeight: 600, mb: 3 }}>
              Navigation
            </Typography>
            <Stack spacing={1.5}>
              {['Home', 'Features', 'How It Works', 'Security', 'About'].map((item) => (
                <Link
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                  sx={{
                    color: tokens.colors.text.secondary,
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    width: 'fit-content',
                    '&:hover': {
                      color: tokens.colors.accent.blue,
                    },
                  }}
                >
                  {item}
                </Link>
              ))}
              <Link
                component={RouterLink}
                to="/login"
                sx={{
                  color: tokens.colors.text.secondary,
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  width: 'fit-content',
                  '&:hover': {
                    color: tokens.colors.accent.blue,
                  },
                }}
              >
                Login
              </Link>
            </Stack>
          </Grid>

          {/* Technology Column */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle1" sx={{ color: tokens.colors.text.primary, fontWeight: 600, mb: 3 }}>
              Technology
            </Typography>
            <Stack spacing={1.5}>
              {['React', 'TypeScript', 'Supabase', 'PostgreSQL', 'SHA-256', 'Blockchain', 'Secure Storage'].map((tech) => (
                <Typography
                  key={tech}
                  variant="body2"
                  sx={{ color: tokens.colors.text.muted, fontSize: '0.9rem' }}
                >
                  {tech}
                </Typography>
              ))}
            </Stack>
          </Grid>
        </Grid>

        {/* Bottom Bar */}
        <Box
          sx={{
            borderTop: `1px solid ${tokens.colors.border.subtle}`,
            pt: 4,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" sx={{ color: tokens.colors.text.muted }}>
            © 2026 BlockVault. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;
