import axios from 'axios';

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return '/api';
};

export const apiClient = axios.create({
  baseURL: getApiUrl(),
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-App': 'admin',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('tanbox_admin_token') || localStorage.getItem('tanbox_token');
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

    console.error(`[Admin API Error] [${status}] ${url}:`, error.response?.data || message);

    if (
      error.response?.status === 401 &&
      !url.includes('/auth/login') &&
      !url.includes('/markirovka/operations')
    ) {
      localStorage.removeItem('tanbox_admin_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Only report critical server errors (5xx) or real network failures (ignoring 4xx client validation errors and /health)
    const isCritical =
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
          message: `Admin API Error [${status}] ${url}: ${JSON.stringify(error.response?.data || message)}`,
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      }).catch(() => {});
    }

    return Promise.reject(error);
  }
);


// Read bounded server pages; fail explicitly rather than silently truncate large workspaces.
export async function getAllPages(url: string, config: any = {}): Promise<any> {
  let page = 1;
  const first = await apiClient.get(url, { ...config, params: { ...config.params, page, limit: 200 } });
  const data = [...first.data];
  let current = first;
  while (current.headers['x-next-page']) {
    if (data.length >= 10000) throw new Error('Too many records for this view; use paginated API or narrow the report.');
    page = Number(current.headers['x-next-page']);
    current = await apiClient.get(url, { ...config, params: { ...config.params, page, limit: 200 } });
    data.push(...current.data);
  }
  return { ...first, data };
}
