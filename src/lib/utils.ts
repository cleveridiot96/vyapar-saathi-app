import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isDateInFinancialYear(dateStr: string, financialYear: string) {
  if (!dateStr || !financialYear) return false;
  try {
    const date = new Date(dateStr);
    if(isNaN(date.getTime())) return false;

    const [startYearStr, endYearStr] = financialYear.split('-');
    const startYear = parseInt(startYearStr, 10);
    const endYear = parseInt(endYearStr, 10);

    if(isNaN(startYear) || isNaN(endYear)) return false;

    const startDate = new Date(startYear, 3, 1); // April 1st
    const endDate = new Date(endYear, 2, 31, 23, 59, 59, 999); // March 31st, end of day
    
    return date >= startDate && date <= endDate;
  } catch (e) {
    return false;
  }
}

export function isDateBeforeFinancialYear(dateStr: string, financialYear: string) {
  if (!dateStr || !financialYear) return false;
  try {
    const date = new Date(dateStr);
    if(isNaN(date.getTime())) return false;

    const [startYearStr] = financialYear.split('-');
    const startYear = parseInt(startYearStr, 10);

    if(isNaN(startYear)) return false;

    const startDate = new Date(startYear, 3, 1); // April 1st
    return date < startDate;
  } catch (e) {
    return false;
  }
}

export function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
