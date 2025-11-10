import axiosInstance from './axiosInstance';
import { API_ENDPOINTS } from '../../config/api';
import type {
  Client,
  ClientFormData,
  ClientContact,
  ClientAddress,
  PaginatedResponse,
  PaginationParams,
} from '../../types';

export const clientsApi = {
  // Get paginated clients
  getAll: async (params?: PaginationParams): Promise<PaginatedResponse<Client>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.CLIENTS, { params });
    return response.data;
  },

  // Get single client
  getById: async (id: string): Promise<Client> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.CLIENTS}/${id}`);
    return response.data.data || response.data;
  },

  // Create client
  create: async (data: ClientFormData): Promise<Client> => {
    const response = await axiosInstance.post(API_ENDPOINTS.CLIENTS, data);
    return response.data.data || response.data;
  },

  // Update client
  update: async (id: string, data: Partial<ClientFormData>): Promise<Client> => {
    const response = await axiosInstance.patch(`${API_ENDPOINTS.CLIENTS}/${id}`, data);
    return response.data.data || response.data;
  },

  // Delete client
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`${API_ENDPOINTS.CLIENTS}/${id}`);
  },

  // Get client contacts
  getContacts: async (clientId: string): Promise<ClientContact[]> => {
    const response = await axiosInstance.get(API_ENDPOINTS.CLIENT_CONTACTS(clientId));
    return response.data.data || response.data;
  },

  // Add client contact
  addContact: async (clientId: string, data: Omit<ClientContact, 'id' | 'clientId' | 'createdAt' | 'updatedAt'>): Promise<ClientContact> => {
    const response = await axiosInstance.post(API_ENDPOINTS.CLIENT_CONTACTS(clientId), data);
    return response.data.data || response.data;
  },

  // Get client addresses
  getAddresses: async (clientId: string): Promise<ClientAddress[]> => {
    const response = await axiosInstance.get(API_ENDPOINTS.CLIENT_ADDRESSES(clientId));
    return response.data.data || response.data;
  },

  // Add client address
  addAddress: async (clientId: string, data: Omit<ClientAddress, 'id' | 'clientId' | 'createdAt' | 'updatedAt'>): Promise<ClientAddress> => {
    const response = await axiosInstance.post(API_ENDPOINTS.CLIENT_ADDRESSES(clientId), data);
    return response.data.data || response.data;
  },

  // Get client history
  getHistory: async (clientId: string): Promise<any> => {
    const response = await axiosInstance.get(API_ENDPOINTS.CLIENT_HISTORY(clientId));
    return response.data.data || response.data;
  },
};
