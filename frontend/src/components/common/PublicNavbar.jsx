import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, logoutUser } from '../../store/slices/authSlice';

const PublicNavbar = () => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/auth/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/auth/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'coach') return '/coach/dashboard';
    return '/athlete/dashboard';
  };

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          Sports Club
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button color="inherit" component={RouterLink} to="/">Home</Button>
          <Button color="inherit" component={RouterLink} to="/about">About</Button>
          <Button color="inherit" component={RouterLink} to="/contact">Contact</Button>
          <Button color="inherit" component={RouterLink} to="/notices">Notice Board</Button>
          
          {user ? (
            <>
              <Button variant="contained" color="secondary" component={RouterLink} to={getDashboardLink()} sx={{ ml: 2 }}>
                Dashboard
              </Button>
              <Button variant="outlined" color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="outlined" color="inherit" component={RouterLink} to="/auth/login" sx={{ ml: 2 }}>
                Login
              </Button>
              <Button variant="contained" color="secondary" component={RouterLink} to="/auth/register">
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default PublicNavbar;
