import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Avatar, Button, Grid,
  Alert, LinearProgress, CircularProgress, TextField, MenuItem,
  Select, FormControl, InputLabel, Chip, Divider, Paper,
  List, ListItem, ListItemIcon, ListItemText,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  Tab, Tabs, Badge,
} from '@mui/material';
import {
  SportsKabaddi, People, EmojiEvents, Logout,
  Edit, Save, Cancel, CheckCircle, RadioButtonUnchecked,
  AccountCircle, Payments, History, AttachMoney, Refresh,
  CalendarToday, LocationOn, TrendingUp,
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
import api from '../../services/api';

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

const STATUS_COLORS = { 'Incomplete':'warning','Pending Review':'info','Approved':'success','Rejected':'error' };
const PAY_COLORS    = { Paid:'success',Pending:'warning',Failed:'error',paid:'success',created:'warning',failed:'error',refunded:'info' };

const PROFILE_STEPS = [
  { label:'Personal Details',  check:(p) => !!(p?.gender && p?.experienceYears) },
  { label:'Address Details',   check:(p) => !!(p?.address?.city && p?.address?.state) },
  { label:'Club/Association',  check:(p) => !!(p?.clubName && p?.stateAssociation) },
  { label:'Document Upload',   check:(p) => !!(p?.documents?.idProof?.url) },
  { label:'Declaration',       check:(p) => (p?.formStep??1)>=5 },
  { label:'Profile Fee',       check:(p) => p?.profileFeeStatus==='Paid' },
];

export default function CoachDashboard() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const user       = useSelector(selectCurrentUser);
  const profile    = useSelector(selectCoachProfile);
  const isLoading  = useSelector(selectCoachLoading);
  const isSaving   = useSelector(selectCoachSaving);
  const completion = useSelector(selectCoachCompletion);
  const error      = useSelector(selectCoachError);

  const [tab,     setTab]     = useState(0);
  const [editing, setEditing] = useState(false);

  const [competitions, setCompetitions] = useState([]);
  const [myRegs,       setMyRegs]       = useState([]);
  const [payments,     setPayments]     = useState([]);
  const [loadingComps, setLoadingComps] = useState(false);
  const [loadingRegs,  setLoadingRegs]  = useState(false);
  const [loadingPay,   setLoadingPay]   = useState(false);

  const { register, handleSubmit, control, reset } = useForm({
    defaultValues: { gender:'', specialization:'', experienceYears:'', bio:'', clubName:'', stateAssociation:'' },
  });

  useEffect(() => { dispatch(fetchCoachProfile()); }, [dispatch]);

  useEffect(() => {
    if (profile) {
      reset({
        gender:           profile.gender||'',
        specialization:   profile.specialization?.[0]||'',
        experienceYears:  profile.experienceYears||'',
        bio:              profile.bio||'',
        clubName:         profile.clubName||'',
        stateAssociation: profile.stateAssociation||'',
      });
    }
  }, [profile, reset]);

  // load registrations for stats on mount
  useEffect(() => { loadMyRegs(); }, []);

  const loadCompetitions = useCallback(async () => {
    setLoadingComps(true);
    try { const r = await api.get('/public/competitions'); setCompetitions(r.data.data||[]); }
    catch { toast.error('Failed to load competitions'); }
    finally { setLoadingComps(false); }
  }, []);

  const loadMyRegs = useCallback(async () => {
    setLoadingRegs(true);
    try { const r = await api.get('/coaches/competitions'); setMyRegs(r.data.data||[]); }
    catch { /* not critical */ }
    finally { setLoadingRegs(false); }
  }, []);

  const loadPayments = useCallback(async () => {
    setLoadingPay(true);
    try { const r = await api.get('/payments/my-payments'); setPayments(r.data.data||[]); }
    catch { /* not critical */ }
    finally { setLoadingPay(false); }
  }, []);

  const handleTabChange = (_, v) => {
    setTab(v);
    if (v===2) loadCompetitions();
    if (v===3) loadMyRegs();
    if (v===4) loadPayments();
  };

  const handleLogout = async () => { await dispatch(logoutUser()); navigate('/auth/login'); };

  const onSubmit = async (data) => {
    try {
      await dispatch(saveCoachProfile(data)).unwrap();
      toast.success('Profile updated!');
      setEditing(false);
    } catch { toast.error(error || 'Save failed'); }
  };

  const profileStatus = profile?.profileStatus || 'Incomplete';
  const isApproved    = profileStatus === 'Approved';
  const feePaid       = profile?.profileFeeStatus === 'Paid';
  const stepsWithStatus = PROFILE_STEPS.map(s => ({ ...s, done: s.check(profile) }));
  const totalPaid = payments.filter(p => p.status==='paid').reduce((s,p) => s+(p.amount||0), 0);

  const getStatusMsg = () => {
    if (isApproved && feePaid)  return { text:'✅ Fully active! You can now coach athletes.', severity:'success' };
    if (isApproved && !feePaid) return { text:'✅ Profile approved! Pay the registration fee to fully activate.', severity:'info' };
    if (profileStatus==='Pending Review') return { text:'⏳ Your profile is under admin review.', severity:'info' };
    if (profileStatus==='Rejected')       return { text:'❌ Profile rejected. Review admin notes and resubmit.', severity:'error' };
    return { text:'⚠️ Profile incomplete. Fill in your details to submit for review.', severity:'warning' };
  };
  const statusMsg = getStatusMsg();

  return (
    <Box sx={{ minHeight:'100vh', bgcolor:'background.default' }}>
      {/* Header */}
      <Box sx={{ background:'linear-gradient(135deg,#2E7D32,#43A047)', color:'white', px:3, py:2, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <Box sx={{ display:'flex', alignItems:'center', gap:2 }}>
          <Avatar sx={{ bgcolor:'rgba(255,255,255,0.2)', width:44, height:44 }}><SportsKabaddi /></Avatar>
          <Box>
            <Typography fontWeight={700}>{user?.fullName}</Typography>
            <Typography variant="caption" sx={{ color:'rgba(255,255,255,0.8)' }}>Coach / Trainer · {user?.email}</Typography>
          </Box>
        </Box>
        <Box sx={{ display:'flex', alignItems:'center', gap:2 }}>
          <Box sx={{ width:130, textAlign:'right' }}>
            <Typography variant="caption" sx={{ color:'rgba(255,255,255,0.8)' }}>{completion}% complete</Typography>
            <LinearProgress variant="determinate" value={completion}
              sx={{ height:6, borderRadius:3, bgcolor:'rgba(255,255,255,0.3)', '& .MuiLinearProgress-bar':{ bgcolor:'white' } }} />
          </Box>
          <Box sx={{ display:'flex', gap:1 }}>
            <Button variant="outlined" size="small" onClick={() => navigate('/')} sx={{ color:'white', borderColor:'rgba(255,255,255,0.5)' }}>Home</Button>
            <Button variant="outlined" size="small" onClick={() => navigate('/coach/competitions')} sx={{ color:'white', borderColor:'rgba(255,255,255,0.5)' }}>Competitions</Button>
            <Button variant="outlined" size="small" onClick={() => navigate('/coach/history')} sx={{ color:'white', borderColor:'rgba(255,255,255,0.5)' }}>My History</Button>
            <Button variant="outlined" size="small" startIcon={<Logout />} onClick={handleLogout} sx={{ color:'white', borderColor:'rgba(255,255,255,0.5)' }}>Logout</Button>
          </Box>
        </Box>
      </Box>

      <Box sx={{ maxWidth:1200, mx:'auto', p:3 }}>
        {isLoading ? (
          <Box sx={{ display:'flex', justifyContent:'center', py:8 }}><CircularProgress /></Box>
        ) : (
          <>
            {error && <Alert severity="error" sx={{ mb:2 }} onClose={() => dispatch(clearCoachError())}>{error}</Alert>}
            <Alert severity={statusMsg.severity} sx={{ mb:3 }}>{statusMsg.text}</Alert>

            {/* Stat cards */}
            <Grid container spacing={2} mb={3}>
              {[
                { icon:<People />,      label:'Athletes', value:`${profile?.assignedAthletes?.length||0}`, sub:'assigned', color:'#1565C0', onClick:()=>toast.success('Assigned athletes coming soon!') },
                { icon:<EmojiEvents />, label:'Competitions', value:`${myRegs.length} Registered`, sub:`${myRegs.filter(r=>r.paymentStatus==='Paid').length} paid`, color:'#F57F17', onClick:()=>setTab(3) },
                { icon:<AttachMoney />, label:'Total Paid', value:`₹${totalPaid.toLocaleString('en-IN')}`, sub:feePaid?'Profile fee ✓':'Profile fee pending', color:'#1565C0', onClick:()=>setTab(4) },
                { icon:<TrendingUp />,  label:'Profile', value:`${completion}% Complete`, sub:profileStatus, color:completion===100?'#2E7D32':'#F57F17', onClick:()=>setTab(0) },
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

            {/* Tabs */}
            <Card>
              <Tabs value={tab} onChange={handleTabChange} sx={{ borderBottom:1, borderColor:'divider', px:2 }} variant="scrollable">
                <Tab icon={<AccountCircle />} iconPosition="start" label="Profile" />
                <Tab icon={<Edit />}          iconPosition="start" label="Edit Profile" />
                <Tab icon={<EmojiEvents />}   iconPosition="start" label="Browse Competitions" />
                <Tab icon={<History />}       iconPosition="start"
                  label={<Badge badgeContent={myRegs.length} color="primary" max={99} sx={{ pr:1 }}>My Registrations</Badge>} />
                <Tab icon={<Payments />}      iconPosition="start" label="Payments" />
              </Tabs>

              <CardContent sx={{ p:{ xs:2, md:3 } }}>

                {/* TAB 0 — Profile View */}
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
                      <Button fullWidth variant="contained" color="success" sx={{ mt:2 }} startIcon={<Edit />}
                        onClick={() => setTab(1)}>
                        {completion===0?'Start Profile Setup':completion===100?'View/Edit Profile':'Continue Setup'}
                      </Button>
                    </Grid>

                    <Grid item xs={12} md={7}>
                      <Typography variant="subtitle1" fontWeight={700} mb={2}>Profile Details</Typography>
                      {profile ? (
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius:2 }}>
                          <Table size="small">
                            <TableBody>
                              {[
                                ['Status',        <Chip label={profileStatus} size="small" color={STATUS_COLORS[profileStatus]||'default'} sx={{ fontWeight:600 }} />],
                                ['Gender',        profile.gender||'—'],
                                ['Specialization',profile.specialization?.join(', ')||'—'],
                                ['Experience',    profile.experienceYears!=null?`${profile.experienceYears} years`:'—'],
                                ['Club',          profile.clubName||'—'],
                                ['State Assoc.',  profile.stateAssociation||'—'],
                                ['Profile Fee',   <Chip label={profile.profileFeeStatus||'Pending'} size="small" color={PAY_COLORS[profile.profileFeeStatus]||'warning'} sx={{ fontWeight:600 }} />],
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
                        <Alert severity="info">No profile data yet. Click "Start Profile Setup" to begin.</Alert>
                      )}
                    </Grid>
                  </Grid>
                )}

                {/* TAB 1 — Edit Profile */}
                {tab===1 && (
                  <Box>
                    <Grid container spacing={2.5}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Gender</InputLabel>
                          <Controller name="gender" control={control} render={({ field }) => (
                            <Select {...field} label="Gender">
                              {['Male','Female','Other'].map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                            </Select>
                          )} />
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Specialization</InputLabel>
                          <Controller name="specialization" control={control} render={({ field }) => (
                            <Select {...field} label="Specialization">
                              {SPECIALIZATIONS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                            </Select>
                          )} />
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField {...register('experienceYears')} label="Years of Experience" type="number" fullWidth inputProps={{ min:0, max:60 }} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField {...register('clubName')} label="Club / Academy Name" fullWidth />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>State Association</InputLabel>
                          <Controller name="stateAssociation" control={control} render={({ field }) => (
                            <Select {...field} label="State Association">
                              {INDIAN_STATES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                            </Select>
                          )} />
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField {...register('bio')} label="Bio / About" fullWidth multiline rows={3}
                          placeholder="Brief description of your coaching background..." />
                      </Grid>
                    </Grid>
                    <Divider sx={{ mt:3 }} />
                    <Box sx={{ display:'flex', gap:2, justifyContent:'flex-end', mt:2 }}>
                      <Button variant="outlined" startIcon={<Cancel />} onClick={() => { setTab(0); reset(); }}>Cancel</Button>
                      <Button variant="contained" color="success" startIcon={isSaving?<CircularProgress size={18} color="inherit" />:<Save />}
                        onClick={handleSubmit(onSubmit)} disabled={isSaving} sx={{ minWidth:130 }}>
                        {isSaving?'Saving…':'Save Profile'}
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* TAB 2 — Browse Competitions */}
                {tab===2 && (
                  <Box>
                    {!isApproved && <Alert severity="warning" sx={{ mb:2 }}>Profile must be <strong>Approved</strong> to register for competitions.</Alert>}
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
                                <Box sx={{ height:4, background:'linear-gradient(90deg,#2E7D32,#43A047)' }} />
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
                                    <Chip icon={<CalendarToday sx={{ fontSize:'13px !important' }} />} size="small" variant="outlined" label={new Date(comp.date).toLocaleDateString('en-IN')} />
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
                                    <Button fullWidth variant="contained" color="success" disabled={!isApproved||daysLeft<=0}
                                      onClick={() => navigate('/coach/competitions')}>
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

                {/* TAB 3 — My Registrations */}
                {tab===3 && (
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
                        <Button variant="contained" color="success" onClick={() => setTab(2)}>Browse Competitions</Button>
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
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">{reg.competition?.date?new Date(reg.competition.date).toLocaleDateString('en-IN'):'—'}</Typography>
                                </TableCell>
                                <TableCell><Typography variant="body2">{reg.competition?.venue||'—'}</Typography></TableCell>
                                <TableCell><Typography variant="body2" fontWeight={600}>₹{reg.paymentAmount||0}</Typography></TableCell>
                                <TableCell>
                                  <Chip label={reg.paymentStatus||'Pending'} size="small" color={PAY_COLORS[reg.paymentStatus]||'warning'} sx={{ fontWeight:600 }} />
                                </TableCell>
                                <TableCell>
                                  <Chip label={reg.status||'Active'} size="small"
                                    color={reg.status==='Active'?'success':reg.status==='Cancelled'?'error':'default'} />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="caption" color="text.secondary">{new Date(reg.createdAt).toLocaleDateString('en-IN')}</Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                )}

                {/* TAB 4 — Payments */}
                {tab===4 && (
                  <Box>
                    <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:2 }}>
                      <Typography variant="subtitle1" fontWeight={700}>Payment History</Typography>
                      <Button size="small" startIcon={<Refresh />} onClick={() => { setPayments([]); loadPayments(); }}>Refresh</Button>
                    </Box>

                    {/* Profile fee card */}
                    <Card variant="outlined" sx={{ mb:2, borderColor:feePaid?'success.main':'warning.main', borderWidth:2 }}>
                      <CardContent sx={{ p:2 }}>
                        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700}>Coach Registration Fee</Typography>
                            <Typography variant="caption" color="text.secondary">One-time fee to activate your coach profile</Typography>
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
                                  <Chip label={pay.status} size="small" color={PAY_COLORS[pay.status]||'default'} sx={{ fontWeight:600 }} />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="caption" color="text.secondary">
                                    {pay.razorpayPaymentId?`...${pay.razorpayPaymentId.slice(-8)}`:'—'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="caption" color="text.secondary">{new Date(pay.createdAt).toLocaleDateString('en-IN')}</Typography>
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