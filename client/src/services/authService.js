import apiClient from './apiClient';

export const authService = {
  async register(data) {
    const res = await apiClient.post('/auth/register', data);
    if (res.data && res.data.token) {
      localStorage.setItem('rentease_token', res.data.token);
    }
    return res.data;
  },

  async login(credentials) {
    const res = await apiClient.post('/auth/login', credentials);
    if (res.data && res.data.token) {
      localStorage.setItem('rentease_token', res.data.token);
    }
    return res.data;
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network logout error
    } finally {
      localStorage.removeItem('rentease_token');
    }
  },

  async getCurrentUser() {
    const res = await apiClient.get('/auth/me');
    return res.data.user;
  },

  async updateProfile(data) {
    const res = await apiClient.put('/auth/profile', data);
    return res.data;
  },

  async submitKyc(data) {
    const res = await apiClient.post('/auth/kyc', data);
    return res.data;
  },

  async forgotPassword(email) {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(payload) {
    const res = await apiClient.post('/auth/reset-password', payload);
    return res.data;
  }
};

export default authService;
