import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Alert, CircularProgress,
  Paper, Link,
} from '@mui/material';
import { Email, Refresh } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { clearError } from '../../store/slices/authSlice';
import authService from '../../services/auth.service';
import toast from 'react-hot-toast';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function OTPVerificationStep({ email, onVerify, isLoading, error }) {
  const dispatch = useDispatch();
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = React.useRef([]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (index, value) => {
    // Allow only digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance to next input
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newOtp.every((d) => d !== '') && newOtp.join('').length === OTP_LENGTH) {
      onVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted.length === OTP_LENGTH) {
      const newOtp = pasted.split('');
      setOtp(newOtp);
      inputRefs.current[OTP_LENGTH - 1]?.focus();
      onVerify(pasted);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    try {
      await authService.resendOTP({ email, purpose: 'email_verification' });
      toast.success('New OTP sent to your email!');
      setOtp(Array(OTP_LENGTH).fill(''));
      setCountdown(RESEND_COOLDOWN);
      dispatch(clearError());
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = () => {
    const otpValue = otp.join('');
    if (otpValue.length === OTP_LENGTH) onVerify(otpValue);
  };

  return (
    <Box>
      {/* Email display */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: 'primary.50',
          borderColor: 'primary.200',
        }}
      >
        <Email color="primary" />
        <Box>
          <Typography variant="body2" color="text.secondary">OTP sent to</Typography>
          <Typography variant="body1" fontWeight={600}>{email}</Typography>
        </Box>
      </Paper>

      <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
        Enter the 6-digit code sent to your email. It expires in 10 minutes.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      {/* OTP Input Boxes */}
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          justifyContent: 'center',
          mb: 3,
        }}
        onPaste={handlePaste}
      >
        {otp.map((digit, index) => (
          <Box
            key={index}
            component="input"
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            sx={{
              width: 52,
              height: 60,
              textAlign: 'center',
              fontSize: '1.5rem',
              fontWeight: 700,
              border: '2px solid',
              borderColor: digit ? 'primary.main' : 'divider',
              borderRadius: 2,
              outline: 'none',
              bgcolor: digit ? 'primary.50' : 'background.default',
              color: 'primary.main',
              cursor: 'text',
              transition: 'all 0.15s',
              '&:focus': {
                borderColor: 'primary.main',
                boxShadow: '0 0 0 3px rgba(21,101,192,0.15)',
                bgcolor: 'white',
              },
            }}
          />
        ))}
      </Box>

      <Button
        fullWidth
        variant="contained"
        size="large"
        disabled={isLoading || otp.join('').length !== OTP_LENGTH}
        onClick={handleSubmit}
        sx={{ py: 1.5, mb: 2 }}
      >
        {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Verify Email'}
      </Button>

      {/* Resend */}
      <Box textAlign="center">
        {countdown > 0 ? (
          <Typography variant="body2" color="text.secondary">
            Resend OTP in{' '}
            <Typography component="span" fontWeight={700} color="primary">
              {countdown}s
            </Typography>
          </Typography>
        ) : (
          <Button
            variant="text"
            size="small"
            startIcon={isResending ? <CircularProgress size={14} /> : <Refresh />}
            onClick={handleResend}
            disabled={isResending}
          >
            Resend OTP
          </Button>
        )}
      </Box>
    </Box>
  );
}
