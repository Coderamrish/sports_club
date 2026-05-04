import React, { useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Avatar,
  Chip, Grid, LinearProgress, Alert, List, ListItem,
  ListItemIcon, ListItemText, CircularProgress,
} from '@mui/material';
import {
  DirectionsRun, EmojiEvents, Assignment, Payments,
  CheckCircle, RadioButtonUnchecked, Logout, Edit,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser, selectCurrentUser } from '../../store/slices/authSlice';
import {
  fetchAthleteProfile,
  selectAthleteProfile,
  selectProfileLoading,
  selectProfileCompletion,
} from '../../store/slices/profileSlice';

const PROFILE_STEPS = [
  { label: 'Personal Details',      field: (p) => p?.gender && p?.dateOfBirth },
  { label: 'Parent / Guardian',     field: (p) => p?.fatherName && p?.parentMobile },
  { label: 'Address Details',       field: (p) => p?.address?.city && p?.address?.state },
  { label: 'Club Representation',   field: (p) => p?.clubName },
  { label: 'Competition Details',   field: (p) => p?.ageGroup && p?.skillLevel },
  { label: 'Document Upload',       field: (p) => p?.documents?.passportPhoto?.url },
  { label: 'Declaration & Consent', field: (p) => p?.formStep >= 8 },
  { label: 'Payment',               field: (p) => p?.registrationStatus === 'Approved' },
];

const STATUS_COLORS = {
  'Incomplete':     'warning',
  'Pending Review': 'info',
  'Approved':       'success',
  'Rejected':       'error',
};

export default function AthleteDashboard() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const user       = useSelector(selectCurrentUser);
  const profile    = useSelector(selectAthleteProfile);
  const isLoading  = useSelector(selectProfileLoading);
  const completion = useSelector(selectProfileCompletion);

  useEffect(() => {
    dispatch(fetchAthleteProfile());
  }, [dispatch]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/auth/login');
  };

  const stepsWithStatus = PROFILE_STEPS.map(s => ({
    ...s,
    done: s.field(profile),
  }));

  const registrationStatus = profile?.registrationStatus || 'Incomplete';

  const getStatusMessage = () => {
    switch (registrationStatus) {
      case 'Incomplete':
        return { text: '⚠️ Complete your profile to register for competitions.', severity: 'warning', action: completion < 100 };
      case 'Pending Review':
        return { text: '⏳ Your profile is under review. Admin will contact you shortly.', severity: 'info', action: false };
      case 'Approved':
        return { text: '✅ You are approved! You can now register for competitions.', severity: 'success', action: false };
      case 'Rejected':
        return { text: '❌ Your profile was rejected. Please review feedback and resubmit.', severity: 'error', action: true };
      default:
        return { text: 'Profile setup in progress.', severity: 'info', action: completion < 100 };
    }
  };

  const statusMsg = getStatusMessage();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box sx={{
        background: 'linear-gradient(135deg,#1565C0,#1E88E5)',
        color: 'white', px: 3, py: 2,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 44, height: 44 }}>
            <DirectionsRun />
          </Avatar>
          <Box>
            <Typography fontWeight={700}>{user?.fullName}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Athlete · {user?.email}
            </Typography>
          </Box>
        </Box>
        <Button variant="outlined" size="small" startIcon={<Logout />} onClick={handleLogout}
          sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}>
          Logout
        </Button>
      </Box>

      <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
        {/* Status banner */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Alert
              severity={statusMsg.severity}
              sx={{ mb: 3 }}
              action={
                statusMsg.action && (
                  <Button color="inherit" size="small" startIcon={<Edit />}
                    onClick={() => navigate('/athlete/profile-setup')}>
                    {completion === 0 ? 'Start Setup' : 'Continue'}
                  </Button>
                )
              }
            >
              {statusMsg.text}
            </Alert>

            <Grid container spacing={3}>
              {/* Profile completion card */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" fontWeight={700}>Profile Setup</Typography>
                      <Chip
                        label={registrationStatus}
                        color={STATUS_COLORS[registrationStatus] || 'default'}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">Completion</Typography>
                        <Typography variant="body2" fontWeight={700} color="primary">{completion}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate" value={completion}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    <List dense disablePadding>
                      {stepsWithStatus.map((step, i) => (
                        <ListItem key={i} disableGutters sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            {step.done
                              ? <CheckCircle fontSize="small" color="success" />
                              : <RadioButtonUnchecked fontSize="small" color="disabled" />}
                          </ListItemIcon>
                          <ListItemText primary={
                            <Typography variant="body2" color={step.done ? 'text.primary' : 'text.secondary'}>
                              {step.label}
                            </Typography>
                          } />
                        </ListItem>
                      ))}
                    </List>

                    <Button
                      fullWidth variant="contained" sx={{ mt: 2 }}
                      onClick={() => navigate('/athlete/profile-setup')}
                      startIcon={<Edit />}
                    >
                      {completion === 0 ? 'Start Profile Setup' : 'Continue Setup'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* Stats + competitions */}
              <Grid item xs={12} md={8}>
                <Grid container spacing={2} mb={2}>
                  {[
                    { icon: <EmojiEvents />, label: 'Competitions', value: '0 Registered', color: '#F57F17' },
                    { icon: <Assignment />,  label: 'Documents',    value: `${Object.values(profile?.documents || {}).filter(d => d?.url).length} Uploaded`, color: '#2E7D32' },
                    { icon: <Payments />,    label: 'Payments',     value: '₹0 Paid',      color: '#1565C0' },
                  ].map(c => (
                    <Grid item xs={12} sm={4} key={c.label}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                          <Avatar sx={{ bgcolor: c.color + '18', color: c.color, mx: 'auto', mb: 1 }}>
                            {c.icon}
                          </Avatar>
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
                    <Alert severity={completion >= 75 ? 'warning' : 'info'}>
                      {completion >= 75
                        ? 'Almost there! Complete your remaining profile steps to unlock competitions.'
                        : 'Complete your profile to view and register for competitions.'}
                    </Alert>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </Box>
  );
}