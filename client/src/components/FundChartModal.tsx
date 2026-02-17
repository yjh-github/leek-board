import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceArea } from 'recharts';
import type { HistoryData, HistoryStats, PeriodType } from '../api';

interface FundChartModalProps {
  fundCode: string;
  fundName: string;
  onClose: () => void;
  onLoad: (fundCode: string, period: PeriodType) => Promise<{ data: HistoryData[]; stats: HistoryStats }>;
}

export function FundChartModal({ fundCode, fundName, onClose, onLoad }: FundChartModalProps) {
  const [period, setPeriod] = useState<PeriodType>('all');
  const [data, setData] = useState<HistoryData[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDrawdown, setShowDrawdown] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  }, [onClose]);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [handleClose]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await onLoad(fundCode, period);
        setData(result.data);
        setStats(result.stats);
      } catch (err) {
        console.error('Failed to load fund history:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fundCode, period, onLoad]);

  const chartData = data.map(item => ({
    date: item.date.slice(5),
    fullDate: item.date,
    profit: parseFloat(item.profit),
    totalValue: parseFloat(item.totalValue),
  }));

  const maxProfit = chartData.length > 0 ? Math.max(...chartData.map(d => d.profit)) : 0;
  const minProfit = chartData.length > 0 ? Math.min(...chartData.map(d => d.profit)) : 0;
  const isAllPositive = minProfit >= 0;

  const strokeColor = maxProfit >= 0 && minProfit >= 0 ? '#ef4444' : 
                      maxProfit < 0 && minProfit < 0 ? '#22c55e' : '#3b82f6';

  const periodLabels: Record<PeriodType, string> = {
    '1m': '1个月',
    '3m': '3个月',
    '6m': '半年',
    '1y': '1年',
    'all': '成立以来',
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden transition-all duration-200 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{fundName}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{fundCode}</p>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex gap-2">
          {(Object.keys(periodLabels) as PeriodType[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                period === p 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        {stats && (
          <div className="px-6 py-3 grid grid-cols-3 gap-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">区间收益</span>
              <p className={`text-lg font-semibold ${parseFloat(stats.periodReturn) >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {parseFloat(stats.periodReturn) >= 0 ? '+' : ''}{stats.periodReturn}%
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">最大回撤</span>
              <p className="text-lg font-semibold text-green-500">-{stats.maxDrawdown}%</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">数据点</span>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">{stats.dataPoints}</p>
            </div>
          </div>
        )}

        {stats && stats.maxDrawdownStart && (
          <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showDrawdown}
                onChange={(e) => setShowDrawdown(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-gray-600 dark:text-gray-300">
                显示最大回撤区间 ({stats.maxDrawdownStart} ~ {stats.maxDrawdownEnd})
              </span>
            </label>
          </div>
        )}

        <div className="p-6">
          {loading ? (
            <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                加载中...
              </div>
            </div>
          ) : data.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
              暂无历史数据
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  stroke="#9ca3af"
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  stroke="#9ca3af"
                  tickFormatter={(value) => `¥${value}`}
                  domain={isAllPositive ? [0, 'auto'] : ['auto', 'auto']}
                />
                <Tooltip 
                  formatter={(value) => [`¥${Number(value).toFixed(2)}`, '收益']}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload;
                    return `日期: ${item?.fullDate || label}`;
                  }}
                  contentStyle={{ 
                    backgroundColor: 'var(--tooltip-bg, #fff)', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend />
                {showDrawdown && stats?.maxDrawdownStart && stats?.maxDrawdownEnd && (
                  <ReferenceArea
                    x1={stats.maxDrawdownStart.slice(5)}
                    x2={stats.maxDrawdownEnd.slice(5)}
                    strokeOpacity={0.3}
                    fill="#ef4444"
                    fillOpacity={0.15}
                  />
                )}
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  name="收益"
                  stroke={strokeColor}
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
