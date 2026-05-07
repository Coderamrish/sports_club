import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import theme from './theme';
import store from './store';
import ProtectedRoute from './components/common/ProtectedRoute';
import {
  fetchCurrentUser,
  markInitialized,
  selectAuthInitialized,
} from './store/slices/authSlice';

import HomePage from './pages/public/HomePage';
import AboutPage from './pages/public/AboutPage';
import ContactPage from './pages/public/ContactPage';
import NoticeBoardPage from './pages/public/NoticeBoardPage';

import LoginPage           from './pages/auth/LoginPage';
import RegisterPage        from './pages/auth/RegisterPage';
import ForgotPasswordPage  from './pages/auth/ForgotPasswordPage';

import AthleteDashboard    from './pages/athlete/AthleteDashboard';
import AthleteProfileSetup from './pages/athlete/AthleteProfileSetup';
import CoachDashboard      from './pages/coach/CoachDashboard';
import CoachProfileSetup   from './pages/coach/CoachProfileSetup';
import AdminDashboard      from './pages/admin/AdminDashboard';
import AdminAnalytics      from './pages/admin/AdminAnalytics';
import AdminManagement     from './pages/admin/AdminManagement';
import AthleteManagement   from './pages/admin/AthleteManagement';
import CoachManagement     from './pages/admin/CoachManagement';
import AthleteDetailPage   from './pages/admin/AthleteDetailPage';
import CoachDetailPage     from './pages/admin/CoachDetailPage';
import AdminCompetitions   from './pages/admin/AdminCompetitions';
import AdminPayments       from './pages/admin/AdminPayments';
import Competitions        from './pages/shared/Competitions';
import MyHistoryPage       from './pages/MyHistory';

/**
 * AuthInitializer — fires /auth/me exactly ONCE when the app boots.
 *
 * Why this matters:
 *  1. On page reload Redux state is empty (in-memory), but a valid token
 *     may still exist in localStorage. Without this check the ProtectedRoute
 *     would see user=null and redirect to login.
 *  2. When a different user (different role) logs in on the same browser the
 *     server always returns the correct current user, preventing stale role data.
 *  3. All ProtectedRoutes now wait for this SINGLE check instead of each
 *     triggering their own /auth/me request (which caused race conditions).
 */
function AuthInitializer({ children }) {
  const dispatch        = useDispatch();
  const authInitialized = useSelector(selectAuthInitialized);

  useEffect(() => {
    // Initial auth check (sessionStorage is per-tab, no sync needed)
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      dispatch(fetchCurrentUser());
    } else {
      dispatch(markInitialized());
    }
  }, [dispatch]);

  // While the startup /auth/me call is in-flight, show a full-page spinner
  if (!authInitialized && sessionStorage.getItem('accessToken')) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return children;
}

function AppRoutes() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthInitializer>
        <Routes>
          {/* Public */}
          <Route path="/"        element={<HomePage />} />
          <Route path="/about"   element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/notices" element={<NoticeBoardPage />} />

          {/* Auth */}
          <Route path="/auth/login"           element={<LoginPage />} />
          <Route path="/auth/register"        element={<RegisterPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />

          {/* Athlete */}
          <Route path="/athlete/dashboard" element={
            <ProtectedRoute allowedRoles={['athlete']}><AthleteDashboard /></ProtectedRoute>
          } />
          <Route path="/athlete/profile-setup" element={
            <ProtectedRoute allowedRoles={['athlete']}><AthleteProfileSetup /></ProtectedRoute>
          } />
          <Route path="/athlete/competitions" element={
            <ProtectedRoute allowedRoles={['athlete']}><Competitions /></ProtectedRoute>
          } />
          <Route path="/athlete/history" element={
            <ProtectedRoute allowedRoles={['athlete']}><MyHistoryPage /></ProtectedRoute>
          } />

          {/* Coach */}
          <Route path="/coach/dashboard" element={
            <ProtectedRoute allowedRoles={['coach']}><CoachDashboard /></ProtectedRoute>
          } />
          <Route path="/coach/profile-setup" element={
            <ProtectedRoute allowedRoles={['coach']}><CoachProfileSetup /></ProtectedRoute>
          } />
          <Route path="/coach/competitions" element={
            <ProtectedRoute allowedRoles={['coach']}><Competitions /></ProtectedRoute>
          } />
          <Route path="/coach/history" element={
            <ProtectedRoute allowedRoles={['coach']}><MyHistoryPage /></ProtectedRoute>
          } />

          {/* Admin */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']} requiredPermissions={['view_analytics']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <ProtectedRoute allowedRoles={['admin']} requiredPermissions={['view_analytics']}>
              <AdminAnalytics />
            </ProtectedRoute>
          } />
          <Route path="/admin/admins" element={
            <ProtectedRoute allowedRoles={['admin']} adminLevels={['super_admin']}>
              <AdminManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/athletes" element={
            <ProtectedRoute allowedRoles={['admin']} requiredPermissions={['view_all_profiles']}>
              <AthleteManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/athletes/:id" element={
            <ProtectedRoute allowedRoles={['admin']} requiredPermissions={['view_all_profiles']}>
              <AthleteDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/coaches" element={
            <ProtectedRoute allowedRoles={['admin']} requiredPermissions={['view_all_profiles']}>
              <CoachManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/coaches/:id" element={
            <ProtectedRoute allowedRoles={['admin']} requiredPermissions={['view_all_profiles']}>
              <CoachDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/competitions" element={
            <ProtectedRoute allowedRoles={['admin']} requiredPermissions={['manage_competitions']}>
              <AdminCompetitions />
            </ProtectedRoute>
          } />
          <Route path="/admin/payments" element={
            <ProtectedRoute allowedRoles={['admin']} requiredPermissions={['manage_payments']}>
              <AdminPayments />
            </ProtectedRoute>
          } />

          <Route path="/admin"   element={<Navigate to="/admin/dashboard"  replace />} />
          <Route path="/athlete" element={<Navigate to="/athlete/dashboard" replace />} />
          <Route path="/coach"   element={<Navigate to="/coach/dashboard"   replace />} />
          <Route path="*"        element={<Navigate to="/auth/login"        replace />} />
        </Routes>
      </AuthInitializer>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '10px', fontFamily: '"Inter", "Roboto", sans-serif' },
          }}
        />
        <AppRoutes />
      </ThemeProvider>
    </Provider>
  );
}