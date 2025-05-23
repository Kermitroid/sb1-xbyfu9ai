import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(config => {
  // Get the token from localStorage
  const userStorage = localStorage.getItem('user-storage');
  if (userStorage) {
    try {
      const { state } = JSON.parse(userStorage);
      if (state.isAuthenticated && state.user) {
        config.headers.Authorization = `Bearer ${state.user.id}`;
      }
    } catch (error) {
      console.error('Error parsing user storage', error);
    }
  }
  return config;
});

export default api;