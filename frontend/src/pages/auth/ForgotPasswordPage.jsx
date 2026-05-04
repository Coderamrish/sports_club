import React, { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress, Link } from '@mui/material';
import { Email } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import authService from '../../services/auth.service';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'otp' | 'done'
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async () => {
    setIsLoading(true); setError('');
    try {
      await authService.forgotPassword({ email });
      setStep('otp');
      toast.success('OTP sent to your email!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally { setIsLoading(false); }
  };

  const handleReset = async () => {
    setIsLoading(true); setError('');
    try {
      await authService.resetPassword({ email, otp, newPassword });
      setStep('done');
      toast.success('Password reset successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    } finally { setIsLoading(false); }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0D47A1, #1E88E5)', p: 2 }}>
      <Card sx={{ maxWidth: 420, width: '100%', borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} mb={1}>Reset Password</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {step === 'email' && (
            <>
              <TextField label="Email Address" value={email} onChange={e => setEmail(e.target.value)} fullWidth margin="normal" />
              <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={handleSendOTP} disabled={isLoading}>
                {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Send Reset OTP'}
              </Button>
            </>
          )}
          {step === 'otp' && (
            <>
              <TextField label="6-Digit OTP" value={otp} onChange={e => setOtp(e.target.value)} fullWidth margin="normal" inputProps={{ maxLength: 6 }} />
              <TextField label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} fullWidth margin="normal" />
              <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={handleReset} disabled={isLoading}>
                {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Reset Password'}
              </Button>
            </>
          )}
          {step === 'done' && (
            <Box textAlign="center" py={2}>
              <Typography variant="h4">✅</Typography>
              <Typography fontWeight={700} mt={1}>Password Reset!</Typography>
              <Link component={RouterLink} to="/auth/login" sx={{ mt: 2, display: 'block' }}>Back to Login</Link>
            </Box>
          )}
          {step !== 'done' && (
            <Box textAlign="center" mt={2}>
              <Link component={RouterLink} to="/auth/login" variant="body2">Back to Login</Link>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
