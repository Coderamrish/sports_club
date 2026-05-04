import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Avatar, Chip,
  Button, IconButton, Alert, CircularProgress, Divider,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Paper, Table, TableBody, TableCell, TableRow, Dialog,
  DialogTitle, DialogContent, DialogActions, Tooltip,
} from '@mui/material';
import {
  ArrowBack, CheckCircle, Cancel, HourglassEmpty,
  OpenInNew, Person, FamilyRestroom, Home, EmojiEvents,
  Description, Shield, Warning,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DOC_LABELS = {
  passportPhoto:    'Passport Photo',
  aadhaarCard:      'Aadhaar Card',
  birthCertificate: 'Birth Certificate',
  schoolBonafide:   'School Bonafide',
  medicalFitness:   'Medical Fitness',
};

const NOC_LABELS = {
  nocClub:              'NOC from Club',
  nocStateAssociation:  'NOC from State Association',
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

function DocCard({ label, doc, docType, athleteId, onReviewed }) {
  const [reviewing, setReviewing] = useState(false);
  const [note, setNote] = useState('');
  const [open, setOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState('');

  const handleReview = async (status) => {
    setReviewing(true);
    try {
      await api.patch(`/admin/athletes/${athleteId}/documents/${docType}`, { status, adminNote: note });
      toast.success(`${label} marked as ${status}`);
      setOpen(false);
      setNote('');
      onReviewed();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Review failed');
    } finally {
      setReviewing(false);
    }
  };

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
    <>
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
          <Chip label={doc.status || 'Pending'} size="small" color={statusColor} />
        </Box>
        {doc.adminNote && (
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            Note: {doc.adminNote}
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Button
            size="small" variant="outlined" startIcon={<OpenInNew />}
            href={doc.url} target="_blank" rel="noopener noreferrer"
            sx={{ fontSize: '0.7rem' }}
          >
            View
          </Button>
          {doc.status !== 'Approved' && (
            <Button size="small" variant="contained" color="success"
              onClick={() => handleReview('Approved')} disabled={reviewing}
              sx={{ fontSize: '0.7rem', minWidth: 80 }}>
              {reviewing ? <CircularProgress size={14} color="inherit" /> : 'Approve'}
            </Button>
          )}
          {doc.status !== 'Rejected' && (
            <Button size="small" variant="outlined" color="error"
              onClick={() => { setPendingStatus('Rejected'); setOpen(true); }}
              sx={{ fontSize: '0.7rem' }}>
              Reject
            </Button>
          )}
        </Box>
      </Paper>

      {/* Reject dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reject Document</DialogTitle>
        <DialogContent>
          <Typography variant="body2" mb={2}>
            Provide a reason so the athlete knows what to fix:
          </Typography>
          <TextField
            label="Rejection Note"
            multiline rows={3} fullWidth
            value={note} onChange={e => setNote(e.target.value)}
            placeholder="e.g. Document is blurry, please re-upload a clear scan"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" disabled={reviewing}
            onClick={() => handleReview('Rejected')}>
            {reviewing ? <CircularProgress size={18} color="inherit" /> : 'Confirm Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function AthleteDetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [statusDialog, setStatusDialog] = useState(false);
  const [newStatus, setNewStatus]       = useState('');
  const [adminNote, setAdminNote]       = useState('');
  const [updating, setUpdating]         = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/athletes/${id}`);
      setProfile(data.data.profile);
    } catch {
      toast.error('Failed to load athlete');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleStatusUpdate = async () => {
    setUpdating(true);
    try {
      await api.patch(`/admin/athletes/${id}/status`, { status: newStatus, adminNotes: adminNote });
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
        <Alert severity="error">Athlete not found.</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/admin/athletes')}>Back to List</Button>
      </Box>
    );
  }

  const user = profile.user;
  const docs = profile.documents || {};
  const statusCfg = STATUS_COLORS[profile.registrationStatus] || 'default';

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton onClick={() => navigate('/admin/athletes')} size="small">
            <ArrowBack />
          </IconButton>
          <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontSize: '1.2rem' }}>
            {user?.fullName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>{user?.fullName}</Typography>
            <Typography color="text.secondary" variant="body2">{user?.email} · {user?.mobile}</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            label={profile.registrationStatus}
            color={statusCfg}
            sx={{ fontWeight: 700, fontSize: '0.85rem' }}
          />
          <Button variant="contained" onClick={() => { setNewStatus(profile.registrationStatus); setStatusDialog(true); }}>
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
                  <InfoRow label="Age"           value={profile.age ? `${profile.age} years` : null} />
                  <InfoRow label="Gender"        value={profile.gender} />
                  <InfoRow label="Blood Group"   value={profile.bloodGroup} />
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Parent */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FamilyRestroom fontSize="small" /> Parent / Guardian
              </Typography>
              <Table size="small">
                <TableBody>
                  <InfoRow label="Father's Name"  value={profile.fatherName} />
                  <InfoRow label="Mother's Name"  value={profile.motherName} />
                  <InfoRow label="Guardian"       value={profile.guardianName} />
                  <InfoRow label="Parent Mobile"  value={profile.parentMobile} />
                  <InfoRow label="Parent Email"   value={profile.parentEmail} />
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
                  <InfoRow label="District" value={profile.address?.district} />
                  <InfoRow label="State"    value={profile.address?.state} />
                  <InfoRow label="PIN Code" value={profile.address?.pinCode} />
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Club + Competition */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmojiEvents fontSize="small" /> Club & Competition
              </Typography>
              <Table size="small">
                <TableBody>
                  <InfoRow label="Club"            value={profile.clubName} />
                  <InfoRow label="State Repr."     value={profile.stateRepresentation} />
                  <InfoRow label="District Repr."  value={profile.districtRepresentation} />
                  <InfoRow label="Age Group"       value={profile.ageGroup} />
                  <InfoRow label="Skill Level"     value={profile.skillLevel} />
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Admin notes */}
          {profile.adminNotes && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" fontWeight={600}>Admin Note:</Typography>
              {profile.adminNotes}
            </Alert>
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
                  <DocCard
                    key={key} label={label} docType={key}
                    doc={docs[key]} athleteId={id} onReviewed={load}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* NOC Docs */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>NOC Documents</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {Object.entries(NOC_LABELS).map(([key, label]) => (
                  <DocCard
                    key={key} label={label} docType={key}
                    doc={profile[key]} athleteId={id} onReviewed={load}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Insurance */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Shield fontSize="small" /> Insurance
              </Typography>
              {profile.insurance?.isRequired ? (
                <Table size="small">
                  <TableBody>
                    <InfoRow label="Status"    value={<Chip label={profile.insurance.status} size="small" color={STATUS_COLORS[profile.insurance.status] || 'default'} />} />
                    <InfoRow label="Provider"  value={profile.insurance.providerName} />
                    <InfoRow label="Policy No" value={profile.insurance.policyNumber} />
                    <InfoRow label="Valid Till" value={profile.insurance.validTill ? new Date(profile.insurance.validTill).toLocaleDateString('en-IN') : null} />
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="text.secondary">Insurance not required for this athlete.</Typography>
              )}
              {profile.insurance?.status === 'Expired' && (
                <Alert severity="error" icon={<Warning />} sx={{ mt: 1.5 }}>
                  Insurance has expired. Athlete must renew before competing.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Status update dialog */}
      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Update Registration Status</DialogTitle>
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
          <TextField
            label="Admin Note (optional)"
            multiline rows={3} fullWidth
            value={adminNote} onChange={e => setAdminNote(e.target.value)}
            placeholder="Reason for rejection, or any note for the athlete..."
          />
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