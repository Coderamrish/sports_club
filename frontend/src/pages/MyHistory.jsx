import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Avatar, Chip, Grid,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  Paper, Tab, Tabs, CircularProgress, IconButton, Tooltip,
} from '@mui/material';
import {
  EmojiEvents, Payments, History, Download, CalendarToday,
  LocationOn, ArrowBack, Refresh,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import api from '../services/api';
import toast from 'react-hot-toast';

const MEDAL_COLORS = { Gold: '#F57F17', Silver: '#607D8B', Bronze: '#BF360C', Participant: '#1565C0', None: '#9E9E9E' };
const MEDAL_EMOJI = { Gold: '🥇', Silver: '🥈', Bronze: '🥉', Participant: '🏅', None: '' };
const PAY_COLORS = { paid: 'success', Paid: 'success', created: 'warning', Pending: 'warning', failed: 'error', Failed: 'error', refunded: 'info' };

export default function MyHistoryPage() {
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [registrations, setRegistrations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [summary, setSummary] = useState({});

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/certificates/my-history');
      const d = data.data || {};
      setRegistrations(d.registrations || []);
      setPayments(d.payments || []);
      setCertificates(d.certificates || []);
      setSummary(d.summary || {});
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleDownload = async (regId, compName) => {
    try {
      const res = await api.get(`/certificates/download/${regId}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificate_${(compName || 'Competition').replace(/\s+/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download certificate');
    }
  };

  const medals = summary.medalCounts || {};
  const backPath = user?.role === 'coach' ? '/coach/dashboard' : '/athlete/dashboard';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box sx={{ background: 'linear-gradient(135deg, #1a3c5e, #1565C0)', color: 'white', px: 3, py: 2.5 }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate(backPath)} sx={{ color: 'white' }}><ArrowBack /></IconButton>
            <Box>
              <Typography variant="h5" fontWeight={700}>My History</Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                Competitions · Certificates · Payments
              </Typography>
            </Box>
          </Box>
          <Button variant="outlined" size="small" startIcon={<Refresh />}
            onClick={loadHistory} sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}>
            Refresh
          </Button>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : (
          <>
            {/* Summary Cards */}
            <Grid container spacing={2} mb={3}>
              {[
                { icon: <EmojiEvents />, label: 'Competitions', value: summary.totalCompetitions || 0, color: '#F57F17' },
                { icon: <EmojiEvents />, label: 'Certificates', value: summary.totalCertificates || 0, color: '#2E7D32' },
                { icon: <Payments />, label: 'Total Paid', value: `₹${(summary.totalPaid || 0).toLocaleString('en-IN')}`, color: '#1565C0' },
                { icon: <History />, label: 'Medals', value: `${medals.Gold || 0}G · ${medals.Silver || 0}S · ${medals.Bronze || 0}B`, color: '#c8a951' },
              ].map(c => (
                <Grid item xs={6} md={3} key={c.label}>
                  <Card sx={{ transition: 'transform .15s', '&:hover': { transform: 'translateY(-2px)' } }}>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Avatar sx={{ bgcolor: c.color + '18', color: c.color, mx: 'auto', mb: 1 }}>{c.icon}</Avatar>
                      <Typography variant="caption" color="text.secondary" display="block">{c.label}</Typography>
                      <Typography variant="h6" fontWeight={700}>{c.value}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Tabs */}
            <Card>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                <Tab icon={<EmojiEvents />} iconPosition="start" label="Competitions" />
                <Tab icon={<Download />} iconPosition="start" label={`Certificates (${certificates.length})`} />
                <Tab icon={<Payments />} iconPosition="start" label={`Payments (${payments.length})`} />
              </Tabs>
              <CardContent>
                {/* TAB 0 — Competitions */}
                {tab === 0 && (
                  registrations.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Typography variant="h4" mb={1}>🏟️</Typography>
                      <Typography color="text.secondary">No competition history yet.</Typography>
                    </Box>
                  ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.50' }}>
                            {['Competition', 'Date', 'Venue', 'Fee', 'Payment', 'Status', 'Medal', 'Certificate'].map(h => (
                              <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.73rem', textTransform: 'uppercase', color: 'text.secondary' }}>{h}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {registrations.map(reg => (
                            <TableRow key={reg._id} hover>
                              <TableCell>
                                <Typography variant="body2" fontWeight={600}>{reg.competition?.title || '—'}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {reg.competition?.date ? new Date(reg.competition.date).toLocaleDateString('en-IN') : '—'}
                                </Typography>
                              </TableCell>
                              <TableCell><Typography variant="body2">{reg.competition?.venue || '—'}</Typography></TableCell>
                              <TableCell><Typography variant="body2" fontWeight={600}>₹{reg.paymentAmount || 0}</Typography></TableCell>
                              <TableCell>
                                <Chip label={reg.paymentStatus || 'Pending'} size="small"
                                  color={PAY_COLORS[reg.paymentStatus] || 'warning'} sx={{ fontWeight: 600 }} />
                              </TableCell>
                              <TableCell>
                                <Chip label={reg.status || 'Pending'} size="small"
                                  color={reg.status === 'Active' ? 'success' : reg.status === 'Rejected' ? 'error' : 'default'} />
                              </TableCell>
                              <TableCell>
                                {reg.medalWon && reg.medalWon !== 'None' ? (
                                  <Chip label={`${MEDAL_EMOJI[reg.medalWon] || ''} ${reg.medalWon}`} size="small"
                                    sx={{ fontWeight: 700, bgcolor: MEDAL_COLORS[reg.medalWon] + '22', color: MEDAL_COLORS[reg.medalWon] }} />
                                ) : (
                                  <Typography variant="caption" color="text.disabled">—</Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                {reg.certificateUrl ? (
                                  <Tooltip title="Download Certificate">
                                    <IconButton size="small" color="primary"
                                      onClick={() => handleDownload(reg._id, reg.competition?.title)}>
                                      <Download fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                ) : (
                                  <Typography variant="caption" color="text.disabled">—</Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )
                )}

                {/* TAB 1 — Certificates */}
                {tab === 1 && (
                  certificates.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Typography variant="h4" mb={1}>📜</Typography>
                      <Typography color="text.secondary">No certificates issued yet.</Typography>
                    </Box>
                  ) : (
                    <Grid container spacing={2}>
                      {certificates.map(cert => (
                        <Grid item xs={12} sm={6} md={4} key={cert._id}>
                          <Card variant="outlined" sx={{ borderColor: MEDAL_COLORS[cert.medal] || '#ccc', borderWidth: 2, borderRadius: 3 }}>
                            <Box sx={{ height: 5, background: `linear-gradient(90deg, ${MEDAL_COLORS[cert.medal] || '#1565C0'}, #c8a951)` }} />
                            <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
                              <Typography variant="h3" mb={1}>{MEDAL_EMOJI[cert.medal] || '🏅'}</Typography>
                              <Typography variant="h6" fontWeight={700} mb={0.5}>{cert.competitionTitle}</Typography>
                              <Typography variant="body2" color="text.secondary" mb={1}>
                                <CalendarToday sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'text-bottom' }} />
                                {cert.competitionDate ? new Date(cert.competitionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                              </Typography>
                              {cert.venue && (
                                <Typography variant="body2" color="text.secondary" mb={1}>
                                  <LocationOn sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'text-bottom' }} />
                                  {cert.venue}
                                </Typography>
                              )}
                              <Chip label={cert.medal === 'Participant' ? 'Participation' : `${cert.medal} Medal`}
                                sx={{ fontWeight: 700, mb: 2, bgcolor: MEDAL_COLORS[cert.medal] + '22', color: MEDAL_COLORS[cert.medal] }} />
                              <br />
                              <Button variant="contained" size="small" startIcon={<Download />}
                                onClick={() => handleDownload(cert._id, cert.competitionTitle)}
                                sx={{ borderRadius: 2 }}>
                                Download PDF
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )
                )}

                {/* TAB 2 — Payments */}
                {tab === 2 && (
                  payments.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Typography variant="h4" mb={1}>💰</Typography>
                      <Typography color="text.secondary">No payment records yet.</Typography>
                    </Box>
                  ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'grey.50' }}>
                            {['Description', 'Type', 'Amount', 'Status', 'Transaction ID', 'Date'].map(h => (
                              <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.73rem', textTransform: 'uppercase', color: 'text.secondary' }}>{h}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {payments.map(pay => (
                            <TableRow key={pay._id} hover>
                              <TableCell>
                                <Typography variant="body2" fontWeight={600}>{pay.description || '—'}</Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={pay.entityType === 'profile_registration' ? 'Profile Fee' : 'Competition Fee'}
                                  size="small" variant="outlined" />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight={700}>₹{(pay.amount || 0).toLocaleString('en-IN')}</Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={pay.status} size="small" color={PAY_COLORS[pay.status] || 'default'} sx={{ fontWeight: 600 }} />
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" color="text.secondary">
                                  {pay.razorpayPaymentId ? `...${pay.razorpayPaymentId.slice(-8)}` : '—'}
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
                  )
                )}
              </CardContent>
            </Card>
          </>
        )}
      </Box>
    </Box>
  );
}