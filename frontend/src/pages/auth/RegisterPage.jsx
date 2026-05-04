import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  InputAdornment, IconButton, Alert, CircularProgress,
  Divider, Avatar, Stepper, Step, StepLabel,
  ToggleButtonGroup, ToggleButton, Chip,
} from '@mui/material';
import {
  Visibility, VisibilityOff, Email, Lock, Person, Phone,
  DirectionsRun, SportsKabaddi, CheckCircle, Cancel, HourglassEmpty,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink, useSearchParams } from 'react-router-dom';
import { Link } from '@mui/material';
import {
  registerUser, verifyEmail as verifyEmailAction,
  selectAuthLoading, selectAuthError, selectPendingEmail,
  selectRegistrationStep, clearError,
} from '../../store/slices/authSlice';
import OTPVerificationStep from '../../components/auth/OTPVerificationStep';
import { useFieldValidation } from '../../hooks/useDebounce';
import authService from '../../services/auth.service';

// ── Yup schema ───────────────────────────────────────────────────────────────
const schema = yup.object({
  fullName: yup.string().min(2).max(100).required('Full name is required'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  mobile: yup
    .string()
    .matches(/^[6-9]\d{9}$/, 'Valid 10-digit Indian mobile number required')
    .required('Mobile number is required'),
  password: yup
    .string()
    .min(8, 'At least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must include uppercase, lowercase, and a number')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

const STEPS = ['Create Account', 'Verify Email', 'Done'];

// ── Field availability indicator ─────────────────────────────────────────────
function AvailabilityIndicator({ isChecking, result }) {
  if (isChecking) return <HourglassEmpty fontSize="small" sx={{ color: 'text.secondary', animation: 'spin 1s linear infinite', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} />;
  if (!result) return null;
  return result.available
    ? <CheckCircle fontSize="small" color="success" />
    : <Cancel fontSize="small" color="error" />;
}

// ── Password strength meter ───────────────────────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    { label: '8+ chars',    pass: password.length >= 8 },
    { label: 'Uppercase',   pass: /[A-Z]/.test(password) },
    { label: 'Lowercase',   pass: /[a-z]/.test(password) },
    { label: 'Number',      pass: /\d/.test(password) },
    { label: 'Special',     pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const colors = ['error','error','warning','warning','success'];
  const labels = ['Very Weak','Weak','Fair','Good','Strong'];
  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', gap: 0.5, mb: 0.75 }}>
        {checks.map((_, i) => (
          <Box key={i} sx={{ height: 4, flex: 1, borderRadius: 1, bgcolor: i < score ? `${colors[score - 1]}.main` : 'divider', transition: 'background 0.3s' }} />
        ))}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color={`${colors[score - 1] || 'text'}.${score > 0 ? 'main' : 'secondary'}`} fontWeight={600}>
          {score > 0 ? labels[score - 1] : ''}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {checks.map(c => (
            <Chip key={c.label} label={c.label} size="small"
              color={c.pass ? 'success' : 'default'}
              sx={{ fontSize: '0.65rem', height: 18, opacity: c.pass ? 1 : 0.5 }} />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default function RegisterPage() {
  const dispatch          = useDispatch();
  const navigate          = useNavigate();
  const [searchParams]    = useSearchParams();
  const isLoading         = useSelector(selectAuthLoading);
  const error             = useSelector(selectAuthError);
  const pendingEmail      = useSelector(selectPendingEmail);
  const registrationStep  = useSelector(selectRegistrationStep);

  const [showPwd, setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [role, setRole]           = useState(searchParams.get('role') === 'coach' ? 'coach' : 'athlete');
  const [passwordVal, setPasswordVal] = useState('');

  // Live field values for debounced availability check
  const [emailVal, setEmailVal]   = useState('');
  const [mobileVal, setMobileVal] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  useEffect(() => { dispatch(clearError()); }, [dispatch]);

  // Redirect on complete
  useEffect(() => {
    if (registrationStep === 'complete') {
      setTimeout(() => navigate(`/${role}/profile-setup`, { replace: true }), 1800);
    }
  }, [registrationStep, role, navigate]);

  // ── Debounced email availability check (600ms) ─────────────────────
  const { isChecking: emailChecking, result: emailResult } = useFieldValidation(
    emailVal,
    async (val) => {
      if (!/^\S+@\S+\.\S+$/.test(val)) return null;
      try {
        await authService.checkEmailAvailability(val);
        return { available: true };
      } catch (e) {
        const msg = e.response?.data?.message || '';
        return { available: false, message: msg };
      }
    },
    600
  );

  // ── Debounced mobile availability check (600ms) ────────────────────
  const { isChecking: mobileChecking, result: mobileResult } = useFieldValidation(
    mobileVal,
    async (val) => {
      if (!/^[6-9]\d{9}$/.test(val)) return null;
      try {
        await authService.checkMobileAvailability(val);
        return { available: true };
      } catch (e) {
        return { available: false, message: e.response?.data?.message };
      }
    },
    600
  );

  const onSubmit = (data) => {
    const { confirmPassword, ...rest } = data;
    dispatch(registerUser({ ...rest, role }));
  };

  const activeStep = { form: 0, otp: 1, complete: 2 }[registrationStep] || 0;

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, #0A1628 0%, #0D2045 50%, #0A1628 100%)',
      p: 2, py: 4,
    }}>
      <Card sx={{ width: '100%', maxWidth: 500, borderRadius: 3 }}>
        {/* Header */}
        <Box sx={{ background: 'linear-gradient(135deg, #1565C0, #0D47A1)', py: 3, px: 4, textAlign: 'center' }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', width: 50, height: 50, mx: 'auto', mb: 1.5 }}>
            {role === 'athlete' ? <DirectionsRun /> : <SportsKabaddi />}
          </Avatar>
          <Typography variant="h5" color="white" fontWeight={700}>Create Account</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', mt: 0.5 }}>
            Join Sports Club Management System
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {STEPS.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
          </Stepper>

          {/* ── STEP 1: Form ─────────────────────────────────────────── */}
          {registrationStep === 'form' && (
            <>
              {/* Role picker */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" mb={1} fontWeight={500}>
                  I am registering as:
                </Typography>
                <ToggleButtonGroup
                  value={role} exclusive onChange={(_, v) => v && setRole(v)}
                  fullWidth size="small"
                >
                  <ToggleButton value="athlete" sx={{ py: 1.2, fontWeight: 600, gap: 0.5 }}>
                    <DirectionsRun fontSize="small" /> Athlete
                  </ToggleButton>
                  <ToggleButton value="coach" sx={{ py: 1.2, fontWeight: 600, gap: 0.5 }}>
                    <SportsKabaddi fontSize="small" /> Coach / Trainer
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>{error}</Alert>
              )}

              <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                {/* Full Name */}
                <TextField
                  {...register('fullName')}
                  label="Full Name (as per official documents)"
                  fullWidth margin="normal"
                  error={!!errors.fullName}
                  helperText={errors.fullName?.message}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Person color="action" fontSize="small" /></InputAdornment> }}
                />

                {/* Email — debounced availability */}
                <TextField
                  {...register('email')}
                  label="Email Address"
                  type="email"
                  fullWidth margin="normal"
                  error={!!errors.email || (emailResult && !emailResult.available)}
                  helperText={
                    errors.email?.message ||
                    (emailResult && !emailResult.available ? emailResult.message || 'Email already registered' : '') ||
                    (emailResult?.available ? '✓ Email available' : 'We\'ll send an OTP here for verification')
                  }
                  FormHelperTextProps={{
                    sx: { color: emailResult?.available ? 'success.main' : undefined }
                  }}
                  onChange={e => setEmailVal(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Email color="action" fontSize="small" /></InputAdornment>,
                    endAdornment: emailVal.length > 4 && (
                      <InputAdornment position="end">
                        <AvailabilityIndicator isChecking={emailChecking} result={emailResult} />
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Mobile — debounced availability */}
                <TextField
                  {...register('mobile')}
                  label="Mobile Number"
                  type="tel"
                  fullWidth margin="normal"
                  inputProps={{ maxLength: 10 }}
                  error={!!errors.mobile || (mobileResult && !mobileResult.available)}
                  helperText={
                    errors.mobile?.message ||
                    (mobileResult && !mobileResult.available ? mobileResult.message || 'Mobile already registered' : '') ||
                    (mobileResult?.available ? '✓ Mobile available' : undefined)
                  }
                  FormHelperTextProps={{
                    sx: { color: mobileResult?.available ? 'success.main' : undefined }
                  }}
                  onChange={e => setMobileVal(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone color="action" fontSize="small" />
                        <Typography variant="body2" color="text.secondary" ml={0.5} mr={0.5}>+91</Typography>
                      </InputAdornment>
                    ),
                    endAdornment: mobileVal.length >= 10 && (
                      <InputAdornment position="end">
                        <AvailabilityIndicator isChecking={mobileChecking} result={mobileResult} />
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Password + strength */}
                <TextField
                  {...register('password')}
                  label="Password"
                  type={showPwd ? 'text' : 'password'}
                  fullWidth margin="normal"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  onChange={e => setPasswordVal(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Lock color="action" fontSize="small" /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPwd(s => !s)} edge="end" size="small" tabIndex={-1}>
                          {showPwd ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <PasswordStrength password={passwordVal} />

                <TextField
                  {...register('confirmPassword')}
                  label="Confirm Password"
                  type={showConfirm ? 'text' : 'password'}
                  fullWidth margin="normal"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Lock color="action" fontSize="small" /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirm(s => !s)} edge="end" size="small" tabIndex={-1}>
                          {showConfirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  fullWidth variant="contained" size="large"
                  disabled={isLoading}
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                >
                  {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Create Account & Send OTP'}
                </Button>
              </Box>

              <Divider sx={{ my: 2 }}><Typography variant="caption" color="text.secondary">OR</Typography></Divider>
              <Typography variant="body2" textAlign="center" color="text.secondary">
                Already have an account?{' '}
                <Link component={RouterLink} to="/auth/login" fontWeight={600} color="primary">Sign In</Link>
              </Typography>
            </>
          )}

          {/* ── STEP 2: OTP ──────────────────────────────────────────── */}
          {registrationStep === 'otp' && (
            <OTPVerificationStep
              email={pendingEmail}
              onVerify={(otp) => dispatch(verifyEmailAction({ email: pendingEmail, otp }))}
              isLoading={isLoading}
              error={error}
            />
          )}

          {/* ── STEP 3: Success ───────────────────────────────────────── */}
          {registrationStep === 'complete' && (
            <Box textAlign="center" py={4}>
              <Typography variant="h3" mb={1}>🎉</Typography>
              <Typography variant="h6" fontWeight={700} color="success.main">Email Verified!</Typography>
              <Typography color="text.secondary" mt={1}>Redirecting to your profile setup...</Typography>
              <CircularProgress sx={{ mt: 3 }} size={28} />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
