import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AnimatedSection from './AnimatedSection';

interface SectionHeadingProps {
  badge?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  children?: ReactNode;
}

export default function SectionHeading({
  badge,
  title,
  subtitle,
  align = 'center',
  children,
}: SectionHeadingProps) {
  return (
    <AnimatedSection>
      <Box sx={{ textAlign: align, mb: { xs: 5, md: 8 }, maxWidth: align === 'center' ? 720 : 'none', mx: align === 'center' ? 'auto' : 0 }}>
        {badge && (
          <Typography
            variant="caption"
            sx={{
              display: 'inline-block',
              px: 2,
              py: 0.5,
              mb: 2,
              borderRadius: '9999px',
              border: '1px solid rgba(59,130,246,0.2)',
              bgcolor: 'rgba(59,130,246,0.08)',
              color: '#60A5FA',
              fontSize: '0.7rem',
              letterSpacing: '0.08em',
              fontWeight: 600,
            }}
          >
            {badge}
          </Typography>
        )}
        <Typography variant="h2" sx={{ color: 'text.primary', mb: subtitle ? 2 : 0 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.1rem', lineHeight: 1.7 }}>
            {subtitle}
          </Typography>
        )}
        {children}
      </Box>
    </AnimatedSection>
  );
}
