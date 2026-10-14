import React from 'react';
import { Box, Typography, Stack, Grid, useTheme, useMediaQuery } from '@mui/material';
import { 
  UserCheck, 
  Database, 
  ShieldCheck, 
  Radio,
  ArrowRight,
  ArrowDown
} from 'lucide-react';

import { tokens } from '../theme/theme';
import AnimatedSection from './common/AnimatedSection';
import SectionContainer from './common/SectionContainer';
import SectionHeading from './common/SectionHeading';
import GlassCard from './common/GlassCard';
import IconBox from './common/IconBox';

const supabaseFeatures = [
  {
    title: 'Authentication',
    description: 'Secure user authentication and session management.',
    icon: UserCheck
  },
  {
    title: 'PostgreSQL',
    description: 'Structured storage for cases, evidence metadata and audit records.',
    icon: Database
  },
  {
    title: 'Row Level Security',
    description: 'Restrict records according to authenticated users and roles.',
    icon: ShieldCheck
  },
  {
    title: 'Realtime',
    description: 'Enable live updates for relevant application activity.',
    icon: Radio
  }
];

export default function SupabaseSection() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <SectionContainer>
      <SectionHeading 
        badge="APPLICATION BACKEND" 
        title="A Secure Application Backend" 
        align="center"
      />
      
      <AnimatedSection>
        <Grid container spacing={4} sx={{ mb: 8, mt: 2 }}>
          {supabaseFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Grid item xs={12} sm={6} key={index}>
                <GlassCard hover glowColor="blue" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <IconBox color="blue" sx={{ mb: 2 }}>
                    <Icon size={24} />
                  </IconBox>
                  <Typography variant="h6" sx={{ color: tokens.colors.text.primary, mb: 1, fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography sx={{ color: tokens.colors.text.secondary }}>
                    {feature.description}
                  </Typography>
                </GlassCard>
              </Grid>
            );
          })}
        </Grid>
      </AnimatedSection>

      <AnimatedSection delay={200}>
        <Box 
          sx={{ 
            p: 4, 
            bgcolor: tokens.colors.card, 
            borderRadius: tokens.radius.xl,
            border: `1px solid ${tokens.colors.border.subtle}`,
            boxShadow: tokens.shadows.card
          }}
        >
          <Typography variant="h6" sx={{ textAlign: 'center', mb: 4, color: tokens.colors.text.primary }}>
            Architecture Flow
          </Typography>
          
          <Stack 
            direction={isMobile ? 'column' : 'row'} 
            alignItems="center" 
            justifyContent="center"
            spacing={2}
          >
            {/* Box 1 */}
            <Box 
              sx={{ 
                p: 3, 
                border: `1px solid ${tokens.colors.accent.cyan}`, 
                borderRadius: tokens.radius.md,
                bgcolor: tokens.colors.bg.primary,
                width: isMobile ? '100%' : 220,
                textAlign: 'center'
              }}
            >
              <Typography sx={{ color: tokens.colors.text.primary, fontWeight: 'bold' }}>
                React Application
              </Typography>
            </Box>

            {/* Arrow */}
            {isMobile ? (
              <ArrowDown color={tokens.colors.text.muted} />
            ) : (
              <ArrowRight color={tokens.colors.text.muted} />
            )}

            {/* Box 2 */}
            <Box 
              sx={{ 
                p: 3, 
                border: `1px solid ${tokens.colors.accent.blue}`, 
                borderRadius: tokens.radius.md,
                bgcolor: tokens.colors.elevated,
                width: isMobile ? '100%' : 220,
                textAlign: 'center'
              }}
            >
              <Typography sx={{ color: tokens.colors.accent.blue, fontWeight: 'bold' }}>
                Supabase
              </Typography>
            </Box>

            {/* Arrow */}
            {isMobile ? (
              <ArrowDown color={tokens.colors.text.muted} />
            ) : (
              <ArrowRight color={tokens.colors.text.muted} />
            )}

            {/* Box 3 */}
            <Box 
              sx={{ 
                p: 3, 
                border: `1px solid ${tokens.colors.accent.blue}`, 
                borderRadius: tokens.radius.md,
                bgcolor: tokens.colors.bg.primary,
                width: isMobile ? '100%' : 280,
                textAlign: 'center'
              }}
            >
              <Typography sx={{ color: tokens.colors.text.primary, fontWeight: 'bold' }}>
                PostgreSQL + Auth + RLS
              </Typography>
            </Box>
          </Stack>
        </Box>
      </AnimatedSection>
    </SectionContainer>
  );
}
