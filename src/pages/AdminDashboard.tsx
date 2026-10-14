import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getLS } from '../lib/supabase';
import { recordOfficialLike, hasOfficiallyLiked, removeFromNews } from '../lib/officialEngagement';
import {
  Container, Typography, Box, Grid, Card, CardContent, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button, Snackbar, Alert
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import Navbar from '../components/Navbar';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState({
    totalEvidence: 0,
    totalViews: 0,
    totalOfficialLikes: 0,
    policeLikes: 0,
    adminLikes: 0,
    courtLikes: 0,
    newsPublished: 0,
    newsPending: 0
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'warning' }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    const allEvidence = getLS('mock_evidence', []);
    setEvidenceList(allEvidence);
    
    let views = 0;
    let officialLikes = 0;
    let pLikes = 0;
    let aLikes = 0;
    let cLikes = 0;
    let published = 0;
    let pending = 0;

    const map: Record<string, boolean> = {};
    allEvidence.forEach((e: any) => {
      views += (e.viewCount || 0);
      officialLikes += (e.officialLikeCount || 0);
      pLikes += (e.policeLikeCount || 0);
      aLikes += (e.adminLikeCount || 0);
      cLikes += (e.courtLikeCount || 0);
      if (e.publicNews) published++;
      else pending++;
      map[e.id] = hasOfficiallyLiked(user?.id || '', e.id);
    });

    setLikedMap(map);
    setStats({
      totalEvidence: allEvidence.length,
      totalViews: views,
      totalOfficialLikes: officialLikes,
      policeLikes: pLikes,
      adminLikes: aLikes,
      courtLikes: cLikes,
      newsPublished: published,
      newsPending: pending
    });
  };

  const handleOfficialLike = (evidenceId: string) => {
    const result = recordOfficialLike(evidenceId, user?.id || '', 'admin');
    if (result) {
      setSnackbar({ open: true, message: `Evidence ${evidenceId} officially promoted. Now eligible for public news.`, severity: 'success' });
      fetchData();
    } else {
      setSnackbar({ open: true, message: 'Already officially liked.', severity: 'info' });
    }
  };

  const handleRemoveFromNews = (evidenceId: string) => {
    removeFromNews(evidenceId, user?.id || '');
    setSnackbar({ open: true, message: `Evidence ${evidenceId} removed from public news.`, severity: 'warning' });
    fetchData();
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />

      <Container maxWidth="xl" sx={{ pt: 12, pb: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" fontWeight="bold">Admin Dashboard</Typography>
          <Button variant="outlined" color="primary">Generate Audit Report</Button>
        </Box>

        {/* Official Engagement Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={4} md={2}>
            <Card><CardContent>
              <Typography color="text.secondary" variant="caption" gutterBottom>Total Evidence</Typography>
              <Typography variant="h4">{stats.totalEvidence}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card><CardContent>
              <Typography color="text.secondary" variant="caption" gutterBottom>Total Official Likes</Typography>
              <Typography variant="h4" color="error">{stats.totalOfficialLikes}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card><CardContent>
              <Typography color="text.secondary" variant="caption" gutterBottom>Police Likes</Typography>
              <Typography variant="h4">{stats.policeLikes}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card><CardContent>
              <Typography color="text.secondary" variant="caption" gutterBottom>Admin Likes</Typography>
              <Typography variant="h4">{stats.adminLikes}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card><CardContent>
              <Typography color="text.secondary" variant="caption" gutterBottom>Court Likes</Typography>
              <Typography variant="h4">{stats.courtLikes}</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card><CardContent>
              <Typography color="text.secondary" variant="caption" gutterBottom>News Published</Typography>
              <Typography variant="h4" color="success.main">{stats.newsPublished}</Typography>
            </CardContent></Card>
          </Grid>
        </Grid>

        <Typography variant="h5" sx={{ mb: 2 }}>All Evidence & Cases</Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>News Status</TableCell>
                <TableCell>Official Likes</TableCell>
                <TableCell>Breakdown (P/A/C)</TableCell>
                <TableCell>Views</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {evidenceList.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center">No records found.</TableCell></TableRow>
              ) : (
                evidenceList.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell><Chip label={row.id} size="small" /></TableCell>
                    <TableCell>{row.title}</TableCell>
                    <TableCell>{row.status || 'Submitted'}</TableCell>
                    <TableCell>
                      {row.publicNews ? (
                        <Chip label="Published" color="success" size="small" icon={<NewspaperIcon />} />
                      ) : (
                        <Chip label="Pending" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell><strong>{row.officialLikeCount || 0}</strong></TableCell>
                    <TableCell>{row.policeLikeCount || 0} / {row.adminLikeCount || 0} / {row.courtLikeCount || 0}</TableCell>
                    <TableCell>{row.viewCount || 0}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant={likedMap[row.id] ? 'contained' : 'outlined'}
                        color="error"
                        startIcon={<FavoriteIcon />}
                        disabled={likedMap[row.id]}
                        onClick={() => handleOfficialLike(row.id)}
                        sx={{ mr: 1 }}
                      >
                        {likedMap[row.id] ? 'Liked' : 'Official Like'}
                      </Button>
                      {row.publicNews && (
                        <Button size="small" variant="outlined" color="warning" onClick={() => handleRemoveFromNews(row.id)}>
                          Remove News
                        </Button>
                      )}
                      <Button size="small" onClick={() => navigate(`/cases/${row.id}`)} sx={{ ml: 1 }}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
