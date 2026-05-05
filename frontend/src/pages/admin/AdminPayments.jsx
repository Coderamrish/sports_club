import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, CircularProgress,
  Alert, Grid, TextField, MenuItem, Select, FormControl, InputLabel,
  InputAdornment, IconButton, Divider, Tooltip
} from '@mui/material';
import {
  ArrowBack, Refresh, Search, TrendingUp, AccountBalanceWallet,
  HourglassEmpty, ErrorOutline, CheckCircle
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { adminGetPayments, adminGetPaymentSummary } from '../../services/payment.service';
import toast from 'react-hot-toast';

const STATUS_COLOR = {
  paid:     'success',
  created:  'warning',
  failed:   'error',
  refunded: 'default',
};

const STATUS_LABEL = {
  paid:    'Paid',
  created: 'Pending',
  failed:  'Failed',
  refunded:'Refunded',
};

export default function AdminPayments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ status: '', entityType: '', search: '' });

  const LIMIT = 20;

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (filters.status)     params.status     = filters.status;
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.search)     params.search     = filters.search;

      const [paymentsData, summaryData] = await Promise.all([
        adminGetPayments(params),
        adminGetPaymentSummary(),
      ]);

      setPayments(paymentsData.payments || []);
      setTotal(paymentsData.pagination?.total || 0);
      setSummary(summaryData);
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [page, filters.status, filters.entityType]);

  const handleSearch = (e) => {
    if (e.key === 'Enter') fetchAll();
  };

  const ff = (key) => (e) => {
    setFilters(p => ({ ...p, [key]: e.target.value }));
    setPage(1);
  };

  const StatCard = ({ icon, label, value, sub, color }) => (
    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2.5 }}>
        <Box sx={{ bgcolor: `${color}.50`, p: 1.5, borderRadius: 2, color: `${color}.main` }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={800} color={`${color}.main`}>{value}</Typography>
          <Typography variant="body2" fontWeight={600}>{label}</Typography>
          {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3, maxWidth: 1300, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => navigate('/admin/dashboard')} size="small">
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight={700}>Payment Management</Typography>
            <Typography variant="body2" color="text.secondary">{total} total transactions</Typography>
          </Box>
        </Box>
        <IconButton onClick={fetchAll} color="primary"><Refresh /></IconButton>
      </Box>

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <StatCard
              icon={<TrendingUp />}
              label="Total Revenue"
              value={`₹${(summary.totalRevenue || 0).toLocaleString('en-IN')}`}
              sub={`${summary.totalPaidCount} successful transactions`}
              color="success"
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatCard
              icon={<HourglassEmpty />}
              label="Pending"
              value={summary.pendingCount || 0}
              sub="Awaiting payment"
              color="warning"
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatCard
              icon={<ErrorOutline />}
              label="Failed"
              value={summary.failedCount || 0}
              sub="Failed transactions"
              color="error"
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatCard
              icon={<AccountBalanceWallet />}
              label="Recent Paid"
              value={summary.recentPayments?.length || 0}
              sub="In last transactions"
              color="primary"
            />
          </Grid>
        </Grid>
      )}

      {/* Recent payments quick list */}
      {summary?.recentPayments?.length > 0 && (
        <Card sx={{ mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={1}>🕐 Recent Successful Payments</Typography>
            <Divider sx={{ mb: 1 }} />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {summary.recentPayments.map((p) => (
                <Chip
                  key={p._id}
                  icon={<CheckCircle sx={{ fontSize: '14px !important' }} />}
                  label={`${p.user?.fullName || '—'} · ₹${p.amount}`}
                  color="success"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search by name or email…"
          value={filters.search}
          onChange={ff('search')}
          onKeyDown={handleSearch}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
          }}
          sx={{ minWidth: 240 }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filters.status} label="Status" onChange={ff('status')}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="created">Pending</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
            <MenuItem value="refunded">Refunded</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Type</InputLabel>
          <Select value={filters.entityType} label="Type" onChange={ff('entityType')}>
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="competition_registration">Competition Fee</MenuItem>
            <MenuItem value="profile_registration">Profile Fee</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Payments Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              {['User', 'Role', 'For', 'Amount', 'Status', 'Transaction ID', 'Date'].map(h => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: 'text.secondary' }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}><CircularProgress size={28} /></TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No payments found.
                </TableCell>
              </TableRow>
            ) : payments.map((p) => (
              <TableRow key={p._id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{p.user?.fullName || '—'}</Typography>
                  <Typography variant="caption" color="text.secondary">{p.user?.email || ''}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={p.user?.role || '—'}
                    size="small"
                    color={p.user?.role === 'athlete' ? 'primary' : 'secondary'}
                    variant="outlined"
                    sx={{ fontSize: '0.65rem', height: 20 }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{p.entityName || '—'}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {p.entityType === 'competition_registration' ? 'Competition' : 'Profile'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={700} color={p.status === 'paid' ? 'success.main' : 'text.primary'}>
                    ₹{p.amount?.toLocaleString('en-IN') || 0}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={STATUS_LABEL[p.status] || p.status}
                    color={STATUS_COLOR[p.status] || 'default'}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title={p.razorpayPaymentId || p.razorpayOrderId || '—'}>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', cursor: 'help' }}>
                      {p.razorpayPaymentId
                        ? p.razorpayPaymentId.slice(-12)
                        : p.razorpayOrderId?.slice(-12) || '—'}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {p.paidAt
                      ? new Date(p.paidAt).toLocaleDateString('en-IN')
                      : new Date(p.createdAt).toLocaleDateString('en-IN')}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {total > LIMIT && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
          <Chip label="← Prev" disabled={page === 1} onClick={() => setPage(p => p - 1)} clickable />
          <Chip label={`Page ${page} of ${Math.ceil(total / LIMIT)}`} variant="outlined" />
          <Chip label="Next →" disabled={page >= Math.ceil(total / LIMIT)} onClick={() => setPage(p => p + 1)} clickable />
        </Box>
      )}
    </Box>
  );
}