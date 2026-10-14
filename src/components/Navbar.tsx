import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import { Menu as MenuIcon, X as CloseIcon, Search as SearchIcon } from 'lucide-react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import BlockVaultLogo from './common/BlockVaultLogo';
import { tokens } from '../theme/theme';

const navItems = [
  { id: 'home', label: 'Home' },
  { id: 'features', label: 'Features' },
  { id: 'workflow', label: 'How It Works' },
  { id: 'security', label: 'Security' },
  { id: 'about', label: 'About' },
];

const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-50% 0px -50% 0px',
      threshold: 0
    };

    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    navItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen((prevState) => !prevState);
  };

  const handleNavClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/about');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
    setMobileOpen(false);
  };

  const drawer = (
    <Box sx={{ p: 2, height: '100%', backgroundColor: tokens.colors.bg.primary }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BlockVaultLogo size={28} color={tokens.colors.accent.blue} />
          <Typography variant="h6" sx={{ color: tokens.colors.text.primary, fontWeight: 700 }}>
            BlockVault
          </Typography>
        </Box>
        <IconButton onClick={handleDrawerToggle} sx={{ color: tokens.colors.text.primary }}>
          <CloseIcon size={24} />
        </IconButton>
      </Box>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              onClick={() => handleNavClick(item.id)}
              sx={{
                borderRadius: tokens.radius.md,
                mb: 1,
                color: activeSection === item.id ? tokens.colors.accent.blue : tokens.colors.text.secondary,
                backgroundColor: activeSection === item.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(59, 130, 246, 0.05)',
                  color: tokens.colors.accent.blue,
                }
              }}
            >
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: activeSection === item.id ? 600 : 400 }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button
          component={RouterLink}
          to="/login"
          variant="outlined"
          fullWidth
          sx={{
            borderColor: tokens.colors.border.accent,
            color: tokens.colors.accent.blue,
            borderRadius: tokens.radius.md,
            textTransform: 'none',
          }}
        >
          Login
        </Button>
        <Button
          component={RouterLink}
          to="/dashboard"
          variant="contained"
          fullWidth
          sx={{
            background: 'linear-gradient(to right, #06B6D4, #2563EB)',
            color: '#fff',
            borderRadius: tokens.radius.md,
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': {
              background: 'linear-gradient(to right, #22D3EE, #3B82F6)',
            }
          }}
        >
          Launch Console
        </Button>
      </Box>
    </Box>
  );

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: scrolled ? tokens.glass.background : 'transparent',
        backdropFilter: scrolled ? tokens.glass.backdropFilter : 'none',
        borderBottom: scrolled ? `1px solid ${tokens.glass.border || tokens.colors.border.subtle}` : '1px solid transparent',
        transition: 'all 0.3s ease',
        zIndex: 1100,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
          onClick={() => handleNavClick('home')}
        >
          <BlockVaultLogo size={32} color={tokens.colors.accent.blue} />
          <Typography
            variant="h6"
            sx={{
              color: tokens.colors.text.primary,
              fontWeight: 700,
              letterSpacing: '-0.5px',
              fontFamily: tokens.fonts?.mono || 'inherit',
            }}
          >
            BlockVault
          </Typography>
        </Box>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
          {navItems.map((item) => (
            <Button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              disableRipple
              sx={{
                color: activeSection === item.id ? tokens.colors.text.primary : tokens.colors.text.secondary,
                textTransform: 'none',
                fontWeight: 500,
                px: 2,
                py: 1,
                borderRadius: tokens.radius.md,
                transition: 'all 0.2s',
                position: 'relative',
                '&:hover': {
                  color: tokens.colors.accent.blue,
                  backgroundColor: 'transparent',
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 4,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: activeSection === item.id ? '20px' : '0px',
                  height: '2px',
                  backgroundColor: tokens.colors.accent.blue,
                  transition: 'width 0.3s ease',
                  borderRadius: '2px',
                }
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/search')} sx={{ color: tokens.colors.text.primary }}>
            <SearchIcon size={20} />
          </IconButton>
          <Button
            component={RouterLink}
            to="/login"
            variant="outlined"
            sx={{
              borderColor: tokens.colors.border.subtle,
              color: tokens.colors.text.primary,
              borderRadius: tokens.radius.md,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              '&:hover': {
                borderColor: tokens.colors.accent.blue,
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
              }
            }}
          >
            Login
          </Button>
          <Button
            component={RouterLink}
            to="/dashboard"
            variant="contained"
            sx={{
              background: 'linear-gradient(to right, #06B6D4, #2563EB)',
              color: '#fff',
              borderRadius: tokens.radius.md,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.25)',
              '&:hover': {
                background: 'linear-gradient(to right, #22D3EE, #3B82F6)',
                boxShadow: '0 0 25px rgba(6, 182, 212, 0.4)',
              }
            }}
          >
            Launch Console
          </Button>
        </Box>

        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ display: { md: 'none' }, color: tokens.colors.text.primary }}
        >
          <MenuIcon size={28} />
        </IconButton>
      </Toolbar>

      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, 
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: 280,
            borderLeft: `1px solid ${tokens.colors.border.subtle}`,
            backgroundColor: tokens.colors.bg.primary
          },
        }}
      >
        {drawer}
      </Drawer>
    </AppBar>
  );
};

export default Navbar;
