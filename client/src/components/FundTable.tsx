import type { Fund } from '../types';

interface FundTableProps {
  funds: Fund[];
  onEdit: (fund: Fund) => void;
  onDelete: (fund: Fund) => void;
  onViewChart: (fund: Fund) => void;
  sortField: string | null;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
}

interface SortIconProps {
  field: string;
  sortField: string | null;
  sortOrder: 'asc' | 'desc';
}

function SortIcon({ field, sortField, sortOrder }: SortIconProps) {
  if (sortField !== field) {
    return <span className="ml-1 text-gray-300 dark:text-gray-600">↕</span>;
  }
  return <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
}

export function FundTable({ funds: originalFunds, onEdit, onDelete, onViewChart, sortField, sortOrder, onSort }: FundTableProps) {
  const formatNumber = (num: number | string, decimals = 2) => {
    const value = typeof num === 'string' ? parseFloat(num) : num;
    return isNaN(value) ? '0.00' : value.toFixed(decimals);
  };

  const sortedFunds = [...originalFunds].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = parseFloat(a[sortField as keyof Fund]?.toString() || '0');
    const bValue = parseFloat(b[sortField as keyof Fund]?.toString() || '0');
    
    if (sortOrder === 'asc') {
      return aValue - bValue;
    }
    return bValue - aValue;
  });

  if (originalFunds.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">暂无基金数据，请添加基金</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                基金代码
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                基金名称
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                备注
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                持仓成本
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                持有份额
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                最新净值
              </th>
              <th 
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => onSort('dailyChange')}
              >
                日涨跌 <SortIcon field="dailyChange" sortField={sortField} sortOrder={sortOrder} />
              </th>
              <th 
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => onSort('currentValue')}
              >
                当前价值 <SortIcon field="currentValue" sortField={sortField} sortOrder={sortOrder} />
              </th>
              <th 
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => onSort('profit')}
              >
                收益 <SortIcon field="profit" sortField={sortField} sortOrder={sortOrder} />
              </th>
              <th 
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => onSort('profitRate')}
              >
                收益率 <SortIcon field="profitRate" sortField={sortField} sortOrder={sortOrder} />
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedFunds.map((fund) => {
              const isProfit = parseFloat(fund.profit) >= 0;
              const dailyChange = parseFloat(fund.dailyChange.toString());
              const isDailyUp = dailyChange >= 0;

              return (
                <tr key={fund.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-mono">
                    {fund.fundCode}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    <button 
                      onClick={() => onViewChart(fund)}
                      className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors text-left flex items-center gap-1"
                    >
                      {fund.fundName}
                      <span className="text-xs opacity-50">📊</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-[100px] truncate" title={fund.note}>
                    {fund.note || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-300">
                    ¥{formatNumber(fund.cost, 5)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-300">
                    {formatNumber(fund.shares, 2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100 font-medium">
                    {fund.nav > 0 ? formatNumber(fund.nav, 4) : '-'}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-medium ${isDailyUp ? 'text-red-500' : 'text-green-500'}`}>
                    {fund.dailyChange ? (isDailyUp ? '+' : '') + formatNumber(fund.dailyChange) + '%' : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-gray-100 font-medium">
                    {fund.currentValue ? '¥' + formatNumber(fund.currentValue) : '-'}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-medium ${isProfit ? 'text-red-500' : 'text-green-500'}`}>
                    {isProfit ? '+' : ''}{fund.profit ? '¥' + formatNumber(fund.profit) : '-'}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-medium ${isProfit ? 'text-red-500' : 'text-green-500'}`}>
                    {fund.profitRate ? (isProfit ? '+' : '') + formatNumber(fund.profitRate) + '%' : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onEdit(fund)}
                      className="text-blue-500 hover:text-blue-700 text-sm mr-2"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => onDelete(fund)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center">
        <span>共 {originalFunds.length} 只基金</span>
        <span>最后更新: {originalFunds[0]?.lastUpdateDate || '-'} | 点击基金名称查看走势</span>
      </div>
    </div>
  );
}
