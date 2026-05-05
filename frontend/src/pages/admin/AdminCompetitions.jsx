import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Grid
} from '@mui/material';
import { Add } from '@mui/icons-material';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminCompetitions() {
  const [competitions, setCompetitions] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', date: '', venue: '', registrationFee: 0, deadline: ''
  });

  const fetchCompetitions = async () => {
    try {
      const res = await api.get('/admin/competitions');
      setCompetitions(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch competitions');
    }
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await api.post('/admin/competitions', formData);
      toast.success('Competition created successfully!');
      setOpen(false);
      fetchCompetitions();
    } catch (err) {
      toast.error('Failed to create competition');
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Competitions Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
          Add Competition
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Venue</TableCell>
              <TableCell>Fee</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {competitions.map((comp) => (
              <TableRow key={comp._id}>
                <TableCell>{comp.title}</TableCell>
                <TableCell>{new Date(comp.date).toLocaleDateString()}</TableCell>
                <TableCell>{comp.venue}</TableCell>
                <TableCell>₹{comp.registrationFee}</TableCell>
                <TableCell>
                  <Chip label={comp.status} color={comp.status === 'upcoming' ? 'success' : 'default'} size="small" />
                </TableCell>
              </TableRow>
            ))}
            {competitions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">No competitions found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Competition</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Title" name="title" value={formData.title} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" name="description" multiline rows={3} value={formData.description} onChange={handleChange} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="date" label="Event Date" name="date" InputLabelProps={{ shrink: true }} value={formData.date} onChange={handleChange} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="date" label="Deadline" name="deadline" InputLabelProps={{ shrink: true }} value={formData.deadline} onChange={handleChange} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Venue" name="venue" value={formData.venue} onChange={handleChange} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="Registration Fee" name="registrationFee" value={formData.registrationFee} onChange={handleChange} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
