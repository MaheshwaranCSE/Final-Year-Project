import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Grid, Button, Divider, Table, TableBody, TableCell, TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { getLS, setLS } from '../lib/supabase';
import { recordOfficialLike, hasOfficiallyLiked } from '../lib/officialEngagement';

export default function PoliceDashboard() {
  const { user } = useAuth();
  const [availableCases, setAvailableCases] = useState<any[]>([]);
  const [myCases, setMyCases] = useState<any[]>([]);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  
  const [assignDoctorModal, setAssignDoctorModal] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchCases();
  }, [user]);

  const fetchCases = () => {
    const allEvidence = getLS('mock_evidence', []);
    
    const unassigned = allEvidence.filter((e: any) => !e.assignedPoliceId);
    setAvailableCases(unassigned);
    
    const assigned = allEvidence.filter((e: any) => e.assignedPoliceId === user?.id);
    setMyCases(assigned);

    // Build liked map
    const map: Record<string, boolean> = {};
    allEvidence.forEach((e: any) => {
      map[e.id] = hasOfficiallyLiked(user?.id || '', e.id);
    });
    setLikedMap(map);
  };

  const handleAcceptCase = (caseObj: any) => {
    const allEvidence = getLS('mock_evidence', []);
    const updated = allEvidence.map((e: any) => 
      e.id === caseObj.id ? { 
        ...e, 
        assignedPoliceId: user?.id, 
        assignedPoliceName: user?.name || 'Officer',
        status: 'Investigation'
      } : e
    );
    setLS('mock_evidence', updated);
    
    const logs = getLS('mock_audit_logs', []);
    setLS('mock_audit_logs', [...logs, {
      id: Date.now().toString(),
      action: 'Case Accepted',
      actorRole: 'Police',
      actorId: user?.id,
      entityId: caseObj.id,
      timestamp: new Date().toISOString()
    }]);

    fetchCases();
  };

  const handleOfficialLike = (evidenceId: string) => {
    const result = recordOfficialLike(evidenceId, user?.id || '', 'police');
    if (result) {
      setSnackbar({ open: true, message: `Evidence ${evidenceId} officially marked as important. It is now eligible for public news.`, severity: 'success' });
      fetchCases();
    } else {
      setSnackbar({ open: true, message: 'You have already officially liked this evidence.', severity: 'info' });
    }
  };

  const handleAssignDoctor = () => {
    if (!selectedCaseId) return;
    
    const allEvidence = getLS('mock_evidence', []);
    const updated = allEvidence.map((e: any) => 
      e.id === selectedCaseId ? { 
        ...e, 
        assignedDoctorId: 'DOC-00001'
      } : e
    );
    setLS('mock_evidence', updated);
    
    setAssignDoctorModal(false);
    setSelectedCaseId(null);
    fetchCases();
    setSnackbar({ open: true, message: 'Doctor DOC-00001 has been assigned to the case.', severity: 'success' });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      
      <Container maxWidth="xl" sx={{ pt: 12, pb: 8 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>Police Dashboard</Typography>
        <Typography variant="subtitle1" color="text.secondary" mb={4}>
          Officer ID: {user?.id}
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom>My Active Cases</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Case / Evidence ID</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Official Interest</TableCell>
                    <TableCell>Doctor Assigned</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {myCases.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center">No active cases.</TableCell></TableRow>
                  ) : (
                    myCases.map(row => (
                      <TableRow key={row.id}>
                        <TableCell>{row.id}</TableCell>
                        <TableCell>{row.title}</TableCell>
                        <TableCell><Chip label={row.status || 'Investigation'} size="small" color="primary" /></TableCell>
                        <TableCell>{row.officialLikeCount || 0}</TableCell>
                        <TableCell>{row.assignedDoctorId ? 'Yes' : 'No'}</TableCell>
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
                            {likedMap[row.id] ? 'Marked' : 'Mark as Important'}
                          </Button>
                          <Button 
                            size="small" 
                            variant="outlined" 
                            color="secondary"
                            disabled={!!row.assignedDoctorId}
                            onClick={() => { setSelectedCaseId(row.id); setAssignDoctorModal(true); }}
                          >
                            Assign Doctor
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Nearby / Available Cases</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Area</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {availableCases.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center">No available cases.</TableCell></TableRow>
                  ) : (
                    availableCases.map(row => (
                      <TableRow key={row.id}>
                        <TableCell>{row.title}</TableCell>
                        <TableCell>{row.category}</TableCell>
                        <TableCell>{row.publicArea || 'Unknown'}</TableCell>
                        <TableCell>{new Date(row.timestamp).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button size="small" variant="contained" color="primary" onClick={() => handleAcceptCase(row)}>
                            Accept Case
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

      {/* Assign Doctor Modal */}
      <Dialog open={assignDoctorModal} onClose={() => setAssignDoctorModal(false)}>
        <DialogTitle>Assign Medical Examiner</DialogTitle>
        <DialogContent>
          <Typography paragraph>Assigning Doctor DOC-00001 to Case {selectedCaseId}</Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for medical examination"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDoctorModal(false)}>Cancel</Button>
          <Button onClick={handleAssignDoctor} variant="contained" color="primary">Assign</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
