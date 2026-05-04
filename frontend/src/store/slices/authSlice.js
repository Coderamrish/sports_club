import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/auth.service';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const registerUser = createAsyncThunk(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try { return await authService.register(data); }
    catch (err) { return rejectWithValue(err.response?.data || { message: err.message }); }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (data, { rejectWithValue }) => {
    try { return await authService.verifyEmail(data); }
    catch (err) { return rejectWithValue(err.response?.data || { message: err.message }); }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (data, { rejectWithValue }) => {
    try { return await authService.login(data); }
    catch (err) { return rejectWithValue(err.response?.data || { message: err.message }); }
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try { await authService.logout(); }
  catch (err) { return rejectWithValue(err.response?.data || { message: err.message }); }
});

export const fetchCurrentUser = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try { return await authService.getMe(); }
  catch (err) { return rejectWithValue(err.response?.data || { message: err.message }); }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function persistTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem('accessToken', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
}
function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:              null,
    accessToken:       localStorage.getItem('accessToken') || null,
    isAuthenticated:    !!localStorage.getItem('accessToken'), 
    isLoading:         false,
    error:             null,
    pendingEmail:      null,
    registrationStep:  'form',  // 'form' | 'otp' | 'complete'
  },
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken, refreshToken } = action.payload;
      state.user            = user;
      state.accessToken     = accessToken;
      state.isAuthenticated = true;
      persistTokens(accessToken, refreshToken);
    },
    clearCredentials: (state) => {
      state.user            = null;
      state.accessToken     = null;
      state.isAuthenticated = false;
      clearTokens();
    },
    setPendingEmail:      (state, action) => { state.pendingEmail     = action.payload; },
    setRegistrationStep:  (state, action) => { state.registrationStep = action.payload; },
    clearError:           (state)         => { state.error            = null; },
    updateUser:           (state, action) => {
      if (state.user) state.user = { ...state.user, ...action.payload };
    },
  },
  extraReducers: (builder) => {

    // ── Register ─────────────────────────────────────────────────────
    builder
      .addCase(registerUser.pending,   (s) => { s.isLoading = true;  s.error = null; })
      .addCase(registerUser.fulfilled, (s, a) => {
        s.isLoading       = false;
        s.pendingEmail    = a.payload.data?.email;
        s.registrationStep = 'otp';
      })
      .addCase(registerUser.rejected,  (s, a) => { s.isLoading = false; s.error = a.payload?.message || 'Registration failed'; });

    // ── Verify Email ──────────────────────────────────────────────────
    builder
      .addCase(verifyEmail.pending,   (s) => { s.isLoading = true;  s.error = null; })
      .addCase(verifyEmail.fulfilled, (s, a) => {
        s.isLoading        = false;
        const { user, accessToken, refreshToken } = a.payload.data;
        s.user             = user;
        s.accessToken      = accessToken;
        s.isAuthenticated  = true;
        s.registrationStep = 'complete';
        persistTokens(accessToken, refreshToken);
      })
      .addCase(verifyEmail.rejected,  (s, a) => { s.isLoading = false; s.error = a.payload?.message || 'Verification failed'; });

    // ── Login (athlete / coach / admin — unified) ─────────────────────
    builder
      .addCase(loginUser.pending,   (s) => { s.isLoading = true;  s.error = null; })
      .addCase(loginUser.fulfilled, (s, a) => {
        s.isLoading       = false;
        const { user, accessToken, refreshToken } = a.payload.data;
        s.user            = user;
        s.accessToken     = accessToken;
        s.isAuthenticated = true;
        persistTokens(accessToken, refreshToken);
      })
      .addCase(loginUser.rejected,  (s, a) => { s.isLoading = false; s.error = a.payload?.message || 'Login failed'; });

    // ── Logout ────────────────────────────────────────────────────────
    builder
      .addCase(logoutUser.fulfilled, (s) => {
        s.user = null; s.accessToken = null; s.isAuthenticated = false;
        clearTokens();
      });

    // ── Fetch Me ──────────────────────────────────────────────────────
    builder
      .addCase(fetchCurrentUser.pending,   (s) => { s.isLoading = true; })
      .addCase(fetchCurrentUser.fulfilled, (s, a) => {
        s.isLoading = false;
        s.user = a.payload.data?.user;
        s.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected,  (s) => {
        s.isLoading = false; s.user = null; s.isAuthenticated = false;
        clearTokens();
      });
  },
});

export const {
  setCredentials, clearCredentials, setPendingEmail,
  setRegistrationStep, clearError, updateUser,
} = authSlice.actions;

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectCurrentUser        = (s) => s.auth.user;
export const selectIsAuthenticated    = (s) => s.auth.isAuthenticated;
export const selectAuthLoading        = (s) => s.auth.isLoading;
export const selectAuthError          = (s) => s.auth.error;
export const selectPendingEmail       = (s) => s.auth.pendingEmail;
export const selectRegistrationStep   = (s) => s.auth.registrationStep;
export const selectUserRole           = (s) => s.auth.user?.role;
export const selectAdminLevel         = (s) => s.auth.user?.adminLevel;
export const selectAdminPermissions   = (s) => s.auth.user?.permissions || [];

/** Check if current admin has a specific permission */
export const selectHasPermission = (permission) => (s) =>
  s.auth.user?.role === 'admin' && (
    s.auth.user?.adminLevel === 'super_admin' ||
    (s.auth.user?.permissions || []).includes(permission)
  );

export default authSlice.reducer;
