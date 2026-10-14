import React from 'react';
import { Box, Typography, Stack, keyframes } from '@mui/material';
import GlassCard from './common/GlassCard';
import StatusBadge from './common/StatusBadge';
import { FileText, Hash, Lock, Blocks, ShieldCheck } from 'lucide-react';
import { tokens } from '../theme/theme';

// Animations
const dashAnimation = keyframes`
  to {
    stroke-dashoffset: -20;
  }
`;

const pulseAnimation = keyframes`
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
`;

const shimmerAnimation = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

interface NodeProps {
  label: string;
  icon: React.ReactNode;
  top: number;
  left: number;
  pulse?: boolean;
}

const VisNode: React.FC<NodeProps> = ({ label, icon, top, left, pulse }) => (
  <Box
    sx={{
      position: 'absolute',
      top,
      left,
      transform: 'translate(-50%, -50%)',
      animation: pulse ? `${pulseAnimation} 3s infinite ease-in-out` : 'none',
      '@media (prefers-reduced-motion: reduce)': {
        animation: 'none',
      },
    }}
  >
    <GlassCard
      sx={{
        p: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        borderRadius: tokens.radius.md,
        minWidth: 140,
        backgroundColor: tokens.colors.elevated,
        border: `1px solid ${tokens.colors.border.subtle}`,
      }}
    >
      <Box sx={{ color: tokens.colors.accent.blue, display: 'flex' }}>
        {icon}
      </Box>
      <Typography variant="body2" sx={{ color: tokens.colors.text.primary, fontWeight: 600, fontSize: '0.85rem' }}>
        {label}
      </Typography>
    </GlassCard>
  </Box>
);

export default function HeroVisualization() {
  return (
    <Box sx={{ position: 'relative', width: 450, height: 400, margin: '0 auto' }}>
      {/* SVG Connecting Lines */}
      <svg width="450" height="400" style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
        <g 
          stroke={tokens.colors.accent.blue} 
          strokeWidth="1.5" 
          strokeDasharray="4 4" 
          opacity="0.3"
          style={{
            animation: typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
              ? 'none'
              : `${dashAnimation} 1s linear infinite`
          }}
        >
          {/* From Center (225, 200) to Nodes */}
          <line x1="225" y1="200" x2="225" y2="50" />
          <line x1="225" y1="200" x2="350" y2="100" />
          <line x1="225" y1="200" x2="390" y2="200" />
          <line x1="225" y1="200" x2="350" y2="300" />
          <line x1="225" y1="200" x2="225" y2="350" />
          
          {/* Node to Node */}
          <line x1="225" y1="50" x2="350" y2="100" />
          <line x1="350" y1="100" x2="390" y2="200" />
          <line x1="390" y1="200" x2="350" y2="300" />
          <line x1="350" y1="300" x2="225" y2="350" />
        </g>
      </svg>

      {/* Center Card */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2,
          width: 240,
        }}
      >
        <GlassCard
          glowColor={tokens.colors.glow.blue}
          sx={{
            p: 3,
            borderRadius: tokens.radius.lg,
            border: `1px solid ${tokens.colors.border.accent}`,
            backgroundColor: tokens.colors.card,
            boxShadow: tokens.shadows.cardHover,
          }}
        >
          <Typography variant="overline" sx={{ color: tokens.colors.text.muted, fontWeight: 700, display: 'block', mb: 1 }}>
            DIGITAL EVIDENCE
          </Typography>
          <Typography sx={{ fontFamily: tokens.fonts.mono, color: tokens.colors.text.primary, fontWeight: 600, fontSize: '0.9rem' }}>
            evidence_0248.dat
          </Typography>
          <Typography variant="caption" sx={{ color: tokens.colors.text.secondary, display: 'block', mb: 2 }}>
            2.48 MB
          </Typography>

          <Typography variant="overline" sx={{ color: tokens.colors.text.muted, fontWeight: 700, display: 'block' }}>
            SHA-256
          </Typography>
          <Typography 
            sx={{ 
              fontFamily: tokens.fonts.mono, 
              color: tokens.colors.text.accent, 
              fontSize: '0.85rem',
              mb: 2.5,
              background: `linear-gradient(90deg, ${tokens.colors.text.accent} 0%, #fff 50%, ${tokens.colors.text.accent} 100%)`,
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: `${shimmerAnimation} 4s linear infinite`,
              '@media (prefers-reduced-motion: reduce)': {
                animation: 'none'
              }
            }}
          >
            8f4a92d7...91c2
          </Typography>

          <Stack spacing={1.5}>
            <StatusBadge label="VERIFIED" variant="success" size="small" pulse />
            <StatusBadge label="BLOCKCHAIN ANCHORED" variant="info" size="small" />
          </Stack>
        </GlassCard>
      </Box>

      {/* Surrounding Nodes */}
      <VisNode label="Evidence" icon={<FileText size={18} />} top={50} left={225} />
      <VisNode label="SHA-256" icon={<Hash size={18} />} top={100} left={350} />
      <VisNode label="Encryption" icon={<Lock size={18} />} top={200} left={390} />
      <VisNode label="Blockchain" icon={<Blocks size={18} />} top={300} left={350} pulse />
      <VisNode label="Verification" icon={<ShieldCheck size={18} />} top={350} left={225} />
    </Box>
  );
};
