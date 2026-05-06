import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip, Avatar,
  CircularProgress, Alert, Tab, Tabs, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Select,
  MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Tooltip, LinearProgress, Divider, Badge,
} from '@mui/material';
import {
  ArrowBack, Download, PictureAsPdf, TableChart, Refresh,
  EmojiEvents, Payments, DirectionsRun, SportsKabaddi,
  CheckCircle, Cancel, HourglassEmpty, TrendingUp, Star,
  MilitaryTech, WorkspacePremium, CardGiftcard, Visibility,
  Edit, BarChart as BarChartIcon, AssignmentInd,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line,
  AreaChart, Area,
} from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';

// ── Color palette ──────────────────────────────────────────────────────────────
const COLORS = ['#1565C0','#2E7D32','#F57F17','#C62828','#6A1B9A','#00838F','#4E342E','#37474F'];
const MEDAL_COLORS = { Gold: '#FFD700', Silver: '#C0C0C0', Bronze: '#CD7F32', None: '#90A4AE' };
const STATUS_COLOR = {
  Approved: 'success', Incomplete: 'warning',
  'Pending Review': 'info', Rejected: 'error',
  upcoming: 'success', ongoing: 'warning', completed: 'default',
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function StatCard({ icon, label, value, sub, color, loading }) {
  return (
    <Card sx={{ height: '100%', borderLeft: `4px solid ${color}` }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
              {label}
            </Typography>
            {loading
              ? <CircularProgress size={22} sx={{ mt: 1 }} />
              : <Typography variant="h4" fontWeight={800} mt={0.5} color={color}>{value ?? '—'}</Typography>}
            {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
          </Box>
          <Avatar sx={{ bgcolor: color + '15', color, width: 48, height: 48 }}>{icon}</Avatar>
        </Box>
      </CardContent>
    </Card>
  );
}

function MedalChip({ medal }) {
  const colors = { Gold: '#FFD700', Silver: '#9E9E9E', Bronze: '#CD7F32', None: '#78909C' };
  const icons  = { Gold: '🥇', Silver: '🥈', Bronze: '🥉', None: '🎖️' };
  return (
    <Chip
      label={`${icons[medal] || ''} ${medal}`}
      size="small"
      sx={{
        bgcolor: colors[medal] + '20',
        color: colors[medal] === '#FFD700' ? '#b8860b' : colors[medal],
        fontWeight: 700,
        border: `1px solid ${colors[medal]}40`,
      }}
    />
  );
}

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState(0);
  const [exporting, setExporting] = useState('');
  const [resultDialog, setResultDialog] = useState(null); // registration obj
  const [resultForm, setResultForm]     = useState({ medalWon: 'None', certificateUrl: '', attendanceStatus: 'Present' });
  const [savingResult, setSavingResult] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/analytics/overview');
      setData(res.data.data);
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── CSV Export ──────────────────────────────────────────────────────────────
  const handleExportCSV = async (type) => {
    setExporting(type);
    try {
      const res = await api.get(`/admin/analytics/export?type=${type}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `${type}_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${type} CSV!`);
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting('');
    }
  };

  // ── PDF Export (print-to-pdf friendly summary) ──────────────────────────────
  const handleExportPDF = () => {
    window.print();
  };

  // ── Update registration result ───────────────────────────────────────────────
  const handleSaveResult = async () => {
    if (!resultDialog) return;
    setSavingResult(true);
    try {
      await api.patch(`/admin/analytics/registrations/${resultDialog._id}/result`, resultForm);
      toast.success('Result updated!');
      setResultDialog(null);
      fetchData();
    } catch {
      toast.error('Failed to update result');
    } finally {
      setSavingResult(false);
    }
  };

  const openResultDialog = (reg) => {
    setResultForm({
      medalWon:         reg.medalWon         || 'None',
      certificateUrl:   reg.certificateUrl   || '',
      attendanceStatus: reg.attendanceStatus || 'Present',
    });
    setResultDialog(reg);
  };

  // ── Derived chart data ───────────────────────────────────────────────────────
  const monthlyData = (data?.payments?.monthlyRevenue || []).map(m => ({
    name: MONTH_NAMES[(m._id.month || 1) - 1] + ' ' + (m._id.year || ''),
    revenue: m.total,
    count: m.count,
  }));

  const athleteStatusData = (data?.athletes?.statusBreakdown || []).map(s => ({
    name: s._id || 'Unknown', value: s.count,
  }));

  const sportData = (data?.sportBreakdown || []).slice(0, 8).map(s => ({
    name: s.sport, registrations: s.totalRegistrations, revenue: s.totalRevenue,
  }));

  const compTableData = data?.competitionData || [];
  const recentRegs    = data?.recentRegistrations || [];

  // ── Tab panels ───────────────────────────────────────────────────────────────
  const tabs = ['Overview', 'Competitions', 'Registrations & Results', 'Payments', 'Athletes', 'Coaches', 'Certificates'];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC' }} className="analytics-page">

      {/* ── Print styles ── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .analytics-page { background: white !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <Box sx={{
        background: 'linear-gradient(135deg,#0D47A1,#1565C0,#1976D2)',
        color: 'white', px: 3, py: 2.5,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }} className="no-print">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/admin/dashboard')} sx={{ color: 'white' }}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h6" fontWeight={800} letterSpacing={-0.5}>
              📊 Analytics & Reports
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
              Real-time insights · competitions, payments, athletes, certificates
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined" size="small" startIcon={<Refresh />}
            onClick={fetchData} disabled={loading}
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined" size="small" startIcon={<PictureAsPdf />}
            onClick={handleExportPDF}
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}
          >
            Print / PDF
          </Button>
          <Button
            variant="contained" size="small" startIcon={<TableChart />}
            onClick={() => handleExportCSV('registrations')}
            disabled={!!exporting}
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
          >
            {exporting === 'registrations' ? 'Exporting…' : 'Export CSV'}
          </Button>
        </Box>
      </Box>

      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1500, mx: 'auto' }}>

        {/* ── Summary stat cards ── */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress size={48} />
          </Box>
        ) : (
          <>
            <Grid container spacing={2.5} mb={3}>
              {[
                { label: 'Total Athletes',       value: data?.summary?.totalAthletes,     icon: <DirectionsRun />,    color: '#1565C0', sub: 'Registered' },
                { label: 'Total Coaches',         value: data?.summary?.totalCoaches,       icon: <SportsKabaddi />,    color: '#2E7D32', sub: 'Active profiles' },
                { label: 'Total Competitions',    value: data?.summary?.totalCompetitions,  icon: <EmojiEvents />,      color: '#F57F17', sub: `${data?.summary?.completedComps} completed, ${data?.summary?.upcomingComps} upcoming` },
                { label: 'Total Registrations',   value: data?.summary?.totalRegistrations, icon: <AssignmentInd />,    color: '#6A1B9A', sub: 'Across all competitions' },
                { label: 'Revenue Collected',     value: `₹${(data?.summary?.totalRevenue || 0).toLocaleString('en-IN')}`, icon: <Payments />, color: '#00838F', sub: 'Paid transactions' },
                { label: 'Pending Revenue',       value: `₹${(data?.summary?.pendingRevenue || 0).toLocaleString('en-IN')}`, icon: <HourglassEmpty />, color: '#C62828', sub: 'Awaiting payment' },
                { label: 'Certificates Issued',   value: data?.summary?.totalCertificates, icon: <WorkspacePremium />,  color: '#4E342E', sub: 'Participation + medals' },
                { label: 'Gold Medals',           value: data?.medals?.goldMedals || 0,    icon: <MilitaryTech />,     color: '#B8860B', sub: `${data?.medals?.silverMedals||0} Silver · ${data?.medals?.bronzeMedals||0} Bronze` },
              ].map(c => (
                <Grid item xs={6} sm={4} md={3} key={c.label}>
                  <StatCard {...c} />
                </Grid>
              ))}
            </Grid>

            {/* ── Tabs ── */}
            <Card sx={{ mb: 3 }} className="no-print">
              <Tabs
                value={tab} onChange={(_, v) => setTab(v)}
                variant="scrollable" scrollButtons="auto"
                sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}
              >
                {tabs.map((t, i) => (
                  <Tab key={t} label={t} sx={{ fontWeight: 600, fontSize: '0.82rem' }} />
                ))}
              </Tabs>
            </Card>

            {/* ══════════════════ TAB 0 — OVERVIEW ════════════════════════════ */}
            {tab === 0 && (
              <Grid container spacing={3}>
                {/* Monthly Revenue Chart */}
                <Grid item xs={12} md={8}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" fontWeight={700} mb={2}>Monthly Revenue Trend</Typography>
                      {monthlyData.length === 0 ? (
                        <Alert severity="info">No payment data yet.</Alert>
                      ) : (
                        <ResponsiveContainer width="100%" height={260}>
                          <AreaChart data={monthlyData}>
                            <defs>
                              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor="#1565C0" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#1565C0" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                            <RechartTooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
                            <Area type="monotone" dataKey="revenue" stroke="#1565C0" fill="url(#revenueGrad)" strokeWidth={2.5} />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Athlete Status Pie */}
                <Grid item xs={12} md={4}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight={700} mb={2}>Athlete Status</Typography>
                      {athleteStatusData.length === 0 ? (
                        <Alert severity="info">No athletes yet.</Alert>
                      ) : (
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie data={athleteStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                              {athleteStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Legend formatter={(v) => <span style={{ fontSize: '11px' }}>{v}</span>} />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Sport/Category bar chart */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" fontWeight={700}>Registrations by Sport/Category</Typography>
                        <Button size="small" variant="outlined" startIcon={<Download />}
                          onClick={() => handleExportCSV('competitions')} disabled={!!exporting}>
                          Export Competitions CSV
                        </Button>
                      </Box>
                      {sportData.length === 0 ? (
                        <Alert severity="info">No competition category data yet.</Alert>
                      ) : (
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={sportData} margin={{ top: 0, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <RechartTooltip />
                            <Bar dataKey="registrations" name="Registrations" fill="#1565C0" radius={[4,4,0,0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Recent activity */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" fontWeight={700} mb={2}>Recent Registration Activity</Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: '#F5F5F5' } }}>
                              <TableCell>Athlete</TableCell>
                              <TableCell>Competition</TableCell>
                              <TableCell>Date</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Payment</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {recentRegs.slice(0, 8).map(r => (
                              <TableRow key={r._id} hover>
                                <TableCell>
                                  <Typography variant="body2" fontWeight={600}>{r.athlete?.fullName || '—'}</Typography>
                                  <Typography variant="caption" color="text.secondary">{r.athlete?.email}</Typography>
                                </TableCell>
                                <TableCell>{r.competition?.title || '—'}</TableCell>
                                <TableCell>
                                  <Typography variant="caption">{r.competition?.date ? new Date(r.competition.date).toLocaleDateString('en-IN') : '—'}</Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip label={r.status} size="small" color={r.status === 'Active' ? 'success' : r.status === 'Pending' ? 'warning' : 'error'} />
                                </TableCell>
                                <TableCell>
                                  <Chip label={r.paymentStatus} size="small" color={r.paymentStatus === 'Paid' ? 'success' : 'default'} variant="outlined" />
                                </TableCell>
                              </TableRow>
                            ))}
                            {recentRegs.length === 0 && (
                              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>No registrations yet</TableCell></TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* ══════════════════ TAB 1 — COMPETITIONS ═════════════════════════ */}
            {tab === 1 && (
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight={700}>All Competitions Analytics</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" variant="outlined" startIcon={<Download />}
                        onClick={() => handleExportCSV('competitions')} disabled={!!exporting}>
                        {exporting === 'competitions' ? 'Exporting…' : 'CSV'}
                      </Button>
                    </Box>
                  </Box>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: '#F5F5F5', whiteSpace: 'nowrap' } }}>
                          <TableCell>Competition</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Venue</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Category / Age</TableCell>
                          <TableCell align="center">Registrations</TableCell>
                          <TableCell align="center">Paid</TableCell>
                          <TableCell align="center">Pending</TableCell>
                          <TableCell align="right">Fee (₹)</TableCell>
                          <TableCell align="right">Revenue (₹)</TableCell>
                          <TableCell align="center">Certificates</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {compTableData.map(c => (
                          <TableRow key={c._id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={700}>{c.title}</Typography>
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              <Typography variant="caption">{new Date(c.date).toLocaleDateString('en-IN')}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">{c.venue}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={c.status} size="small" color={STATUS_COLOR[c.status] || 'default'} />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.3 }}>
                                {(c.categories || []).slice(0,2).map(cat => <Chip key={cat} label={cat} size="small" variant="outlined" sx={{ fontSize: '10px', height: 18 }} />)}
                                {(c.ageGroups  || []).slice(0,2).map(ag  => <Chip key={ag}  label={ag}  size="small" variant="outlined" sx={{ fontSize: '10px', height: 18, bgcolor: '#E3F2FD' }} />)}
                              </Box>
                            </TableCell>
                            <TableCell align="center"><Typography fontWeight={700}>{c.totalRegistrations}</Typography></TableCell>
                            <TableCell align="center"><Chip label={c.paidCount} size="small" color="success" /></TableCell>
                            <TableCell align="center"><Chip label={c.pendingCount} size="small" color={c.pendingCount > 0 ? 'warning' : 'default'} /></TableCell>
                            <TableCell align="right">₹{c.registrationFee.toLocaleString('en-IN')}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#2E7D32' }}>
                              ₹{c.revenue.toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell align="center">
                              <Chip label={`${c.certificatesIssued}/${c.totalRegistrations}`}
                                size="small" color={c.certificatesIssued > 0 ? 'success' : 'default'} />
                            </TableCell>
                          </TableRow>
                        ))}
                        {compTableData.length === 0 && (
                          <TableRow><TableCell colSpan={11} align="center" sx={{ py: 4 }}>No competitions found</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            )}

            {/* ══════════════════ TAB 2 — REGISTRATIONS & RESULTS ═════════════ */}
            {tab === 2 && (
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight={700}>Registrations & Results Management</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" variant="outlined" startIcon={<Download />}
                        onClick={() => handleExportCSV('registrations')} disabled={!!exporting}>
                        {exporting === 'registrations' ? 'Exporting…' : 'Export CSV'}
                      </Button>
                    </Box>
                  </Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Click <strong>Edit Result</strong> on any registration to assign medals, attendance status, and certificate URLs for completed competitions.
                  </Alert>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: '#F5F5F5', whiteSpace: 'nowrap' } }}>
                          <TableCell>Athlete</TableCell>
                          <TableCell>Competition</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell align="center">Approval</TableCell>
                          <TableCell align="center">Payment</TableCell>
                          <TableCell align="center">Attendance</TableCell>
                          <TableCell align="center">Medal</TableCell>
                          <TableCell align="center">Certificate</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recentRegs.map(r => (
                          <TableRow key={r._id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>{r.athlete?.fullName || '—'}</Typography>
                              <Typography variant="caption" color="text.secondary">{r.athlete?.email}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{r.competition?.title || '—'}</Typography>
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              <Typography variant="caption">{r.competition?.date ? new Date(r.competition.date).toLocaleDateString('en-IN') : '—'}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip label={r.status === 'Active' ? 'Approved' : r.status} size="small"
                                color={r.status === 'Active' ? 'success' : r.status === 'Pending' ? 'warning' : 'error'} />
                            </TableCell>
                            <TableCell align="center">
                              <Chip label={r.paymentStatus} size="small"
                                color={r.paymentStatus === 'Paid' ? 'success' : 'default'} variant="outlined" />
                            </TableCell>
                            <TableCell align="center">
                              <Chip label={r.attendanceStatus || 'Registered'} size="small"
                                color={r.attendanceStatus === 'Present' ? 'success' : r.attendanceStatus === 'Absent' ? 'error' : 'default'} />
                            </TableCell>
                            <TableCell align="center">
                              <MedalChip medal={r.medalWon || 'None'} />
                            </TableCell>
                            <TableCell align="center">
                              {r.certificateUrl ? (
                                <Tooltip title="Download Certificate">
                                  <IconButton size="small" color="success" href={r.certificateUrl} target="_blank">
                                    <Download fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              ) : (
                                <Typography variant="caption" color="text.secondary">None</Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Assign medal / certificate">
                                <IconButton size="small" color="primary" onClick={() => openResultDialog(r)}>
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                        {recentRegs.length === 0 && (
                          <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}>No registrations found</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            )}

            {/* ══════════════════ TAB 3 — PAYMENTS ════════════════════════════ */}
            {tab === 3 && (
              <Grid container spacing={3}>
                {/* Payment summary cards */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                    {(data?.payments?.summary || []).map(p => (
                      <Card key={p._id} sx={{ flex: '1 1 180px', minWidth: 160 }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={600}>{p._id}</Typography>
                          <Typography variant="h5" fontWeight={800} color={p._id === 'paid' ? '#2E7D32' : p._id === 'failed' ? '#C62828' : '#F57F17'}>
                            {p.count}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">₹{(p.totalAmount || 0).toLocaleString('en-IN')}</Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </Grid>

                {/* Monthly revenue chart */}
                <Grid item xs={12} md={7}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" fontWeight={700}>Monthly Revenue</Typography>
                        <Button size="small" variant="outlined" startIcon={<Download />}
                          onClick={() => handleExportCSV('payments')} disabled={!!exporting}>
                          {exporting === 'payments' ? 'Exporting…' : 'Export Payments CSV'}
                        </Button>
                      </Box>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                          <RechartTooltip formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
                          <Bar dataKey="revenue" fill="#1565C0" radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Payment by type */}
                <Grid item xs={12} md={5}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight={700} mb={2}>Payment Type Breakdown</Typography>
                      {(data?.payments?.byType || []).map(p => (
                        <Box key={p._id} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">
                              {p._id === 'competition_registration' ? '🏆 Competition Fees' : '👤 Profile Registration Fees'}
                            </Typography>
                            <Typography variant="body2" fontWeight={700}>₹{(p.total || 0).toLocaleString('en-IN')} ({p.count})</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={Math.min(100, (p.count / Math.max(...(data?.payments?.byType || []).map(x => x.count), 1)) * 100)} sx={{ height: 8, borderRadius: 4 }} />
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* ══════════════════ TAB 4 — ATHLETES ════════════════════════════ */}
            {tab === 4 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" fontWeight={700}>Athletes by Status</Typography>
                        <Button size="small" variant="outlined" startIcon={<Download />}
                          onClick={() => handleExportCSV('athletes')} disabled={!!exporting}>
                          {exporting === 'athletes' ? 'Exporting…' : 'Export CSV'}
                        </Button>
                      </Box>
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie data={athleteStatusData} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}>
                            {athleteStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" fontWeight={700} mb={2}>Athletes by Age Group</Typography>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={data?.athletes?.byAgeGroup?.map(a => ({ name: a._id || 'Unknown', count: a.count })) || []}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <RechartTooltip />
                          <Bar dataKey="count" fill="#6A1B9A" radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" fontWeight={700} mb={2}>Top States by Athlete Count</Typography>
                      {(data?.athletes?.byState || []).map((s, i) => (
                        <Box key={s._id} sx={{ mb: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                            <Typography variant="body2">{s._id || 'Unknown'}</Typography>
                            <Typography variant="body2" fontWeight={700}>{s.count}</Typography>
                          </Box>
                          <LinearProgress variant="determinate"
                            value={(s.count / Math.max(...(data?.athletes?.byState || []).map(x => x.count), 1)) * 100}
                            sx={{ height: 6, borderRadius: 3, bgcolor: '#E3F2FD', '& .MuiLinearProgress-bar': { bgcolor: COLORS[i % COLORS.length] } }}
                          />
                        </Box>
                      ))}
                      {(data?.athletes?.byState || []).length === 0 && (
                        <Alert severity="info">No state data available yet.</Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* ══════════════════ TAB 5 — COACHES ════════════════════════════ */}
            {tab === 5 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={5}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" fontWeight={700}>Coaches by Status</Typography>
                        <Button size="small" variant="outlined" startIcon={<Download />}
                          onClick={() => handleExportCSV('coaches')} disabled={!!exporting}>
                          {exporting === 'coaches' ? 'Exporting…' : 'Export CSV'}
                        </Button>
                      </Box>
                      {(data?.coaches?.statusBreakdown || []).map(s => (
                        <Box key={s._id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="body2">{s._id || 'Unknown'}</Typography>
                          <Chip label={s.count} size="small" color={STATUS_COLOR[s._id] || 'default'} />
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={7}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" fontWeight={700} mb={2}>Coaches by Specialization</Typography>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart
                          layout="vertical"
                          data={data?.coaches?.bySpecialization?.map(s => ({ name: s._id || 'Unknown', count: s.count })) || []}
                          margin={{ left: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                          <RechartTooltip />
                          <Bar dataKey="count" fill="#2E7D32" radius={[0,4,4,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* ══════════════════ TAB 6 — CERTIFICATES ═══════════════════════ */}
            {tab === 6 && (
              <Grid container spacing={3}>
                {/* Medal summary */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {[
                      { label: '🥇 Gold Medals',    value: data?.medals?.goldMedals   || 0, color: '#B8860B' },
                      { label: '🥈 Silver Medals',  value: data?.medals?.silverMedals || 0, color: '#757575' },
                      { label: '🥉 Bronze Medals',  value: data?.medals?.bronzeMedals || 0, color: '#CD7F32' },
                      { label: '🎖️ Certificates Issued', value: data?.medals?.totalWithCert || 0, color: '#1565C0' },
                    ].map(m => (
                      <Card key={m.label} sx={{ flex: '1 1 180px', minWidth: 160, borderTop: `4px solid ${m.color}` }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>{m.label}</Typography>
                          <Typography variant="h4" fontWeight={800} color={m.color}>{m.value}</Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </Grid>

                {/* Competition-wise certificate status */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" fontWeight={700}>Certificate & Medal Status by Competition</Typography>
                        <Button size="small" variant="outlined" startIcon={<Download />}
                          onClick={() => handleExportCSV('certificates')} disabled={!!exporting}>
                          {exporting === 'certificates' ? 'Exporting…' : 'Winners CSV'}
                        </Button>
                      </Box>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: '#F5F5F5' } }}>
                              <TableCell>Competition</TableCell>
                              <TableCell>Date</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell align="center">Total Registered</TableCell>
                              <TableCell align="center">🥇 Gold</TableCell>
                              <TableCell align="center">🥈 Silver</TableCell>
                              <TableCell align="center">🥉 Bronze</TableCell>
                              <TableCell align="center">🎖️ Certificates</TableCell>
                              <TableCell align="center">Results</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {compTableData.map(c => (
                              <TableRow key={c._id} hover>
                                <TableCell>
                                  <Typography variant="body2" fontWeight={700}>{c.title}</Typography>
                                </TableCell>
                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                  <Typography variant="caption">{new Date(c.date).toLocaleDateString('en-IN')}</Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip label={c.status} size="small" color={STATUS_COLOR[c.status] || 'default'} />
                                </TableCell>
                                <TableCell align="center">{c.totalRegistrations}</TableCell>
                                <TableCell align="center">{c.gold > 0 ? <Chip label={c.gold} size="small" sx={{ bgcolor: '#FFF9C4', color: '#B8860B', fontWeight: 700 }} /> : '—'}</TableCell>
                                <TableCell align="center">{c.silver > 0 ? <Chip label={c.silver} size="small" sx={{ bgcolor: '#F5F5F5', color: '#757575', fontWeight: 700 }} /> : '—'}</TableCell>
                                <TableCell align="center">{c.bronze > 0 ? <Chip label={c.bronze} size="small" sx={{ bgcolor: '#FFF3E0', color: '#CD7F32', fontWeight: 700 }} /> : '—'}</TableCell>
                                <TableCell align="center">
                                  <Chip
                                    label={`${c.certificatesIssued}/${c.totalRegistrations}`}
                                    size="small"
                                    color={c.certificatesIssued === c.totalRegistrations && c.totalRegistrations > 0 ? 'success' : c.certificatesIssued > 0 ? 'warning' : 'default'}
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <Button size="small" variant="outlined"
                                    onClick={() => { setTab(2); }}
                                    startIcon={<Edit />} sx={{ fontSize: '11px' }}>
                                    Manage
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            {compTableData.length === 0 && (
                              <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}>No competitions yet</TableCell></TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Per-registration with medals list */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" fontWeight={700} mb={2}>Medal Winners & Certificate Holders</Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: '#FFFDE7' } }}>
                              <TableCell>Athlete</TableCell>
                              <TableCell>Competition</TableCell>
                              <TableCell>Date</TableCell>
                              <TableCell align="center">Medal</TableCell>
                              <TableCell align="center">Certificate</TableCell>
                              <TableCell align="center">Published</TableCell>
                              <TableCell align="center">Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {recentRegs.filter(r => r.medalWon && r.medalWon !== 'None').map(r => (
                              <TableRow key={r._id} hover>
                                <TableCell>
                                  <Typography variant="body2" fontWeight={600}>{r.athlete?.fullName || '—'}</Typography>
                                  <Typography variant="caption" color="text.secondary">{r.athlete?.email}</Typography>
                                </TableCell>
                                <TableCell>{r.competition?.title || '—'}</TableCell>
                                <TableCell>
                                  <Typography variant="caption">{r.competition?.date ? new Date(r.competition.date).toLocaleDateString('en-IN') : '—'}</Typography>
                                </TableCell>
                                <TableCell align="center"><MedalChip medal={r.medalWon} /></TableCell>
                                <TableCell align="center">
                                  {r.certificateUrl ? (
                                    <Button size="small" variant="contained" color="success" startIcon={<Download />}
                                      href={r.certificateUrl} target="_blank" sx={{ fontSize: '11px' }}>
                                      Download
                                    </Button>
                                  ) : (
                                    <Chip label="Not Generated" size="small" color="warning" />
                                  )}
                                </TableCell>
                                <TableCell align="center">
                                  <Typography variant="caption">
                                    {r.publishedAt ? new Date(r.publishedAt).toLocaleDateString('en-IN') : 'Pending'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Tooltip title="Edit result / certificate">
                                    <IconButton size="small" color="primary" onClick={() => openResultDialog(r)}>
                                      <Edit fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))}
                            {recentRegs.filter(r => r.medalWon && r.medalWon !== 'None').length === 0 && (
                              <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                  No medal winners assigned yet. Go to "Registrations & Results" tab to assign medals.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* ── Bulk Export section ── */}
            <Card sx={{ mt: 3 }} className="no-print">
              <CardContent>
                <Typography variant="h6" fontWeight={700} mb={2}>📥 Export Data</Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Download data exports in CSV format for further analysis in Excel/Google Sheets. Use Print / PDF button for a printable analytics report.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  {[
                    { type: 'registrations', label: 'All Registrations',    icon: '📋' },
                    { type: 'payments',      label: 'Payment Records',       icon: '💳' },
                    { type: 'athletes',      label: 'Athlete Profiles',      icon: '🏃' },
                    { type: 'coaches',       label: 'Coach Profiles',        icon: '🏅' },
                    { type: 'competitions',  label: 'Competition Summary',   icon: '🏆' },
                    { type: 'certificates',  label: 'Winners & Certificates',icon: '🥇' },
                  ].map(e => (
                    <Button
                      key={e.type}
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={() => handleExportCSV(e.type)}
                      disabled={!!exporting}
                      sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                      {exporting === e.type ? 'Exporting…' : `${e.icon} ${e.label}`}
                    </Button>
                  ))}
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<PictureAsPdf />}
                    onClick={handleExportPDF}
                    sx={{ borderRadius: 2, textTransform: 'none' }}
                  >
                    🖨️ Print / Save as PDF
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </>
        )}
      </Box>

      {/* ── Result / Medal Assignment Dialog ── */}
      <Dialog open={!!resultDialog} onClose={() => setResultDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MilitaryTech color="warning" /> Assign Result & Certificate
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          {resultDialog && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Athlete: <strong>{resultDialog.athlete?.fullName}</strong> · Competition: <strong>{resultDialog.competition?.title}</strong>
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Attendance Status</InputLabel>
                    <Select
                      value={resultForm.attendanceStatus}
                      label="Attendance Status"
                      onChange={e => setResultForm(f => ({ ...f, attendanceStatus: e.target.value }))}
                    >
                      <MenuItem value="Registered">Registered</MenuItem>
                      <MenuItem value="Present">Present ✓</MenuItem>
                      <MenuItem value="Absent">Absent ✗</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Medal / Result</InputLabel>
                    <Select
                      value={resultForm.medalWon}
                      label="Medal / Result"
                      onChange={e => setResultForm(f => ({ ...f, medalWon: e.target.value }))}
                    >
                      <MenuItem value="None">🎖️ Participant (No Medal)</MenuItem>
                      <MenuItem value="Gold">🥇 Gold</MenuItem>
                      <MenuItem value="Silver">🥈 Silver</MenuItem>
                      <MenuItem value="Bronze">🥉 Bronze</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Certificate URL (AWS S3 / Cloud link)"
                    placeholder="https://your-bucket.s3.amazonaws.com/certificates/cert_123.pdf"
                    value={resultForm.certificateUrl}
                    onChange={e => setResultForm(f => ({ ...f, certificateUrl: e.target.value }))}
                    helperText="Paste the direct URL to the generated PDF certificate stored in cloud storage."
                  />
                </Grid>
              </Grid>
              <Alert severity="warning" sx={{ mt: 2 }}>
                Once saved, the athlete will be able to see their result and download the certificate from their dashboard.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setResultDialog(null)} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveResult}
            disabled={savingResult}
            startIcon={savingResult ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
          >
            {savingResult ? 'Saving…' : 'Save Result'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}