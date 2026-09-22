import axios from 'axios';

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return '/api';
};

export const apiClient = axios.create({
  baseURL: getApiUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('tanbox_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : 'NETWORK_ERROR';
    const message = error.message || 'API Request Failed';
    const url = error.config ? error.config.url : '';

    console.error(`[API Error] [${status}] ${url}:`, error.response?.data || message);

    // Forward critical errors to backend logger (avoiding infinite loops if logging endpoint itself fails)
    if (url && !url.includes('/logs/frontend')) {
      fetch(`${getApiUrl()}/logs/frontend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'error',
          message: `LK API Error [${status}] ${url}: ${JSON.stringify(error.response?.data || message)}`,
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      }).catch(() => {});
    }

    return Promise.reject(error);
  }
);

