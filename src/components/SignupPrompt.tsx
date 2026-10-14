import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, IconButton, Paper, Slide } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function SignupPrompt() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem('signup_prompt_dismissed');
    if (dismissed) return;

    // Show after 30 seconds
    const timer = setTimeout(() => {
      setShow(true);
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setShow(false);
    sessionStorage.setItem('signup_prompt_dismissed', 'true');
  };

  const handleAction = (path: string) => {
    setShow(false);
    sessionStorage.setItem('signup_prompt_dismissed', 'true');
    navigate(path);
  };

  return (
    <Slide direction="up" in={show} mountOnEnter unmountOnExit>
      <Paper 
        elevation={6}
        sx={{
          position: 'fixed',
          bottom: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
          left: { xs: 16, sm: 'auto' },
          maxWidth: { sm: 400 },
          p: 3,
          zIndex: 9999,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'primary.light',
          bgcolor: 'background.paper'
        }}
      >
        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
          <IconButton size="small" onClick={handleClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        
        <Typography variant="h6" gutterBottom fontWeight="bold" color="primary">
          Create a BlockVault Account
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Create a BlockVault account to access additional features, track your submissions, and receive updates securely.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="contained" size="small" onClick={() => handleAction('/login')}>
            Sign Up
          </Button>
          <Button variant="outlined" size="small" onClick={() => handleAction('/login')}>
            Login
          </Button>
          <Button variant="text" size="small" color="inherit" onClick={handleClose}>
            Continue Reading
          </Button>
        </Box>
      </Paper>
    </Slide>
  );
}
