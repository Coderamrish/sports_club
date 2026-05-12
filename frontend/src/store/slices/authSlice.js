import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/auth.service';

//Async Thunks

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
  catch (err) {
    return rejectWithValue({
      message: err.response?.data?.message || err.message,
      status:  err.response?.status,
    });
  }
});

//  Helpers

function persistTokens(accessToken, refreshToken) {
  if (accessToken) sessionStorage.setItem('accessToken', accessToken);
  if (refreshToken) sessionStorage.setItem('refreshToken', refreshToken);
}
function clearTokens() {
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
}

//  Slice 

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:              null,
    accessToken:       sessionStorage.getItem('accessToken') || null,
    isAuthenticated:   !!sessionStorage.getItem('accessToken'),
    authInitialized:   false,   // true once the startup /auth/me check completes
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
      state.authInitialized = true;
      persistTokens(accessToken, refreshToken);
    },
    clearCredentials: (state) => {
      state.user            = null;
      state.accessToken     = null;
      state.isAuthenticated = false;
      clearTokens();
    },
    markInitialized:      (state)         => { state.authInitialized = true; },
    setPendingEmail:      (state, action) => { state.pendingEmail     = action.payload; },
    setRegistrationStep:  (state, action) => { state.registrationStep = action.payload; },
    clearError:           (state)         => { state.error            = null; },
    updateUser:           (state, action) => {
      if (state.user) state.user = { ...state.user, ...action.payload };
    },
  },
  extraReducers: (builder) => {

    //  Register
    builder
      .addCase(registerUser.pending,   (s) => { s.isLoading = true;  s.error = null; })
      .addCase(registerUser.fulfilled, (s, a) => {
        s.isLoading       = false;
        s.pendingEmail    = a.payload.data?.email;
        s.registrationStep = 'otp';
      })
      .addCase(registerUser.rejected,  (s, a) => { s.isLoading = false; s.error = a.payload?.message || 'Registration failed'; });

    //  Verify Email
    builder
      .addCase(verifyEmail.pending,   (s) => { s.isLoading = true;  s.error = null; })
      .addCase(verifyEmail.fulfilled, (s, a) => {
        s.isLoading        = false;
        const { user, accessToken, refreshToken } = a.payload.data;
        s.user             = user;
        s.accessToken      = accessToken;
        s.isAuthenticated  = true;
        s.authInitialized  = true;
        s.registrationStep = 'complete';
        persistTokens(accessToken, refreshToken);
      })
      .addCase(verifyEmail.rejected,  (s, a) => { s.isLoading = false; s.error = a.payload?.message || 'Verification failed'; });

    //  Login (athlete / coach / admin — unified)
    builder
      .addCase(loginUser.pending,   (s) => { s.isLoading = true;  s.error = null; })
      .addCase(loginUser.fulfilled, (s, a) => {
        s.isLoading       = false;
        const { user, accessToken, refreshToken } = a.payload.data;
        s.user            = user;
        s.accessToken     = accessToken;
        s.isAuthenticated = true;
        s.authInitialized = true;
        persistTokens(accessToken, refreshToken);
      })
      .addCase(loginUser.rejected,  (s, a) => { s.isLoading = false; s.error = a.payload?.message || 'Login failed'; });

    //Logout
    builder
      .addCase(logoutUser.fulfilled, (s) => {
        s.user = null; s.accessToken = null; s.isAuthenticated = false;
        clearTokens();
      })
      .addCase(logoutUser.rejected, (s) => {
        // Force logout even if API call fails
        s.user = null; s.accessToken = null; s.isAuthenticated = false;
        clearTokens();
      });

    //  Fetch Me 
    builder
      .addCase(fetchCurrentUser.pending,   (s) => { s.isLoading = true; })
      .addCase(fetchCurrentUser.fulfilled, (s, a) => {
        s.isLoading       = false;
        s.authInitialized = true;
        s.user            = a.payload.data?.user;
        s.accessToken     = sessionStorage.getItem('accessToken');
        s.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected,  (s, a) => {
        s.isLoading       = false;
        s.authInitialized = true;
        // Only clear session on explicit auth failure (401), not network errors
        const httpStatus = a.payload?.status || a.payload?.statusCode;
        if (httpStatus === 401 || !sessionStorage.getItem('accessToken')) {
          s.user            = null;
          s.isAuthenticated = false;
          clearTokens();
        }
      });
  },
});

export const {
  setCredentials, clearCredentials, markInitialized,
  setPendingEmail, setRegistrationStep, clearError, updateUser,
} = authSlice.actions;

//  Selectors
export const selectCurrentUser        = (s) => s.auth.user;
export const selectIsAuthenticated    = (s) => s.auth.isAuthenticated;
export const selectAuthInitialized    = (s) => s.auth.authInitialized;
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
