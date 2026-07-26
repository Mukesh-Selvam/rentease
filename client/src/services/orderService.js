import apiClient from './apiClient';

export const orderService = {
  async getOrders() {
    const res = await apiClient.get('/orders');
    return res.data;
  },

  async getOrderById(id) {
    const res = await apiClient.get(`/orders/${id}`);
    return res.data;
  },

  async createOrder(data) {
    const res = await apiClient.post('/orders', data);
    return res.data;
  },

  async updateOrderStatus(id, data) {
    const res = await apiClient.patch(`/orders/${id}/status`, data);
    return res.data;
  },

  async extendOrder(id, extensionMonths = 3) {
    const res = await apiClient.post(`/orders/${id}/extend`, { additionalMonths: extensionMonths });
    return res.data;
  },

  async returnOrder(id, data) {
    const res = await apiClient.post(`/orders/${id}/return`, data);
    return res.data;
  },

  async relocateOrder(id, data) {
    const res = await apiClient.post(`/orders/${id}/relocate`, data);
    return res.data;
  },

  async cancelOrder(id) {
    const res = await apiClient.post(`/orders/${id}/cancel`);
    return res.data;
  }
};

export default orderService;
