import React, { useEffect, useState } from 'react';
import { Box, Typography, Container, Paper, Grid, Button, Chip, CircularProgress } from '@mui/material';
import PublicNavbar from '../../components/common/PublicNavbar';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const NoticeBoardPage = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const response = await api.get('/public/competitions');
        if (response.data && response.data.success) {
          setCompetitions(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch competitions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCompetitions();
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <PublicNavbar />
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" gutterBottom align="center" sx={{ color: 'primary.main', mb: 2 }}>
          Notice Board & Competitions
        </Typography>
        <Typography variant="h6" color="text.secondary" align="center" sx={{ mb: 6 }}>
          Stay updated with the latest events and register now!
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : competitions.length === 0 ? (
          <Typography variant="h6" align="center" color="text.secondary">
            No active competitions at the moment.
          </Typography>
        ) : (
          <Grid container spacing={4}>
            {competitions.map((comp) => (
              <Grid item xs={12} md={6} key={comp._id}>
                <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {comp.title}
                    </Typography>
                    <Chip 
                      label={comp.status.toUpperCase()} 
                      color={comp.status === 'upcoming' ? 'success' : 'default'} 
                      size="small" 
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                    {comp.description}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    <Chip label={`Date: ${new Date(comp.date).toLocaleDateString()}`} variant="outlined" />
                    <Chip label={`Fee: ₹${comp.registrationFee}`} variant="outlined" />
                    <Chip label={`Venue: ${comp.venue}`} variant="outlined" />
                  </Box>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth
                    onClick={() => navigate('/auth/login')}
                  >
                    Login to Register
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default NoticeBoardPage;
