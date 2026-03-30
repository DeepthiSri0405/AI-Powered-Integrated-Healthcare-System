import axios from 'axios';
import authService from './authService';

const API_URL = '/api/citizen';

const getHeaders = () => {
    const token = authService.getToken();
    return { Authorization: `Bearer ${token}` };
};

const citizenService = {
    getProfile: async () => {
        const response = await axios.get(`${API_URL}/profile`, { headers: getHeaders() });
        return response.data;
    },
    getMedications: async () => {
        try {
            const response = await axios.get(`${API_URL}/medications`, { headers: getHeaders() });
            return response.data;
        } catch (e) {
            if (e.response?.status === 401) authService.handleAuthError();
            throw e;
        }
    },
    getReminders: async () => {
        try {
            const response = await axios.get(`${API_URL}/reminders`, { headers: getHeaders() });
            return response.data;
        } catch (e) {
            if (e.response?.status === 401) authService.handleAuthError();
            throw e;
        }
    },
    getRecords: async (id) => {
        const response = await axios.get(`${API_URL}/records/${id}`, { headers: getHeaders() });
        return response.data;
    },
    getQueueStatus: async (doctorId, token, date) => {
        try {
            const response = await axios.get(`/api/appointment/queue/status?doctor_id=${doctorId}&my_token=${token}&date=${date}`, { headers: getHeaders() });
            return response.data;
        } catch (e) {
            return { activeToken: "N/A", estimatedWait: 0 };
        }
    }
};

export default citizenService;
