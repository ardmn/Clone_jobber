import axiosInstance from './axiosInstance';
import { API_ENDPOINTS } from '../../config/api';
import type {
  Job,
  JobFormData,
  JobPhoto,
  PaginatedResponse,
  PaginationParams,
} from '../../types';

export const jobsApi = {
  // Get paginated jobs
  getAll: async (params?: PaginationParams & { date?: string; status?: string; assignedTo?: string }): Promise<PaginatedResponse<Job>> => {
    const response = await axiosInstance.get(API_ENDPOINTS.JOBS, { params });
    return response.data;
  },

  // Get single job
  getById: async (id: string): Promise<Job> => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.JOBS}/${id}`);
    return response.data.data || response.data;
  },

  // Create job
  create: async (data: JobFormData): Promise<Job> => {
    const response = await axiosInstance.post(API_ENDPOINTS.JOBS, data);
    return response.data.data || response.data;
  },

  // Update job
  update: async (id: string, data: Partial<JobFormData>): Promise<Job> => {
    const response = await axiosInstance.patch(`${API_ENDPOINTS.JOBS}/${id}`, data);
    return response.data.data || response.data;
  },

  // Delete job
  delete: async (id: string): Promise<void> => {
    await axiosInstance.delete(`${API_ENDPOINTS.JOBS}/${id}`);
  },

  // Start job
  start: async (id: string): Promise<Job> => {
    const response = await axiosInstance.post(API_ENDPOINTS.JOB_START(id));
    return response.data.data || response.data;
  },

  // Complete job
  complete: async (id: string, data: { signature?: string; photos?: string[]; completionNotes?: string }): Promise<Job> => {
    const response = await axiosInstance.post(API_ENDPOINTS.JOB_COMPLETE(id), data);
    return response.data.data || response.data;
  },

  // Cancel job
  cancel: async (id: string, reason?: string): Promise<Job> => {
    const response = await axiosInstance.post(API_ENDPOINTS.JOB_CANCEL(id), { reason });
    return response.data.data || response.data;
  },

  // Get job photos
  getPhotos: async (id: string): Promise<JobPhoto[]> => {
    const response = await axiosInstance.get(API_ENDPOINTS.JOB_PHOTOS(id));
    return response.data.data || response.data;
  },

  // Add job photo
  addPhoto: async (id: string, data: FormData): Promise<JobPhoto> => {
    const response = await axiosInstance.post(API_ENDPOINTS.JOB_PHOTOS(id), data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data || response.data;
  },
};
