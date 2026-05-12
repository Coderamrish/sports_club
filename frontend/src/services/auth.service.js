import api from './api';

const authService = {
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  verifyEmail: async ({ email, otp }) => {
    const response = await api.post('/auth/verify-email', { email, otp });
    return response.data;
  },

  resendOTP: async ({ email, purpose = 'email_verification' }) => {
    const response = await api.post('/auth/resend-otp', { email, purpose });
    return response.data;
  },

  // Athlete/Coach login
  login: async ({ email, password, role }) => {
    const endpoint = role === 'admin' ? '/auth/admin/login' : '/auth/login';
    const response = await api.post(endpoint, { email, password, role });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  forgotPassword: async ({ email }) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async ({ email, otp, newPassword }) => {
    const response = await api.post('/auth/reset-password', { email, otp, newPassword });
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },

  // Debounced availability checks 
  checkEmailAvailability: async (email) => {
    const response = await api.post('/auth/check/email', { email });
    return response.data;
  },

  checkMobileAvailability: async (mobile) => {
    const response = await api.post('/auth/check/mobile', { mobile });
    return response.data;
  },
};

export default authService;
