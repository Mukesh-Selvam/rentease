import apiClient from './apiClient';

export const vendorService = {
  async getVendorAnalytics() {
    const res = await apiClient.get('/vendor/analytics');
    return res.data;
  },

  async getVendorOrders() {
    const res = await apiClient.get('/vendor/orders');
    return res.data;
  },

  async fileDamageClaim(data) {
    const res = await apiClient.post('/vendor/claims', data);
    return res.data;
  }
};

export default vendorService;
