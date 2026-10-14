export const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('blockvault_backend_url');
    if (custom && custom.trim()) {
      return `${custom.trim().replace(/\/+$/, '')}/auth`;
    }
    const envUrl = (import.meta as any).env?.VITE_API_URL;
    if (envUrl && envUrl.trim()) {
      return envUrl.trim().replace(/\/+$/, '');
    }
    if (
      window.location.hostname &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1' &&
      !window.location.hostname.includes('vercel.app')
    ) {
      return `${window.location.protocol}//${window.location.hostname}:8080/api/auth`;
    }
  }
  return 'http://localhost:8080/api/auth';
};

export const apiAuth = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${getApiUrl()}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data; // { token, user }
  },
  
  register: async (email: string, password: string, name: string, role: string) => {
    const res = await fetch(`${getApiUrl()}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    return data;
  },

  me: async (token: string) => {
    const res = await fetch(`${getApiUrl()}/me`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to get user');
    return data; // user info
  },
  
  logout: async () => {
    // Optional backend logout if stateful, but JWT is stateless mostly
  }
};
