import axios from './axios';
import { API } from './endpoints';
import Cookies from 'js-cookie';

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return (
    Cookies.get('auth-token') ||
    localStorage.getItem('auth-token') ||
    localStorage.getItem('token')
  );
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    Authorization: `Bearer ${token || ''}`,
  };
};

export type ReportType = 'stay' | 'experience' | 'host';
export type ReportStatus = 'open' | 'resolved';

export interface CreateReportPayload {
  reportType: ReportType;
  hostName: string;
  location: string;
  problem: string;
  itemId?: string;
  itemTitle?: string;
  sourcePlatform?: 'web' | 'mobile' | 'unknown';
}

export interface AdminReport {
  _id: string;
  reportType: ReportType;
  hostName: string;
  location: string;
  problem: string;
  status: ReportStatus;
  itemId?: string | null;
  itemTitle?: string | null;
  sourcePlatform?: 'web' | 'mobile' | 'unknown';
  createdAt: string;
  updatedAt: string;
  reporterId?: {
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
  } | null;
}

export const createReport = async (payload: CreateReportPayload) => {
  const response = await axios.post(API.REPORTS.CREATE, payload, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getAdminReports = async (params?: { limit?: number }) => {
  const response = await axios.get(API.REPORTS.ADMIN_LIST, {
    params,
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const updateAdminReportStatus = async (id: string, status: ReportStatus) => {
  const response = await axios.patch(
    API.REPORTS.ADMIN_STATUS(id),
    { status },
    { headers: getAuthHeaders() },
  );
  return response.data;
};
