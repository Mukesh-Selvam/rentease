import apiClient from './apiClient';

export const paymentService = {
  async verifyPayment(paymentDetails) {
    const res = await apiClient.post('/payment/verify', paymentDetails);
    return res.data;
  },

  async getInvoices() {
    const res = await apiClient.get('/payment/invoices');
    return res.data;
  }
};

export default paymentService;
