import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL 
    || 'http://localhost:5000';

const axiosInstance = axios.create(
    {
        baseURL: BASE_URL,
        withCredentials: true, // Important for cookies
    }
);

// Request interceptor to set Content-Type for JSON requests
// But allow FormData requests to set their own Content-Type (multipart/form-data)
axiosInstance.interceptors.request.use((config) => {
  // If there's no data or data is FormData, don't set Content-Type
  // The browser will set it automatically with the correct boundary
  if (config.data && !(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

export default axiosInstance;