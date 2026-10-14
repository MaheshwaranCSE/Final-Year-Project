import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import { ArrowLeft } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
}

export default function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
        <Typography
          variant="caption"
          sx={{
            display: 'inline-block',
            px: 2,
            py: 0.5,
            mb: 3,
            borderRadius: '9999px',
            border: '1px solid rgba(59,130,246,0.2)',
            bgcolor: 'rgba(59,130,246,0.08)',
            color: '#60A5FA',
          }}
        >
          COMING SOON
        </Typography>
        <Typography variant="h2" sx={{ mb: 2, color: 'text.primary' }}>
          {title}
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
          This page is under development and will be available in a future release of BlockVault.
        </Typography>
        <Button
          component={RouterLink}
          to="/"
          variant="outlined"
          startIcon={<ArrowLeft size={18} />}
          sx={{
            borderColor: 'rgba(255,255,255,0.12)',
            color: 'text.primary',
            '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(59,130,246,0.08)' },
          }}
        >
          Back to Home
        </Button>
      </Container>
    </Box>
  );
}
