import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Avatar, Button, Grid,
  Alert, LinearProgress, CircularProgress, TextField, MenuItem,
  Select, FormControl, InputLabel, Chip, Divider, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip,
} from '@mui/material';
import {
  SportsKabaddi, People, EmojiEvents, Logout,
  Edit, Save, Cancel, Payments, CheckCircle, Lock,
  Receipt, HourglassEmpty, ErrorOutline,
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
import { initiatePayment, getMyPayments } from '../../services/payment.service';

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
  'Incomplete': 'warning', 'Pending Review': 'info',
  'Approved': 'success', 'Rejected': 'error',
};

const TXN_STATUS_COLOR = { paid: 'success', created: 'warning', failed: 'error', refunded: 'default' };
const TXN_STATUS_LABEL = { paid: 'Paid', created: 'Pending', failed: 'Failed', refunded: 'Refunded' };

export default function CoachDashboard() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const user       = useSelector(selectCurrentUser);
  const profile    = useSelector(selectCoachProfile);
  const isLoading  = useSelector(selectCoachLoading);
  const isSaving   = useSelector(selectCoachSaving);
  const completion = useSelector(selectCoachCompletion);
  const error      = useSelector(selectCoachError);

  const [editing, setEditing]     = useState(false);
  const [tab, setTab]             = useState('overview');
  const [payments, setPayments]   = useState([]);
  const [loadingPay, setLoadingPay] = useState(false);
  const [payingFee, setPayingFee] = useState(false);

  const profileFeePaid = profile?.profileFeeStatus === 'Paid';
  const PROFILE_FEE    = 500;

  const { register, handleSubmit, control, reset } = useForm({
    defaultValues: { gender: '', specialization: '', experienceYears: '', bio: '', clubName: '', stateAssociation: '' },
  });

  useEffect(() => { dispatch(fetchCoachProfile()); }, [dispatch]);
  useEffect(() => {
    if (profile) {
      reset({
        gender: profile.gender || '', specialization: profile.specialization?.[0] || '',
        experienceYears: profile.experienceYears || '', bio: profile.bio || '',
        clubName: profile.clubName || '', stateAssociation: profile.stateAssociation || '',
      });
    }
  }, [profile, reset]);

  const loadPayments = useCallback(async () => {
    setLoadingPay(true);
    try {
      const data = await getMyPayments();
      setPayments(data || []);
    } catch { toast.error('Could not load payment history'); }
    finally { setLoadingPay(false); }
  }, []);

  useEffect(() => { if (tab === 'payments') loadPayments(); }, [tab, loadPayments]);

  const handleLogout = async () => { await dispatch(logoutUser()); navigate('/auth/login'); };

  const onSubmit = async (data) => {
    try {
      await dispatch(saveCoachProfile(data)).unwrap();
      toast.success('Profile updated!');
      setEditing(false);
    } catch { toast.error(error || 'Save failed'); }
  };

  const handlePayProfileFee = () => {
    if (!profile?._id) { toast.error('Profile not loaded. Please refresh.'); return; }
    setPayingFee(true);
    initiatePayment({
      entityType:  'profile_registration',
      entityId:    profile._id,
      description: `Profile Registration Fee – ${user?.fullName} (Coach)`,
      onSuccess: () => {
        toast.success('🎉 Profile fee paid! Confirmation email sent.');
        setPayingFee(false);
        dispatch(fetchCoachProfile());
        if (tab === 'payments') loadPayments();
      },
      onFailure: (err) => {
        const msg = err?.message || '';
        if (!msg.includes('cancelled')) toast.error(msg || 'Payment failed');
        setPayingFee(false);
      },
    });
  };

  const profileStatus = profile?.profileStatus || 'Incomplete';
  const totalPaid     = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);

  const getStatusMessage = () => {
    switch (profileStatus) {
      case 'Incomplete':    return { text: '⚠️ Profile incomplete. Fill in your details to submit for review.', severity: 'warning' };
      case 'Pending Review':return { text: '⏳ Profile is under review. Admin will contact you shortly.', severity: 'info' };
      case 'Approved':      return { text: '✅ Profile approved! You can now coach athletes.', severity: 'success' };
      case 'Rejected':      return { text: '❌ Profile rejected. Review feedback and resubmit.', severity: 'error' };
      default:              return { text: 'Profile status unknown', severity: 'warning' };
    }
  };
  const statusMsg = getStatusMessage();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box sx={{ background: 'linear-gradient(135deg,#2E7D32,#43A047)', color: 'white', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 44, height: 44 }}><SportsKabaddi /></Avatar>
          <Box>
            <Typography fontWeight={700}>{user?.fullName}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Coach / Trainer · {user?.email}</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 130, textAlign: 'right' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>{completion}% complete</Typography>
            <LinearProgress variant="determinate" value={completion} sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.3)', '& .MuiLinearProgress-bar': { bgcolor: 'white' } }} />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" size="small" onClick={() => navigate('/')} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}>Home</Button>
            <Button variant="outlined" size="small" startIcon={<EmojiEvents />} onClick={() => navigate('/coach/competitions')} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}>Competitions</Button>
            <Button variant="outlined" size="small" startIcon={<Logout />} onClick={handleLogout} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}>Logout</Button>
          </Box>
        </Box>
      </Box>

      {/* Tab bar */}
      <Box sx={{ px: 3, pt: 1.5, display: 'flex', gap: 1, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'white' }}>
        {[{ key: 'overview', label: '📋 Overview' }, { key: 'payments', label: '💳 My Payments' }].map(t => (
          <Button key={t.key} variant={tab === t.key ? 'contained' : 'text'} size="small" onClick={() => setTab(t.key)}
            sx={{ borderRadius: '8px 8px 0 0', mb: '-1px', pb: 1.5, bgcolor: tab===t.key ? '#2E7D32' : undefined }}>{t.label}</Button>
        ))}
      </Box>

      <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : tab === 'overview' ? (
          <>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearCoachError())}>{error}</Alert>}

            <Alert severity={statusMsg.severity} sx={{ mb: 3 }}
              action={!editing && profileStatus === 'Incomplete' && (
                <Button color="inherit" size="small" startIcon={<Edit />} onClick={() => setEditing(true)}>Edit Profile</Button>
              )}>
              {statusMsg.text}
            </Alert>

            {/* Stat cards */}
            <Grid container spacing={2} mb={3}>
              {[
                { icon: <People />, label: 'Assigned Athletes', value: '0', color: '#1565C0', onClick: () => toast.success('Coming soon') },
                { icon: <EmojiEvents />, label: 'Competitions', value: '0', color: '#F57F17', onClick: () => navigate('/coach/competitions') },
                { icon: <Payments />, label: 'Total Paid', value: `₹${totalPaid.toLocaleString('en-IN')}`, color: '#6A1B9A', onClick: () => setTab('payments') },
              ].map(c => (
                <Grid item xs={12} sm={4} key={c.label}>
                  <Card sx={{ cursor: c.onClick ? 'pointer' : 'default', transition: 'transform .15s', '&:hover': c.onClick ? { transform: 'scale(1.02)' } : {} }} onClick={c.onClick}>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Avatar sx={{ bgcolor: c.color + '18', color: c.color, mx: 'auto', mb: 1 }}>{c.icon}</Avatar>
                      <Typography variant="body2" color="text.secondary">{c.label}</Typography>
                      <Typography variant="h6" fontWeight={700}>{c.value}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Profile Fee Card */}
            <Card sx={{ mb: 3, border: '1.5px solid', borderColor: profileFeePaid ? 'success.main' : 'warning.main', borderStyle: profileFeePaid ? 'solid' : 'dashed' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: profileFeePaid ? '#E8F5E9' : '#FFF3E0', color: profileFeePaid ? 'success.main' : 'warning.main' }}>
                      {profileFeePaid ? <CheckCircle /> : <Lock />}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={700}>Coach Profile Registration Fee</Typography>
                      <Typography variant="body2" color="text.secondary">One-time fee to activate your coach profile</Typography>
                      {profileFeePaid && (
                        <Typography variant="caption" color="success.main">
                          Paid {profile?.profileFeePaidAt ? `on ${new Date(profile.profileFeePaidAt).toLocaleDateString('en-IN')}` : ''}
                          {profile?.profileFeeTxnId ? ` · TXN: ...${profile.profileFeeTxnId.slice(-8)}` : ''}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography variant="h5" fontWeight={800} color={profileFeePaid ? 'success.main' : 'warning.main'}>₹{PROFILE_FEE}</Typography>
                    {profileFeePaid ? (
                      <Chip label="✓ Paid" color="success" size="small" sx={{ mt: 0.5 }} />
                    ) : (
                      <Button variant="contained" color="warning" size="small"
                        startIcon={payingFee ? <CircularProgress size={14} color="inherit" /> : <Payments />}
                        disabled={payingFee || !profile?._id} onClick={handlePayProfileFee}
                        sx={{ mt: 0.5, fontWeight: 700 }}>
                        {payingFee ? 'Processing…' : 'Pay via Razorpay'}
                      </Button>
                    )}
                  </Box>
                </Box>
                {!profileFeePaid && (
                  <Alert severity="info" sx={{ mt: 2 }} icon={<Receipt />}>
                    Paying the registration fee submits your profile for admin approval. A confirmation email will be sent to {user?.email}.
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Profile form */}
            <Card>
              <CardContent sx={{ p: { xs: 2, md: 4 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" fontWeight={700}>Coach Profile</Typography>
                  {!editing && <Button startIcon={<Edit />} size="small" onClick={() => setEditing(true)}>Edit</Button>}
                </Box>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={!editing}>
                      <InputLabel>Gender</InputLabel>
                      <Controller name="gender" control={control} render={({ field }) => (
                        <Select {...field} label="Gender">
                          {['Male','Female','Other'].map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                        </Select>
                      )} />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={!editing}>
                      <InputLabel>Specialization</InputLabel>
                      <Controller name="specialization" control={control} render={({ field }) => (
                        <Select {...field} label="Specialization">
                          {SPECIALIZATIONS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </Select>
                      )} />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField {...register('experienceYears')} label="Years of Experience" type="number" fullWidth disabled={!editing} inputProps={{ min: 0, max: 60 }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField {...register('clubName')} label="Club / Academy Name" fullWidth disabled={!editing} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={!editing}>
                      <InputLabel>State Association</InputLabel>
                      <Controller name="stateAssociation" control={control} render={({ field }) => (
                        <Select {...field} label="State Association">
                          {INDIAN_STATES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </Select>
                      )} />
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField {...register('bio')} label="Bio / About" fullWidth multiline rows={3} disabled={!editing} placeholder="Brief coaching background..." />
                  </Grid>
                </Grid>
                {!editing && !profile?.gender && (
                  <Paper variant="outlined" sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: 'grey.50', textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">No profile details yet. Click <strong>Edit</strong> to fill in your information.</Typography>
                  </Paper>
                )}
              </CardContent>
              {editing && (
                <>
                  <Divider />
                  <Box sx={{ px: 4, py: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button variant="outlined" startIcon={<Cancel />} onClick={() => { setEditing(false); reset(); }}>Cancel</Button>
                    <Button variant="contained" startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : <Save />}
                      onClick={handleSubmit(onSubmit)} disabled={isSaving} sx={{ minWidth: 130, bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1b5e20' } }}>
                      {isSaving ? 'Saving…' : 'Save Profile'}
                    </Button>
                  </Box>
                </>
              )}
            </Card>
          </>
        ) : (
          /* Payments Tab */
          <>
            <Typography variant="h6" fontWeight={700} mb={2}>My Payment History</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
              <Chip icon={<Payments />} label={`Total Paid: ₹${payments.filter(p=>p.status==='paid').reduce((s,p)=>s+p.amount,0).toLocaleString('en-IN')}`} color="success" variant="outlined" />
              <Chip icon={<HourglassEmpty />} label={`Pending: ${payments.filter(p=>p.status==='created').length}`} color="warning" variant="outlined" />
              <Chip icon={<ErrorOutline />} label={`Failed: ${payments.filter(p=>p.status==='failed').length}`} color="error" variant="outlined" />
            </Box>

            {loadingPay ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
            ) : payments.length === 0 ? (
              <Card><CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h4" mb={1}>💳</Typography>
                <Typography color="text.secondary" mb={2}>No payments yet.</Typography>
                {!profileFeePaid && (
                  <Button variant="contained" color="warning" onClick={handlePayProfileFee} disabled={payingFee}>
                    {payingFee ? 'Processing…' : 'Pay Profile Registration Fee'}
                  </Button>
                )}
              </CardContent></Card>
            ) : (
              <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      {['Description', 'Type', 'Amount', 'Status', 'Transaction ID', 'Date'].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'text.secondary' }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map(p => (
                      <TableRow key={p._id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{p.description || p.entityName || '—'}</Typography>
                          {p.entityDate && <Typography variant="caption" color="text.secondary">{new Date(p.entityDate).toLocaleDateString('en-IN')}</Typography>}
                        </TableCell>
                        <TableCell>
                          <Chip size="small"
                            label={p.entityType === 'competition_registration' ? 'Competition' : 'Profile Fee'}
                            color={p.entityType === 'competition_registration' ? 'primary' : 'secondary'}
                            variant="outlined" sx={{ fontSize: '0.65rem' }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700} color={p.status === 'paid' ? 'success.main' : 'text.primary'}>
                            ₹{(p.amount || 0).toLocaleString('en-IN')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={TXN_STATUS_LABEL[p.status] || p.status} color={TXN_STATUS_COLOR[p.status] || 'default'} size="small" sx={{ fontWeight: 600 }} />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={p.razorpayPaymentId || p.razorpayOrderId || '—'}>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', cursor: 'help' }}>
                              {(p.razorpayPaymentId || p.razorpayOrderId || '—').slice(-12)}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(p.paidAt || p.createdAt).toLocaleDateString('en-IN')}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}