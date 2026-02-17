export interface Fund {
  id: number;
  fundCode: string;
  fundName: string;
  cost: number;
  shares: number;
  note?: string;
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
}
