import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  AppBar,
  Toolbar
} from '@mui/material';
import { Folder as FolderIcon, Add as AddIcon, Logout as LogoutIcon } from '@mui/icons-material';

interface Case {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

export default function InvestigatorDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [openNewCase, setOpenNewCase] = useState(false);
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseDesc, setNewCaseDesc] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('investigator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCases(data || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = async () => {
    if (!user || !newCaseTitle) return;
    
    try {
      const { error } = await supabase
        .from('cases')
        .insert([
          { title: newCaseTitle, description: newCaseDesc, investigator_id: user.id }
        ]);

      if (error) throw error;
      
      setOpenNewCase(false);
      setNewCaseTitle('');
      setNewCaseDesc('');
      fetchCases();
    } catch (error) {
      console.error('Error creating case:', error);
      alert('Failed to create case');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Investigator Dashboard
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.email}
          </Typography>
          <Button color="inherit" onClick={handleSignOut} startIcon={<LogoutIcon />}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">My Cases</Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => setOpenNewCase(true)}
          >
            New Case Folder
          </Button>
        </Box>

        {loading ? (
          <Typography>Loading cases...</Typography>
        ) : cases.length === 0 ? (
          <Typography color="text.secondary">No cases found. Create one to get started.</Typography>
        ) : (
          <Grid container spacing={3}>
            {cases.map((c) => (
              <Grid item xs={12} sm={6} md={4} key={c.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <FolderIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" component="div">
                        {c.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {c.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                      Created: {new Date(c.created_at).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate(`/cases/${c.id}`)}>
                      Open Folder
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Dialog open={openNewCase} onClose={() => setOpenNewCase(false)}>
          <DialogTitle>Create New Case Folder</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Case Title"
              fullWidth
              variant="outlined"
              value={newCaseTitle}
              onChange={(e) => setNewCaseTitle(e.target.value)}
              sx={{ mb: 2, mt: 1 }}
            />
            <TextField
              margin="dense"
              label="Description (Optional)"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={newCaseDesc}
              onChange={(e) => setNewCaseDesc(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenNewCase(false)}>Cancel</Button>
            <Button onClick={handleCreateCase} variant="contained" disabled={!newCaseTitle}>
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
