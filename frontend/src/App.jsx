import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import theme from './theme';
import store from './store';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth pages
import LoginPage          from './pages/auth/LoginPage';
import RegisterPage       from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Dashboards
import AthleteDashboard   from './pages/athlete/AthleteDashboard';
import AthleteProfileSetup from './pages/athlete/AthleteProfileSetup';
import CoachDashboard     from './pages/coach/CoachDashboard';
import AdminDashboard     from './pages/admin/AdminDashboard';
import AdminManagement    from './pages/admin/AdminManagement';

const Spinner = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
    <CircularProgress />
  </Box>
);

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
        <BrowserRouter>
          <Routes>
            {/* Root */}
            <Route path="/" element={<Navigate to="/auth/login" replace />} />

            {/* Public */}
            <Route path="/auth/login"           element={<LoginPage />} />
            <Route path="/auth/register"        element={<RegisterPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />

            {/* Athlete */}
            <Route path="/athlete/dashboard" element={
              <ProtectedRoute allowedRoles={['athlete']}>
                <AthleteDashboard />
              </ProtectedRoute>
            } />
            <Route path="/athlete/profile-setup" element={
              <ProtectedRoute allowedRoles={['athlete']}>
                <AthleteProfileSetup />
              </ProtectedRoute>
            } />

            {/* Coach */}
            <Route path="/coach/*" element={
              <ProtectedRoute allowedRoles={['coach']}>
                <CoachDashboard />
              </ProtectedRoute>
            } />

            {/* Admin */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['admin']} requiredPermissions={['view_analytics']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/admins" element={
              <ProtectedRoute allowedRoles={['admin']} adminLevels={['super_admin']}>
                <AdminManagement />
              </ProtectedRoute>
            } />

            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/athlete" element={<Navigate to="/athlete/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/auth/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}