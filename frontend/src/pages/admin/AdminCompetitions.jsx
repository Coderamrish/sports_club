import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Grid, FormControl,
  InputLabel, Select, MenuItem, CircularProgress, Alert, Tooltip, Divider,
  Tabs, Tab, Badge
} from '@mui/material';
import {
  Add, Refresh, Visibility, Edit, Delete, CheckCircle, Cancel,
  HourglassEmpty, People, ArrowBack
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_COLOR = { upcoming: 'success', ongoing: 'warning', completed: 'default' };
const EMPTY_FORM = {
  title: '', description: '', date: '', venue: '', categories: '',
  ageGroups: '', registrationFee: 0, deadline: '', requirements: ''
};

export default function AdminCompetitions() {
  const navigate = useNavigate();
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(null); // competition obj
  const [statusDialog, setStatusDialog] = useState(null); // competition obj
  const [regsDialog, setRegsDialog] = useState(null);     // competition obj
  const [registrations, setRegistrations] = useState([]);
  const [regsLoading, setRegsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editTarget, setEditTarget] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminNote, setAdminNote] = useState('');

  const fetchCompetitions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/competitions');
      setCompetitions(data.data || []);
    } catch {
      toast.error('Failed to load competitions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompetitions(); }, []);

  // ── Create ──────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!formData.title || !formData.date || !formData.venue || !formData.deadline) {
      toast.error('Title, Date, Venue and Deadline are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        categories: formData.categories ? formData.categories.split(',').map(s => s.trim()).filter(Boolean) : [],
        ageGroups:  formData.ageGroups  ? formData.ageGroups.split(',').map(s => s.trim()).filter(Boolean)  : [],
        registrationFee: Number(formData.registrationFee) || 0,
      };
      await api.post('/admin/competitions', payload);
      toast.success('Competition created!');
      setCreateDialog(false);
      setFormData(EMPTY_FORM);
      fetchCompetitions();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ────────────────────────────────────────────────────────────────────
  const openEdit = (comp) => {
    setEditTarget(comp);
    setFormData({
      title:           comp.title || '',
      description:     comp.description || '',
      date:            comp.date ? comp.date.split('T')[0] : '',
      venue:           comp.venue || '',
      categories:      (comp.categories || []).join(', '),
      ageGroups:       (comp.ageGroups || []).join(', '),
      registrationFee: comp.registrationFee ?? 0,
      deadline:        comp.deadline ? comp.deadline.split('T')[0] : '',
      requirements:    comp.requirements || '',
    });
    setEditDialog(true);
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const payload = {
        ...formData,
        categories: formData.categories ? formData.categories.split(',').map(s => s.trim()).filter(Boolean) : [],
        ageGroups:  formData.ageGroups  ? formData.ageGroups.split(',').map(s => s.trim()).filter(Boolean)  : [],
        registrationFee: Number(formData.registrationFee) || 0,
      };
      await api.patch(`/admin/competitions/${editTarget._id}`, payload);
      toast.success('Competition updated!');
      setEditDialog(false);
      setEditTarget(null);
      setFormData(EMPTY_FORM);
      fetchCompetitions();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteDialog) return;
    setSaving(true);
    try {
      await api.delete(`/admin/competitions/${deleteDialog._id}`);
      toast.success('Competition deleted');
      setDeleteDialog(null);
      fetchCompetitions();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  // ── Status change ───────────────────────────────────────────────────────────
  const openStatus = (comp) => {
    setStatusDialog(comp);
    setNewStatus(comp.status);
    setAdminNote(comp.adminNote || '');
  };

  const handleStatusChange = async () => {
    if (!statusDialog) return;
    setSaving(true);
    try {
      await api.patch(`/admin/competitions/${statusDialog._id}/status`, {
        status: newStatus,
        adminNote,
      });
      toast.success('Status updated!');
      setStatusDialog(null);
      fetchCompetitions();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  // ── Registrations ───────────────────────────────────────────────────────────
  const openRegistrations = async (comp) => {
    setRegsDialog(comp);
    setRegsLoading(true);
    setRegistrations([]);
    try {
      const { data } = await api.get(`/admin/competitions/${comp._id}/registrations`);
      setRegistrations(data.data || []);
    } catch {
      toast.error('Failed to load registrations');
    } finally {
      setRegsLoading(false);
    }
  };

  const handleRegStatus = async (regId, status) => {
    try {
      await api.patch(`/admin/competitions/registrations/${regId}/status`, { status });
      toast.success(`Registration ${status.toLowerCase()}`);
      openRegistrations(regsDialog);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update');
    }
  };

  // ── Form helper ─────────────────────────────────────────────────────────────
  const ff = (key) => ({
    value: formData[key],
    onChange: (e) => setFormData(p => ({ ...p, [key]: e.target.value })),
  });

  const CompetitionForm = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Title *" margin="dense" {...ff('title')} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Venue *" margin="dense" {...ff('venue')} />
      </Grid>
      <Grid item xs={12}>
        <TextField fullWidth multiline rows={2} label="Description" margin="dense" {...ff('description')} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth type="date" label="Competition Date *" InputLabelProps={{ shrink: true }} margin="dense" {...ff('date')} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth type="date" label="Registration Deadline *" InputLabelProps={{ shrink: true }} margin="dense" {...ff('deadline')} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth type="number" label="Registration Fee (₹)" margin="dense" {...ff('registrationFee')} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Categories (comma separated)" margin="dense" placeholder="e.g. Sprint, Relay" {...ff('categories')} />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField fullWidth label="Age Groups (comma separated)" margin="dense" placeholder="e.g. U-14, U-18, Senior" {...ff('ageGroups')} />
      </Grid>
      <Grid item xs={12}>
        <TextField fullWidth multiline rows={2} label="Requirements / Notes" margin="dense" {...ff('requirements')} />
      </Grid>
    </Grid>
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
            <Typography variant="h4" fontWeight={700}>Competition Management</Typography>
            <Typography variant="body2" color="text.secondary">{competitions.length} competitions total</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchCompetitions}>Refresh</Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => { setFormData(EMPTY_FORM); setCreateDialog(true); }}>
            Create Competition
          </Button>
        </Box>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              {['Title', 'Date', 'Deadline', 'Venue', 'Fee (₹)', 'Age Groups', 'Status', 'Actions'].map(h => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 0.5 }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}><CircularProgress size={28} /></TableCell>
              </TableRow>
            ) : competitions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No competitions yet. Create one to get started.
                </TableCell>
              </TableRow>
            ) : competitions.map((comp) => (
              <TableRow key={comp._id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{comp.title}</Typography>
                  {comp.adminNote && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Note: {comp.adminNote}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{new Date(comp.date).toLocaleDateString('en-IN')}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{new Date(comp.deadline).toLocaleDateString('en-IN')}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{comp.venue}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>₹{comp.registrationFee}</Typography>
                </TableCell>
                <TableCell>
                  {(comp.ageGroups || []).length > 0
                    ? comp.ageGroups.map(ag => <Chip key={ag} label={ag} size="small" sx={{ mr: 0.3, mb: 0.3, fontSize: '0.65rem', height: 18 }} />)
                    : <Typography variant="caption" color="text.disabled">All</Typography>
                  }
                </TableCell>
                <TableCell>
                  <Chip
                    label={comp.status}
                    color={STATUS_COLOR[comp.status] || 'default'}
                    size="small"
                    sx={{ fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => openStatus(comp)}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="View Registrations">
                      <IconButton size="small" color="primary" onClick={() => openRegistrations(comp)}>
                        <People fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" color="info" onClick={() => openEdit(comp)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Change Status">
                      <IconButton size="small" color="warning" onClick={() => openStatus(comp)}>
                        <HourglassEmpty fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => setDeleteDialog(comp)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Create Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight={700}>Create New Competition</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <CompetitionForm />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateDialog(false)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Create Competition'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit Dialog ───────────────────────────────────────────────────────── */}
      <Dialog open={editDialog} onClose={() => { setEditDialog(false); setEditTarget(null); }} maxWidth="md" fullWidth>
        <DialogTitle fontWeight={700}>Edit Competition</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <CompetitionForm />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setEditDialog(false); setEditTarget(null); }} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={saving}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation ───────────────────────────────────────────────── */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Delete Competition?</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 1 }}>
            This will permanently delete <strong>{deleteDialog?.title}</strong>. This cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialog(null)} color="inherit">Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={saving}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Status Dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={!!statusDialog} onClose={() => setStatusDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Update Competition Status</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Competition: <strong>{statusDialog?.title}</strong>
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select value={newStatus} label="Status" onChange={e => setNewStatus(e.target.value)}>
              <MenuItem value="upcoming">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="upcoming" color="success" size="small" /> Upcoming
                </Box>
              </MenuItem>
              <MenuItem value="ongoing">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="ongoing" color="warning" size="small" /> Ongoing
                </Box>
              </MenuItem>
              <MenuItem value="completed">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label="completed" color="default" size="small" /> Completed
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth size="small"
            label="Admin Note (optional)"
            multiline rows={2}
            value={adminNote}
            onChange={e => setAdminNote(e.target.value)}
            placeholder="e.g. Postponed due to weather..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setStatusDialog(null)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleStatusChange} disabled={saving}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Registrations Dialog ──────────────────────────────────────────────── */}
      <Dialog open={!!regsDialog} onClose={() => { setRegsDialog(null); setRegistrations([]); }} maxWidth="md" fullWidth>
        <DialogTitle fontWeight={700}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography fontWeight={700}>Registrations</Typography>
              <Typography variant="caption" color="text.secondary">{regsDialog?.title}</Typography>
            </Box>
            <Chip label={`${registrations.length} registered`} color="primary" size="small" />
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 0 }}>
          {regsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : registrations.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
              <Typography variant="h4" mb={1}>📋</Typography>
              <Typography>No registrations yet for this competition.</Typography>
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Athlete</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Registered</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {registrations.map(reg => (
                  <TableRow key={reg._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {reg.athlete?.fullName || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {reg.athlete?.email || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={reg.status || 'Pending'}
                        color={
                          reg.status === 'Active' ? 'success' :
                          reg.status === 'Rejected' ? 'error' :
                          reg.status === 'Pending' ? 'warning' : 'default'
                        }
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={reg.paymentStatus || 'Pending'}
                        color={reg.paymentStatus === 'Paid' ? 'success' : reg.paymentStatus === 'Failed' ? 'error' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">₹{reg.paymentAmount || 0}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(reg.createdAt).toLocaleDateString('en-IN')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {/* Accept: show for Pending and Rejected (not already Active) */}
                        {reg.status !== 'Active' && (
                          <Tooltip title={reg.status === 'Rejected' ? 'Re-activate' : 'Accept Registration'}>
                            <IconButton size="small" color="success" onClick={() => handleRegStatus(reg._id, 'Active')}>
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {/* Reject: show for Pending and Active (not already Rejected) */}
                        {reg.status !== 'Rejected' && (
                          <Tooltip title="Reject Registration">
                            <IconButton size="small" color="error" onClick={() => handleRegStatus(reg._id, 'Rejected')}>
                              <Cancel fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setRegsDialog(null); setRegistrations([]); }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}