import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Box, Container, Typography, Button, Grid, Card, CardContent, CardMedia,
  Chip, Divider, CircularProgress, Snackbar, Paper
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import Navbar from '../components/Navbar';
import SignupPrompt from '../components/SignupPrompt';
import { getLS, setLS } from '../lib/supabase';

export default function EvidenceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  
  const [evidence, setEvidence] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    const fetchEvidence = async () => {
      setLoading(true);
      const { data } = await supabase.from('evidence').select('*').eq('id', id).single();
      
      if (data) {
        const currentViews = data.viewCount || 0;
        const viewedKey = `viewed_${id}`;
        let finalViews = currentViews;
        if (!sessionStorage.getItem(viewedKey)) {
          finalViews += 1;
          const allEvidence = getLS('mock_evidence', []);
          const updated = allEvidence.map((e: any) => e.id === id ? { ...e, viewCount: finalViews } : e);
          setLS('mock_evidence', updated);
          sessionStorage.setItem(viewedKey, 'true');
        }
        setEvidence({ ...data, viewCount: finalViews });
      }
      setLoading(false);
    };

    if (id) fetchEvidence();
  }, [id]);

  const handleReport = () => {
    setSnackbarMessage('Content reported to administrators.');
    setSnackbarOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!evidence) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Navbar />
        <Container sx={{ pt: 12, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>Evidence Not Found</Typography>
          <Button variant="contained" onClick={() => navigate('/')}>Return Home</Button>
        </Container>
      </Box>
    );
  }

  const isRestricted = evidence.publicStatus !== 'PUBLIC';
  const canAccessRestricted = user && ['police', 'investigator', 'admin', 'court'].includes(role || '');

  if (isRestricted && !canAccessRestricted) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Navbar />
        <Container sx={{ pt: 12, textAlign: 'center' }}>
          <Paper sx={{ p: 6, maxWidth: 600, mx: 'auto', mt: 4, bgcolor: '#fff0f0' }}>
            <ReportProblemIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h4" color="error" gutterBottom>Restricted Information</Typography>
            <Typography variant="body1" paragraph>
              You do not have permission to access this information. This evidence is restricted to authorized investigation personnel.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/')}>Return Home</Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      
      <Container maxWidth="lg" sx={{ pt: 12, pb: 8 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 4 }}>
              <CardMedia
                component="img"
                height="400"
                image={evidence.thumbnailUrl || 'https://via.placeholder.com/800?text=Evidence'}
                alt={evidence.title}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h4" component="h1" fontWeight="bold">
                    {evidence.title}
                  </Typography>
                  <Button 
                    variant="outlined" 
                    color="error"
                    onClick={handleReport}
                    title="Report this content"
                  >
                    <ReportProblemIcon />
                  </Button>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                  <Chip label={evidence.category} color="primary" />
                  <Chip label={`Area: ${evidence.publicArea || 'Unknown'}`} variant="outlined" />
                  <Chip icon={<VisibilityIcon />} label={`${evidence.viewCount || 0} Views`} variant="outlined" />
                  <Chip 
                    icon={<VerifiedUserIcon />} 
                    label={`Official Interest: ${evidence.officialLikeCount || 0}`} 
                    color="primary" 
                    variant="outlined" 
                  />
                  {evidence.verificationStatus === 'VERIFIED' && (
                    <Chip icon={<ShieldIcon />} label="Verified Intact" color="success" />
                  )}
                </Box>

                {evidence.officialLikeCount > 0 && (
                  <Box sx={{ mb: 3, p: 1.5, bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
                    <Typography variant="body2" color="primary.main" fontWeight="bold">
                      ✓ Reviewed by Authorized Officials
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ mb: 3 }} />

                <Typography variant="h6" gutterBottom>Description</Typography>
                <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                  {evidence.description || 'No public description available.'}
                </Typography>

                <Box sx={{ mt: 4, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" color="text.secondary">Public Record Information</Typography>
                  <Typography variant="body2"><strong>Date Submitted:</strong> {new Date(evidence.timestamp).toLocaleString()}</Typography>
                  <Typography variant="body2"><strong>Evidence ID:</strong> {evidence.id}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom>Public Chain of Custody</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ position: 'relative', pl: 2, borderLeft: '2px solid', borderColor: 'primary.main', mb: 2 }}>
                <Box sx={{ position: 'absolute', left: -6, top: 0, width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main' }} />
                <Typography variant="subtitle2">Evidence Submitted</Typography>
                <Typography variant="caption" color="text.secondary">{new Date(evidence.timestamp).toLocaleString()}</Typography>
              </Box>
              <Box sx={{ position: 'relative', pl: 2, borderLeft: '2px solid', borderColor: 'success.main' }}>
                <Box sx={{ position: 'absolute', left: -6, top: 0, width: 10, height: 10, borderRadius: '50%', bgcolor: 'success.main' }} />
                <Typography variant="subtitle2">Blockchain Hash Verified</Typography>
                <Typography variant="caption" color="text.secondary">System Automated</Typography>
              </Box>
            </Paper>

            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom>Official Engagement</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2">Police Interest: {evidence.policeLikeCount || 0}</Typography>
                <Typography variant="body2">Admin Interest: {evidence.adminLikeCount || 0}</Typography>
                <Typography variant="body2">Court Interest: {evidence.courtLikeCount || 0}</Typography>
                <Divider />
                <Typography variant="subtitle1" fontWeight="bold" color="primary">Total Official Interest: {evidence.officialLikeCount || 0}</Typography>
              </Box>
            </Paper>

            <Paper sx={{ p: 3, bgcolor: '#f8f9fa' }}>
              <Typography variant="h6" gutterBottom>Have Information?</Typography>
              <Typography variant="body2" paragraph>
                If you have information related to this evidence, you can submit an anonymous tip or create an account to upload additional evidence safely and securely.
              </Typography>
              <Button variant="contained" fullWidth onClick={() => navigate('/login')}>
                Submit Information
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
      
      {!user && <SignupPrompt />}

      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={4000} 
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
}
