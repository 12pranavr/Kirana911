import api from './api';

const storesService = {
  // Get nearby stores by pincode
  getNearbyStores: async (pincode) => {
    try {
      const response = await api.get(`/stores/nearby/${pincode}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching nearby stores:', error);
      throw error;
    }
  },

  // Get all stores (admin only)
  getAllStores: async () => {
    try {
      const response = await api.get('/stores');
      return response.data;
    } catch (error) {
      console.error('Error fetching stores:', error);
      throw error;
    }
  },

  // Create new store (admin only)
  createStore: async (storeData) => {
    try {
      const response = await api.post('/stores/create', storeData);
      return response.data;
    } catch (error) {
      console.error('Error creating store:', error);
      throw error;
    }
  },

  // Update store
  updateStore: async (storeData) => {
    try {
      const response = await api.post('/stores/update', storeData);
      return response.data;
    } catch (error) {
      console.error('Error updating store:', error);
      throw error;
    }
  },

  // Delete store
  deleteStore: async (storeId) => {
    try {
      const response = await api.post('/stores/remove', { id: storeId });
      return response.data;
    } catch (error) {
      console.error('Error deleting store:', error);
      throw error;
    }
  },

  // Get store products
  getStoreProducts: async (storeId) => {
    try {
      const response = await api.get(`/stores/${storeId}/products`);
      return response.data;
    } catch (error) {
      console.error('Error fetching store products:', error);
      throw error;
    }
  }
};

export default storesService;