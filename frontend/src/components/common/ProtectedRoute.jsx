import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, Alert, Button } from '@mui/material';
import {
  selectIsAuthenticated,
  selectCurrentUser,
} from '../../store/slices/authSlice';

/**
 * ProtectedRoute
 *
 * Auth initialization is handled once at the top level by <AuthInitializer>
 * in App.jsx, so by the time this component renders:
 *   - authInitialized === true
 *   - user is either populated (valid session) or null (no/expired token)
 *
 * This component only needs to:
 *   1. Redirect unauthenticated users to /auth/login
 *   2. Redirect users to their own dashboard if they try to access the wrong role's route
 *   3. Check admin-level and permission requirements
 */
export default function ProtectedRoute({
  children,
  allowedRoles        = [],
  adminLevels         = [],
  requiredPermissions = [],
}) {
  const location        = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user            = useSelector(selectCurrentUser);
  const token           = sessionStorage.getItem('accessToken');

  // No token or not authenticated → login
  if (!token || !isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Token present but user failed to load (should not normally reach here
  // thanks to AuthInitializer, but kept as a safety net)
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Role mismatch → redirect to the user's own dashboard
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