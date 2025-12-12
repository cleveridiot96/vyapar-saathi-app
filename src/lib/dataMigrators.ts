"use client";

import type { Purchase, Sale } from './types';

export const purchaseMigrator = (data: any[]): Purchase[] => {
  if (!Array.isArray(data)) return [];
  return data.map(p => ({
    ...p,
    // Add any new fields with default values
    expenses: p.expenses || [],
  }));
};

export const salesMigrator = (data: any[]): Sale[] => {
  if (!Array.isArray(data)) return [];
  return data.map(s => ({
    ...s,
    // Add any new fields with default values
    expenses: s.expenses || [],
    isStockPaymentSale: s.isStockPaymentSale || false,
  }));
};
