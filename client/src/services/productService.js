import apiClient from './apiClient';

export const productService = {
  async getProducts(params = {}) {
    const res = await apiClient.get('/products', { params });
    return res.data;
  },

  async getProductById(id) {
    const res = await apiClient.get(`/products/${id}`);
    return res.data;
  },

  async createProduct(data) {
    const res = await apiClient.post('/products', data);
    return res.data;
  },

  async updateProduct(id, data) {
    const res = await apiClient.put(`/products/${id}`, data);
    return res.data;
  },

  async deleteProduct(id) {
    const res = await apiClient.delete(`/products/${id}`);
    return res.data;
  },

  async getServiceAreas() {
    const res = await apiClient.get('/products/service-areas');
    return res.data;
  }
};

export default productService;
