import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, CircularProgress,
  Select, MenuItem, FormControl, InputLabel, Switch,
  FormControlLabel, InputAdornment, Tooltip, Avatar,
  Divider,
} from '@mui/material';
import {
  Add, PersonOff, Edit, Shield, AdminPanelSettings,
  SupervisorAccount, Person, Search, Refresh, Visibility,
  VisibilityOff, CheckCircle, Cancel, HourglassEmpty,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useDebounce, useFieldValidation } from '../../hooks/useDebounce';
import authService from '../../services/auth.service';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

const schema = yup.object({
  fullName: yup.string().min(2).required('Full name required'),
  email:    yup.string().email().required('Email required'),
  mobile:   yup.string().matches(/^[6-9]\d{9}$/, 'Valid 10-digit number').required(),
  password: yup.string().min(8).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Weak password').required(),
  adminLevel: yup.string().oneOf(['admin', 'moderator']).required('Admin level required'),
});

const LEVEL_CONFIG = {
  super_admin: { label: 'Super Admin', color: 'error',   icon: <Shield />,              description: 'Full system access' },
  admin:       { label: 'Admin',       color: 'primary', icon: <AdminPanelSettings />,  description: 'Manage all operations' },
  moderator:   { label: 'Moderator',   color: 'success', icon: <SupervisorAccount />,   description: 'View & approve documents' },
};

const PERMISSIONS_BY_LEVEL = {
  admin:     ['manage_athletes','manage_coaches','manage_competitions','manage_payments','view_analytics','export_data','view_all_profiles','approve_documents','manage_certificates'],
  moderator: ['view_all_profiles','approve_documents','view_analytics'],
};

function AvailabilityIndicator({ isChecking, result }) {
  if (isChecking) return <CircularProgress size={16} />;
  if (!result)    return null;
  return result.available ? <CheckCircle fontSize="small" color="success" /> : <Cancel fontSize="small" color="error" />;
}

export default function AdminManagement() {
  const currentUser  = useSelector(selectCurrentUser);
  const [admins, setAdmins]       = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch]       = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating]   = useState(false);
  const [showPwd, setShowPwd]     = useState(false);
  const [emailVal, setEmailVal]   = useState('');
  const [mobileVal, setMobileVal] = useState('');
  const [filterLevel, setFilterLevel] = useState('');

  const debouncedSearch = useDebounce(search, 350);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { adminLevel: 'admin' },
  });
  const watchedLevel = watch('adminLevel');

  // Debounced availability checks for the create form
  const { isChecking: emailChecking, result: emailResult } = useFieldValidation(
    emailVal, async (val) => {
      try { await authService.checkEmailAvailability(val); return { available: true }; }
      catch (e) { return { available: false, message: e.response?.data?.message }; }
    }, 600
  );
  const { isChecking: mobileChecking, result: mobileResult } = useFieldValidation(
    mobileVal, async (val) => {
      try { await authService.checkMobileAvailability(val); return { available: true }; }
      catch (e) { return { available: false, message: e.response?.data?.message }; }
    }, 600
  );

  const fetchAdmins = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterLevel) params.append('adminLevel', filterLevel);
      const { data } = await api.get(`/admin/admins?${params}`);
      setAdmins(data.data.admins);
    } catch (e) {
      toast.error('Failed to load admins');
    } finally { setIsLoading(false); }
  }, [filterLevel]);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  const filteredAdmins = admins.filter(a =>
    !debouncedSearch ||
    a.fullName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    a.email.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const handleCreate = async (data) => {
    setCreating(true);
    try {
      await api.post('/admin/admins', data);
      toast.success(`${data.adminLevel} account created! Welcome email sent.`);
      reset(); setOpenCreate(false); fetchAdmins();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create admin');
    } finally { setCreating(false); }
  };

  const handleToggleActive = async (admin) => {
    try {
      await api.patch(`/admin/admins/${admin._id}`, { isActive: !admin.isActive });
      toast.success(`Admin ${admin.isActive ? 'deactivated' : 'activated'}`);
      fetchAdmins();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed');
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Admin Management</Typography>
          <Typography color="text.secondary" mt={0.5}>
            Manage administrator accounts and permissions
          </Typography>
        </Box>
        <Button
          variant="contained" startIcon={<Add />}
          onClick={() => setOpenCreate(true)}
          sx={{ background: 'linear-gradient(135deg,#4A148C,#7B1FA2)' }}
        >
          Create Admin
        </Button>
      </Box>

      {/* Your badge */}
      <Alert severity="info" icon={<Shield />} sx={{ mb: 3 }}>
        You are logged in as <strong>{currentUser?.adminLevel?.replace('_', ' ')}</strong>.
        Super Admins have unrestricted access to all features.
      </Alert>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', py: '12px !important' }}>
          <TextField
            placeholder="Search by name or email..."
            size="small"
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ flex: '1 1 240px' }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Filter by Level</InputLabel>
            <Select value={filterLevel} label="Filter by Level" onChange={e => setFilterLevel(e.target.value)}>
              <MenuItem value="">All Levels</MenuItem>
              <MenuItem value="super_admin">Super Admin</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="moderator">Moderator</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={fetchAdmins} disabled={isLoading}>
            <Refresh />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            {filteredAdmins.length} admin{filteredAdmins.length !== 1 ? 's' : ''}
          </Typography>
        </CardContent>
      </Card>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              {['Admin', 'Level', 'Permissions', 'Status', 'Last Login', 'Actions'].map(h => (
                <TableCell key={h} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={28} /></TableCell></TableRow>
            ) : filteredAdmins.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>No admins found</TableCell></TableRow>
            ) : filteredAdmins.map(admin => {
              const cfg = LEVEL_CONFIG[admin.adminLevel] || {};
              const isSelf = admin._id === currentUser?._id;
              return (
                <TableRow key={admin._id} sx={{ '&:hover': { bgcolor: 'action.hover' }, opacity: admin.isActive ? 1 : 0.6 }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.50', color: 'primary.main', fontSize: '0.9rem' }}>
                        {admin.fullName[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{admin.fullName} {isSelf && <Chip label="You" size="small" sx={{ ml: 0.5, fontSize: '0.65rem', height: 16 }} />}</Typography>
                        <Typography variant="caption" color="text.secondary">{admin.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={cfg.label} size="small" color={cfg.color} icon={cfg.icon} sx={{ fontWeight: 600 }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {admin.adminLevel === 'super_admin'
                        ? 'All permissions'
                        : `${(PERMISSIONS_BY_LEVEL[admin.adminLevel] || []).length} permissions`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={admin.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={admin.isActive ? 'success' : 'default'}
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleDateString('en-IN') : 'Never'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {!isSelf && admin.adminLevel !== 'super_admin' && (
                      <Tooltip title={admin.isActive ? 'Deactivate' : 'Activate'}>
                        <IconButton
                          size="small"
                          color={admin.isActive ? 'error' : 'success'}
                          onClick={() => handleToggleActive(admin)}
                        >
                          {admin.isActive ? <PersonOff fontSize="small" /> : <Person fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Admin Dialog */}
      <Dialog open={openCreate} onClose={() => { setOpenCreate(false); reset(); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Shield color="primary" /> Create Admin Account
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            A welcome email with login credentials will be sent automatically.
          </Alert>
          <Box component="form" noValidate>
            <TextField {...register('fullName')} label="Full Name" fullWidth margin="dense"
              error={!!errors.fullName} helperText={errors.fullName?.message} />

            {/* Debounced email */}
            <TextField {...register('email')} label="Email Address" fullWidth margin="dense"
              error={!!errors.email || (emailResult && !emailResult.available)}
              helperText={errors.email?.message || (emailResult && !emailResult.available ? emailResult.message : emailResult?.available ? '✓ Available' : '')}
              FormHelperTextProps={{ sx: { color: emailResult?.available ? 'success.main' : undefined } }}
              onChange={e => setEmailVal(e.target.value)}
              InputProps={{ endAdornment: emailVal.length > 4 && <InputAdornment position="end"><AvailabilityIndicator isChecking={emailChecking} result={emailResult} /></InputAdornment> }}
            />

            {/* Debounced mobile */}
            <TextField {...register('mobile')} label="Mobile Number" fullWidth margin="dense"
              inputProps={{ maxLength: 10 }}
              error={!!errors.mobile || (mobileResult && !mobileResult.available)}
              helperText={errors.mobile?.message || (mobileResult && !mobileResult.available ? mobileResult.message : mobileResult?.available ? '✓ Available' : '')}
              FormHelperTextProps={{ sx: { color: mobileResult?.available ? 'success.main' : undefined } }}
              onChange={e => setMobileVal(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Typography variant="caption">+91</Typography></InputAdornment>,
                endAdornment: mobileVal.length >= 10 && <InputAdornment position="end"><AvailabilityIndicator isChecking={mobileChecking} result={mobileResult} /></InputAdornment>,
              }}
            />

            <TextField {...register('password')} label="Temporary Password" fullWidth margin="dense"
              type={showPwd ? 'text' : 'password'}
              error={!!errors.password} helperText={errors.password?.message || 'Admin will be asked to change on first login'}
              InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPwd(s=>!s)} size="small"><>{showPwd ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</></IconButton></InputAdornment> }}
            />

            <FormControl fullWidth margin="dense" error={!!errors.adminLevel}>
              <InputLabel>Admin Level</InputLabel>
              <Select {...register('adminLevel')} label="Admin Level" defaultValue="admin">
                <MenuItem value="admin">Admin — Full Operations</MenuItem>
                <MenuItem value="moderator">Moderator — View & Approve Only</MenuItem>
              </Select>
            </FormControl>

            {/* Permissions preview */}
            {watchedLevel && watchedLevel !== 'super_admin' && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>
                  Permissions granted to <strong>{watchedLevel}</strong>:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(PERMISSIONS_BY_LEVEL[watchedLevel] || []).map(p => (
                    <Chip key={p} label={p.replace(/_/g, ' ')} size="small"
                      sx={{ fontSize: '0.65rem', height: 20 }} color="primary" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setOpenCreate(false); reset(); }} color="inherit">Cancel</Button>
          <Button
            onClick={handleSubmit(handleCreate)}
            variant="contained" disabled={creating}
            sx={{ background: 'linear-gradient(135deg,#4A148C,#7B1FA2)' }}
          >
            {creating ? <CircularProgress size={20} color="inherit" /> : 'Create & Send Email'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
