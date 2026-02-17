import { useState, useEffect, useCallback, useRef } from 'react';
import type { Fund, FundFormData, FundStats, UserSettings } from './types';
import { fundApi, settingsApi, cacheApi, type ExportData, type HistoryData, type HistoryStats, type PeriodType } from './api';
import { StatsCard } from './components/StatsCard';
import { FundTable } from './components/FundTable';
import { FundForm } from './components/FundForm';
import { ProfitChart } from './components/ProfitChart';
import { FundChartModal } from './components/FundChartModal';

function App() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [stats, setStats] = useState<FundStats | null>(null);
  const [history, setHistory] = useState<HistoryData[]>([]);
  const [historyStats, setHistoryStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingFund, setEditingFund] = useState<Fund | null>(null);
  const [chartModal, setChartModal] = useState<Fund | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(settingsApi.getSettings());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  const saveSettings = useCallback((newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    settingsApi.saveSettings(updated);
  }, [settings]);

  const loadData = useCallback(async (useCache = true) => {
    try {
      setError(null);
      
      if (useCache) {
        const cached = cacheApi.getCache();
        if (cached) {
          setFunds(cached.funds);
          setStats(cached.stats);
        }
      }

      const [fundsData, statsData, historyResponse] = await Promise.all([
        fundApi.getFunds(),
        fundApi.getStats(),
        fundApi.getHistory(),
      ]);
      setFunds(fundsData);
      setStats(statsData);
      setHistory(historyResponse.data);
      setHistoryStats(historyResponse.stats);
      cacheApi.setCache({ funds: fundsData, stats: statsData });
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('加载数据失败，请检查后端服务是否启动');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      await fundApi.refreshData();
      await loadData(false);
      if (!silent) setSuccess('数据刷新成功');
    } catch (err) {
      console.error('Failed to refresh:', err);
      if (!silent) setError('刷新数据失败');
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (settings.autoRefresh) {
      intervalRef.current = setInterval(() => {
        handleRefresh(true);
      }, settings.refreshInterval * 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [settings.autoRefresh, settings.refreshInterval, handleRefresh]);

  const handleAddFund = async (data: FundFormData) => {
    setSubmitting(true);
    setError(null);
    try {
      await fundApi.addFund(data);
      await fundApi.refreshData();
      await loadData(false);
      setShowForm(false);
      setSuccess('基金添加成功');
    } catch (err: unknown) {
      console.error('Failed to add fund:', err);
      const errorObj = err as { response?: { data?: { error?: string } }; message?: string };
      const msg = errorObj?.response?.data?.error || errorObj?.message || '添加失败';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditFund = async (data: FundFormData) => {
    if (!editingFund) return;
    setSubmitting(true);
    setError(null);
    try {
      await fundApi.updateFund(editingFund.id, data);
      await loadData(false);
      setEditingFund(null);
      setSuccess('基金更新成功');
    } catch (err: unknown) {
      console.error('Failed to update fund:', err);
      const errorObj = err as { response?: { data?: { error?: string } } };
      setError(errorObj?.response?.data?.error || '更新失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFund = async (id: number) => {
    if (!confirm('确定要删除这只基金吗？')) return;
    setError(null);
    try {
      await fundApi.deleteFund(id);
      await loadData(false);
      setSuccess('基金删除成功');
    } catch (err: unknown) {
      console.error('Failed to delete fund:', err);
      const errorObj = err as { response?: { data?: { error?: string } } };
      setError(errorObj?.response?.data?.error || '删除失败');
    }
  };

  const loadFundHistory = useCallback(async (fundCode: string, period: PeriodType) => {
    return fundApi.getHistory(fundCode, period);
  }, []);

  const handleExport = async () => {
    try {
      const data = await fundApi.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fund-board-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess('数据导出成功');
    } catch (err) {
      console.error('Failed to export:', err);
      setError('导出失败');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data: ExportData = JSON.parse(text);
      
      if (!data.funds || !Array.isArray(data.funds)) {
        setError('无效的数据格式');
        return;
      }

      const result = await fundApi.importData(data);
      await loadData(false);
      setSuccess(`导入成功：${result.importedFunds} 只基金，${result.importedDailyData} 条历史数据`);
    } catch (err) {
      console.error('Failed to import:', err);
      setError('导入失败，请检查文件格式');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSort = (field: string) => {
    if (settings.sortField === field) {
      saveSettings({ sortOrder: settings.sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      saveSettings({ sortField: field, sortOrder: 'desc' });
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingFund(null);
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-gray-500 dark:text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">基金看板</h1>
          <div className="flex gap-2 items-center flex-wrap">
            <button
              onClick={() => saveSettings({ darkMode: !settings.darkMode })}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={settings.darkMode ? '切换到浅色模式' : '切换到深色模式'}
            >
              {settings.darkMode ? '☀️' : '🌙'}
            </button>
            <label className="flex items-center gap-1 cursor-pointer text-sm text-gray-600 dark:text-gray-300 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <input
                type="checkbox"
                checked={settings.autoRefresh}
                onChange={(e) => saveSettings({ autoRefresh: e.target.checked })}
                className="w-4 h-4"
              />
              <span>自动</span>
            </label>
            {settings.autoRefresh && (
              <select
                value={settings.refreshInterval}
                onChange={(e) => saveSettings({ refreshInterval: Number(e.target.value) })}
                className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={30}>30秒</option>
                <option value={60}>1分钟</option>
                <option value={300}>5分钟</option>
                <option value={600}>10分钟</option>
              </select>
            )}
            <button
              onClick={handleExport}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              导出
            </button>
            <label className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors">
              导入
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <button
              onClick={() => handleRefresh()}
              disabled={refreshing}
              className="px-4 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors flex items-center gap-1.5"
            >
              <svg 
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refreshing ? '刷新中' : '刷新'}
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
            >
              添加
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4">
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4 animate-fadeIn">
            {error}
            <button onClick={() => setError(null)} className="float-right font-bold">&times;</button>
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-4 animate-fadeIn">
            {success}
          </div>
        )}
        
        <StatsCard stats={stats} funds={funds} />
        
        <div className="mb-4">
          <ProfitChart data={history} stats={historyStats} />
        </div>
        
        <FundTable 
          funds={funds} 
          onEdit={setEditingFund}
          onDelete={handleDeleteFund}
          onViewChart={setChartModal}
          sortField={settings.sortField}
          sortOrder={settings.sortOrder}
          onSort={handleSort}
        />
      </main>

      {(showForm || editingFund) && (
        <FundForm
          fund={editingFund}
          onSubmit={editingFund ? handleEditFund : handleAddFund}
          onClose={closeForm}
          submitting={submitting}
        />
      )}

      {chartModal && (
        <FundChartModal
          fundCode={chartModal.fundCode}
          fundName={chartModal.fundName}
          onClose={() => setChartModal(null)}
          onLoad={loadFundHistory}
        />
      )}
    </div>
  );
}

export default App;
