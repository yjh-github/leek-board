import { lazy, Suspense } from 'react';
import type { HistoryData, HistoryStats } from '../api';

const LineChart = lazy(() => import('recharts').then(m => ({ default: m.LineChart })));
const Line = lazy(() => import('recharts').then(m => ({ default: m.Line })));
const XAxis = lazy(() => import('recharts').then(m => ({ default: m.XAxis })));
const YAxis = lazy(() => import('recharts').then(m => ({ default: m.YAxis })));
const CartesianGrid = lazy(() => import('recharts').then(m => ({ default: m.CartesianGrid })));
const Tooltip = lazy(() => import('recharts').then(m => ({ default: m.Tooltip })));
const ResponsiveContainer = lazy(() => import('recharts').then(m => ({ default: m.ResponsiveContainer })));
const Legend = lazy(() => import('recharts').then(m => ({ default: m.Legend })));

interface ProfitChartProps {
  data: HistoryData[];
  stats?: HistoryStats | null;
}

function ChartContent({ data }: { data: HistoryData[] }) {
  const chartData = data.map(item => ({
    date: item.date.slice(5),
    profit: parseFloat(item.profit),
    totalValue: parseFloat(item.totalValue),
  }));

  const maxProfit = chartData.length > 0 ? Math.max(...chartData.map(d => d.profit)) : 0;
  const minProfit = chartData.length > 0 ? Math.min(...chartData.map(d => d.profit)) : 0;
  const isAllPositive = minProfit >= 0;

  const strokeColor = maxProfit >= 0 && minProfit >= 0 ? '#ef4444' : 
                      maxProfit < 0 && minProfit < 0 ? '#22c55e' : '#3b82f6';

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          stroke="#9ca3af"
        />
        <YAxis 
          tick={{ fontSize: 12, fill: '#9ca3af' }}
          stroke="#9ca3af"
          tickFormatter={(value) => `¥${value}`}
          domain={isAllPositive ? [0, 'auto'] : ['auto', 'auto']}
        />
        <Tooltip 
          formatter={(value) => [`¥${Number(value).toFixed(2)}`, '收益']}
          labelFormatter={(label) => `日期: ${label}`}
          contentStyle={{ 
            backgroundColor: 'var(--tooltip-bg, #fff)', 
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="profit" 
          name="收益"
          stroke={strokeColor}
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ProfitChart({ data, stats }: ProfitChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">收益走势</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">暂无历史数据，刷新数据后即可查看走势图</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">收益走势</h3>
        {stats && (
          <div className="flex gap-4 text-xs">
            <div className="text-right">
              <span className="text-gray-500 dark:text-gray-400">区间收益</span>
              <p className={`font-semibold ${parseFloat(stats.periodReturn) >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {parseFloat(stats.periodReturn) >= 0 ? '+' : ''}{stats.periodReturn}%
              </p>
            </div>
            <div className="text-right">
              <span className="text-gray-500 dark:text-gray-400">最大回撤</span>
              <p className="font-semibold text-green-500">-{stats.maxDrawdown}%</p>
            </div>
          </div>
        )}
      </div>
      <Suspense fallback={<div className="h-[280px] flex items-center justify-center text-gray-500">加载图表...</div>}>
        <ChartContent data={data} />
      </Suspense>
    </div>
  );
}
