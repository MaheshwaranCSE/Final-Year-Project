import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Grid, Button, Divider, Table, TableBody, TableCell, TableHead, TableRow, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { getLS, setLS } from '../lib/supabase';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [assignedCases, setAssignedCases] = useState<any[]>([]);
  
  const [reportModal, setReportModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [findings, setFindings] = useState('');

  useEffect(() => {
    fetchCases();
  }, [user]);

  const fetchCases = () => {
    const allEvidence = getLS('mock_evidence', []);
    const mine = allEvidence.filter((e: any) => e.assignedDoctorId === user?.id);
    setAssignedCases(mine);
  };

  const handleSubmitReport = () => {
    if (!selectedCase) return;
    
    // In a real app, create a record in medical_reports table
    // For mock, we'll just update the evidence object
    const allEvidence = getLS('mock_evidence', []);
    const updated = allEvidence.map((e: any) => 
      e.id === selectedCase.id ? { 
        ...e, 
        medicalReportStatus: 'Submitted',
        medicalFindings: findings,
        status: 'Medical Review Completed'
      } : e
    );
    setLS('mock_evidence', updated);
    
    // Mock audit log
    const logs = getLS('mock_audit_logs', []);
    setLS('mock_audit_logs', [...logs, {
      id: Date.now().toString(),
      action: 'Medical Report Submitted',
      actorRole: 'Doctor',
      actorId: user?.id,
      entityId: selectedCase.id,
      timestamp: new Date().toISOString()
    }]);

    setReportModal(false);
    setSelectedCase(null);
    setFindings('');
    fetchCases();
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      
      <Container maxWidth="lg" sx={{ pt: 12, pb: 8 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>Doctor Dashboard</Typography>
        <Typography variant="subtitle1" color="text.secondary" mb={4}>
          Medical Examiner ID: {user?.id}
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Assigned Medical Examinations</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Case ID</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Police Assigned</TableCell>
                    <TableCell>Report Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignedCases.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center">No assigned cases.</TableCell></TableRow>
                  ) : (
                    assignedCases.map(row => (
                      <TableRow key={row.id}>
                        <TableCell>{row.id}</TableCell>
                        <TableCell>{row.title}</TableCell>
                        <TableCell>{row.assignedPoliceName || 'Officer'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={row.medicalReportStatus || 'Pending'} 
                            size="small" 
                            color={row.medicalReportStatus === 'Submitted' ? 'success' : 'warning'} 
                          />
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="small" 
                            variant="outlined"
                            disabled={row.medicalReportStatus === 'Submitted'}
                            onClick={() => { setSelectedCase(row); setReportModal(true); }}
                          >
                            {row.medicalReportStatus === 'Submitted' ? 'View Report' : 'Draft Report'}
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

      {/* Draft Report Modal */}
      <Dialog open={reportModal} onClose={() => setReportModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Medical Examination Report - Case {selectedCase?.id}</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom mt={2}>Examination Findings</Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Detailed medical observations and findings"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={10}
            value={findings}
            onChange={(e) => setFindings(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportModal(false)}>Cancel</Button>
          <Button onClick={handleSubmitReport} variant="contained" color="primary">Submit Official Report</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
