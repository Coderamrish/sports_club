import React from 'react';
import { Box, Typography, Container, Paper } from '@mui/material';
import PublicNavbar from '../../components/common/PublicNavbar';

const AboutPage = () => {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <PublicNavbar />
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper sx={{ p: 6, borderRadius: 4, boxShadow: 3 }}>
          <Typography variant="h3" gutterBottom align="center" sx={{ color: 'primary.main', mb: 4 }}>
            About Sports Club
          </Typography>
          <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
            Welcome to the Sports Club Management Platform. Our goal is to design and develop a comprehensive sports club management website that enables seamless interaction between athletes, coaches, and administrators.
          </Typography>
          <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
            The platform will streamline registration, profile management, competition participation, and fee tracking—similar in functionality to any club or association in for state or national games.
          </Typography>
          <Typography variant="h5" sx={{ mt: 4, mb: 2, color: 'primary.main' }}>
            Our Objectives
          </Typography>
          <ul>
            <li><Typography variant="body1">Provide a centralized platform for athletes and coaches.</Typography></li>
            <li><Typography variant="body1">Simplify competition registration and fee payments.</Typography></li>
            <li><Typography variant="body1">Enable administrators to efficiently manage operations.</Typography></li>
            <li><Typography variant="body1">Improve transparency with real-time tracking.</Typography></li>
          </ul>
        </Paper>
      </Container>
    </Box>
  );
};

export default AboutPage;
