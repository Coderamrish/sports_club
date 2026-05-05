import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import {
  Box, Typography, Card, CardContent, Button, Chip, Grid,
  Alert, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Divider, Avatar, IconButton,
  LinearProgress
} from '@mui/material';
import {
  EmojiEvents, CalendarToday, LocationOn, Payment,
  CheckCircle, ArrowBack, Logout, Warning, Receipt
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import { selectAthleteProfile } from '../../store/slices/profileSlice';
import { selectCoachProfile } from '../../store/slices/coachProfileSlice';
import api from '../../services/api';
import { initiatePayment } from '../../services/payment.service';
import toast from 'react-hot-toast';

export default function Competitions() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const athleteProfile = useSelector(selectAthleteProfile);
  const coachProfile = useSelector(selectCoachProfile);
  const profile = user?.role === 'coach' ? coachProfile : athleteProfile;
  const isApproved = profile?.registrationStatus === 'Approved' || profile?.profileStatus === 'Approved';
  const apiRoute = user?.role === 'coach' ? '/coaches/competitions' : '/athletes/competitions';

  const [competitions, setCompetitions] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComp, setSelectedComp] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [tab, setTab] = useState('available'); // 'available' | 'mine'
  const [payingId, setPayingId] = useState(null); // registrationId currently being paid

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compsRes, myRes] = await Promise.allSettled([
        api.get('/public/competitions'),
        api.get(apiRoute),
      ]);
      if (compsRes.status === 'fulfilled') setCompetitions(compsRes.value.data.data || []);
      if (myRes.status === 'fulfilled') setMyRegistrations(myRes.value.data.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);


  const isRegistered = (compId) => myRegistrations.some(r => r.competition?._id === compId || r.competition === compId);

  const handleRegister = async () => {
    if (!selectedComp) return;
    setRegistering(true);
    try {
      await api.post(`${apiRoute}/register`, { competitionId: selectedComp._id });
      toast.success('Registered! Awaiting admin approval.');
      setSelectedComp(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handlePayNow = (reg) => {
    setPayingId(reg._id);
    initiatePayment({
      entityType:  'competition_registration',
      entityId:    reg._id,
      description: `Competition fee – ${reg.competition?.title || 'Competition'}`,
      onSuccess: () => {
        toast.success('🎉 Payment successful! Confirmation email sent.');
        setPayingId(null);
        fetchData();
      },
      onFailure: (err) => {
        const msg = err?.message || 'Payment failed';
        if (!msg.includes('cancelled')) {
          toast.error(msg);
        }
        setPayingId(null);
      },
    });
  };

  const getDaysLeft = (deadline) => {
    const diff = new Date(deadline) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const statusColor = { upcoming: 'success', ongoing: 'warning', completed: 'default' };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box sx={{ background: 'linear-gradient(135deg,#1565C0,#1E88E5)', color: 'white', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(`/${user?.role}/dashboard`)} sx={{ color: 'white' }}>
            <ArrowBack />
          </IconButton>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}><EmojiEvents /></Avatar>
          <Box>
            <Typography fontWeight={700}>Competitions</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Browse & Register</Typography>
          </Box>
        </Box>
        <Button variant="outlined" size="small" startIcon={<Logout />} onClick={() => { dispatch(logoutUser()); navigate('/auth/login'); }}
          sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}>
          Logout
        </Button>
      </Box>

      <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
        {!isApproved && (
          <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
            <strong>Profile not approved.</strong> Complete your profile setup and wait for admin approval before registering for competitions.
            <Button size="small" sx={{ ml: 2 }} onClick={() => navigate(`/${user?.role}/profile-setup`)}>Complete Profile</Button>
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          {[
            { key: 'available', label: `Available (${competitions.length})` },
            { key: 'mine', label: `My Registrations (${myRegistrations.length})` },
          ].map(t => (
            <Button key={t.key} variant={tab === t.key ? 'contained' : 'outlined'} onClick={() => setTab(t.key)} size="small">
              {t.label}
            </Button>
          ))}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : tab === 'available' ? (
          <>
            {competitions.length === 0 ? (
              <Card><CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h4" mb={1}>🏟️</Typography>
                <Typography color="text.secondary">No competitions available yet.</Typography>
              </CardContent></Card>
            ) : (
              <Grid container spacing={3}>
                {competitions.map((comp) => {
                  const daysLeft = getDaysLeft(comp.deadline);
                  const registered = isRegistered(comp._id);
                  return (
                    <Grid item xs={12} md={6} key={comp._id}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', border: registered ? '2px solid' : '1px solid', borderColor: registered ? 'success.main' : 'divider' }}>
                        <Box sx={{ height: 4, background: 'linear-gradient(90deg,#1565C0,#7C3AED)' }} />
                        <CardContent sx={{ flex: 1, p: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Chip label={comp.status} color={statusColor[comp.status] || 'default'} size="small" />
                            {registered && <Chip label="✓ Registered" color="success" size="small" />}
                            {!registered && daysLeft <= 3 && daysLeft > 0 && (
                              <Chip label={`${daysLeft}d left`} color="error" size="small" />
                            )}
                          </Box>

                          <Typography variant="h6" fontWeight={700} mb={1}>{comp.title}</Typography>
                          <Typography variant="body2" color="text.secondary" mb={2} sx={{ minHeight: 42 }}>
                            {comp.description?.slice(0, 90)}{comp.description?.length > 90 ? '...' : ''}
                          </Typography>

                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            <Chip icon={<CalendarToday sx={{ fontSize: '14px !important' }} />} label={new Date(comp.date).toLocaleDateString('en-IN')} size="small" variant="outlined" />
                            <Chip icon={<LocationOn sx={{ fontSize: '14px !important' }} />} label={comp.venue} size="small" variant="outlined" />
                            <Chip icon={<Payment sx={{ fontSize: '14px !important' }} />} label={`₹${comp.registrationFee}`} size="small" variant="outlined" />
                          </Box>

                          <Box sx={{ bgcolor: 'grey.50', borderRadius: 1, p: 1.5, mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color="text.secondary">Deadline</Typography>
                            <Typography variant="caption" fontWeight={700} color={daysLeft <= 3 ? 'error.main' : 'text.primary'}>
                              {new Date(comp.deadline).toLocaleDateString('en-IN')}
                            </Typography>
                          </Box>

                          {registered ? (
                            <Button fullWidth variant="outlined" color="success" startIcon={<CheckCircle />} disabled>
                              Already Registered
                            </Button>
                          ) : (
                            <Button fullWidth variant="contained" disabled={!isApproved || daysLeft <= 0}
                              onClick={() => setSelectedComp(comp)}>
                              {!isApproved ? 'Profile Not Approved' : daysLeft <= 0 ? 'Deadline Passed' : 'Register Now →'}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </>
        ) : (
          <>
            {myRegistrations.length === 0 ? (
              <Card><CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h4" mb={1}>📋</Typography>
                <Typography color="text.secondary" mb={2}>You haven't registered for any competitions yet.</Typography>
                <Button variant="contained" onClick={() => setTab('available')}>Browse Competitions</Button>
              </CardContent></Card>
            ) : (
              <Grid container spacing={3}>
                {myRegistrations.map((reg) => (
                  <Grid item xs={12} md={6} key={reg._id}>
                    <Card>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Chip label={reg.paymentStatus || 'Pending'} color={reg.paymentStatus === 'Paid' ? 'success' : 'warning'} size="small" />
                          <Typography variant="caption" color="text.secondary">
                            Registered: {new Date(reg.createdAt).toLocaleDateString('en-IN')}
                          </Typography>
                        </Box>
                        <Typography variant="h6" fontWeight={700} mb={1}>
                          {reg.competition?.title || 'Competition'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                          {reg.competition?.date ? new Date(reg.competition.date).toLocaleDateString('en-IN') : ''} · {reg.competition?.venue || ''}
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Fee: <strong>₹{reg.competition?.registrationFee || 0}</strong>
                            </Typography>
                            <Chip
                              size="small"
                              label={reg.status === 'Active' ? 'Approved' : reg.status === 'Pending' ? 'Pending Approval' : reg.status}
                              color={reg.status === 'Active' ? 'success' : reg.status === 'Pending' ? 'warning' : 'error'}
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                          {reg.paymentStatus !== 'Paid' && reg.status === 'Active' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={payingId === reg._id ? <CircularProgress size={14} color="inherit" /> : <Receipt />}
                              disabled={payingId === reg._id}
                              onClick={() => handlePayNow(reg)}
                            >
                              {payingId === reg._id ? 'Processing...' : 'Pay Now'}
                            </Button>
                          )}
                          {reg.paymentStatus === 'Paid' && (
                            <Chip label="✓ Paid" color="success" size="small" />
                          )}
                          {reg.paymentStatus !== 'Paid' && reg.status === 'Pending' && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              Pay after approval
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}
      </Box>

      {/* Registration dialog */}
      <Dialog open={!!selectedComp} onClose={() => setSelectedComp(null)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEvents color="primary" /> Confirm Registration
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          {selectedComp && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                You are about to register for <strong>{selectedComp.title}</strong>.
              </Alert>
              <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Date</Typography>
                  <Typography variant="body2" fontWeight={600}>{new Date(selectedComp.date).toLocaleDateString('en-IN')}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Venue</Typography>
                  <Typography variant="body2" fontWeight={600}>{selectedComp.venue}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Registration Fee</Typography>
                  <Typography variant="body2" fontWeight={700} color="primary.main">₹{selectedComp.registrationFee}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Deadline</Typography>
                  <Typography variant="body2" fontWeight={600}>{new Date(selectedComp.deadline).toLocaleDateString('en-IN')}</Typography>
                </Box>
              </Box>
              <Alert severity="warning" sx={{ mt: 2 }} icon={<Payment />}>
                Payment of <strong>₹{selectedComp.registrationFee}</strong> will be collected after admin confirms your slot.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSelectedComp(null)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleRegister} disabled={registering}>
            {registering ? <CircularProgress size={20} color="inherit" /> : 'Confirm Registration'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}