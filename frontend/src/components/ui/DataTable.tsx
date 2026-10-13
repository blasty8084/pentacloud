import type { ReactNode, HTMLAttributes, ChangeEvent } from 'react';
import { forwardRef, useMemo, useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../Button';
import { Skeleton } from '../Skeleton';
import { EmptyState } from '../EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> extends HTMLAttributes<HTMLTableElement> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  onRowClick?: (row: T) => void;
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  selectable?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  stickyHeader?: boolean;
  striped?: boolean;
  bordered?: boolean;
  compact?: boolean;
}

function SortIcon({ order }: { order: 'asc' | 'desc' }) {
  return order === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
}

function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  showPageSize = false,
  pageSize = 10,
  onPageSizeChange 
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void;
  showPageSize?: boolean;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = useMemo(() => {
    const result = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      result.push(i);
    }
    return result;
  }, [currentPage, totalPages]);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-surface-border">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <span>Showing</span>
        <select 
          value={10}
          onChange={(e) => onPageSizeChange?.(parseInt(e.target.value))}
          disabled={!showPageSize}
          className="input py-1 px-2 text-xs w-auto"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span>rows</span>
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <div className="flex items-center gap-1">
          {pages.map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                page === currentPage
                  ? 'bg-accent-primary text-accent-on-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
              }`}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          ))}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = 'No data available',
  emptyIcon,
  onRowClick,
  selectedKeys = new Set(),
  onSelectionChange,
  selectable = false,
  sortBy,
  sortOrder,
  onSort,
  stickyHeader = true,
  striped = true,
  bordered = true,
  compact = false,
  className = '',
  ...props
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{ key: string; order: 'asc' | 'desc' } | null>({ 
    key: sortBy || '', 
    order: sortOrder || 'asc' 
  });

  const handleSort = (key: string) => {
    if (!onSort) return;
    const newOrder = sortConfig.key === key && sortConfig.order === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, order: newOrder });
    onSort(key);
  };

  const handleRowClick = (row: T) => {
    onRowClick?.(row);
  };

  const handleSelectionChange = (key: string, checked: boolean) => {
    const newKeys = new Set(selectedKeys);
    if (checked) {
      newKeys.add(key);
    } else {
      newKeys.delete(key);
    }
    onSelectionChange?.(newKeys);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allKeys = new Set(data.map(keyExtractor));
      onSelectionChange?.(allKeys);
    } else {
      onSelectionChange?.(new Set());
    }
  };

  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(data.length / pageSize);

  const isAllSelected = data.length > 0 && data.every(row => selectedKeys.has(keyExtractor(row)));
  const isIndeterminate = data.length > 0 && data.some(row => selectedKeys.has(keyExtractor(row))) && !isAllSelected;

  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const sortedColumns = useMemo(() => 
    columns.map(col => ({
      ...col,
      isSorted: sortConfig.key === col.key && col.sortable,
      sortOrder: sortConfig.key === col.key && col.sortable ? sortConfig.order : undefined,
    }))
  , [columns, sortConfig]);

  if (loading) {
    const selectAllRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
      if (selectAllRef.current) {
        selectAllRef.current.indeterminate = data.length > 0 && 
          data.some(r => selectedKeys.has(keyExtractor(r))) && 
          !data.every(r => selectedKeys.has(keyExtractor(r)));
      }
    }, [data, selectedKeys, keyExtractor]);

    return (
      <div className="overflow-x-auto" {...props}>
        <table className="w-full" role="grid">
          <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
            <tr className="border-b border-surface-border">
              {selectable && (
                <th className="px-4 py-3 w-12">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => onSelectionChange?.(e.target.checked ? new Set(data.map(keyExtractor)) : new Set())}
                    aria-label="Select all"
                  />
                </th>
              )}
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider ${col.sortable ? 'cursor-pointer select-none hover:bg-surface-secondary' : ''}`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <SortIcon order={sortConfig.key === col.key ? sortConfig.order : 'asc'} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {Array.from({ length: Math.min(5, pageSize) }).map((_, i) => (
              <tr key={i} className="animate-shimmer">
                {selectable && <td className="px-4 py-3"><Skeleton variant="circle" className="w-4 h-4 mx-auto" /></td>}
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3">
                    <Skeleton variant="text" style={{ width: '80%' }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="overflow-x-auto" {...props}>
        <table className="w-full" role="grid">
          <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
            <tr className="border-b border-surface-border">
              {selectable && <th className="px-4 py-3 w-12" />}
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider ${col.sortable ? 'cursor-pointer select-none hover:bg-surface-secondary' : ''}`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.header}</span>
                    {col.sortable && <SortIcon order={sortConfig.key === col.key ? sortConfig.order : 'asc'} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-12 text-center">
                <EmptyState
                  icon={emptyIcon}
                  title={emptyMessage}
                  description="No data to display"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" {...props}>
      <table className="w-full" role="grid">
        <thead className={`${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
          <tr className="border-b border-surface-border bg-surface-secondary/50">
            {selectable && (
              <th className="px-4 py-3 w-12">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => onSelectionChange?.(e.target.checked ? new Set(paginatedData.map(keyExtractor)) : new Set())}
                  aria-label="Select all"
                />
              </th>
            )}
            {columns.map(col => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider ${col.sortable ? 'cursor-pointer select-none hover:bg-surface-secondary' : ''}`}
                style={{ width: col.width }}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <div className="flex items-center gap-2">
                  <span>{col.header}</span>
                  {col.sortable && <SortIcon order={sortConfig.key === col.key ? sortConfig.order : 'asc'} />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {paginatedData.map((row, index) => {
            const key = keyExtractor(row);
            const isSelected = selectedKeys.has(key);
            const rowClass = `transition-colors ${isSelected ? 'bg-accent-primary-light/50' : index % 2 === 1 ? 'bg-surface-secondary/30' : ''}`;
            
            return (
              <tr
                key={key}
                className={rowClass}
                onClick={() => onRowClick?.(row)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onRowClick?.(row);
                  }
                }}
                role="row"
              >
                {selectable && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedKeys.has(key)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectionChange(key, e.target.checked);
                      }}
                      aria-label="Select row"
                    />
                  </td>
                )}
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3">
                    {col.render 
                      ? col.render(row, index)
                      : String((row as any)[col.key] ?? '')
                    }
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {(data.length > pageSize) && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(data.length / pageSize)}
          onPageChange={setCurrentPage}
          showPageSize
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}

DataTable.displayName = 'DataTable';