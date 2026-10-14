import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Grid, Button, Chip, Divider, Stepper, Step, StepLabel } from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { getLS, setLS } from '../lib/supabase';

const generateCaseId = () => {
  return `BV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
};

export default function UserDashboard() {
  const { user } = useAuth();
  const [myEvidence, setMyEvidence] = useState<any[]>([]);

  useEffect(() => {
    const fetchMyEvidence = () => {
      const allEvidence = getLS('mock_evidence', []);
      const mine = allEvidence.filter((e: any) => e.uploaderId === user?.id || e.uploaderEmail === user?.email);
      setMyEvidence(mine);
    };
    fetchMyEvidence();
  }, [user]);

  const handleUploadNew = () => {
    const newCaseId = generateCaseId();
    const newEvidence = {
      id: `EV-${Math.floor(1000 + Math.random() * 9000)}`,
      caseId: newCaseId,
      uploaderId: user?.id,
      uploaderEmail: user?.email,
      title: 'New Uploaded Evidence',
      description: 'User description of the evidence.',
      category: 'Digital',
      publicStatus: 'PRIVATE',
      publicArea: 'Unknown',
      timestamp: new Date().toISOString(),
      status: 'Submitted',
      // Official engagement fields — start at zero, only officials can increment
      policeLikeCount: 0,
      adminLikeCount: 0,
      courtLikeCount: 0,
      officialLikeCount: 0,
      publicNews: false,
      viewCount: 0,
    };

    const allEvidence = getLS('mock_evidence', []);
    setLS('mock_evidence', [...allEvidence, newEvidence]);
    setMyEvidence(prev => [...prev, newEvidence]);
    
    alert('Your evidence has been submitted successfully.\n\nIt will be reviewed by authorized officials before appearing in public news.');
  };

  const getStatusStep = (status: string) => {
    const steps = ['Submitted', 'Evidence Processing', 'Police Assignment', 'Investigation', 'Closed'];
    return steps.indexOf(status) >= 0 ? steps.indexOf(status) : 0;
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      
      <Container maxWidth="lg" sx={{ pt: 12, pb: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" fontWeight="bold">My Dashboard</Typography>
          <Button variant="contained" color="primary" onClick={handleUploadNew}>
            Upload Evidence
          </Button>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Paper sx={{ p: 4 }}>
              <Typography variant="h6" gutterBottom>My Submissions</Typography>
              <Divider sx={{ mb: 3 }} />

              {myEvidence.length === 0 ? (
                <Typography color="text.secondary">You have not submitted any evidence yet.</Typography>
              ) : (
                myEvidence.map(item => (
                  <Paper key={item.id} variant="outlined" sx={{ p: 3, mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">{item.title}</Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip label={item.category} size="small" />
                        {item.publicNews ? (
                          <Chip label="Published as News" color="success" size="small" />
                        ) : (
                          <Chip label="Pending Review" size="small" variant="outlined" />
                        )}
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" paragraph color="text.secondary">
                      Submitted on: {new Date(item.timestamp).toLocaleString()}
                    </Typography>

                    {/* Official Interest (read-only for normal users) */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <VerifiedUserIcon fontSize="small" color="primary" />
                      <Typography variant="body2" color="primary">
                        Official Interest: {item.officialLikeCount || 0}
                      </Typography>
                      {item.officialLikeCount > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          — Reviewed by authorized officials
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ mt: 4 }}>
                      <Typography variant="subtitle2" gutterBottom>Submission Status:</Typography>
                      <Stepper activeStep={getStatusStep(item.status || 'Submitted')} alternativeLabel>
                        {['Submitted', 'Processing', 'Assigned', 'Investigation', 'Closed'].map((label) => (
                          <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                          </Step>
                        ))}
                      </Stepper>
                    </Box>
                  </Paper>
                ))
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
