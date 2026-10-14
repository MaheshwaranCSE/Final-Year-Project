import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button
} from '@mui/material';
import {
  Bell,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Info,
  ExternalLink,
  CheckCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForensicStore } from '../../stores/useForensicStore';
import { PlatformNotification } from '../../types';

export const NotificationCenter: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useForensicStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isOpen = Boolean(anchorEl);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (n: PlatformNotification) => {
    markNotificationRead(n.id);
    if (n.link) {
      handleClose();
      navigate(n.link);
    }
  };

  const handleMarkAllRead = () => {
    notifications.forEach(n => {
      if (!n.read) markNotificationRead(n.id);
    });
  };

  const getIcon = (type: PlatformNotification['type']) => {
    switch (type) {
      case 'CRITICAL':
        return <AlertOctagon size={18} color="#EF4444" />;
      case 'WARNING':
        return <AlertTriangle size={18} color="#F59E0B" />;
      case 'SUCCESS':
        return <CheckCircle2 size={18} color="#10B981" />;
      case 'INFO':
      default:
        return <Info size={18} color="#3B82F6" />;
    }
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          color: unreadCount > 0 ? '#3B82F6' : '#94A3B8',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          bgcolor: 'rgba(15, 22, 41, 0.6)',
          backdropFilter: 'blur(8px)',
          '&:hover': {
            bgcolor: 'rgba(59, 130, 246, 0.1)',
            borderColor: '#3B82F6'
          }
        }}
      >
        <Badge
          badgeContent={unreadCount}
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.7rem'
            }
          }}
        >
          <Bell size={19} />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 520,
            bgcolor: '#0C101D',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 2.5,
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.85), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
            p: 0,
            mt: 1
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} new`}
                size="small"
                sx={{
                  bgcolor: 'rgba(239, 68, 68, 0.15)',
                  color: '#EF4444',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  height: 20
                }}
              />
            )}
          </Box>
          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={handleMarkAllRead}
              startIcon={<CheckCheck size={14} />}
              sx={{ color: '#94A3B8', fontSize: '0.75rem', textTransform: 'none' }}
            >
              Mark all read
            </Button>
          )}
        </Box>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

        {notifications.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Info size={32} color="#64748B" style={{ opacity: 0.5, marginBottom: 8 }} />
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              No notifications at this time
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0, overflowY: 'auto', maxHeight: 420 }}>
            {notifications.map(n => (
              <ListItem
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  px: 2,
                  py: 1.5,
                  cursor: 'pointer',
                  bgcolor: n.read ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  transition: 'background-color 0.15s',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.03)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, mt: 0.5 }}>{getIcon(n.type)}</ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: n.read ? 500 : 700,
                          color: n.read ? '#CBD5E1' : '#FFFFFF',
                          fontSize: '0.85rem'
                        }}
                      >
                        {n.title}
                      </Typography>
                      {!n.read && (
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: '#3B82F6',
                            ml: 1
                          }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#94A3B8',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.4
                        }}
                      >
                        {n.message}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                          {new Date(n.timestamp).toLocaleDateString()}
                        </Typography>
                        {n.link && <ExternalLink size={12} color="#60A5FA" />}
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Menu>
    </>
  );
};
