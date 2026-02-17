import type { Fund, FundFormData, FundStats } from './types';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export interface ExportData {
  version: string;
  exportDate: string;
  funds: Fund[];
  dailyData: Array<{
    id: number;
    fundCode: string;
    nav: number;
    dailyChange: number;
    date: string;
  }>;
}

export interface HistoryData {
  date: string;
  totalValue: string;
  totalCost: string;
  profit: string;
  nav: number;
}

export interface HistoryStats {
  maxDrawdown: string;
  maxDrawdownStart: string;
  maxDrawdownEnd: string;
  periodReturn: string;
  dataPoints: number;
}

export interface HistoryResponse {
  data: HistoryData[];
  stats: HistoryStats;
}

export type PeriodType = '1m' | '3m' | '6m' | '1y' | 'all';

export const fundApi = {
  getFunds: () => api.get<Fund[]>('/funds').then(res => res.data),
  
  addFund: (data: FundFormData) => api.post<Fund>('/funds', data).then(res => res.data),
  
  updateFund: (id: number, data: Partial<FundFormData>) => 
    api.put<Fund>(`/funds/${id}`, data).then(res => res.data),
  
  deleteFund: (id: number) => api.delete(`/funds/${id}`),
  
  refreshData: () => api.post('/funds/refresh').then(res => res.data),
  
  getStats: () => api.get<FundStats>('/stats').then(res => res.data),
  
  getHistory: (fundCode?: string, period: PeriodType = 'all'): Promise<HistoryResponse> => 
    api.get<HistoryResponse>('/history', { params: { fundCode, period } }).then(res => res.data),
  
  exportData: () => api.get<ExportData>('/export').then(res => res.data),
  
  importData: (data: ExportData) => api.post('/import', data).then(res => res.data),
};

const SETTINGS_KEY = 'fund-board-settings';

const defaultSettings: import('./types').UserSettings = {
  autoRefresh: false,
  refreshInterval: 60,
  sortField: null,
  sortOrder: 'desc',
  darkMode: false,
};

export const settingsApi = {
  getSettings: (): import('./types').UserSettings => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        return { ...defaultSettings, ...JSON.parse(saved) };
      }
    } catch {
      // ignore parse errors
    }
    return defaultSettings;
  },
  
  saveSettings: (settings: import('./types').UserSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },
};

const CACHE_KEY = 'fund-board-cache';
const CACHE_EXPIRY = 5 * 60 * 1000;

export const cacheApi = {
  getCache: () => {
    try {
      const saved = localStorage.getItem(CACHE_KEY);
      if (saved) {
        const { data, timestamp } = JSON.parse(saved);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return data;
        }
      }
    } catch {
      // ignore parse errors
    }
    return null;
  },
  
  setCache: (data: { funds: Fund[]; stats: FundStats }) => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  },
  
  clearCache: () => {
    localStorage.removeItem(CACHE_KEY);
  },
};
