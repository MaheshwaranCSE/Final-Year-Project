import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import { tokens } from '../../theme/theme';

interface GlassCardProps {
  children: ReactNode;
  hover?: boolean;
  glowColor?: string;
  sx?: object;
  onClick?: () => void;
  active?: boolean;
}

export default function GlassCard({
  children,
  hover = true,
  glowColor = tokens.colors.glow.blue,
  sx = {},
  onClick,
  active = false,
}: GlassCardProps) {
  return (
    <Box
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      sx={{
        p: 3,
        borderRadius: `${tokens.radius.lg}px`,
        bgcolor: active ? tokens.colors.bg.cardHover : tokens.colors.bg.card,
        border: `1px solid ${active ? tokens.colors.border.accent : tokens.colors.border.subtle}`,
        boxShadow: active ? tokens.shadows.glow(glowColor) : tokens.shadows.card,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: onClick ? 'pointer' : 'default',
        ...(hover && !onClick
          ? {
              '&:hover': {
                transform: 'translateY(-4px)',
                borderColor: tokens.colors.border.accent,
                boxShadow: `${tokens.shadows.cardHover}, ${tokens.shadows.glow(glowColor)}`,
                bgcolor: tokens.colors.bg.cardHover,
              },
            }
          : {}),
        ...(onClick
          ? {
              '&:hover': {
                transform: 'translateY(-4px)',
                borderColor: tokens.colors.border.accentHover,
                boxShadow: `${tokens.shadows.cardHover}, ${tokens.shadows.glow(glowColor)}`,
                bgcolor: tokens.colors.bg.cardHover,
              },
              '&:focus-visible': {
                outline: `2px solid ${tokens.colors.accent.blue}`,
                outlineOffset: 2,
              },
            }
          : {}),
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
