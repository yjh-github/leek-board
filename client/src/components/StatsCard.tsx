import type { FundStats, Fund } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface StatsCardProps {
  stats: FundStats | null;
  funds: Fund[];
}

export function StatsCard({ stats, funds }: StatsCardProps) {
  if (!stats) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-500 dark:text-gray-400">加载中...</p>
      </div>
    );
  }

  const isProfit = parseFloat(stats.totalProfit) >= 0;

  const pieData = funds.map(fund => ({
    name: fund.fundName.length > 8 ? fund.fundName.slice(0, 8) + '...' : fund.fundName,
    value: parseFloat(fund.currentValue),
    code: fund.fundCode,
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-gray-500 dark:text-gray-400 text-sm">持仓基金数</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.fundCount}</p>
          {stats.profitCount !== undefined && (
            <p className="text-xs mt-1">
              <span className="text-red-500">{stats.profitCount}盈</span>
              <span className="text-gray-400 mx-1">/</span>
              <span className="text-green-500">{stats.lossCount}亏</span>
            </p>
          )}
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-gray-500 dark:text-gray-400 text-sm">持仓总成本</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">¥{parseFloat(stats.totalCost).toLocaleString()}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-gray-500 dark:text-gray-400 text-sm">当前总价值</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">¥{parseFloat(stats.totalValue).toLocaleString()}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-gray-500 dark:text-gray-400 text-sm">总收益</p>
          <p className={`text-2xl font-bold ${isProfit ? 'text-red-500' : 'text-green-500'}`}>
            {isProfit ? '+' : ''}{parseFloat(stats.totalProfit).toLocaleString()} 
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-gray-500 dark:text-gray-400 text-sm">总收益率</p>
          <p className={`text-2xl font-bold ${isProfit ? 'text-red-500' : 'text-green-500'}`}>
            {isProfit ? '+' : ''}{stats.totalProfitRate}%
          </p>
        </div>
      </div>

      {funds.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">持仓占比</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => `¥${Number(value).toFixed(2)}`}
                contentStyle={{ 
                  backgroundColor: 'var(--tooltip-bg, #fff)', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
