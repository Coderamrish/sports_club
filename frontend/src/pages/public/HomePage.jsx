import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Container, Grid, Paper, Chip, CircularProgress } from '@mui/material';
import PublicNavbar from '../../components/common/PublicNavbar';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const HomePage = () => {
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
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNavbar />
      <Box 
        sx={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          color: 'white',
          py: 10
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Elevate Your Game
          </Typography>
          <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
            The ultimate platform for athletes, coaches, and administrators to seamlessly manage registrations, competitions, and progress.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
            <Button variant="contained" color="secondary" size="large" component={RouterLink} to="/auth/register">
              Join Now
            </Button>
            <Button variant="outlined" color="inherit" size="large" component="a" href="#notices">
              View Competitions
            </Button>
          </Box>
        </Container>
      </Box>

      <Container sx={{ py: 8 }} maxWidth="lg">
        <Typography variant="h3" align="center" gutterBottom sx={{ mb: 6 }}>
          Features
        </Typography>
        <Grid container spacing={4}>
          {['Athlete Profiles', 'Competition Tracking', 'Secure Payments', 'Coach Management'].map((feature, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Paper sx={{ p: 4, textAlign: 'center', height: '100%', borderRadius: 3, boxShadow: 3 }}>
                <Typography variant="h6" gutterBottom>{feature}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Streamlined and modern workflow for all your sports management needs.
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Notice Board Section */}
      <Container sx={{ py: 8, backgroundColor: '#f9fafb' }} maxWidth="lg" id="notices">
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

export default HomePage;
