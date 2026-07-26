import apiClient from './apiClient';

export const adminService = {
  async getAnalytics() {
    const res = await apiClient.get('/admin/analytics');
    return res.data;
  },

  async getUsers(role = '') {
    const res = await apiClient.get('/admin/users', { params: { role } });
    return res.data;
  },

  async updateUserStatus(id, data) {
    const res = await apiClient.patch(`/admin/users/${id}/status`, data);
    return res.data;
  },

  async getPendingListings() {
    const res = await apiClient.get('/admin/pending-listings');
    return res.data;
  },

  async approveListing(id) {
    const res = await apiClient.patch(`/admin/listings/${id}/approve`);
    return res.data;
  },

  async rejectListing(id) {
    const res = await apiClient.patch(`/admin/listings/${id}/reject`);
    return res.data;
  },

  async getClaims() {
    const res = await apiClient.get('/admin/claims');
    return res.data;
  },

  async updateClaimStatus(id, status) {
    const res = await apiClient.patch(`/admin/claims/${id}`, { status });
    return res.data;
  },

  async getServiceAreas() {
    const res = await apiClient.get('/admin/service-areas');
    return res.data;
  },

  async addServiceArea(data) {
    const res = await apiClient.post('/admin/service-areas', data);
    return res.data;
  },

  async getCoupons() {
    const res = await apiClient.get('/admin/coupons');
    return res.data;
  },

  async createCoupon(data) {
    const res = await apiClient.post('/admin/coupons', data);
    return res.data;
  },

  getExportUrl(type) {
    const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    return `${baseUrl}/admin/export/${type}`;
  }
};

export default adminService;
