// server side processsing

"use server"
import {register, login} from "../api/auth";
import { cookies } from 'next/headers';

export const handleRegister = async (formData: any) => {
    try {
        // how data sent from component to backend api
        const res = await register(formData);
        // component return logic
        if (res.message === 'User registered successfully') {
            return{
                success: true,
                data: res.user,
                message: "Registration successful"
            };
        }
        return {
            success: false,
            message: res.message || "Registration failed"
        };
    } catch (err: Error | any) {
        return {
            success: false,
            message: err.message || "Registration failed"
        };
    }
}

export const handleLogin = async (formData: FormData) => {
    try {
        const loginData = {
            email: formData.get('email') as string,
            password: formData.get('password') as string,
        }
        const res = await login(loginData);
        if (res.message === 'Login successful' && res.data?.token) {
            // Set cookie with the token
            const cookieStore = await cookies();
            cookieStore.set('auth-token', res.data.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7, // 7 days
                path: '/',
            });
            return {
                success: true,
                message: "Login successful"
            };
        }
        return {
            success: false,
            message: res.message || "Login failed"
        };
    } catch (err: Error | any) {
        return {
            success: false,
            message: err.message || "Login failed"
        };
    }
}

export const handleLogout = async () => {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('auth-token');
        return {
            success: true,
            message: "Logged out successfully"
        };
    } catch (err) {
        return {
            success: false,
            message: "Logout failed"
        };
    }
}

export const getAuthToken = async () => {
    try {
        const cookieStore = await cookies();
        return cookieStore.get('auth-token')?.value;
    } catch (err) {
        return null;
    }
}