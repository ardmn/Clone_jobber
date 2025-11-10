import axiosInstance from './axiosInstance';
import { API_ENDPOINTS } from '../../config/api';
import type {
  Quote,
  QuoteFormData,
  PaginatedResponse,
  PaginationParams,
} from '../../types';

export const quotesApi = {
  // Get paginated quotes
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Quote>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.QUOTES, { params });
    return response.data;
  },

  // Get single quote
  getById: async (id: string): Promise<Quote> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.QUOTES}/${id}`);
    return response.data.data || response.data;
  },

  // Create quote
  create: async (data: QuoteFormData): Promise<Quote> => {
    const response = await axiosInstance.post(API_ENDPOINTS.QUOTES, data);
    return response.data.data || response.data;
  },

  // Update quote
  update: async (id: string, data: Partial<QuoteFormData>): Promise<Quote> => {
    const response = await axiosInstance.patch(`${API_ENDPOINTS.QUOTES}/${id}`, data);
    return response.data.data || response.data;
  },

  // Delete quote
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`${API_ENDPOINTS.QUOTES}/${id}`);
  },

  // Send quote
  send: async (id: string, data: { method: 'email' | 'sms'; message?: string }): Promise<Quote> => {
    const response = await axiosInstance.post(API_ENDPOINTS.QUOTE_SEND(id), data);
    return response.data.data || response.data;
  },

  // Convert quote to job
  convertToJob: async (id: string): Promise<any> => {
    const response = await axiosInstance.post(API_ENDPOINTS.QUOTE_CONVERT(id));
    return response.data.data || response.data;
  },
};
