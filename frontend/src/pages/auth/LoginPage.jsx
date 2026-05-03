import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  InputAdornment, IconButton, Alert, CircularProgress,
  Divider, Avatar, Chip, LinearProgress, Tooltip,
} from '@mui/material';
import {
  Visibility, VisibilityOff, Email, Lock,
  DirectionsRun, SportsKabaddi, AdminPanelSettings,
  Shield, WarningAmber, LockClock,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { Link } from '@mui/material';
import {
  loginUser, selectAuthLoading, selectAuthError, clearError,
} from '../../store/slices/authSlice';
import useRateLimit from '../../hooks/useRateLimit';
import { useDebounce } from '../../hooks/useDebounce';

const schema = yup.object({
  email:    yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

const ROLES = [
  {
    value: 'athlete',
    label: 'Athlete',
    icon: <DirectionsRun />,
    gradient: 'linear-gradient(135deg, #1565C0, #1E88E5)',
    maxAttempts: 5,
    description: 'Student / Participant',
  },
  {
    value: 'coach',
    label: 'Coach',
    icon: <SportsKabaddi />,
    gradient: 'linear-gradient(135deg, #2E7D32, #43A047)',
    maxAttempts: 5,
    description: 'Trainer / Instructor',
  },
  {
    value: 'admin',
    label: 'Admin',
    icon: <AdminPanelSettings />,
    gradient: 'linear-gradient(135deg, #4A148C, #7B1FA2)',
    maxAttempts: 3,  // stricter — matches backend ADMIN_MAX
    description: 'Club Administrator',
  },
];

// ── Countdown component shown when locked ───────────────────────────────────
function LockoutTimer({ seconds, onExpire }) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (remaining <= 0) { onExpire(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onExpire]);
  const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
  const secs = String(remaining % 60).padStart(2, '0');
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', mt: 1 }}>
      <LockClock fontSize="small" color="error" />
      <Typography variant="body2" color="error" fontWeight={700}>
        Locked — try again in {mins}:{secs}
      </Typography>
    </Box>
  );
}

// ── Attempt indicator bar ────────────────────────────────────────────────────
function AttemptsBar({ used, max, role }) {
  if (used === 0) return null;
  const pct = (used / max) * 100;
  const color = pct >= 80 ? 'error' : pct >= 60 ? 'warning' : 'primary';
  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">Login attempts</Typography>
        <Typography variant="caption" color={`${color}.main`} fontWeight={600}>
          {used} / {max}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        color={color}
        sx={{ height: 4, borderRadius: 2 }}
      />
    </Box>
  );
}

export default function LoginPage() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const location   = useLocation();
  const isLoading  = useSelector(selectAuthLoading);
  const error      = useSelector(selectAuthError);

  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('athlete');

  // Rate limit state — changes with selected role
  const loginType  = selectedRole === 'admin' ? 'admin_login' : 'login';
  const rateLimit  = useRateLimit(loginType);

  // Debounce email for any live feedback (600ms)
  const [emailInput, setEmailInput] = useState('');
  const debouncedEmail = useDebounce(emailInput, 600);

  const roleData = ROLES.find(r => r.value === selectedRole);
  const from     = location.state?.from?.pathname;

  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: yupResolver(schema),
  });

  useEffect(() => { dispatch(clearError()); }, [selectedRole, dispatch]);

  const onSubmit = async (data) => {
    if (rateLimit.isBlocked) return;

    const endpoint = selectedRole === 'admin' ? 'admin' : selectedRole;
    const result   = await dispatch(loginUser({ ...data, role: selectedRole, _endpoint: endpoint }));

    if (loginUser.fulfilled.match(result)) {
      rateLimit.recordSuccess();
      const user = result.payload.data.user;
      const routes = { athlete: '/athlete/dashboard', coach: '/coach/dashboard', admin: '/admin/dashboard' };
      navigate(from || routes[user.role] || '/', { replace: true });
    } else {
      const errData = result.payload;
      if (errData?.code === 'RATE_LIMIT_EXCEEDED') {
        rateLimit.handleRateLimitError(errData);
      } else {
        rateLimit.recordAttempt();
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #0A1628 0%, #0D2045 50%, #0A1628 100%)',
        p: 2,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-30%', left: '-10%',
          width: '50%', height: '70%',
          background: 'radial-gradient(ellipse, rgba(21,101,192,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 460, borderRadius: 3, overflow: 'hidden' }}>
        {/* Dynamic header — changes with role */}
        <Box sx={{ background: roleData.gradient, py: 3, px: 4, textAlign: 'center' }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', width: 54, height: 54, mx: 'auto', mb: 1.5 }}>
            {roleData.icon}
          </Avatar>
          <Typography variant="h5" color="white" fontWeight={700} letterSpacing={0.3}>
            Sports Club
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', mt: 0.5 }}>
            Sign in as {roleData.label} · {roleData.description}
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {/* Role selector tabs */}
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            {ROLES.map(r => (
              <Box
                key={r.value}
                onClick={() => setSelectedRole(r.value)}
                sx={{
                  flex: 1,
                  py: 1.2,
                  px: 0.5,
                  borderRadius: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: '2px solid',
                  transition: 'all 0.2s',
                  borderColor: selectedRole === r.value ? 'primary.main' : 'divider',
                  bgcolor: selectedRole === r.value ? 'primary.50' : 'transparent',
                  '&:hover': { borderColor: 'primary.light', bgcolor: 'action.hover' },
                }}
              >
                <Box sx={{ fontSize: 20, mb: 0.3, color: selectedRole === r.value ? 'primary.main' : 'text.secondary' }}>
                  {r.icon}
                </Box>
                <Typography
                  variant="caption"
                  fontWeight={selectedRole === r.value ? 700 : 400}
                  color={selectedRole === r.value ? 'primary.main' : 'text.secondary'}
                  display="block"
                >
                  {r.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Admin security notice */}
          {selectedRole === 'admin' && (
            <Alert icon={<Shield fontSize="small" />} severity="info" sx={{ mb: 2, py: 0.75 }}>
              Admin accounts require credentials provided by your Super Admin.
            </Alert>
          )}

          {/* API error */}
          {error && !rateLimit.isBlocked && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
              {error}
            </Alert>
          )}

          {/* Lockout warning */}
          {rateLimit.blockMessage && !rateLimit.isBlocked && (
            <Alert icon={<WarningAmber />} severity="warning" sx={{ mb: 2 }}>
              {rateLimit.blockMessage}
            </Alert>
          )}

          {/* Lockout blocker */}
          {rateLimit.isBlocked && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography fontWeight={600} variant="body2">Account temporarily locked</Typography>
              <LockoutTimer
                seconds={rateLimit.retryAfterSeconds}
                onExpire={() => dispatch(clearError())}
              />
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              {...register('email')}
              label="Email Address"
              type="email"
              fullWidth
              margin="normal"
              disabled={rateLimit.isBlocked}
              error={!!errors.email}
              helperText={errors.email?.message}
              onChange={e => { setEmailInput(e.target.value); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              {...register('password')}
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              margin="normal"
              disabled={rateLimit.isBlocked}
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(s => !s)} edge="end" size="small" tabIndex={-1}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Live attempt bar */}
            <AttemptsBar used={rateLimit.attemptCount} max={roleData.maxAttempts} role={selectedRole} />

            <Box sx={{ textAlign: 'right', mt: 1, mb: 2 }}>
              <Link component={RouterLink} to="/auth/forgot-password" variant="body2" color="primary">
                Forgot password?
              </Link>
            </Box>

            <Tooltip title={rateLimit.isBlocked ? rateLimit.blockMessage : ''} placement="top" arrow>
              <span style={{ display: 'block' }}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading || rateLimit.isBlocked}
                  sx={{ py: 1.5, background: roleData.gradient, '&:hover': { filter: 'brightness(1.1)' } }}
                >
                  {isLoading
                    ? <CircularProgress size={22} color="inherit" />
                    : rateLimit.isBlocked
                    ? <><LockClock sx={{ mr: 1, fontSize: 20 }} /> Locked</>
                    : `Sign In as ${roleData.label}`}
                </Button>
              </span>
            </Tooltip>
          </Box>

          {selectedRole !== 'admin' && (
            <>
              <Divider sx={{ my: 3 }}>
                <Typography variant="caption" color="text.secondary">OR</Typography>
              </Divider>
              <Typography variant="body2" textAlign="center" color="text.secondary">
                Don't have an account?{' '}
                <Link component={RouterLink} to={`/auth/register?role=${selectedRole}`} fontWeight={600} color="primary">
                  Register as {roleData.label}
                </Link>
              </Typography>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
