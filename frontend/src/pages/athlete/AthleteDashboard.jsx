import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Avatar,
  Chip, Grid, LinearProgress, Alert, List, ListItem,
  ListItemIcon, ListItemText, CircularProgress, Divider,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  Paper, Tab, Tabs, Badge,
} from '@mui/material';
import {
  DirectionsRun, EmojiEvents, Assignment, Payments,
  CheckCircle, RadioButtonUnchecked, Logout, Edit,
  CalendarToday, LocationOn, History, AccountCircle,
  TrendingUp, AttachMoney, Refresh,
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
import api from '../../services/api';
import toast from 'react-hot-toast';

const PROFILE_STEPS = [
  { label: 'Personal Details',      check: (p) => !!(p?.gender && p?.dateOfBirth) },
  { label: 'Parent / Guardian',     check: (p) => !!(p?.fatherName && p?.parentMobile) },
  { label: 'Address Details',       check: (p) => !!(p?.address?.city && p?.address?.state) },
  { label: 'Club Representation',   check: (p) => !!(p?.clubName) },
  { label: 'Competition Details',   check: (p) => !!(p?.ageGroup && p?.skillLevel) },
  { label: 'Document Upload',       check: (p) => !!(p?.documents?.passportPhoto?.url) },
  { label: 'Declaration & Consent', check: (p) => (p?.formStep ?? 1) >= 8 },
  { label: 'Profile Fee',           check: (p) => p?.profileFeeStatus === 'Paid' },
];

const STATUS_COLORS = { 'Incomplete':'warning','Pending Review':'info','Approved':'success','Rejected':'error' };
const PAY_COLORS    = { Paid:'success', Pending:'warning', Failed:'error', paid:'success', created:'warning', failed:'error', refunded:'info' };

export default function AthleteDashboard() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const user       = useSelector(selectCurrentUser);
  const profile    = useSelector(selectAthleteProfile);
  const isLoading  = useSelector(selectProfileLoading);
  const completion = useSelector(selectProfileCompletion);

  const [tab, setTab]                   = useState(0);
  const [competitions, setCompetitions] = useState([]);
  const [myRegs, setMyRegs]             = useState([]);
  const [payments, setPayments]         = useState([]);
  const [loadingComps, setLoadingComps] = useState(false);
  const [loadingRegs, setLoadingRegs]   = useState(false);
  const [loadingPay, setLoadingPay]     = useState(false);

  useEffect(() => { dispatch(fetchAthleteProfile()); }, [dispatch]);

  const loadCompetitions = useCallback(async () => {
    setLoadingComps(true);
    try { const r = await api.get('/public/competitions'); setCompetitions(r.data.data || []); }
    catch { toast.error('Failed to load competitions'); }
    finally { setLoadingComps(false); }
  }, []);

  const loadMyRegs = useCallback(async () => {
    setLoadingRegs(true);
    try { const r = await api.get('/athletes/competitions'); setMyRegs(r.data.data || []); }
    catch { /* not critical */ }
    finally { setLoadingRegs(false); }
  }, []);

  const loadPayments = useCallback(async () => {
    setLoadingPay(true);
    try { const r = await api.get('/payments/my-payments'); setPayments(r.data.data || []); }
    catch { /* not critical */ }
    finally { setLoadingPay(false); }
  }, []);

  // load registrations on mount for stats + count badge
  useEffect(() => { loadMyRegs(); }, []);

  const handleTabChange = (_, v) => {
    setTab(v);
    if (v === 1) loadCompetitions();
    if (v === 2) loadMyRegs();
    if (v === 3) loadPayments();
  };

  const handleLogout = async () => { await dispatch(logoutUser()); navigate('/auth/login'); };

  const regStatus  = profile?.registrationStatus || 'Incomplete';
  const isApproved = regStatus === 'Approved';
  const feePaid    = profile?.profileFeeStatus === 'Paid';

  const stepsWithStatus = PROFILE_STEPS.map(s => ({ ...s, done: s.check(profile) }));

  const docCount = Object.values(profile?.documents || {}).filter(d => d && typeof d === 'object' && d.url).length;
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);

  const getStatusMsg = () => {
    if (isApproved && feePaid)   return { text:'✅ Fully active! Register for competitions anytime.', severity:'success' };
    if (isApproved && !feePaid)  return { text:'✅ Profile approved! Complete payment to fully activate.', severity:'info', action:true };
    if (regStatus==='Pending Review') return { text:'⏳ Your profile is under admin review.', severity:'info' };
    if (regStatus==='Rejected')  return { text:'❌ Profile rejected. Review admin notes and resubmit.', severity:'error', action:true };
    return { text:'⚠️ Complete your profile to get approved for competitions.', severity:'warning', action:completion<100 };
  };
  const statusMsg = getStatusMsg();

  return (
    <Box sx={{ minHeight:'100vh', bgcolor:'background.default' }}>
      {/* Header */}
      <Box sx={{ background:'linear-gradient(135deg,#1565C0,#1E88E5)', color:'white', px:3, py:2, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <Box sx={{ display:'flex', alignItems:'center', gap:2 }}>
          <Avatar sx={{ bgcolor:'rgba(255,255,255,0.2)', width:44, height:44 }}><DirectionsRun /></Avatar>
          <Box>
            <Typography fontWeight={700}>{user?.fullName}</Typography>
            <Typography variant="caption" sx={{ color:'rgba(255,255,255,0.8)' }}>Athlete · {user?.email}</Typography>
          </Box>
        </Box>
        <Box sx={{ display:'flex', gap:1 }}>
          <Button variant="outlined" size="small" onClick={() => navigate('/')} sx={{ color:'white', borderColor:'rgba(255,255,255,0.5)' }}>Home</Button>
          <Button variant="outlined" size="small" onClick={() => navigate('/athlete/competitions')} sx={{ color:'white', borderColor:'rgba(255,255,255,0.5)' }}>Competitions</Button>
          <Button variant="outlined" size="small" onClick={() => navigate('/athlete/history')} sx={{ color:'white', borderColor:'rgba(255,255,255,0.5)' }}>My History</Button>
          <Button variant="outlined" size="small" startIcon={<Logout />} onClick={handleLogout} sx={{ color:'white', borderColor:'rgba(255,255,255,0.5)' }}>Logout</Button>
        </Box>
      </Box>

      <Box sx={{ maxWidth:1200, mx:'auto', p:3 }}>
        {isLoading ? (
          <Box sx={{ display:'flex', justifyContent:'center', py:8 }}><CircularProgress /></Box>
        ) : (
          <>
            <Alert severity={statusMsg.severity} sx={{ mb:3 }}
              action={statusMsg.action && (
                <Button color="inherit" size="small" startIcon={<Edit />} onClick={() => navigate('/athlete/profile-setup')}>
                  {completion===0?'Start Setup':'Continue'}
                </Button>
              )}>
              {statusMsg.text}
            </Alert>

            {/* Stat cards */}
            <Grid container spacing={2} mb={3}>
              {[
                { icon:<EmojiEvents />, label:'Competitions', value:`${myRegs.length} Registered`, sub:`${myRegs.filter(r=>r.paymentStatus==='Paid').length} paid`, color:'#F57F17', onClick:()=>setTab(2) },
                { icon:<Assignment />,  label:'Documents',    value:`${docCount} Uploaded`, sub:`${Object.values(profile?.documents||{}).filter(d=>d?.status==='Approved').length} approved`, color:'#2E7D32', onClick:()=>navigate('/athlete/profile-setup') },
                { icon:<AttachMoney />, label:'Total Paid',   value:`₹${totalPaid.toLocaleString('en-IN')}`, sub:feePaid?'Profile fee ✓':'Profile fee pending', color:'#1565C0', onClick:()=>setTab(3) },
                { icon:<TrendingUp />,  label:'Profile',      value:`${completion}% Complete`, sub:regStatus, color:completion===100?'#2E7D32':'#F57F17', onClick:()=>setTab(0) },
              ].map(c => (
                <Grid item xs={12} sm={6} md={3} key={c.label}>
                  <Card sx={{ cursor:'pointer', transition:'transform .15s', '&:hover':{ transform:'translateY(-2px)' } }} onClick={c.onClick}>
                    <CardContent sx={{ textAlign:'center', py:2 }}>
                      <Avatar sx={{ bgcolor:c.color+'18', color:c.color, mx:'auto', mb:1 }}>{c.icon}</Avatar>
                      <Typography variant="caption" color="text.secondary" display="block">{c.label}</Typography>
                      <Typography variant="h6" fontWeight={700}>{c.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{c.sub}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Tabbed content */}
            <Card>
              <Tabs value={tab} onChange={handleTabChange} sx={{ borderBottom:1, borderColor:'divider', px:2 }} variant="scrollable">
                <Tab icon={<AccountCircle />} iconPosition="start" label="Profile" />
                <Tab icon={<EmojiEvents />}   iconPosition="start" label="Browse Competitions" />
                <Tab icon={<History />}        iconPosition="start"
                  label={<Badge badgeContent={myRegs.length} color="primary" max={99} sx={{ pr:1 }}>My Registrations</Badge>} />
                <Tab icon={<Payments />}       iconPosition="start" label="Payments" />
              </Tabs>

              <CardContent sx={{ p:{ xs:2, md:3 } }}>

                {/* TAB 0 — Profile */}
                {tab===0 && (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={5}>
                      <Box mb={2}>
                        <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.5 }}>
                          <Typography variant="body2" color="text.secondary">Completion</Typography>
                          <Typography variant="body2" fontWeight={700} color={completion===100?'success.main':'primary'}>
                            {completion}%
                          </Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={completion}
                          color={completion===100?'success':'primary'} sx={{ height:10, borderRadius:5 }} />
                      </Box>
                      <List dense disablePadding>
                        {stepsWithStatus.map((step,i) => (
                          <ListItem key={i} disableGutters sx={{ py:0.5 }}>
                            <ListItemIcon sx={{ minWidth:28 }}>
                              {step.done ? <CheckCircle fontSize="small" color="success" /> : <RadioButtonUnchecked fontSize="small" color="disabled" />}
                            </ListItemIcon>
                            <ListItemText primary={
                              <Typography variant="body2" color={step.done?'text.primary':'text.secondary'}>{step.label}</Typography>
                            } />
                          </ListItem>
                        ))}
                      </List>
                      <Button fullWidth variant="contained" sx={{ mt:2 }} startIcon={<Edit />}
                        onClick={() => navigate('/athlete/profile-setup')}>
                        {completion===0?'Start Profile Setup':completion===100?'View Profile':'Continue Setup'}
                      </Button>
                    </Grid>

                    <Grid item xs={12} md={7}>
                      <Typography variant="subtitle1" fontWeight={700} mb={2}>Profile Details</Typography>
                      {profile ? (
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius:2 }}>
                          <Table size="small">
                            <TableBody>
                              {[
                                ['Status',      <Chip label={regStatus} size="small" color={STATUS_COLORS[regStatus]||'default'} sx={{ fontWeight:600 }} />],
                                ['Age Group',   profile.ageGroup||'—'],
                                ['Skill Level', profile.skillLevel||'—'],
                                ['Club',        profile.clubName||'—'],
                                ['State',       profile.stateRepresentation||profile.address?.state||'—'],
                                ['Blood Group', profile.bloodGroup||'—'],
                                ['Profile Fee', <Chip label={profile.profileFeeStatus||'Pending'} size="small" color={PAY_COLORS[profile.profileFeeStatus]||'warning'} sx={{ fontWeight:600 }} />],
                                ...(profile.profileFeePaidAt?[['Fee Paid On', new Date(profile.profileFeePaidAt).toLocaleDateString('en-IN')]]: []),
                                ...(profile.profileFeeTransactionId?[['TXN ID', `...${profile.profileFeeTransactionId.slice(-8)}`]]: []),
                              ].map(([lbl,val],i) => (
                                <TableRow key={i}>
                                  <TableCell sx={{ color:'text.secondary', fontWeight:500, width:150, border:0, py:1 }}>{lbl}</TableCell>
                                  <TableCell sx={{ fontWeight:600, border:0, py:1 }}>{val}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Alert severity="info">No profile data yet. Start your profile setup.</Alert>
                      )}
                    </Grid>
                  </Grid>
                )}

                {/* TAB 1 — Browse Competitions */}
                {tab===1 && (
                  <Box>
                    {!isApproved && (
                      <Alert severity="warning" sx={{ mb:2 }}>
                        Profile must be <strong>Approved</strong> to register for competitions.
                      </Alert>
                    )}
                    {loadingComps ? (
                      <Box sx={{ display:'flex', justifyContent:'center', py:6 }}><CircularProgress /></Box>
                    ) : competitions.length===0 ? (
                      <Box sx={{ textAlign:'center', py:6 }}>
                        <Typography variant="h4" mb={1}>🏟️</Typography>
                        <Typography color="text.secondary">No competitions available yet.</Typography>
                      </Box>
                    ) : (
                      <Grid container spacing={2}>
                        {competitions.map(comp => {
                          const registered = myRegs.some(r => r.competition?._id===comp._id || r.competition===comp._id);
                          const daysLeft   = Math.ceil((new Date(comp.deadline)-new Date())/86400000);
                          return (
                            <Grid item xs={12} md={6} key={comp._id}>
                              <Card variant="outlined" sx={{ borderColor:registered?'success.main':'divider', borderWidth:registered?2:1 }}>
                                <Box sx={{ height:4, background:'linear-gradient(90deg,#1565C0,#7C3AED)' }} />
                                <CardContent sx={{ p:2.5 }}>
                                  <Box sx={{ display:'flex', justifyContent:'space-between', mb:1.5 }}>
                                    <Chip label={comp.status} size="small"
                                      color={{ upcoming:'success',ongoing:'warning',completed:'default' }[comp.status]||'default'} />
                                    {registered && <Chip label="✓ Registered" color="success" size="small" />}
                                    {!registered && daysLeft<=3 && daysLeft>0 && <Chip label={`${daysLeft}d left`} color="error" size="small" />}
                                  </Box>
                                  <Typography variant="h6" fontWeight={700} mb={0.5}>{comp.title}</Typography>
                                  <Typography variant="body2" color="text.secondary" mb={1.5} sx={{ minHeight:40 }}>
                                    {comp.description?.slice(0,80)}{comp.description?.length>80?'…':''}
                                  </Typography>
                                  <Box sx={{ display:'flex', flexWrap:'wrap', gap:1, mb:1.5 }}>
                                    <Chip icon={<CalendarToday sx={{ fontSize:'13px !important' }} />} size="small" variant="outlined"
                                      label={new Date(comp.date).toLocaleDateString('en-IN')} />
                                    <Chip icon={<LocationOn sx={{ fontSize:'13px !important' }} />} size="small" variant="outlined" label={comp.venue} />
                                    <Chip icon={<AttachMoney sx={{ fontSize:'13px !important' }} />} size="small" variant="outlined" label={`₹${comp.registrationFee}`} />
                                  </Box>
                                  <Box sx={{ bgcolor:'grey.50', borderRadius:1, px:1.5, py:1, mb:1.5, display:'flex', justifyContent:'space-between' }}>
                                    <Typography variant="caption" color="text.secondary">Deadline</Typography>
                                    <Typography variant="caption" fontWeight={700} color={daysLeft<=3?'error.main':'text.primary'}>
                                      {new Date(comp.deadline).toLocaleDateString('en-IN')}
                                    </Typography>
                                  </Box>
                                  {registered ? (
                                    <Button fullWidth variant="outlined" color="success" startIcon={<CheckCircle />} disabled>Already Registered</Button>
                                  ) : (
                                    <Button fullWidth variant="contained" disabled={!isApproved||daysLeft<=0}
                                      onClick={() => navigate('/athlete/competitions')}>
                                      {!isApproved?'Profile Not Approved':daysLeft<=0?'Deadline Passed':'Register Now →'}
                                    </Button>
                                  )}
                                </CardContent>
                              </Card>
                            </Grid>
                          );
                        })}
                      </Grid>
                    )}
                  </Box>
                )}

                {/* TAB 2 — My Registrations */}
                {tab===2 && (
                  <Box>
                    <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:2 }}>
                      <Typography variant="subtitle1" fontWeight={700}>My Competition Registrations ({myRegs.length})</Typography>
                      <Button size="small" startIcon={<Refresh />} onClick={loadMyRegs}>Refresh</Button>
                    </Box>
                    {loadingRegs ? (
                      <Box sx={{ display:'flex', justifyContent:'center', py:6 }}><CircularProgress /></Box>
                    ) : myRegs.length===0 ? (
                      <Box sx={{ textAlign:'center', py:6 }}>
                        <Typography variant="h4" mb={1}>📋</Typography>
                        <Typography color="text.secondary" mb={2}>No registrations yet.</Typography>
                        <Button variant="contained" onClick={() => setTab(1)}>Browse Competitions</Button>
                      </Box>
                    ) : (
                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius:2 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor:'grey.50' }}>
                              {['Competition','Date','Venue','Fee','Payment','Status','Registered On'].map(h => (
                                <TableCell key={h} sx={{ fontWeight:700, fontSize:'0.73rem', textTransform:'uppercase', color:'text.secondary', letterSpacing:0.5 }}>{h}</TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {myRegs.map(reg => (
                              <TableRow key={reg._id} hover>
                                <TableCell>
                                  <Typography variant="body2" fontWeight={600}>{reg.competition?.title||'—'}</Typography>
                                  {reg.competition?.ageGroups?.length>0 && (
                                    <Typography variant="caption" color="text.secondary">{reg.competition.ageGroups.join(', ')}</Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {reg.competition?.date?new Date(reg.competition.date).toLocaleDateString('en-IN'):'—'}
                                  </Typography>
                                </TableCell>
                                <TableCell><Typography variant="body2">{reg.competition?.venue||'—'}</Typography></TableCell>
                                <TableCell><Typography variant="body2" fontWeight={600}>₹{reg.paymentAmount||0}</Typography></TableCell>
                                <TableCell>
                                  <Chip label={reg.paymentStatus||'Pending'} size="small"
                                    color={PAY_COLORS[reg.paymentStatus]||'warning'} sx={{ fontWeight:600 }} />
                                </TableCell>
                                <TableCell>
                                  <Chip label={reg.status||'Active'} size="small"
                                    color={reg.status==='Active'?'success':reg.status==='Cancelled'?'error':'default'} />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(reg.createdAt).toLocaleDateString('en-IN')}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                )}

                {/* TAB 3 — Payments */}
                {tab===3 && (
                  <Box>
                    <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:2 }}>
                      <Typography variant="subtitle1" fontWeight={700}>Payment History</Typography>
                      <Button size="small" startIcon={<Refresh />} onClick={() => { setPayments([]); loadPayments(); }}>Refresh</Button>
                    </Box>

                    {/* Profile fee summary */}
                    <Card variant="outlined" sx={{ mb:2, borderColor:feePaid?'success.main':'warning.main', borderWidth:2 }}>
                      <CardContent sx={{ p:2 }}>
                        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700}>Profile Registration Fee</Typography>
                            <Typography variant="caption" color="text.secondary">One-time fee to activate your athlete profile</Typography>
                            {profile?.profileFeePaidAt && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                Paid on {new Date(profile.profileFeePaidAt).toLocaleDateString('en-IN')}
                                {profile.profileFeeTransactionId && ` · TXN: ...${profile.profileFeeTransactionId.slice(-8)}`}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ textAlign:'right' }}>
                            <Typography variant="h6" fontWeight={700}>₹500</Typography>
                            <Chip label={feePaid?'✓ Paid':'Pending'} color={feePaid?'success':'warning'} size="small" sx={{ fontWeight:700 }} />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>

                    {loadingPay ? (
                      <Box sx={{ display:'flex', justifyContent:'center', py:4 }}><CircularProgress /></Box>
                    ) : payments.length===0 ? (
                      <Typography color="text.secondary" textAlign="center" py={3}>No payment transactions recorded yet.</Typography>
                    ) : (
                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius:2 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor:'grey.50' }}>
                              {['Description','Amount','Status','Transaction ID','Date'].map(h => (
                                <TableCell key={h} sx={{ fontWeight:700, fontSize:'0.73rem', textTransform:'uppercase', color:'text.secondary' }}>{h}</TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {payments.map(pay => (
                              <TableRow key={pay._id} hover>
                                <TableCell>
                                  <Typography variant="body2" fontWeight={600}>{pay.entityName||pay.description||'—'}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {pay.entityType==='profile_registration'?'Profile Fee':'Competition Fee'}
                                  </Typography>
                                </TableCell>
                                <TableCell><Typography variant="body2" fontWeight={600}>₹{pay.amount?.toLocaleString('en-IN')}</Typography></TableCell>
                                <TableCell>
                                  <Chip label={pay.status} size="small"
                                    color={PAY_COLORS[pay.status]||'default'} sx={{ fontWeight:600 }} />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="caption" color="text.secondary">
                                    {pay.razorpayPaymentId?`...${pay.razorpayPaymentId.slice(-8)}`:'—'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(pay.createdAt).toLocaleDateString('en-IN')}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                )}

              </CardContent>
            </Card>
          </>
        )}
      </Box>
    </Box>
  );
}