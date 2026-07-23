// Admin API calls for user management
import axios from './axios';
import { API } from './endpoints';
import Cookies from 'js-cookie';

// Get authentication token from cookie or localStorage
const getAuthToken = () => {
    if (typeof window !== 'undefined') {
        return (
            Cookies.get('auth-token') ||
            localStorage.getItem('auth-token') ||
            localStorage.getItem('token')
        );
    }
    return null;
};

// Get all users (Admin only)
export const getAllUsers = async (params?: { page?: number; limit?: number }) => {
    try {
        const token = getAuthToken();
        const response = await axios.get(API.ADMIN.USERS, {
            params,
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (err: Error | any) {
        const errorMessage = err.response?.data?.message || err.message || "Failed to fetch users";
        throw new Error(errorMessage);
    }
};

// Get user by ID (Admin only)
export const getUserById = async (id: string) => {
    try {
        const token = getAuthToken();
        const response = await axios.get(API.ADMIN.USER_BY_ID(id), {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (err: Error | any) {
        const errorMessage = err.response?.data?.message || err.message || "Failed to fetch user";
        throw new Error(errorMessage);
    }
};

// Create user (Admin only)
export const createUser = async (userData: FormData) => {
    try {
        const token = getAuthToken();
        const response = await axios.post(API.ADMIN.USERS, userData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (err: Error | any) {
        const errorMessage = err.response?.data?.message || err.message || "Failed to create user";
        throw new Error(errorMessage);
    }
};

// Update user (Admin only)
export const updateUser = async (id: string, userData: FormData) => {
    try {
        const token = getAuthToken();
        const response = await axios.put(API.ADMIN.USER_BY_ID(id), userData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (err: Error | any) {
        const errorMessage = err.response?.data?.message || err.message || "Failed to update user";
        throw new Error(errorMessage);
    }
};

// Delete user (Admin only)
export const deleteUser = async (id: string) => {
    try {
        const token = getAuthToken();
        const response = await axios.delete(API.ADMIN.USER_BY_ID(id), {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (err: Error | any) {
        const errorMessage = err.response?.data?.message || err.message || "Failed to delete user";
        throw new Error(errorMessage);
    }
};

// Get pending host applications (Admin only)
export const getPendingHosts = async () => {
    try {
        const token = getAuthToken();
        const response = await axios.get(API.ADMIN.HOSTS_PENDING, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (err: Error | any) {
        const errorMessage = err.response?.data?.message || err.message || "Failed to fetch pending hosts";
        throw new Error(errorMessage);
    }
};

// Get all host applications (Admin only)
export const getAllHosts = async () => {
    try {
        const token = getAuthToken();
        const response = await axios.get(API.ADMIN.HOSTS, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (err: Error | any) {
        if (err?.code === 'ERR_NETWORK') {
            throw new Error('Cannot reach backend API at http://localhost:5000. Start backend with: cd backend && npm run dev');
        }
        const errorMessage = err.response?.data?.message || err.message || "Failed to fetch host applications";
        throw new Error(errorMessage);
    }
};

// Approve host application (Admin only)
export const approveHost = async (hostProfileId: string) => {
    try {
        const token = getAuthToken();
        const response = await axios.post(API.ADMIN.HOST_APPROVE(hostProfileId), {}, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (err: Error | any) {
        const errorMessage = err.response?.data?.message || err.message || "Failed to approve host";
        throw new Error(errorMessage);
    }
};

// Reject host application (Admin only)
export const rejectHost = async (hostProfileId: string, reason: string) => {
    try {
        const token = getAuthToken();
        const response = await axios.post(API.ADMIN.HOST_REJECT(hostProfileId), { reason }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (err: Error | any) {
        const errorMessage = err.response?.data?.message || err.message || "Failed to reject host";
        throw new Error(errorMessage);
    }
};

// Update user profile (Authenticated user)
export const updateProfile = async (id: string, userData: FormData) => {
    try {
        const token = getAuthToken();
        const response = await axios.put(API.AUTH.UPDATE_PROFILE(id), userData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (err: Error | any) {
        const errorMessage = err.response?.data?.message || err.message || "Failed to update profile";
        throw new Error(errorMessage);
    }
};
