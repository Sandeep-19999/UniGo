import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL;
const baseURL = import.meta.env.DEV ? "/api" : (configuredApiUrl || "/api");

export const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("unigo_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
