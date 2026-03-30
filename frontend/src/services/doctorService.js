import axios from 'axios';
import authService from './authService';

const API_URL = '/api/doctor';

const getHeaders = () => {
    const token = authService.getToken();
    return { Authorization: `Bearer ${token}` };
};

const doctorService = {
    searchDoctors: async (hospitalId = null, specialty = null) => {
        try {
            let url = `${API_URL}/search`;
            const params = [];
            if (hospitalId) params.push(`hospitalId=${hospitalId}`);
            if (specialty) params.push(`specialty=${specialty}`);
            if (params.length > 0) url += `?${params.join('&')}`;
            
            const response = await axios.get(url, { headers: getHeaders() });
            return response.data;
        } catch (e) {
            if (e.response?.status === 401) authService.handleAuthError();
            throw e;
        }
    },
    getPatientAppointments: async (patientId) => {
        try {
            const response = await axios.get(`/api/appointment/patient/${patientId}`, { headers: getHeaders() });
            return response.data;
        } catch (e) {
            if (e.response?.status === 401) authService.handleAuthError();
            throw e;
        }
    },
    getDoctorSlots: async (doctorId, date) => {
        try {
            const response = await axios.get(`${API_URL}/${doctorId}/slots?date=${date}`, { headers: getHeaders() });
            return response.data;
        } catch (e) {
            if (e.response?.status === 401) authService.handleAuthError();
            throw e;
        }
    },
    getDoctorDashboard: async (doctorId, date) => {
        try {
            const response = await axios.get(`/api/doctor/dashboard/today?date=${date}`, { headers: getHeaders() });
            return response.data;
        } catch (e) {
            if (e.response?.status === 401) authService.handleAuthError();
            throw e;
        }
    },
    getDoctorPatients: async () => {
        try {
            const response = await axios.get(`${API_URL}/patients`, { headers: getHeaders() });
            return response.data;
        } catch (e) {
            if (e.response?.status === 401) authService.handleAuthError();
            throw e;
        }
    },
    initiateAppointment: async (appointmentId) => {
        try {
            const response = await axios.post(`${API_URL}/appointment/${appointmentId}/initiate`, {}, { headers: getHeaders() });
            return response.data;
        } catch (e) {
            if (e.response?.status === 401) authService.handleAuthError();
            throw e;
        }
    },
    getAppointmentCounts: async (monthYear) => {
        try {
            const response = await axios.get(`${API_URL}/appointments/counts?month_year=${monthYear}`, { headers: getHeaders() });
            return response.data;
        } catch (e) {
            if (e.response?.status === 401) authService.handleAuthError();
            throw e;
        }
    },
    addPrescription: async (data) => {
        try {
            const response = await axios.post(`${API_URL}/prescription`, data, { headers: getHeaders() });
            return response.data;
        } catch (e) {
            if (e.response?.status === 401) authService.handleAuthError();
            throw e;
        }
    },
    updatePrescription: async (prescriptionId, data) => {
        try {
            const response = await axios.put(`${API_URL}/prescription/${prescriptionId}`, data, { headers: getHeaders() });
            return response.data;
        } catch (e) {
            if (e.response?.status === 401) authService.handleAuthError();
            throw e;
        }
    },
    getPatientPrescriptions: async (patientId) => {
        try {
            const response = await axios.get(`${API_URL}/patients/${patientId}/prescriptions`, { headers: getHeaders() });
            return response.data;
        } catch (e) {
            if (e.response?.status === 401) authService.handleAuthError();
            throw e;
        }
    },
    getDoctorHistory: async () => {
        try {
            const response = await axios.get(`${API_URL}/history`, { headers: getHeaders() });
            return response.data;
        } catch (e) {
            if (e.response?.status === 401) authService.handleAuthError();
            throw e;
        }
    },
    getDoctorFeedbacks: async (doctorId) => {
        try {
            const response = await axios.get(`${API_URL}/${doctorId}/feedbacks`, { headers: getHeaders() });
            return response.data;
        } catch (e) {
            if (e.response?.status === 401) authService.handleAuthError();
            throw e;
        }
    }
};

export default doctorService;
