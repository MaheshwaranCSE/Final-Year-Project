import React from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';

interface AuditLog {
  id: string;
  action: string;
  actorRole: string;
  actorId: string;
  timestamp: string;
}

interface ChainOfCustodyTimelineProps {
  logs: AuditLog[];
}

export default function ChainOfCustodyTimeline({ logs }: ChainOfCustodyTimelineProps) {
  // Sort logs by timestamp ascending
  const sortedLogs = [...logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>Chain of Custody</Typography>
      <Divider sx={{ mb: 3 }} />
      
      {sortedLogs.length === 0 ? (
        <Typography color="text.secondary">No custody records available.</Typography>
      ) : (
        <Box sx={{ position: 'relative', ml: 2 }}>
          {/* Vertical line connecting events */}
          <Box sx={{ position: 'absolute', top: 10, bottom: 20, left: -1, width: 2, bgcolor: 'divider' }} />
          
          {sortedLogs.map((log, index) => {
            const isLast = index === sortedLogs.length - 1;
            
            // Determine colors based on role
            let dotColor = 'primary.main';
            if (log.actorRole === 'Doctor') dotColor = 'error.main';
            if (log.actorRole === 'Court') dotColor = 'warning.main';
            if (log.actorRole === 'System') dotColor = 'success.main';
            
            return (
              <Box key={log.id} sx={{ position: 'relative', mb: isLast ? 0 : 4, pl: 3 }}>
                {/* Timeline Dot */}
                <Box 
                  sx={{ 
                    position: 'absolute', 
                    left: -6, 
                    top: 6, 
                    width: 12, 
                    height: 12, 
                    borderRadius: '50%', 
                    bgcolor: dotColor,
                    border: '2px solid white',
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
                  }} 
                />
                
                <Typography variant="subtitle1" fontWeight="bold">
                  {log.action}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Role:</strong> {log.actorRole} ({log.actorId})
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  <strong>Time:</strong> {new Date(log.timestamp).toLocaleString()}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}
