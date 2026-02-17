import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsOptions {
  onAdd?: () => void;
  onRefresh?: () => void;
  onToggleDark?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions) {
  const { onAdd, onRefresh, onToggleDark, enabled = true } = options;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || 
                    target.tagName === 'TEXTAREA' || 
                    target.isContentEditable;

    if (isInput) return;

    switch (e.key.toLowerCase()) {
      case 'n':
        e.preventDefault();
        onAdd?.();
        break;
      case 'r':
        e.preventDefault();
        onRefresh?.();
        break;
      case 'd':
        e.preventDefault();
        onToggleDark?.();
        break;
    }
  }, [enabled, onAdd, onRefresh, onToggleDark]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export const SHORTCUTS = [
  { key: 'N', description: '添加基金' },
  { key: 'R', description: '刷新数据' },
  { key: 'D', description: '切换深色模式' },
  { key: 'Esc', description: '关闭弹窗' },
];
