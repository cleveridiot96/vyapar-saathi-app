import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isDateInFinancialYear(dateStr: string, financialYear: string) {
  // financialYear is 'YYYY-YYYY'
  if (!dateStr || !financialYear) return false;
  const date = new Date(dateStr);
  const [startYear, endYear] = financialYear.split('-').map(Number);
  const startDate = new Date(startYear, 3, 1); // April 1st
  const endDate = new Date(endYear, 2, 31); // March 31st
  return date >= startDate && date <= endDate;
}
