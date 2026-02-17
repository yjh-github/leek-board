import type { Fund, UserSettings } from '../types';
import { DEFAULT_TAGS } from '../types';

interface FundTableProps {
  funds: Fund[];
  onEdit: (fund: Fund) => void;
  onDelete: (fund: Fund) => void;
  onViewChart: (fund: Fund) => void;
  sortField: string | null;
  sortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
  settings: UserSettings;
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

function TagBadge({ tag }: { tag: string }) {
  const tagConfig = DEFAULT_TAGS.find(t => t.value === tag) || {
    value: tag,
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  };
  
  return (
    <span className={`px-1.5 py-0.5 text-xs rounded-full ${tagConfig.color}`}>
      {tag}
    </span>
  );
}

export function FundTable({ funds: originalFunds, onEdit, onDelete, onViewChart, sortField, sortOrder, onSort, settings }: FundTableProps) {
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

  const pageSize = settings.pageSize || 10;
  const totalPages = Math.ceil(sortedFunds.length / pageSize);
  const currentPage = 1;

  const paginatedFunds = sortedFunds.slice(0, pageSize);

  if (originalFunds.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">还没有添加基金</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">点击上方"添加"按钮或按 <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">N</kbd> 键添加第一只基金</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">示例基金代码：161039、110022、519778</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-16">
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
                标签
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
            {paginatedFunds.map((fund) => {
              const isProfit = parseFloat(fund.profit) >= 0;
              const dailyChange = parseFloat(fund.dailyChange.toString());
              const isDailyUp = dailyChange >= 0;
              const tags = fund.tags ? fund.tags.split(',').filter(t => t) : [];

              return (
                <tr 
                  key={fund.id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
                  onDoubleClick={() => onEdit(fund)}
                >
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-mono">
                    {fund.fundCode}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    <button 
                      onClick={() => onViewChart(fund)}
                      className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors text-left flex items-center gap-1"
                    >
                      {fund.fundName}
                      <span className="text-xs opacity-0 group-hover:opacity-50 transition-opacity">📊</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-wrap gap-1">
                      {tags.length > 0 ? (
                        tags.map(tag => <TagBadge key={tag} tag={tag} />)
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </div>
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
                      onClick={(e) => { e.stopPropagation(); onEdit(fund); }}
                      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                      title="编辑"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(fund); }}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                      title="删除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center">
        <span>共 {originalFunds.length} 只基金 · 双击行编辑</span>
        <div className="flex items-center gap-2">
          {totalPages > 1 && (
            <span>第 {currentPage}/{totalPages} 页</span>
          )}
          <span>最后更新: {originalFunds[0]?.lastUpdateDate || '-'}</span>
        </div>
      </div>
    </div>
  );
}
