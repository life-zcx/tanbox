export const getLandingUrl = (path: string = ''): string => {
  const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.endsWith('tanbox.kz')) {
      return `https://tanbox.kz${cleanPath}`;
    }
    if ((import.meta as any).env?.VITE_LANDING_URL) {
      return `${(import.meta as any).env.VITE_LANDING_URL.replace(/\/$/, '')}${cleanPath}`;
    }
    const protocol = window.location.protocol;
    return `${protocol}//${hostname}:3000${cleanPath}`;
  }
  return `http://localhost:3000${cleanPath}`;
};

export const getLkUrl = (path: string = ''): string => {
  const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.endsWith('tanbox.kz')) {
      return `https://lk.tanbox.kz${cleanPath}`;
    }
    if ((import.meta as any).env?.VITE_LK_URL) {
      return `${(import.meta as any).env.VITE_LK_URL.replace(/\/$/, '')}${cleanPath}`;
    }
    const protocol = window.location.protocol;
    return `${protocol}//${hostname}:3001${cleanPath}`;
  }
  return `http://localhost:3001${cleanPath}`;
};

export const getAdminUrl = (path: string = ''): string => {
  const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.endsWith('tanbox.kz')) {
      return `https://admin.tanbox.kz${cleanPath}`;
    }
    if ((import.meta as any).env?.VITE_ADMIN_URL) {
      return `${(import.meta as any).env.VITE_ADMIN_URL.replace(/\/$/, '')}${cleanPath}`;
    }
    const protocol = window.location.protocol;
    return `${protocol}//${hostname}:3002${cleanPath}`;
  }
  return `http://localhost:3002${cleanPath}`;
};
