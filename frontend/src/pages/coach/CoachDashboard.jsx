import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Avatar, Button, Grid,
  Alert, LinearProgress, CircularProgress, TextField, MenuItem,
  Select, FormControl, InputLabel, Chip, Divider, Paper,
} from '@mui/material';
import {
  SportsKabaddi, People, EmojiEvents, Logout,
  Edit, Save, Cancel,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { logoutUser, selectCurrentUser } from '../../store/slices/authSlice';
import {
  fetchCoachProfile, saveCoachProfile,
  selectCoachProfile, selectCoachLoading,
  selectCoachSaving, selectCoachCompletion,
  selectCoachError, clearCoachError,
} from '../../store/slices/coachProfileSlice';

const SPECIALIZATIONS = [
  'Athletics','Swimming','Football','Basketball','Cricket',
  'Kabaddi','Wrestling','Boxing','Badminton','Tennis',
  'Gymnastics','Weightlifting','Archery','Other',
];

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi',
];

const STATUS_COLORS = {
  'Incomplete':     'warning',
  'Pending Review': 'info',
  'Approved':       'success',
  'Rejected':       'error',
};

export default function CoachDashboard() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const user       = useSelector(selectCurrentUser);
  const profile    = useSelector(selectCoachProfile);
  const isLoading  = useSelector(selectCoachLoading);
  const isSaving   = useSelector(selectCoachSaving);
  const completion = useSelector(selectCoachCompletion);
  const error      = useSelector(selectCoachError);
  const [editing, setEditing] = useState(false);

  const { register, handleSubmit, control, reset } = useForm({
    defaultValues: {
      gender: '', specialization: '', experienceYears: '',
      bio: '', clubName: '', stateAssociation: '',
    },
  });

  useEffect(() => { dispatch(fetchCoachProfile()); }, [dispatch]);

  useEffect(() => {
    if (profile) {
      reset({
        gender:           profile.gender || '',
        specialization:   profile.specialization?.[0] || '',
        experienceYears:  profile.experienceYears || '',
        bio:              profile.bio || '',
        clubName:         profile.clubName || '',
        stateAssociation: profile.stateAssociation || '',
      });
    }
  }, [profile, reset]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/auth/login');
  };

  const onSubmit = async (data) => {
    try {
      await dispatch(saveCoachProfile(data)).unwrap();
      toast.success('Profile updated!');
      setEditing(false);
    } catch {
      toast.error(error || 'Save failed');
    }
  };

  const profileStatus = profile?.profileStatus || 'Incomplete';

  const getStatusMessage = () => {
    switch (profileStatus) {
      case 'Incomplete':
        return { text: '⚠️ Profile incomplete. Fill in your details to submit for review.', severity: 'warning' };
      case 'Pending Review':
        return { text: '⏳ Your profile is under review. Admin will contact you shortly.', severity: 'info' };
      case 'Approved':
        return { text: '✅ Your profile has been approved! You can now coach athletes.', severity: 'success' };
      case 'Rejected':
        return { text: '❌ Your profile was rejected. Please review feedback and resubmit.', severity: 'error' };
      default:
        return { text: 'Profile status unknown', severity: 'warning' };
    }
  };

  const statusMsg = getStatusMessage();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>

      {/* ── Header ── */}
      <Box sx={{
        background: 'linear-gradient(135deg,#2E7D32,#43A047)',
        color: 'white', px: 3, py: 2,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 44, height: 44 }}>
            <SportsKabaddi />
          </Avatar>
          <Box>
            <Typography fontWeight={700}>{user?.fullName}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Coach / Trainer · {user?.email}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 130, textAlign: 'right' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              {completion}% complete
            </Typography>
            <LinearProgress
              variant="determinate" value={completion}
              sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.3)',
                '& .MuiLinearProgress-bar': { bgcolor: 'white' } }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" onClick={() => navigate('/')}
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}>
            Home
          </Button>
          <Button variant="outlined" size="small" startIcon={<Logout />} onClick={handleLogout}
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}>
            Logout
          </Button>
        </Box>
        </Box>
      </Box>

      <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}
                onClose={() => dispatch(clearCoachError())}>{error}</Alert>
            )}

            {/* ── Status banner ── */}
            <Alert
              severity={statusMsg.severity}
              sx={{ mb: 3 }}
              action={!editing && profileStatus === 'Incomplete' && (
                <Button color="inherit" size="small" startIcon={<Edit />}
                  onClick={() => setEditing(true)}>
                  Edit Profile
                </Button>
              )}
            >
              {statusMsg.text}
            </Alert>

            {/* ── Stat cards ── */}
            <Grid container spacing={2} mb={3}>
              {[
                { icon: <People />,       label: 'Assigned Athletes', value: '0',         color: '#1565C0' },
                { icon: <EmojiEvents />,  label: 'Competitions',      value: '0',         color: '#F57F17' },
                { icon: <SportsKabaddi />,label: 'Profile Status',    value: profileStatus, color: '#2E7D32', isChip: true },
              ].map(c => (
                <Grid item xs={12} sm={4} key={c.label}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Avatar sx={{ bgcolor: c.color + '18', color: c.color, mx: 'auto', mb: 1 }}>
                        {c.icon}
                      </Avatar>
                      <Typography variant="body2" color="text.secondary">{c.label}</Typography>
                      {c.isChip
                        ? <Chip label={c.value} color={STATUS_COLORS[c.value] || 'default'}
                            size="small" sx={{ mt: 0.5, fontWeight: 600 }} />
                        : <Typography variant="h6" fontWeight={700}>{c.value}</Typography>}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* ── Profile form ── */}
            <Card>
              <CardContent sx={{ p: { xs: 2, md: 4 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" fontWeight={700}>Coach Profile</Typography>
                  {!editing && (
                    <Button startIcon={<Edit />} size="small" onClick={() => setEditing(true)}>
                      Edit
                    </Button>
                  )}
                </Box>

                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={!editing}>
                      <InputLabel>Gender</InputLabel>
                      <Controller name="gender" control={control} render={({ field }) => (
                        <Select {...field} label="Gender">
                          {['Male','Female','Other'].map(g =>
                            <MenuItem key={g} value={g}>{g}</MenuItem>)}
                        </Select>
                      )} />
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={!editing}>
                      <InputLabel>Specialization</InputLabel>
                      <Controller name="specialization" control={control} render={({ field }) => (
                        <Select {...field} label="Specialization">
                          {SPECIALIZATIONS.map(s =>
                            <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </Select>
                      )} />
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField {...register('experienceYears')}
                      label="Years of Experience" type="number"
                      fullWidth disabled={!editing}
                      inputProps={{ min: 0, max: 60 }} />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField {...register('clubName')}
                      label="Club / Academy Name"
                      fullWidth disabled={!editing} />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={!editing}>
                      <InputLabel>State Association</InputLabel>
                      <Controller name="stateAssociation" control={control} render={({ field }) => (
                        <Select {...field} label="State Association">
                          {INDIAN_STATES.map(s =>
                            <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </Select>
                      )} />
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField {...register('bio')}
                      label="Bio / About" fullWidth multiline rows={3}
                      disabled={!editing}
                      placeholder="Brief description of your coaching background..." />
                  </Grid>
                </Grid>

                {/* Show current values when not editing */}
                {!editing && !profile?.gender && (
                  <Paper variant="outlined" sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: 'grey.50', textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No profile details yet. Click <strong>Edit</strong> to fill in your information.
                    </Typography>
                  </Paper>
                )}
              </CardContent>

              {editing && (
                <>
                  <Divider />
                  <Box sx={{ px: 4, py: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button variant="outlined" startIcon={<Cancel />}
                      onClick={() => { setEditing(false); reset(); }}>
                      Cancel
                    </Button>
                    <Button
                      variant="contained" startIcon={isSaving
                        ? <CircularProgress size={18} color="inherit" />
                        : <Save />}
                      onClick={handleSubmit(onSubmit)}
                      disabled={isSaving}
                      sx={{ minWidth: 130 }}
                    >
                      {isSaving ? 'Saving…' : 'Save Profile'}
                    </Button>
                  </Box>
                </>
              )}
            </Card>
          </>
        )}
      </Box>
    </Box>
  );
}