import api from './api';

export const fetchMLPredictions = async () => {
    try {
        const response = await api.get('/ml-models/predict/top10-accurate');
        return response.data;
    } catch (error) {
        console.error('Error fetching ML predictions:', error);
        throw error;
    }
};

export default {
    fetchMLPredictions
};