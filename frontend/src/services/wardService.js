import axios from 'axios';
import authService from './authService';

const API_URL = '/api/ward';

const getHeaders = () => {
    const token = authService.getToken();
    return { Authorization: `Bearer ${token}` };
};

const wardService = {
    getDashboard: async () => {
        const response = await axios.get(`${API_URL}/dashboard`, { headers: getHeaders() });
        return response.data;
    },
    submitRemark: async (payload) => {
        const response = await axios.post(`${API_URL}/remark`, payload, { headers: getHeaders() });
        return response.data;
    },
    submitHandover: async (notes) => {
        const response = await axios.put(`${API_URL}/handover`, { notes }, { headers: getHeaders() });
        return response.data;
    },
    triggerIotAlert: async (payload) => {
        // Public API representing hardware
        const response = await axios.post(`${API_URL}/iot-trigger`, payload);
        return response.data;
    },
    dischargePatient: async (patientId) => {
        const response = await axios.post(`${API_URL}/patients/${patientId}/discharge`, {}, { headers: getHeaders() });
        return response.data;
    },
    getPatientLogs: async (patientId) => {
        const response = await axios.get(`${API_URL}/patients/${patientId}/logs`, { headers: getHeaders() });
        return response.data;
    }
};

export default wardService;
