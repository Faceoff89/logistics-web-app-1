import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface ColFilterProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  sortDir?: 'asc' | 'desc' | null;
  onSort?: (dir: 'asc' | 'desc' | null) => void;
}

export function ColFilter({ value, onChange, placeholder = 'Фильтр...', className = '', sortDir, onSort }: ColFilterProps) {
  return (
    <div className={`relative mt-1 flex items-center gap-0.5 ${className}`}>
      {onSort && (
        <button
          onClick={e => {
            e.stopPropagation();
            onSort(sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc');
          }}
          title={sortDir === 'asc' ? 'А→Я (нажми для Я→А)' : sortDir === 'desc' ? 'Я→А (нажми сбросить)' : 'Сортировать А→Я'}
          className={`shrink-0 p-0.5 rounded transition-colors ${sortDir ? 'text-primary' : 'text-muted-foreground/50 hover:text-muted-foreground'}`}
        >
          <Icon name={sortDir === 'desc' ? 'ArrowDownAZ' : 'ArrowUpAZ'} size={11} />
        </button>
      )}
      <div className="relative flex-1">
        <Icon name="Search" size={10} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onClick={e => e.stopPropagation()}
          className="w-full pl-4 pr-4 py-0.5 text-[11px] border border-border rounded bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary min-w-0"
        />
        {value && (
          <button
            onClick={e => { e.stopPropagation(); onChange(''); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <Icon name="X" size={9} />
          </button>
        )}
      </div>
    </div>
  );
}

export function useColFilters<K extends string>(keys: K[]) {
  const init = Object.fromEntries(keys.map(k => [k, ''])) as Record<K, string>;
  return init;
}
