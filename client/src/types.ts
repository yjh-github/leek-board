export interface Fund {
  id: number;
  fundCode: string;
  fundName: string;
  cost: number;
  shares: number;
  note?: string;
  tags?: string;
  nav: number;
  dailyChange: number;
  currentValue: string;
  profit: string;
  profitRate: string;
  lastUpdateDate?: string;
}

export interface FundFormData {
  fundCode: string;
  fundName?: string;
  cost: number;
  shares: number;
  note?: string;
  tags?: string;
}

export interface FundStats {
  totalCost: string;
  totalValue: string;
  totalProfit: string;
  totalProfitRate: string;
  fundCount: number;
  profitCount?: number;
  lossCount?: number;
}

export interface UserSettings {
  autoRefresh: boolean;
  refreshInterval: number;
  sortField: string | null;
  sortOrder: 'asc' | 'desc';
  darkMode: boolean;
  pageSize?: number;
}

export const DEFAULT_TAGS = [
  { value: '核心', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: '定投', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: '抄底', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: '观察', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  { value: '止盈', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
];
