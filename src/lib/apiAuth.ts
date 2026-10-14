const getApiUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `${window.location.protocol}//${window.location.hostname}:8080/api/auth`;
  }
  return 'http://localhost:8080/api/auth';
};

const API_URL = (import.meta as any).env?.VITE_API_URL || getApiUrl();
export const apiAuth = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data; // { token, user }
  },
  
  register: async (email: string, password: string, name: string, role: string) => {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    return data;
  },

  me: async (token: string) => {
    const res = await fetch(`${API_URL}/me`, {
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
