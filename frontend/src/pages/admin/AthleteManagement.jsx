import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip, IconButton, Alert, CircularProgress,
  Select, MenuItem, FormControl, InputLabel, InputAdornment,
  Avatar, Tooltip, Pagination, Badge,
} from '@mui/material';
import {
  Search, Refresh, Visibility, CheckCircle,
  Cancel, HourglassEmpty, FilterList, ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';

const STATUS_CONFIG = {
  'Incomplete':     { color: 'default',  label: 'Incomplete' },
  'Pending Review': { color: 'warning',  label: 'Pending Review' },
  'Approved':       { color: 'success',  label: 'Approved' },
  'Rejected':       { color: 'error',    label: 'Rejected' },
};

const DOC_FIELDS = ['passportPhoto', 'aadhaarCard', 'birthCertificate', 'schoolBonafide'];

function docCount(profile) {
  const docs = profile?.documents || {};
  return DOC_FIELDS.filter(k => docs[k]?.url).length;
}

function pendingDocCount(profile) {
  const docs = profile?.documents || {};
  return DOC_FIELDS.filter(k => docs[k]?.status === 'Pending').length;
}

export default function AthleteManagement() {
  const navigate = useNavigate();
  const [athletes,  setAthletes]  = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search,    setSearch]    = useState('');
  const [status,    setStatus]    = useState('');
  const [ageGroup,  setAgeGroup]  = useState('');
  const [page,      setPage]      = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,     setTotal]     = useState(0);

  const debouncedSearch = useDebounce(search, 400);

  const fetchAthletes = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (status)          params.set('status', status);
      if (ageGroup)        params.set('ageGroup', ageGroup);

      const { data } = await api.get(`/admin/athletes?${params}`);
      setAthletes(data.data.athletes);
      setTotal(data.data.pagination.total);
      setTotalPages(data.data.pagination.totalPages);
    } catch {
      toast.error('Failed to load athletes');
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, status, ageGroup]);

  useEffect(() => { fetchAthletes(); }, [fetchAthletes]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [debouncedSearch, status, ageGroup]);

  const handleQuickStatus = async (userId, newStatus) => {
    try {
      await api.patch(`/admin/athletes/${userId}/status`, { status: newStatus });
      toast.success(`Athlete ${newStatus.toLowerCase()}`);
      fetchAthletes();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed');
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton onClick={() => navigate('/admin/dashboard')} size="small">
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight={700}>Athlete Management</Typography>
            <Typography color="text.secondary" variant="body2">
              {total} total registered athletes
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={fetchAthletes} disabled={isLoading}>
          <Refresh />
        </IconButton>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', py: '12px !important' }}>
          <TextField
            placeholder="Search name, email, mobile..."
            size="small" value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ flex: '1 1 240px' }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          />
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel>Registration Status</InputLabel>
            <Select value={status} label="Registration Status" onChange={e => setStatus(e.target.value)}>
              <MenuItem value="">All Statuses</MenuItem>
              {Object.keys(STATUS_CONFIG).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Age Group</InputLabel>
            <Select value={ageGroup} label="Age Group" onChange={e => setAgeGroup(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {['U-10','U-12','U-14','U-16','U-18','U-21','Senior','Masters'].map(a =>
                <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </Select>
          </FormControl>
          {(search || status || ageGroup) && (
            <Button size="small" variant="outlined" onClick={() => { setSearch(''); setStatus(''); setAgeGroup(''); }}>
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              {['Athlete', 'Age Group / Level', 'Documents', 'Insurance', 'Status', 'Registered', 'Actions'].map(h => (
                <TableCell key={h} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : athletes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No athletes found
                </TableCell>
              </TableRow>
            ) : athletes.map(profile => {
              const user   = profile.user;
              const cfg    = STATUS_CONFIG[profile.registrationStatus] || STATUS_CONFIG['Incomplete'];
              const docsUp = docCount(profile);
              const docsPending = pendingDocCount(profile);
              const insExpired = profile.insurance?.status === 'Expired';

              return (
                <TableRow
                  key={profile._id}
                  sx={{ '&:hover': { bgcolor: 'action.hover' }, cursor: 'pointer' }}
                  onClick={() => navigate(`/admin/athletes/${user?._id}`)}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.50', color: 'primary.main', fontSize: '0.85rem' }}>
                        {user?.fullName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{user?.fullName}</Typography>
                        <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {profile.ageGroup  && <Chip label={profile.ageGroup}  size="small" sx={{ fontSize: '0.7rem', height: 18 }} />}
                      {profile.skillLevel && <Chip label={profile.skillLevel} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 18 }} />}
                      {!profile.ageGroup && <Typography variant="caption" color="text.disabled">Not set</Typography>}
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Tooltip title={`${docsUp}/4 uploaded, ${docsPending} pending review`}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" fontWeight={600} color={docsPending > 0 ? 'warning.main' : 'text.primary'}>
                          {docsUp}/4
                        </Typography>
                        {docsPending > 0 && (
                          <Chip label={`${docsPending} pending`} size="small" color="warning" sx={{ fontSize: '0.65rem', height: 18 }} />
                        )}
                      </Box>
                    </Tooltip>
                  </TableCell>

                  <TableCell>
                    {profile.insurance?.isRequired ? (
                      <Chip
                        label={profile.insurance.status || 'Missing'}
                        size="small"
                        color={insExpired ? 'error' : profile.insurance.status === 'Verified' ? 'success' : 'default'}
                        sx={{ fontSize: '0.7rem', height: 18 }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.disabled">N/A</Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <Chip label={cfg.label} size="small" color={cfg.color} sx={{ fontWeight: 600 }} />
                  </TableCell>

                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN') : '—'}
                    </Typography>
                  </TableCell>

                  <TableCell onClick={e => e.stopPropagation()}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" color="primary"
                          onClick={() => navigate(`/admin/athletes/${user?._id}`)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {profile.registrationStatus === 'Pending Review' && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton size="small" color="success"
                              onClick={() => handleQuickStatus(user._id, 'Approved')}>
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton size="small" color="error"
                              onClick={() => handleQuickStatus(user._id, 'Rejected')}>
                              <Cancel fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
        </Box>
      )}
    </Box>
  );
}