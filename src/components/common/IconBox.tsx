import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import { tokens } from '../../theme/theme';

export interface IconBoxProps {
  children: ReactNode;
  color?: string;
  size?: number | 'sm' | 'small' | 'md' | 'medium' | 'lg' | 'large';
  sx?: SxProps<Theme>;
  className?: string;
}

const resolveColor = (c: string): string => {
  if (c === 'blue' || c === 'primary') return tokens.colors.accent.blue;
  if (c === 'cyan' || c === 'secondary') return tokens.colors.accent.cyan;
  if (c === 'green' || c === 'success') return tokens.colors.accent.green;
  if (c === 'red' || c === 'error') return tokens.colors.accent.red;
  if (c === 'amber' || c === 'warning') return tokens.colors.accent.amber;
  return c;
};

const resolveSize = (s: number | string): number => {
  if (typeof s === 'number') return s;
  switch (s) {
    case 'sm':
    case 'small':
      return 36;
    case 'lg':
    case 'large':
      return 56;
    case 'md':
    case 'medium':
    default:
      return 48;
  }
};

export default function IconBox({
  children,
  color = tokens.colors.accent.blue,
  size = 48,
  sx,
  className
}: IconBoxProps) {
  const actualColor = resolveColor(color);
  const actualSize = resolveSize(size);
  const bgColor = actualColor.startsWith('#') ? `${actualColor}15` : 'rgba(59,130,246,0.15)';
  const borderColor = actualColor.startsWith('#') ? `${actualColor}25` : 'rgba(59,130,246,0.25)';

  return (
    <Box
      className={className}
      sx={{
        width: actualSize,
        height: actualSize,
        borderRadius: `${tokens.radius.md}px`,
        bgcolor: bgColor,
        border: `1px solid ${borderColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: actualColor,
        flexShrink: 0,
        '& svg': {
          width: actualSize * 0.5,
          height: actualSize * 0.5,
        },
        ...((sx as object) || {}),
      }}
    >
      {children}
    </Box>
  );
}

