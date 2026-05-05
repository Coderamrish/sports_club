import React from 'react';
import { Box, Typography, Container, Paper, TextField, Button, Grid } from '@mui/material';
import PublicNavbar from '../../components/common/PublicNavbar';
import toast from 'react-hot-toast';

const ContactPage = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Message sent successfully!');
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <PublicNavbar />
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper sx={{ p: 6, borderRadius: 4, boxShadow: 3 }}>
          <Typography variant="h3" gutterBottom align="center" sx={{ color: 'primary.main', mb: 4 }}>
            Contact Us
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="First Name" required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Last Name" required />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Email Address" type="email" required />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Message" multiline rows={4} required />
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" color="primary" size="large" fullWidth>
                  Send Message
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default ContactPage;
