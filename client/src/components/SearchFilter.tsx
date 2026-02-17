import { useState, useEffect, useRef } from 'react';

interface SearchFilterProps {
  onSearch: (keyword: string) => void;
  onFilter: (filter: FilterType) => void;
  currentFilter: FilterType;
  placeholder?: string;
}

export type FilterType = 'all' | 'profit' | 'loss' | 'tag';

export function SearchFilter({ onSearch, onFilter, currentFilter, placeholder = '搜索基金代码或名称...' }: SearchFilterProps) {
  const [keyword, setKeyword] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(keyword);
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword, onSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filters: { value: FilterType; label: string; icon: string }[] = [
    { value: 'all', label: '全部', icon: '📋' },
    { value: 'profit', label: '盈利', icon: '📈' },
    { value: 'loss', label: '亏损', icon: '📉' },
  ];

  const currentFilterLabel = filters.find(f => f.value === currentFilter)?.label || '全部';

  return (
    <div className="flex gap-2 items-center">
      <div className="relative flex-1 max-w-xs">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        />
        <svg 
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {keyword && (
          <button
            onClick={() => setKeyword('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
          >
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div ref={filterRef} className="relative">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2 text-sm rounded-lg border transition-colors flex items-center gap-1.5 ${
            currentFilter !== 'all' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
              : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <span>{filters.find(f => f.value === currentFilter)?.icon}</span>
          <span>{currentFilterLabel}</span>
          <svg className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showFilters && (
          <div className="absolute top-full mt-1 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[120px] z-10">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => {
                  onFilter(filter.value);
                  setShowFilters(false);
                }}
                className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  currentFilter === filter.value ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <span>{filter.icon}</span>
                <span>{filter.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
