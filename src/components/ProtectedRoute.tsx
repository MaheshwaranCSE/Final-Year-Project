import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

import { Role } from '../lib/supabase';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect to default dashboard if role doesn't match
    const paths: Record<Role, string> = {
      user: '/user/dashboard',
      police: '/police/dashboard',
      doctor: '/doctor/dashboard',
      court: '/court/dashboard',
      admin: '/admin/dashboard',
      investigator: '/investigator-dashboard'
    };
    return <Navigate to={role ? paths[role] : '/'} replace />;
  }

  return <Outlet />;
}
