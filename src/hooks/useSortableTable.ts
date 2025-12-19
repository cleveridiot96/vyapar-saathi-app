"use client";
import { useState, useMemo } from 'react';

type SortDirection = 'ascending' | 'descending';

interface SortConfig<T> {
  key: keyof T;
  direction: SortDirection;
}

export function useSortableTable<T>(data: T[], defaultSortConfig: SortConfig<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>(defaultSortConfig);

  const sortedData = useMemo(() => {
    if (!data) return [];
    const sortableData = [...data];
    sortableData.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
    return sortableData;
  }, [data, sortConfig]);

  const handleSort = (key: keyof T) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return { tableData: sortedData, handleSort, sortConfig };
}
