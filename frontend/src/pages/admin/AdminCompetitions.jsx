import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Grid, FormControl, InputLabel, Select, MenuItem,
  CircularProgress
} from '@mui/material';
import { Add, Refresh, Visibility, Edit } from '@mui/icons-material';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminCompetitions() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    title: '', description: '', date: '', venue: '', categories: '',
    ageGroups: '', registrationFee: 0, deadline: '', requirements: ''
  });

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

  const handleCreate = async () => {
    setCreating(true);
    try {
      const payload = {
        ...formData,
        categories: formData.categories.split(',').map(s => s.trim()),
        ageGroups: formData.ageGroups.split(',').map(s => s.trim()),
      };
      await api.post('/admin/competitions', payload);
      toast.success('Competition created');
      setCreateDialog(false);
      setFormData({ title: '', description: '', date: '', venue: '', categories: '', ageGroups: '', registrationFee: 0, deadline: '', requirements: '' });
      fetchCompetitions();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Competition Management</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchCompetitions}>Refresh</Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialog(true)}>Create Competition</Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Venue</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Fee (₹)</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
            ) : competitions.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>No competitions found</TableCell></TableRow>
            ) : (
              competitions.map((comp) => (
                <TableRow key={comp._id} hover>
                  <TableCell>{comp.title}</TableCell>
                  <TableCell>{new Date(comp.date).toLocaleDateString()}</TableCell>
                  <TableCell>{comp.venue}</TableCell>
                  <TableCell>{comp.registrationFee}</TableCell>
                  <TableCell>
                    <Chip label={comp.status} color={comp.status === 'upcoming' ? 'success' : 'default'} size="small" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Competition</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} margin="dense" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Venue" value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} margin="dense" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} margin="dense" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Date" InputLabelProps={{ shrink: true }} value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} margin="dense" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Deadline" InputLabelProps={{ shrink: true }} value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} margin="dense" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Registration Fee (₹)" value={formData.registrationFee} onChange={e => setFormData({ ...formData, registrationFee: e.target.value })} margin="dense" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Categories (comma separated)" value={formData.categories} onChange={e => setFormData({ ...formData, categories: e.target.value })} margin="dense" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Age Groups (comma separated)" value={formData.ageGroups} onChange={e => setFormData({ ...formData, ageGroups: e.target.value })} margin="dense" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={creating}>{creating ? 'Creating...' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}