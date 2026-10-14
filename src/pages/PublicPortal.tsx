import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Box, Container, Typography, Button, Grid, Card, CardContent, CardMedia,
  CardActions, Chip, Divider, useTheme
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Navbar from '../components/Navbar';

export default function PublicPortal() {
  const [topEvidence, setTopEvidence] = useState<any[]>([]);
  const [latestNews, setLatestNews] = useState<any[]>([]);
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    const fetchPublicData = async () => {
      const { data: evidence } = await supabase.from('evidence').select('*');
      if (evidence) {
        // Only show evidence that has been officially promoted (publicNews === true)
        const publicEvidence = evidence
          .filter((e: any) => e.publicStatus === 'PUBLIC' && e.publicNews === true)
          .sort((a: any, b: any) => (b.officialLikeCount || 0) - (a.officialLikeCount || 0) || new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10);
        setTopEvidence(publicEvidence);
      }

      const { data: news } = await supabase.from('news').select('*');
      if (news) {
        const sortedNews = news
          .filter((n: any) => n.status === 'PUBLISHED')
          .sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        setLatestNews(sortedNews);
      }
    };
    
    fetchPublicData();
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      
      {/* Hero Section */}
      <Box sx={{ 
        pt: 12, pb: 8, 
        background: 'linear-gradient(135deg, #0a192f 0%, #112240 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
            Secure Digital Evidence.<br />
            <span style={{ color: theme.palette.primary.main }}>Verified. Protected. Immutable.</span>
          </Typography>
          <Typography variant="h6" paragraph sx={{ mb: 4, color: 'rgba(255,255,255,0.7)' }}>
            BlockVault provides an immutable, blockchain-backed framework for managing digital forensic evidence, ensuring tamper-proof chain of custody for law enforcement and legal professionals.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="contained" size="large" onClick={() => document.getElementById('evidence-section')?.scrollIntoView()}>
              Explore Evidence
            </Button>
            <Button variant="outlined" size="large" sx={{ color: 'white', borderColor: 'white' }} onClick={() => navigate('/login')}>
              Report Evidence
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* Top Evidence News Section */}
        <Box id="evidence-section" sx={{ mb: 8 }}>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Top Evidence News
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Evidence reviewed and promoted by authorized officials
          </Typography>
          <Divider sx={{ mb: 4 }} />
          
          <Grid container spacing={3}>
            {topEvidence.length === 0 ? (
              <Grid item xs={12}>
                <Typography color="text.secondary">No officially promoted evidence at this time.</Typography>
              </Grid>
            ) : (
              topEvidence.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardMedia
                      component="img"
                      height="140"
                      image={item.thumbnailUrl || 'https://via.placeholder.com/300?text=Evidence'}
                      alt={item.title}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                          #{index + 1} {item.title}
                        </Typography>
                        {item.verificationStatus === 'VERIFIED' && (
                          <ShieldIcon color="success" fontSize="small" titleAccess="Verified Intact" />
                        )}
                      </Box>
                      <Chip label={item.category} size="small" sx={{ mb: 1.5 }} />
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {item.description?.substring(0, 100)}...
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Area: {item.publicArea}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Date: {new Date(item.timestamp).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                    <Divider />
                    <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
                      <Box sx={{ display: 'flex', gap: 2, color: 'text.secondary' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <VerifiedUserIcon fontSize="small" color="primary" />
                          <Typography variant="caption" fontWeight="bold">
                            Official Interest: {item.officialLikeCount || 0}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <VisibilityIcon fontSize="small" />
                          <Typography variant="caption">{item.viewCount || 0}</Typography>
                        </Box>
                      </Box>
                      <Button size="small" onClick={() => navigate(`/evidence/${item.id}`)}>
                        Read More
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </Box>

        {/* Latest News Section */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Latest News
          </Typography>
          <Divider sx={{ mb: 4 }} />
          
          <Grid container spacing={4}>
            {latestNews.length === 0 ? (
              <Grid item xs={12}>
                <Typography color="text.secondary">No news available at this time.</Typography>
              </Grid>
            ) : (
              latestNews.map((news) => (
                <Grid item xs={12} md={6} key={news.id}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box
                      component="img"
                      src={news.imageUrl || 'https://via.placeholder.com/150'}
                      sx={{ width: 150, height: 100, objectFit: 'cover', borderRadius: 1 }}
                    />
                    <Box>
                      <Chip label={news.category} size="small" sx={{ mb: 1 }} />
                      <Typography variant="h6" sx={{ lineHeight: 1.2, mb: 1, cursor: 'pointer', '&:hover': { color: 'primary.main' } }} onClick={() => navigate(`/news/${news.id}`)}>
                        {news.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {news.summary}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {new Date(news.publishedAt).toLocaleDateString()} • {news.area}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))
            )}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
