import React from 'react';
import {
  Box, Typography, Card, CardContent, Button, Avatar,
  Chip, Grid, LinearProgress, Alert, List, ListItem,
  ListItemIcon, ListItemText,
} from '@mui/material';
import {
  DirectionsRun, EmojiEvents, Assignment, Payments,
  CheckCircle, RadioButtonUnchecked, Logout,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser, selectCurrentUser } from '../../store/slices/authSlice';

const PROFILE_STEPS = [
  { label: 'Personal Details',      done: false },
  { label: 'Parent / Guardian',     done: false },
  { label: 'Address Details',       done: false },
  { label: 'Club Representation',   done: false },
  { label: 'Competition Details',   done: false },
  { label: 'Document Upload',       done: false },
  { label: 'Declaration & Consent', done: false },
  { label: 'Payment',               done: false },
];

export default function AthleteDashboard() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const user      = useSelector(selectCurrentUser);
  const completed = PROFILE_STEPS.filter(s => s.done).length;
  const progress  = Math.round((completed / PROFILE_STEPS.length) * 100);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/auth/login');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box sx={{ background: 'linear-gradient(135deg,#1565C0,#1E88E5)', color: 'white', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 44, height: 44 }}><DirectionsRun /></Avatar>
          <Box>
            <Typography fontWeight={700}>{user?.fullName}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Athlete · {user?.email}</Typography>
          </Box>
        </Box>
        <Button variant="outlined" size="small" startIcon={<Logout />} onClick={handleLogout}
          sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}>Logout</Button>
      </Box>

      <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
        {/* Profile completion */}
        <Alert severity={progress === 100 ? 'success' : 'warning'} sx={{ mb: 3 }}>
          {progress === 100
            ? '✅ Your profile is complete! You can now register for competitions.'
            : `⚠️ Your profile is ${progress}% complete. Complete all steps to register for competitions.`}
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} mb={2}>Profile Setup</Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">Completion</Typography>
                    <Typography variant="body2" fontWeight={700} color="primary">{progress}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
                </Box>
                <List dense disablePadding>
                  {PROFILE_STEPS.map((step, i) => (
                    <ListItem key={i} disableGutters sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        {step.done
                          ? <CheckCircle fontSize="small" color="success" />
                          : <RadioButtonUnchecked fontSize="small" color="disabled" />}
                      </ListItemIcon>
                      <ListItemText primary={<Typography variant="body2" color={step.done ? 'text.primary' : 'text.secondary'}>{step.label}</Typography>} />
                    </ListItem>
                  ))}
                </List>
                <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/athlete/profile-setup')}>
                  {progress === 0 ? 'Start Profile Setup →' : 'Continue Setup →'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Grid container spacing={2} mb={2}>
              {[
                { icon: <EmojiEvents />, label: 'Competitions', value: '0 Registered', color: '#F57F17' },
                { icon: <Assignment />,  label: 'Documents',    value: '0 Approved',   color: '#2E7D32' },
                { icon: <Payments />,    label: 'Payments',     value: '₹0 Paid',      color: '#1565C0' },
              ].map(c => (
                <Grid item xs={12} sm={4} key={c.label}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Avatar sx={{ bgcolor: c.color + '18', color: c.color, mx: 'auto', mb: 1 }}>{c.icon}</Avatar>
                      <Typography variant="body2" color="text.secondary">{c.label}</Typography>
                      <Typography variant="h6" fontWeight={700}>{c.value}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={700} mb={2}>Available Competitions</Typography>
                <Alert severity="info">Complete your profile to view and register for competitions.</Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
