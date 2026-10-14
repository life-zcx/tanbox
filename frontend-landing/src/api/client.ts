import axios from 'axios';

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return '/api';
};

export const apiClient = axios.create({
  baseURL: getApiUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : 'NETWORK_ERROR';
    const message = error.message || 'API Request Failed';
    const url = error.config ? error.config.url : '';

    console.error(`[Landing API Error] [${status}] ${url}:`, error.response?.data || message);

    // Only report critical server errors (5xx) or real network failures (ignoring 4xx client validation errors and /health)
    const isCritical =
      status !== 503 &&
      url &&
      !url.includes('/logs/frontend') &&
      !url.includes('/health') &&
      (typeof status === 'number' ? status >= 500 : status === 'NETWORK_ERROR');

    if (isCritical) {
      fetch(`${getApiUrl()}/logs/frontend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'error',
          message: `Landing API Error [${status}] ${url}: ${JSON.stringify(error.response?.data || message)}`,
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      }).catch(() => {});
    }

    return Promise.reject(error);
  }
);

