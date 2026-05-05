import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import theme from './theme';
import store from './store';
import ProtectedRoute from './components/common/ProtectedRoute';

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
import AdminManagement     from './pages/admin/AdminManagement';
import AthleteManagement   from './pages/admin/AthleteManagement';
import CoachManagement     from './pages/admin/CoachManagement';
import AthleteDetailPage   from './pages/admin/AthleteDetailPage';
import CoachDetailPage     from './pages/admin/CoachDetailPage';
import AdminCompetitions   from './pages/admin/AdminCompetitions';
import Competitions        from './pages/shared/Competitions';

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
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            {/* Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/notices" element={<NoticeBoardPage />} />

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
            <Route path="/athlete/competitions" element={
              <ProtectedRoute allowedRoles={['athlete']}>
                <Competitions />
              </ProtectedRoute>
            } />

            {/* Coach */}
            <Route path="/coach/dashboard" element={
              <ProtectedRoute allowedRoles={['coach']}>
                <CoachDashboard />
              </ProtectedRoute>
            } />
            <Route path="/coach/profile-setup" element={
              <ProtectedRoute allowedRoles={['coach']}>
                <CoachProfileSetup />
              </ProtectedRoute>
            } />
            <Route path="/coach/competitions" element={
              <ProtectedRoute allowedRoles={['coach']}>
                <Competitions />
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
              <ProtectedRoute allowedRoles={['admin']} requiredPermissions={['manage_settings']}>
                <AdminCompetitions />
              </ProtectedRoute>
            } />

            <Route path="/admin"   element={<Navigate to="/admin/dashboard"   replace />} />
            <Route path="/athlete" element={<Navigate to="/athlete/dashboard"  replace />} />
            <Route path="/coach"   element={<Navigate to="/coach/dashboard"    replace />} />
            <Route path="*"        element={<Navigate to="/auth/login"         replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}