import axios from 'axios';
import authService from './authService';

const API_URL = '/api/family';

const getHeaders = () => {
    const token = authService.getToken();
    return { Authorization: `Bearer ${token}` };
};

const familyService = {
    getFamilyDetails: async () => {
        try {
            const response = await axios.get(`${API_URL}/details`, { headers: getHeaders() });
            return response.data;
        } catch (e) {
            if (e.response?.status === 401) authService.handleAuthError();
            throw e;
        }
    },
    leaveFamily: async () => {
        try {
            const response = await axios.post(`${API_URL}/autonomy/leave`, {}, { headers: getHeaders() });
            return response.data;
        } catch (e) {
            if (e.response?.status === 401) authService.handleAuthError();
            throw e;
        }
    },
    restrictFamilyAccess: async () => {
        try {
            const response = await axios.post(`${API_URL}/autonomy/restrict`, {}, { headers: getHeaders() });
            return response.data;
        } catch (e) {
            if (e.response?.status === 401) authService.handleAuthError();
            throw e;
        }
    },
    addDependent: async (formData) => {
        try {
            const token = authService.getToken();
            const response = await axios.post(`${API_URL}/add-dependent`, formData, { 
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}` 
                } 
            });
            return response.data;
        } catch (e) {
            throw e;
        }
    }
};

export default familyService;
