import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip, IconButton, CircularProgress,
  Select, MenuItem, FormControl, InputLabel, InputAdornment,
  Avatar, Tooltip, Pagination,
} from '@mui/material';
import {
  Search, Refresh, Visibility, CheckCircle,
  Cancel, ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useDebounce } from '../../hooks/useDebounce';

const STATUS_CONFIG = {
  'Incomplete':     { color: 'default', label: 'Incomplete' },
  'Pending Review': { color: 'warning', label: 'Pending Review' },
  'Approved':       { color: 'success', label: 'Approved' },
  'Rejected':       { color: 'error',   label: 'Rejected' },
};

const SPECIALIZATION_OPTIONS = [
  'Sprints', 'Long Distance', 'Jumps', 'Throws', 'Multi-Events',
  'Race Walk', 'Hurdles', 'Cross Country', 'Road Running',
];

export default function CoachManagement() {
  const navigate = useNavigate();

  const [coaches,    setCoaches]    = useState([]);
  const [isLoading,  setIsLoading]  = useState(false);
  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState('');
  const [spec,       setSpec]       = useState('');
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);

  const debouncedSearch = useDebounce(search, 400);

  const fetchCoaches = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (status)          params.set('status', status);
      if (spec)            params.set('specialization', spec);

      const { data } = await api.get(`/admin/coaches?${params}`);
      setCoaches(data.data.coaches);
      setTotal(data.data.pagination.total);
      setTotalPages(data.data.pagination.totalPages);
    } catch {
      toast.error('Failed to load coaches');
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, status, spec]);

  useEffect(() => { fetchCoaches(); }, [fetchCoaches]);
  useEffect(() => { setPage(1); }, [debouncedSearch, status, spec]);

  const handleQuickStatus = async (userId, newStatus) => {
    try {
      await api.patch(`/admin/coaches/${userId}/status`, { status: newStatus });
      toast.success(`Coach ${newStatus.toLowerCase()}`);
      fetchCoaches();
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
            <Typography variant="h4" fontWeight={700}>Coach Management</Typography>
            <Typography color="text.secondary" variant="body2">
              {total} total registered coaches
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={fetchCoaches} disabled={isLoading}>
          <Refresh />
        </IconButton>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', py: '12px !important' }}>
          <TextField
            placeholder="Search name, email, mobile..."
            size="small"
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ flex: '1 1 240px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select value={status} label="Status" onChange={e => setStatus(e.target.value)}>
              <MenuItem value="">All Statuses</MenuItem>
              {Object.keys(STATUS_CONFIG).map(s => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Specialization</InputLabel>
            <Select value={spec} label="Specialization" onChange={e => setSpec(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {SPECIALIZATION_OPTIONS.map(s => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {(search || status || spec) && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => { setSearch(''); setStatus(''); setSpec(''); }}
            >
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
              {['Coach', 'Specialization', 'Certification', 'Athletes', 'Experience', 'Status', 'Joined', 'Actions'].map(h => (
                <TableCell
                  key={h}
                  sx={{
                    fontWeight: 700,
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : coaches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No coaches found
                </TableCell>
              </TableRow>
            ) : coaches.map(profile => {
              const user = profile.user;
              const cfg  = STATUS_CONFIG[profile.profileStatus] || STATUS_CONFIG['Incomplete'];

              return (
                <TableRow
                  key={profile._id}
                  sx={{ '&:hover': { bgcolor: 'action.hover' }, cursor: 'pointer' }}
                  onClick={() => navigate(`/admin/coaches/${user?._id}`)}
                >
                  {/* Coach */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        sx={{
                          width: 32, height: 32,
                          bgcolor: 'secondary.50',
                          color: 'secondary.main',
                          fontSize: '0.85rem',
                        }}
                      >
                        {user?.fullName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{user?.fullName}</Typography>
                        <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Specialization */}
                  <TableCell>
                    {profile.specialization?.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {profile.specialization.slice(0, 2).map(s => (
                          <Chip key={s} label={s} size="small" sx={{ fontSize: '0.7rem', height: 18 }} />
                        ))}
                        {profile.specialization.length > 2 && (
                          <Chip
                            label={`+${profile.specialization.length - 2}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 18 }}
                          />
                        )}
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.disabled">Not set</Typography>
                    )}
                  </TableCell>

                  {/* Certification */}
                  <TableCell>
                    {profile.certifications?.length > 0 ? (
                      <Chip
                        label={`${profile.certifications.length} cert.`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 18 }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.disabled">—</Typography>
                    )}
                  </TableCell>

                  {/* Athletes coached */}
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {profile.assignedAthletes?.length ?? '—'}
                    </Typography>
                  </TableCell>

                  {/* Experience */}
                  <TableCell>
                    {profile.experienceYears != null ? (
                      <Typography variant="body2">
                        {profile.experienceYears} yr{profile.experienceYears !== 1 ? 's' : ''}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.disabled">—</Typography>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Chip label={cfg.label} size="small" color={cfg.color} sx={{ fontWeight: 600 }} />
                  </TableCell>

                  {/* Joined */}
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('en-IN')
                        : '—'}
                    </Typography>
                  </TableCell>

                  {/* Actions */}
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/admin/coaches/${user?._id}`)}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {profile.profileStatus === 'Pending Review' && (
                        <>
                          <Tooltip title="Activate">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleQuickStatus(user._id, 'Approved')}
                            >
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleQuickStatus(user._id, 'Rejected')}
                            >
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
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
}