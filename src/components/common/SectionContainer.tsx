import type { ReactNode } from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';

interface SectionContainerProps {
  id?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  sx?: object;
  disablePadding?: boolean;
}

export default function SectionContainer({
  id,
  children,
  maxWidth = 'lg',
  sx = {},
  disablePadding = false,
}: SectionContainerProps) {
  return (
    <Box
      component="section"
      id={id}
      sx={{
        py: disablePadding ? 0 : { xs: 8, md: 12 },
        position: 'relative',
        ...sx,
      }}
    >
      <Container maxWidth={maxWidth}>{children}</Container>
    </Box>
  );
}
