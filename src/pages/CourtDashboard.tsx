import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Grid, Button, Divider, Table, TableBody, TableCell, TableHead, TableRow, Chip, Snackbar, Alert } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ShieldIcon from '@mui/icons-material/Shield';
import FavoriteIcon from '@mui/icons-material/Favorite';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { getLS, setLS } from '../lib/supabase';
import { recordOfficialLike, hasOfficiallyLiked } from '../lib/officialEngagement';
import { useNavigate } from 'react-router-dom';

export default function CourtDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courtCases, setCourtCases] = useState<any[]>([]);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchCases();
  }, [user]);

  const fetchCases = () => {
    const allEvidence = getLS('mock_evidence', []);
    const authorized = allEvidence.filter((e: any) => 
      e.status === 'Investigation' || 
      e.status === 'Medical Review Completed' ||
      e.status === 'Closed'
    );
    setCourtCases(authorized);

    const map: Record<string, boolean> = {};
    authorized.forEach((e: any) => {
      map[e.id] = hasOfficiallyLiked(user?.id || '', e.id);
    });
    setLikedMap(map);
    
    const logs = getLS('mock_audit_logs', []);
    setLS('mock_audit_logs', [...logs, {
      id: Date.now().toString(),
      action: 'Court Dashboard Accessed',
      actorRole: 'Court',
      actorId: user?.id,
      timestamp: new Date().toISOString()
    }]);
  };

  const handleOfficialLike = (evidenceId: string) => {
    const result = recordOfficialLike(evidenceId, user?.id || '', 'court');
    if (result) {
      setSnackbar({ open: true, message: `Evidence ${evidenceId} officially endorsed by Court. Now eligible for public news.`, severity: 'success' });
      fetchCases();
    } else {
      setSnackbar({ open: true, message: 'Already officially endorsed.', severity: 'info' });
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      
      <Container maxWidth="xl" sx={{ pt: 12, pb: 8 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>Court Dashboard</Typography>
        <Typography variant="subtitle1" color="text.secondary" mb={4}>
          Judicial ID: {user?.id}
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Authorized Cases for Review</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Case ID</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Integrity</TableCell>
                    <TableCell>Official Interest</TableCell>
                    <TableCell>Medical Report</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {courtCases.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center">No authorized cases found.</TableCell></TableRow>
                  ) : (
                    courtCases.map(row => (
                      <TableRow key={row.id}>
                        <TableCell>{row.id}</TableCell>
                        <TableCell>{row.title}</TableCell>
                        <TableCell><Chip label={row.status} size="small" /></TableCell>
                        <TableCell>
                          {row.verificationStatus === 'VERIFIED' ? (
                            <Chip icon={<ShieldIcon />} label="Verified" color="success" size="small" />
                          ) : (
                            <Chip label="Unverified" color="error" size="small" />
                          )}
                        </TableCell>
                        <TableCell><strong>{row.officialLikeCount || 0}</strong></TableCell>
                        <TableCell>{row.medicalReportStatus === 'Submitted' ? 'Available' : 'None'}</TableCell>
                        <TableCell>
                          <Button 
                            size="small" 
                            variant={likedMap[row.id] ? 'contained' : 'outlined'}
                            color="error"
                            startIcon={<FavoriteIcon />}
                            disabled={likedMap[row.id]}
                            onClick={() => handleOfficialLike(row.id)}
                            sx={{ mr: 1 }}
                          >
                            {likedMap[row.id] ? 'Endorsed' : 'Official Endorse'}
                          </Button>
                          <Button 
                            size="small" 
                            variant="outlined"
                            startIcon={<VisibilityIcon />}
                            onClick={() => navigate(`/cases/${row.id}`)}
                          >
                            View Case File
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
