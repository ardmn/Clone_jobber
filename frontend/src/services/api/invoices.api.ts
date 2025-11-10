import axiosInstance from './axiosInstance';
import { API_ENDPOINTS } from '../../config/api';
import type {
  Invoice,
  InvoiceFormData,
  PaginatedResponse,
  PaginationParams,
} from '../../types';

export const invoicesApi = {
  // Get paginated invoices
  getAll: async (params?: PaginationParams & { status?: string; clientId?: string }): Promise<PaginatedResponse<Invoice>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.INVOICES, { params });
    return response.data;
  },

  // Get single invoice
  getById: async (id: string): Promise<Invoice> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.INVOICES}/${id}`);
    return response.data.data || response.data;
  },

  // Create invoice
  create: async (data: InvoiceFormData): Promise<Invoice> => {
    const response = await axiosInstance.post(API_ENDPOINTS.INVOICES, data);
    return response.data.data || response.data;
  },

  // Update invoice
  update: async (id: string, data: Partial<InvoiceFormData>): Promise<Invoice> => {
    const response = await axiosInstance.patch(`${API_ENDPOINTS.INVOICES}/${id}`, data);
    return response.data.data || response.data;
  },

  // Delete invoice
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`${API_ENDPOINTS.INVOICES}/${id}`);
  },

  // Send invoice
  send: async (id: string, data: { method: 'email' | 'sms'; message?: string }): Promise<Invoice> => {
    const response = await axiosInstance.post(API_ENDPOINTS.INVOICE_SEND(id), data);
    return response.data.data || response.data;
  },

  // Record payment
  recordPayment: async (id: string, data: { amount: number; method: string; notes?: string }): Promise<Invoice> => {
    const response = await axiosInstance.post(API_ENDPOINTS.INVOICE_RECORD_PAYMENT(id), data);
    return response.data.data || response.data;
  },
};
