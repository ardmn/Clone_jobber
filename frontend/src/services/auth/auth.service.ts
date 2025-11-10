import axiosInstance from '../api/axiosInstance';
import { API_ENDPOINTS } from '../../config/api';
import { LOCAL_STORAGE_KEYS } from '../../config/constants';
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
} from '../../types';

export const authService = {
  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.LOGIN, credentials);
    const authData = response.data;

    // Store tokens and user
    localStorage.setItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, authData.accessToken);
    localStorage.setItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN, authData.refreshToken);
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(authData.user));

    return authData;
  },

  // Register
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.REGISTER, data);
    const authData = response.data;

    // Store tokens and user
    localStorage.setItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, authData.accessToken);
    localStorage.setItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN, authData.refreshToken);
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(authData.user));

    return authData;
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await axiosInstance.post(API_ENDPOINTS.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call result
      localStorage.removeItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
    }
  },

  // Get current user from localStorage
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
    return !!token;
  },

  // Refresh token
  refreshToken: async (): Promise<string> => {
    const refreshToken = localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axiosInstance.post(
      API_ENDPOINTS.REFRESH_TOKEN,
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      }
    );

    const { accessToken } = response.data;
    localStorage.setItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, accessToken);

    return accessToken;
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<void> => {
    await axiosInstance.post(API_ENDPOINTS.FORGOT_PASSWORD, { email });
  },

  // Reset password
  resetPassword: async (token: string, password: string): Promise<void> => {
    await axiosInstance.post(API_ENDPOINTS.RESET_PASSWORD, { token, password });
  },

  // Verify email
  verifyEmail: async (token: string): Promise<void> => {
    await axiosInstance.post(API_ENDPOINTS.VERIFY_EMAIL, { token });
  },
};
