import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { ApiError, ApiResponse } from "../types/api";
import { APP_EVENTS, appEvents } from "./event-emitter";

import Constants from 'expo-constants';

const getApiUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL || process.env.API_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // Auto-detect host IP when running via Expo on a physical mobile device / emulator
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:3001`;
    }
  }

  return envUrl || "http://localhost:3001";
};

const API_URL = getApiUrl();

console.log("🔧 API Configuration:", { API_URL });

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_URL}/api/v1`,
      timeout: 15000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
    this.loadToken();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors() {
    console.log("🔧 Setting up API interceptors");

    // Request interceptor - add auth token and branch_id
    this.api.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Jika token belum dimuat, coba muat dari storage
        if (!this.token) {
          await this.loadToken();
        }

        // Tambahkan token ke header jika ada
        if (this.token && config.headers) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }

        // Tambahkan branch_id ke header untuk filter outlet
        if (typeof window !== "undefined") {
          try {
            const branchId = await AsyncStorage.getItem("current_branch_id");
            console.log("🔧 Branch ID:", branchId);
            if (branchId && config.headers) {
              config.headers["branch_id"] = branchId;
            }
          } catch (error) {
            // Ignore error loading branch_id
          }
        }

        console.log(
          `📤 API Request: ${config.method?.toUpperCase()} ${config.url}`
        );
        return config;
      },
      error => {
        console.error("❌ Request Error:", error);
        return Promise.reject(error);
      }
    );


    // Response interceptor - handle errors
    this.api.interceptors.response.use(
      response => {
        console.log(`✅ API Response: ${response.config.url}`, response.status);
        return response;
      },
      async (error: AxiosError<ApiError>) => {
        console.error("❌ API Error:", error.response?.status, error.message);

        // Handle 401 Unauthorized - clear token and redirect to login
        if (error.response?.status === 401) {
          await this.clearToken();
          // Emit event untuk redirect ke login screen
          console.log("🔐 Token expired, emitting TOKEN_EXPIRED event...");
          appEvents.emit(APP_EVENTS.TOKEN_EXPIRED);
        }

        // Format error response
        const apiError: ApiError = {
          code: error.response?.status || 500,
          message:
            error.response?.data?.message ||
            error.message ||
            "Terjadi kesalahan",
          errors: error.response?.data?.errors,
        };

        return Promise.reject(apiError);
      }
    );
  }

  /**
   * Load token from AsyncStorage
   */
  private async loadToken() {
    if (typeof window === "undefined") return;
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (token) {
        this.token = token;
        console.log("🔑 Token loaded from storage");
      }
    } catch (error) {
      console.error("Failed to load token:", error);
    }
  }

  /**
   * Set authentication token
   */
  async setToken(token: string) {
    this.token = token;
    try {
      await AsyncStorage.setItem("auth_token", token);
      console.log("🔑 Token saved to storage");
    } catch (error) {
      console.error("Failed to save token:", error);
    }
  }

  /**
   * Clear authentication token
   */
  async clearToken() {
    this.token = null;
    try {
      await AsyncStorage.removeItem("auth_token");
      console.log("🔑 Token cleared from storage");
    } catch (error) {
      console.error("Failed to clear token:", error);
    }
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token;
  }

  /**
   * Get axios instance for custom requests
   */
  getInstance(): AxiosInstance {
    return this.api;
  }

  /**
   * Generic GET request
   */
  async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    const response = await this.api.get<ApiResponse<T>>(url, { params });
    return response.data;
  }

  /**
   * Generic POST request
   */
  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.api.post<ApiResponse<T>>(url, data);
    return response.data;
  }

  /**
   * Generic PUT request
   */
  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.api.put<ApiResponse<T>>(url, data);
    return response.data;
  }

  /**
   * Generic PATCH request
   */
  async patch<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.api.patch<ApiResponse<T>>(url, data);
    return response.data;
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.api.delete<ApiResponse<T>>(url);
    return response.data;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
