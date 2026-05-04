import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, CircularProgress, Alert, Button } from '@mui/material';
import {
  selectIsAuthenticated, selectCurrentUser, selectAuthLoading,
  fetchCurrentUser,
} from '../../store/slices/authSlice';

export default function ProtectedRoute({
  children,
  allowedRoles         = [],
  adminLevels          = [],
  requiredPermissions  = [],
}) {
  const dispatch        = useDispatch();
  const location        = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user            = useSelector(selectCurrentUser);
  const isLoading       = useSelector(selectAuthLoading);
  const token           = localStorage.getItem('accessToken');

  // Track whether we've finished the initial auth check
  const [isInitializing, setIsInitializing] = useState(!!token && !user);

  useEffect(() => {
    if (token && !user && !isLoading) {
      dispatch(fetchCurrentUser()).finally(() => setIsInitializing(false));
    } else {
      setIsInitializing(false);
    }
  }, []); // run once on mount only

  // Show spinner while fetching user on refresh
  if (isInitializing || isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // No token — send to login
  if (!token) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Token exists but user failed to load (expired / invalid token)
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Role check
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const roleRedirects = {
      athlete: '/athlete/dashboard',
      coach:   '/coach/dashboard',
      admin:   '/admin/dashboard',
    };
    return <Navigate to={roleRedirects[user.role] || '/auth/login'} replace />;
  }

  // Admin level check
  if (adminLevels.length > 0 && user.role === 'admin') {
    if (!adminLevels.includes(user.adminLevel)) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2 }}>
          <Alert severity="error" sx={{ maxWidth: 400 }}>
            <strong>Access Denied</strong><br />
            This page requires {adminLevels.map(l => l.replace('_', ' ')).join(' or ')} access.
            Your current level: <strong>{user.adminLevel?.replace('_', ' ')}</strong>
          </Alert>
          <Button variant="outlined" onClick={() => window.history.back()}>Go Back</Button>
        </Box>
      );
    }
  }

  // Permission check
  if (requiredPermissions.length > 0 && user.role === 'admin') {
    const isSuperAdmin = user.adminLevel === 'super_admin';
    if (!isSuperAdmin) {
      const userPerms = user.permissions || [];
      const missing   = requiredPermissions.filter(p => !userPerms.includes(p));
      if (missing.length > 0) {
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2 }}>
            <Alert severity="warning" sx={{ maxWidth: 400 }}>
              <strong>Insufficient Permissions</strong><br />
              Missing: <code>{missing.join(', ')}</code>
            </Alert>
            <Button variant="outlined" onClick={() => window.history.back()}>Go Back</Button>
          </Box>
        );
      }
    }
  }

  return children;
}