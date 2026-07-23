// Actual backend API calls
import axios from './axios';
import { API } from './endpoints';

export const register = async (registerData: any) => {
    try {
        const response = await axios.post(API.AUTH.REGISTER, registerData);
        return response.data; //reponse ko body(what backend returns)
    } catch (err: Error | any) {
        // Handle backend error messages
        const errorMessage = err.response?.data?.message || err.message || "Registration failed";
        throw new Error(errorMessage);
    }
}

export const login = async (loginData: any) => {
    try {
        const response = await axios.post(API.AUTH.LOGIN, loginData);
        return response.data; // response body from backend
    } catch (err: Error | any) {
        // Handle backend error messages
        const errorMessage = err.response?.data?.message || err.message || "Login failed";
        throw new Error(errorMessage);
    }
}

export const verify = async () => {
    try {
        const response = await axios.get(API.AUTH.VERIFY);
        return response.data; // response body from backend
    } catch (err: Error | any) {
        // Handle backend error messages
        const errorMessage = err.response?.data?.message || err.message || "Verification failed";
        throw new Error(errorMessage);
    }
}

export const forgotPassword = async (email: string) => {
    try {
        const response = await axios.post(API.AUTH.FORGOT_PASSWORD, { email });
        return response.data;
    } catch (err: Error | any) {
        const errorMessage = err.response?.data?.message || err.message || "Failed to send OTP";
        throw new Error(errorMessage);
    }
}

export const resetPassword = async (payload: { email: string; otp: string; password: string; confirmPassword: string }) => {
    try {
        const response = await axios.post(API.AUTH.RESET_PASSWORD, payload);
        return response.data;
    } catch (err: Error | any) {
        const errorMessage = err.response?.data?.message || err.message || "Failed to reset password";
        throw new Error(errorMessage);
    }
}