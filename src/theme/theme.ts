import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3B82F6',
      light: '#60A5FA',
      dark: '#2563EB',
    },
    secondary: {
      main: '#06B6D4',
      light: '#22D3EE',
      dark: '#0891B2',
    },
    success: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
    },
    error: {
      main: '#EF4444',
      light: '#F87171',
      dark: '#DC2626',
    },
    warning: {
      main: '#F59E0B',
      light: '#FBBF24',
      dark: '#D97706',
    },
    background: {
      default: '#0A0E1A',
      paper: '#0F1629',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#94A3B8',
      disabled: '#64748B',
    },
    divider: 'rgba(255,255,255,0.06)',
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: {
      fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
      fontWeight: 800,
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: 'clamp(2rem, 4vw, 3rem)',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: 'clamp(1.5rem, 3vw, 2rem)',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.7,
      color: '#94A3B8',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      color: '#94A3B8',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
      color: '#94A3B8',
      fontWeight: 400,
    },
    button: {
      textTransform: 'none' as const,
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0A0E1A',
          scrollbarWidth: 'thin',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '0.938rem',
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

export default theme;

/* ── Design Token Constants ── */
export const tokens = {
  colors: {
    bg: {
      primary: '#0A0E1A',
      secondary: '#060A14',
      card: '#0F1629',
      cardHover: '#141C2E',
      elevated: '#1A2340',
    },
    card: '#0F1629',
    cardHover: '#141C2E',
    elevated: '#1A2340',
    border: {
      subtle: 'rgba(255,255,255,0.06)',
      accent: 'rgba(59,130,246,0.3)',
      accentHover: 'rgba(59,130,246,0.5)',
    },
    accent: {
      blue: '#3B82F6',
      cyan: '#06B6D4',
      green: '#10B981',
      red: '#EF4444',
      amber: '#F59E0B',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#94A3B8',
      muted: '#64748B',
      accent: '#60A5FA',
    },
    glow: {
      blue: 'rgba(59,130,246,0.15)',
      cyan: 'rgba(6,182,212,0.15)',
      green: 'rgba(16,185,129,0.15)',
      red: 'rgba(239,68,68,0.15)',
    },
  },
  fonts: {
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  spacing: {
    section: { py: { xs: 8, md: 12 } },
    container: { px: { xs: 2, sm: 3, md: 4, lg: 6 } },
  },
  radius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  shadows: {
    card: '0 4px 24px rgba(0,0,0,0.3)',
    cardHover: '0 8px 40px rgba(0,0,0,0.4)',
    glow: (color: string) => `0 0 30px ${color}`,
  },
  glass: {
    background: 'rgba(15,22,41,0.7)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
} as const;
