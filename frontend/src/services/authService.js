import axios from 'axios';

const API_URL = '/api/auth';

const authService = {
  login: async (username, password) => {
    // OAuth2PasswordRequestForm expects x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    const response = await axios.post(`${API_URL}/login`, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (response.data.access_token) {
      localStorage.setItem('shs_user', JSON.stringify(response.data));
    }
    return response.data;
  },

  registerOnboard: async (aadhaarId, name, dob) => {
    const response = await axios.post(`${API_URL}/citizen/onboard`, {
      aadhaarId, name, dob
    });
    return response.data;
  },

  registerSetPassword: async (medicalId, aadhaarId, password) => {
    const response = await axios.post(`${API_URL}/citizen/set-password`, {
      medicalId, aadhaarId, password
    });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('shs_user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('shs_user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  },

  getToken: () => {
    const user = authService.getCurrentUser();
    return user?.access_token;
  },

  isAuthenticated: () => {
    return !!authService.getToken();
  },

  handleAuthError: () => {
    localStorage.removeItem('shs_user');
    window.location.href = '/login';
  }
};

export default authService;
