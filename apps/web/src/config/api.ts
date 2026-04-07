import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3002/api',
});

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('cf_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
