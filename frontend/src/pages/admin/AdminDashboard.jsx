import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Avatar, Chip,
  List, ListItem, ListItemAvatar, ListItemText, Divider,
  Button, IconButton, Alert, CircularProgress, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Badge,
} from '@mui/material';
import {
  People, DirectionsRun, SportsKabaddi, EmojiEvents,
  Payments, TrendingUp, Warning, CheckCircle, Schedule,
  AdminPanelSettings, Logout, Shield, ManageAccounts,
  Dashboard, NotificationsActive,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser, selectCurrentUser, selectAdminLevel, selectAdminPermissions } from '../../store/slices/authSlice';
import api from '../../services/api';

const LEVEL_COLORS = {
  super_admin: { bg: 'linear-gradient(135deg,#4A148C,#7B1FA2)', label: 'Super Admin' },
  admin:       { bg: 'linear-gradient(135deg,#1565C0,#1E88E5)', label: 'Admin' },
  moderator:   { bg: 'linear-gradient(135deg,#2E7D32,#43A047)', label: 'Moderator' },
};

function StatCard({ icon, label, value, color, sub, loading }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>{label}</Typography>
            {loading
              ? <CircularProgress size={20} sx={{ mt: 1 }} />
              : <Typography variant="h4" fontWeight={800} mt={0.5}>{value ?? '—'}</Typography>}
            {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
          </Box>
          <Avatar sx={{ bgcolor: color + '18', color, width: 48, height: 48 }}>{icon}</Avatar>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const dispatch     = useDispatch();
  const navigate     = useNavigate();
  const user         = useSelector(selectCurrentUser);
  const adminLevel   = useSelector(selectAdminLevel);
  const permissions  = useSelector(selectAdminPermissions);
  const levelCfg     = LEVEL_COLORS[adminLevel] || LEVEL_COLORS.admin;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(r => setStats(r.data.data))
      .catch(() => setStats({}))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/auth/login');
  };

  const isSuperAdmin = adminLevel === 'super_admin';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top bar */}
      <Box sx={{ background: levelCfg.bg, color: 'white', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 44, height: 44 }}>
            {user?.fullName?.[0]}
          </Avatar>
          <Box>
            <Typography fontWeight={700}>{user?.fullName}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label={levelCfg.label} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, height: 20, fontSize: '0.7rem' }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>{user?.email}</Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isSuperAdmin && (
            <Button variant="outlined" size="small" startIcon={<ManageAccounts />}
              onClick={() => navigate('/admin/admins')}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: 'white' } }}>
              Manage Admins
            </Button>
          )}
          <Button variant="outlined" size="small" onClick={() => navigate('/')}
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: 'white' } }}>
            Home
          </Button>
          <IconButton onClick={handleLogout} sx={{ color: 'white' }}><Logout /></IconButton>
        </Box>
      </Box>

      <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
        {/* Permission banner for moderators */}
        {adminLevel === 'moderator' && (
          <Alert severity="info" icon={<Shield />} sx={{ mb: 3 }}>
            You have <strong>Moderator</strong> access: view profiles and approve documents.
            Contact your Super Admin for additional permissions.
          </Alert>
        )}

        <Typography variant="h5" fontWeight={700} mb={3}>
          <Dashboard sx={{ mr: 1, verticalAlign: 'middle' }} />
          Dashboard Overview
        </Typography>

        {/* Stats grid */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<DirectionsRun />} label="Total Athletes" value={stats?.totalAthletes ?? 0}
              color="#1565C0" sub="Registered" loading={loading} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<SportsKabaddi />} label="Total Coaches" value={stats?.totalCoaches ?? 0}
              color="#2E7D32" sub="Registered" loading={loading} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<EmojiEvents />} label="Competitions" value={stats?.totalCompetitions ?? 0}
              color="#F57F17" sub="Active this season" loading={loading} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Payments />} label="Payments Due" value={stats?.pendingPayments ?? 0}
              color="#C62828" sub="Pending collection" loading={loading} />
          </Grid>
        </Grid>

        {/* Quick navigation buttons */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Button variant="contained" startIcon={<People />}
            onClick={() => navigate('/admin/athletes')}
            sx={{ bgcolor: '#1565C0', '&:hover': { bgcolor: '#0d47a1' } }}>
            Manage Athletes
          </Button>
          <Button variant="contained" startIcon={<SportsKabaddi />}
            onClick={() => navigate('/admin/coaches')}
            sx={{ bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1b5e20' } }}>
            Manage Coaches
          </Button>
          <Button variant="contained" startIcon={<EmojiEvents />}
            onClick={() => navigate('/admin/competitions')}
            sx={{ bgcolor: '#F57F17', '&:hover': { bgcolor: '#e65100' } }}>
            Manage Competitions
          </Button>
          <Button variant="contained" startIcon={<Payments />}
            onClick={() => navigate('/admin/payments')}
            sx={{ bgcolor: '#6A1B9A', '&:hover': { bgcolor: '#4a148c' } }}>
            Payment Management
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Document verification queue */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={700}>Document Queue</Typography>
                  <Chip label="Needs Review" color="warning" size="small" />
                </Box>
                {loading ? <LinearProgress /> : (
                  <Box>
                    {[
                      { label: 'Pending Approval', value: stats?.pendingDocuments ?? 0, color: 'warning', icon: <Schedule /> },
                      { label: 'Approved Today',   value: stats?.approvedToday ?? 0,   color: 'success', icon: <CheckCircle /> },
                      { label: 'Rejected',         value: stats?.rejectedDocs ?? 0,    color: 'error',   icon: <Warning /> },
                    ].map(row => (
                      <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: row.color + '.50', color: row.color + '.main' }}>
                            {React.cloneElement(row.icon, { fontSize: 'small' })}
                          </Avatar>
                          <Typography variant="body2">{row.label}</Typography>
                        </Box>
                        <Chip label={row.value} size="small" color={row.color} />
                      </Box>
                    ))}
                    {permissions.includes('approve_documents') && (
                      <Button fullWidth variant="outlined" size="small" sx={{ mt: 2 }}
                        onClick={() => navigate('/admin/documents')}>
                        Review All Documents →
                      </Button>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Permissions list */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} mb={2}>Your Permissions</Typography>
                {isSuperAdmin ? (
                  <Alert severity="success" icon={<Shield />}>
                    Super Admin — unrestricted access to all features
                  </Alert>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {permissions.map(p => (
                      <Chip key={p} label={p.replace(/_/g, ' ')} size="small"
                        color="primary" variant="outlined"
                        icon={<CheckCircle sx={{ fontSize: '14px !important' }} />}
                        sx={{ fontWeight: 500, textTransform: 'capitalize' }} />
                    ))}
                  </Box>
                )}
                {isSuperAdmin && (
                  <Box sx={{ mt: 2 }}>
                    <Button variant="contained" startIcon={<ManageAccounts />}
                      onClick={() => navigate('/admin/admins')}
                      sx={{ background: 'linear-gradient(135deg,#4A148C,#7B1FA2)' }}>
                      Manage Admin Accounts
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Coming soon notice */}
        <Alert severity="info" icon={<NotificationsActive />} sx={{ mt: 3 }}>
          <strong>Day 3+ features:</strong> Full athlete/coach management, competition registration,
          payment tracking, analytics charts, and certificate generation will be implemented next.
        </Alert>
      </Box>
    </Box>
  );
}