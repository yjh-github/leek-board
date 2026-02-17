import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Fund, FundFormData } from '../types';

interface FundFormProps {
  fund?: Fund | null;
  onSubmit: (data: FundFormData) => void;
  onClose: () => void;
  submitting?: boolean;
}

function getInitialFormData(fund?: Fund | null): FundFormData {
  if (fund) {
    return {
      fundCode: fund.fundCode,
      fundName: fund.fundName,
      cost: fund.cost,
      shares: fund.shares,
      note: fund.note || '',
    };
  }
  return {
    fundCode: '',
    fundName: '',
    cost: 0,
    shares: 0,
    note: '',
  };
}

function validateFundCode(code: string): { valid: boolean; message: string } {
  if (!code) {
    return { valid: false, message: '请输入基金代码' };
  }
  if (!/^\d{6}$/.test(code)) {
    return { valid: false, message: '基金代码应为6位数字' };
  }
  return { valid: true, message: '' };
}

export function FundForm({ fund, onSubmit, onClose, submitting }: FundFormProps) {
  const initialData = useMemo(() => getInitialFormData(fund), [fund]);
  const [formData, setFormData] = useState<FundFormData>(initialData);
  const [isVisible, setIsVisible] = useState(false);
  const [codeError, setCodeError] = useState<string>('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleClose = useCallback(() => {
    if (submitting) return;
    setIsVisible(false);
    setTimeout(onClose, 200);
  }, [submitting, onClose]);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [submitting, handleClose]);

  const handleCodeChange = (value: string) => {
    const filtered = value.replace(/\D/g, '').slice(0, 6);
    setFormData({ ...formData, fundCode: filtered });
    if (touched) {
      const validation = validateFundCode(filtered);
      setCodeError(validation.message);
    }
  };

  const handleCodeBlur = () => {
    setTouched(true);
    const validation = validateFundCode(formData.fundCode);
    setCodeError(validation.message);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateFundCode(formData.fundCode);
    if (!validation.valid) {
      setCodeError(validation.message);
      setTouched(true);
      return;
    }
    onSubmit(formData);
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transition-all duration-200 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            {fund ? '编辑基金' : '添加基金'}
          </h2>
          <button 
            onClick={handleClose}
            disabled={submitting}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                基金代码 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.fundCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                onBlur={handleCodeBlur}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
                  codeError 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                }`}
                placeholder="请输入6位数字基金代码"
                disabled={!!fund || submitting}
                maxLength={6}
              />
              {codeError && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {codeError}
                </p>
              )}
              {fund && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">基金代码不可修改</p>}
            </div>
            
            {fund && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  基金名称
                </label>
                <input
                  type="text"
                  value={formData.fundName}
                  onChange={(e) => setFormData({ ...formData, fundName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                  disabled={submitting}
                  required
                />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  持仓成本 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                  placeholder="买入净值"
                  disabled={submitting}
                  required
                  min={0}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  持有份额 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.shares}
                  onChange={(e) => setFormData({ ...formData, shares: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                  placeholder="份额"
                  disabled={submitting}
                  required
                  min={0}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                备注（可选）
              </label>
              <input
                type="text"
                value={formData.note || ''}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                placeholder="例如: 定投、抄底等"
                disabled={submitting}
                maxLength={50}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-wait flex items-center gap-2"
            >
              {submitting && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              )}
              {fund ? '保存' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
