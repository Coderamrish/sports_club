import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Avatar, Chip,
  Button, IconButton, Alert, CircularProgress, Divider,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Paper, Table, TableBody, TableCell, TableRow, Dialog,
  DialogTitle, DialogContent, DialogActions, Tooltip,
} from '@mui/material';
import {
  ArrowBack, CheckCircle, Cancel, OpenInNew, Person,
  Home, EmojiEvents, Description,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DOC_LABELS = {
  profilePhoto:     'Profile Photo',
  idProof:          'ID Proof (Aadhaar/PAN)',
  certificationDoc: 'Certification Document',
};

const STATUS_COLORS = {
  Approved:       'success',
  Rejected:       'error',
  Pending:        'warning',
  'Pending Review': 'warning',
  Incomplete:     'default',
};

function InfoRow({ label, value }) {
  return (
    <TableRow>
      <TableCell sx={{ color: 'text.secondary', width: 180, py: 1, border: 0, fontWeight: 500 }}>
        {label}
      </TableCell>
      <TableCell sx={{ py: 1, border: 0, fontWeight: 600 }}>
        {value || <Typography component="span" color="text.disabled" fontWeight={400}>Not provided</Typography>}
      </TableCell>
    </TableRow>
  );
}

function DocCard({ label, doc }) {
  if (!doc?.url) {
    return (
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
        <Typography variant="body2" fontWeight={600} mb={0.5}>{label}</Typography>
        <Typography variant="caption" color="text.disabled">Not uploaded</Typography>
      </Paper>
    );
  }

  const statusColor = STATUS_COLORS[doc.status] || 'default';

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2, borderRadius: 2,
        borderColor: doc.status === 'Approved' ? 'success.main'
                   : doc.status === 'Rejected'  ? 'error.main'
                   : 'divider',
        bgcolor: doc.status === 'Approved' ? 'success.50'
               : doc.status === 'Rejected'  ? 'error.50'
               : 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="body2" fontWeight={600}>{label}</Typography>
        {doc.status && <Chip label={doc.status} size="small" color={statusColor} />}
      </Box>
      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <Button
          size="small" variant="outlined" startIcon={<OpenInNew />}
          href={doc.url} target="_blank" rel="noopener noreferrer"
          sx={{ fontSize: '0.7rem' }}
        >
          View Document
        </Button>
      </Box>
    </Paper>
  );
}

export default function CoachDetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [statusDialog, setStatusDialog] = useState(false);
  const [newStatus, setNewStatus]       = useState('');
  const [updating, setUpdating]         = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/coaches/${id}`);
      setProfile(data.data.profile);
    } catch {
      toast.error('Failed to load coach');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleStatusUpdate = async () => {
    setUpdating(true);
    try {
      await api.patch(`/admin/coaches/${id}/status`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      setStatusDialog(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Coach not found.</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/admin/coaches')}>Back to List</Button>
      </Box>
    );
  }

  const user = profile.user;
  const docs = profile.documents || {};
  const statusCfg = STATUS_COLORS[profile.profileStatus] || 'default';

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton onClick={() => navigate('/admin/coaches')} size="small">
            <ArrowBack />
          </IconButton>
          <Avatar sx={{ width: 48, height: 48, bgcolor: 'secondary.main', fontSize: '1.2rem' }}>
            {user?.fullName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>{user?.fullName}</Typography>
            <Typography color="text.secondary" variant="body2">{user?.email} · {user?.mobile}</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            label={profile.profileStatus}
            color={statusCfg}
            sx={{ fontWeight: 700, fontSize: '0.85rem' }}
          />
          <Button variant="contained" onClick={() => { setNewStatus(profile.profileStatus); setStatusDialog(true); }}>
            Update Status
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left: Profile info */}
        <Grid item xs={12} md={7}>
          {/* Personal */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person fontSize="small" /> Personal Details
              </Typography>
              <Table size="small">
                <TableBody>
                  <InfoRow label="Date of Birth" value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-IN') : null} />
                  <InfoRow label="Gender"        value={profile.gender} />
                  <InfoRow label="Experience"    value={profile.experienceYears ? `${profile.experienceYears} years` : null} />
                  <InfoRow label="Specialization" value={profile.specialization?.join(', ')} />
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Address */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Home fontSize="small" /> Address
              </Typography>
              <Table size="small">
                <TableBody>
                  <InfoRow label="Street"   value={profile.address?.street} />
                  <InfoRow label="City"     value={profile.address?.city} />
                  <InfoRow label="State"    value={profile.address?.state} />
                  <InfoRow label="PIN Code" value={profile.address?.pinCode} />
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Club & Representation */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmojiEvents fontSize="small" /> Club & Association
              </Typography>
              <Table size="small">
                <TableBody>
                  <InfoRow label="Club/Academy"    value={profile.clubName} />
                  <InfoRow label="State Assoc."    value={profile.stateAssociation} />
                  <InfoRow label="Assigned Athletes" value={profile.assignedAthletes?.length || 0} />
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {profile.bio && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} mb={2}>Bio / About</Typography>
                <Typography variant="body2" color="text.secondary">{profile.bio}</Typography>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Right: Documents */}
        <Grid item xs={12} md={5}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Description fontSize="small" /> Documents
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {Object.entries(DOC_LABELS).map(([key, label]) => (
                  <DocCard key={key} label={label} doc={docs[key]} />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Status update dialog */}
      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Update Coach Status</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>New Status</InputLabel>
            <Select value={newStatus} label="New Status" onChange={e => setNewStatus(e.target.value)}>
              {['Incomplete', 'Pending Review', 'Approved', 'Rejected'].map(s => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setStatusDialog(false)}>Cancel</Button>
          <Button variant="contained" disabled={updating || !newStatus}
            onClick={handleStatusUpdate}>
            {updating ? <CircularProgress size={20} color="inherit" /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
