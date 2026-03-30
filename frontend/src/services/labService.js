import axios from 'axios';
import authService from './authService';

const API_URL = '/api/lab';

const getHeaders = () => {
    const token = authService.getToken();
    return { Authorization: `Bearer ${token}` };
};

const labService = {
    getPendingRequests: async () => {
        try {
            const response = await axios.get(`${API_URL}/pending`, { headers: getHeaders() });
            return response.data;
        } catch (e) {
            if (e.response?.status === 401) authService.handleAuthError();
            throw e;
        }
    },
    acceptRequest: async (requestId) => {
        try {
            const response = await axios.put(`${API_URL}/accept/${requestId}`, {}, { headers: getHeaders() });
            return response.data;
        } catch (e) {
            if (e.response?.status === 401) authService.handleAuthError();
            throw e;
        }
    },
    submitStructuredReport: async (payload) => {
        try {
            const response = await axios.post(`${API_URL}/submit-structured-report`, payload, { headers: getHeaders() });
            return response.data;
        } catch (e) {
            if (e.response?.status === 401) authService.handleAuthError();
            throw e;
        }
    },
    getPatientReports: async (patientId) => {
        try {
            const response = await axios.get(`${API_URL}/reports/${patientId}`, { headers: getHeaders() });
            return response.data;
        } catch (e) {
            if (e.response?.status === 401) authService.handleAuthError();
            throw e;
        }
    }
};

export default labService;
