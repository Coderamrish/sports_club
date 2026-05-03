import React from 'react';
import { Box, Typography, Card, CardContent, Avatar, Button, Grid, Alert } from '@mui/material';
import { SportsKabaddi, People, EmojiEvents, Logout } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser, selectCurrentUser } from '../../store/slices/authSlice';

export default function CoachDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user     = useSelector(selectCurrentUser);
  const logout   = async () => { await dispatch(logoutUser()); navigate('/auth/login'); };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ background: 'linear-gradient(135deg,#2E7D32,#43A047)', color: 'white', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 44, height: 44 }}><SportsKabaddi /></Avatar>
          <Box>
            <Typography fontWeight={700}>{user?.fullName}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Coach / Trainer · {user?.email}</Typography>
          </Box>
        </Box>
        <Button variant="outlined" size="small" startIcon={<Logout />} onClick={logout}
          sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}>Logout</Button>
      </Box>
      <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          Complete your coach profile to start managing athletes. Full dashboard coming Day 2.
        </Alert>
        <Grid container spacing={2}>
          {[
            { icon: <People />, label: 'Assigned Athletes', value: '0', color: '#1565C0' },
            { icon: <EmojiEvents />, label: 'Competitions',  value: '0', color: '#F57F17' },
          ].map(c => (
            <Grid item xs={12} sm={4} key={c.label}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ bgcolor: c.color + '18', color: c.color, mx: 'auto', mb: 1 }}>{c.icon}</Avatar>
                  <Typography variant="body2" color="text.secondary">{c.label}</Typography>
                  <Typography variant="h5" fontWeight={700}>{c.value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
