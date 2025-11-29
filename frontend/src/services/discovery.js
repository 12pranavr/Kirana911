import api from './api';

const discoveryService = {
  // Get product discovery data for marketplace sections
  getDiscoveryData: async () => {
    try {
      const response = await api.get('/inventory/discovery');
      return response.data;
    } catch (error) {
      console.error('Error fetching discovery data:', error);
      throw error;
    }
  }
};

export default discoveryService;