import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Avatar,
  Chip, Grid, LinearProgress, Alert, List, ListItem,
  ListItemIcon, ListItemText, CircularProgress, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Tooltip,
} from '@mui/material';
import {
  DirectionsRun, EmojiEvents, Assignment, Payments,
  CheckCircle, RadioButtonUnchecked, Logout, Edit,
  Receipt, HourglassEmpty, ErrorOutline, Lock,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { logoutUser, selectCurrentUser } from '../../store/slices/authSlice';
import {
  fetchAthleteProfile,
  selectAthleteProfile,
  selectProfileLoading,
  selectProfileCompletion,
} from '../../store/slices/profileSlice';
import api from '../../services/api';
import { initiatePayment, getMyPayments } from '../../services/payment.service';

const PROFILE_STEPS = [
  { label: 'Personal Details',      field: (p) => p?.gender && p?.dateOfBirth },
  { label: 'Parent / Guardian',     field: (p) => p?.fatherName && p?.parentMobile },
  { label: 'Address Details',       field: (p) => p?.address?.city && p?.address?.state },
  { label: 'Club Representation',   field: (p) => p?.clubName },
  { label: 'Competition Details',   field: (p) => p?.ageGroup && p?.skillLevel },
  { label: 'Document Upload',       field: (p) => p?.documents?.passportPhoto?.url },
  { label: 'Declaration & Consent', field: (p) => p?.formStep >= 8 },
  { label: 'Profile Fee',           field: (p) => p?.profileFeeStatus === 'Paid' },
];

const STATUS_COLORS = {
  'Incomplete': 'warning', 'Pending Review': 'info',
  'Approved': 'success', 'Rejected': 'error',
};

const TXN_STATUS_COLOR = { paid: 'success', created: 'warning', failed: 'error', refunded: 'default' };
const TXN_STATUS_LABEL = { paid: 'Paid', created: 'Pending', failed: 'Failed', refunded: 'Refunded' };

export default function AthleteDashboard() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const user       = useSelector(selectCurrentUser);
  const profile    = useSelector(selectAthleteProfile);
  const isLoading  = useSelector(selectProfileLoading);
  const completion = useSelector(selectProfileCompletion);

  const [competitions, setCompetitions] = useState([]);
  const [loadingComps, setLoadingComps] = useState(true);
  const [tab, setTab]         = useState('overview');
  const [payments, setPayments]     = useState([]);
  const [loadingPay, setLoadingPay] = useState(false);
  const [payingFee, setPayingFee]   = useState(false);

  const profileFeePaid = profile?.profileFeeStatus === 'Paid';
  const PROFILE_FEE    = 500; // matches backend PROFILE_REGISTRATION_FEE env var

  const loadPayments = useCallback(async () => {
    setLoadingPay(true);
    try {
      const data = await getMyPayments();
      setPayments(data || []);
    } catch { toast.error('Could not load payment history'); }
    finally { setLoadingPay(false); }
  }, []);

  useEffect(() => {
    dispatch(fetchAthleteProfile());
    api.get('/public/competitions')
      .then(res => setCompetitions(res.data.data))
      .catch(() => {})
      .finally(() => setLoadingComps(false));
  }, [dispatch]);

  useEffect(() => { if (tab === 'payments') loadPayments(); }, [tab, loadPayments]);

  const handleLogout = async () => { await dispatch(logoutUser()); navigate('/auth/login'); };

  const handlePayProfileFee = () => {
    if (!profile?._id) { toast.error('Complete profile setup first.'); return; }
    setPayingFee(true);
    initiatePayment({
      entityType:  'profile_registration',
      entityId:    profile._id,
      description: `Profile Registration Fee – ${user?.fullName}`,
      onSuccess: () => {
        toast.success('🎉 Profile fee paid! Confirmation email sent.');
        setPayingFee(false);
        dispatch(fetchAthleteProfile());
        if (tab === 'payments') loadPayments();
      },
      onFailure: (err) => {
        const msg = err?.message || '';
        if (!msg.includes('cancelled')) toast.error(msg || 'Payment failed');
        setPayingFee(false);
      },
    });
  };

  const stepsWithStatus    = PROFILE_STEPS.map(s => ({ ...s, done: s.field(profile) }));
  const registrationStatus = profile?.registrationStatus || 'Incomplete';
  const totalPaid          = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);

  const getStatusMessage = () => {
    switch (registrationStatus) {
      case 'Incomplete':    return { text: '⚠️ Complete your profile to register for competitions.', severity: 'warning', action: true };
      case 'Pending Review':return { text: '⏳ Profile under review. Admin will contact you shortly.', severity: 'info', action: false };
      case 'Approved':      return { text: '✅ Approved! You can now register for competitions.', severity: 'success', action: false };
      case 'Rejected':      return { text: '❌ Profile rejected. Review feedback and resubmit.', severity: 'error', action: true };
      default:              return { text: 'Profile setup in progress.', severity: 'info', action: true };
    }
  };
  const statusMsg = getStatusMessage();

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
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" size="small" onClick={() => navigate('/')} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}>Home</Button>
          <Button variant="outlined" size="small" startIcon={<EmojiEvents />} onClick={() => navigate('/athlete/competitions')} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}>Competitions</Button>
          <Button variant="outlined" size="small" startIcon={<Logout />} onClick={handleLogout} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}>Logout</Button>
        </Box>
      </Box>

      {/* Tab bar */}
      <Box sx={{ px: 3, pt: 1.5, display: 'flex', gap: 1, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'white' }}>
        {[{ key: 'overview', label: '📋 Overview' }, { key: 'payments', label: '💳 My Payments' }].map(t => (
          <Button key={t.key} variant={tab === t.key ? 'contained' : 'text'} size="small" onClick={() => setTab(t.key)}
            sx={{ borderRadius: '8px 8px 0 0', mb: '-1px', pb: 1.5 }}>{t.label}</Button>
        ))}
      </Box>

      <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : tab === 'overview' ? (
          <>
            <Alert severity={statusMsg.severity} sx={{ mb: 3 }}
              action={statusMsg.action && (
                <Button color="inherit" size="small" startIcon={<Edit />} onClick={() => navigate('/athlete/profile-setup')}>
                  {completion === 0 ? 'Start Setup' : 'Continue'}
                </Button>
              )}>
              {statusMsg.text}
            </Alert>

            <Grid container spacing={3}>
              {/* Profile card */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" fontWeight={700}>Profile Setup</Typography>
                      <Chip label={registrationStatus} color={STATUS_COLORS[registrationStatus] || 'default'} size="small" sx={{ fontWeight: 600 }} />
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">Completion</Typography>
                        <Typography variant="body2" fontWeight={700} color="primary">{completion}%</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={completion} sx={{ height: 8, borderRadius: 4 }} />
                    </Box>
                    <List dense disablePadding>
                      {stepsWithStatus.map((step, i) => (
                        <ListItem key={i} disableGutters sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            {step.done ? <CheckCircle fontSize="small" color="success" /> : <RadioButtonUnchecked fontSize="small" color="disabled" />}
                          </ListItemIcon>
                          <ListItemText primary={<Typography variant="body2" color={step.done ? 'text.primary' : 'text.secondary'}>{step.label}</Typography>} />
                        </ListItem>
                      ))}
                    </List>
                    <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/athlete/profile-setup')} startIcon={<Edit />}>
                      {completion === 0 ? 'Start Profile Setup' : 'Continue Setup'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* Right column */}
              <Grid item xs={12} md={8}>
                {/* Stat cards */}
                <Grid container spacing={2} mb={2}>
                  {[
                    { icon: <EmojiEvents />, label: 'Competitions', value: '0 Registered', color: '#F57F17', onClick: () => navigate('/athlete/competitions') },
                    { icon: <Assignment />, label: 'Documents', value: `${Object.values(profile?.documents || {}).filter(d => d?.url).length} Uploaded`, color: '#2E7D32' },
                    { icon: <Payments />, label: 'Total Paid', value: `₹${totalPaid.toLocaleString('en-IN')}`, color: '#1565C0', onClick: () => setTab('payments') },
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
                <Card sx={{ mb: 2, border: '1.5px solid', borderColor: profileFeePaid ? 'success.main' : 'warning.main', borderStyle: profileFeePaid ? 'solid' : 'dashed' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: profileFeePaid ? '#E8F5E9' : '#FFF3E0', color: profileFeePaid ? 'success.main' : 'warning.main' }}>
                          {profileFeePaid ? <CheckCircle /> : <Lock />}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={700}>Profile Registration Fee</Typography>
                          <Typography variant="body2" color="text.secondary">One-time fee to activate your athlete profile</Typography>
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
                        Paying the registration fee submits your profile for admin approval. A confirmation email will be sent.
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Available competitions */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} mb={2}>Available Competitions</Typography>
                    {registrationStatus !== 'Approved' ? (
                      <Alert severity="info">
                        {completion < 100 ? 'Complete your profile setup to unlock competitions.' : 'Your profile is under review. Competitions unlock after approval.'}
                      </Alert>
                    ) : loadingComps ? <CircularProgress size={24} /> : (
                      <List>
                        {competitions.length === 0 && <Typography color="text.secondary">No upcoming competitions.</Typography>}
                        {competitions.map(comp => (
                          <ListItem key={comp._id} divider sx={{ px: 0 }}>
                            <ListItemText primary={comp.title} secondary={`Date: ${new Date(comp.date).toLocaleDateString('en-IN')} | Fee: ₹${comp.registrationFee}`} />
                            <Button variant="contained" size="small" onClick={() => navigate('/athlete/competitions')}>Register</Button>
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
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
                  <Button variant="contained" onClick={handlePayProfileFee} disabled={payingFee}>
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