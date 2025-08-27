import axios from "axios";
import { API_BASE_URL } from "./api";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Automatically attach token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
