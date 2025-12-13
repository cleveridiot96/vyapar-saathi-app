"use client";

import { useMemo } from 'react';
import { useTransactions } from './useTransactions';
import type { MasterItem } from '@/lib/types';
import { useSettings } from '@/contexts/SettingsContext';
import { isDateInFinancialYear, isDateBeforeFinancialYear } from '@/lib/utils';
import { parseISO } from 'date-fns';

export function useOutstandingBalances() {
    const { purchases, sales, payments, receipts, purchaseReturns, saleReturns, ledger, getAllMasters, isTransactionsLoaded } = useTransactions();
    const { financialYear, isAppHydrating } = useSettings();

    const allMasters = useMemo(() => getAllMasters(), [getAllMasters]);

    const balances = useMemo(() => {
        if (isAppHydrating || !isTransactionsLoaded) {
            return new Map<string, number>();
        }

        const balances = new Map<string, number>();

        // 1. Set opening balances from before the financial year
        allMasters.forEach(m => {
            if (m.type !== 'Warehouse' && m.type !== 'Expense' && m.type !== 'Product') {
                balances.set(m.id, m.details?.openingBalanceType === 'Cr' ? -(m.details?.openingBalance || 0) : (m.details?.openingBalance || 0));
            }
        });
        
        const allTransactionsSorted = [
            ...purchases.map(p => ({...p, txType: 'Purchase' as const})),
            ...sales.map(s => ({...s, txType: 'Sale' as const})),
            ...receipts.map(r => ({...r, txType: 'Receipt' as const})),
            ...payments.map(p => ({...p, txType: 'Payment' as const})),
            ...purchaseReturns.map(pr => ({...pr, txType: 'PurchaseReturn' as const})),
            ...saleReturns.map(sr => ({...sr, txType: 'SaleReturn' as const})),
            ...ledger.filter(l => ['Expense'].includes(l.type)).map(l => ({...l, txType: 'LedgerEntry' as const}))
        ].sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
        
        allTransactionsSorted.forEach(tx => {
            if (isDateBeforeFinancialYear(tx.date, financialYear)) {
                if (tx.txType === 'Sale') {
                    const primaryDebtorId = tx.brokerId || tx.customerId;
                    balances.set(primaryDebtorId, (balances.get(primaryDebtorId) || 0) + (tx.billedAmount || 0));
                } else if (tx.txType === 'Purchase') {
                    const primaryCreditorId = tx.agentId || tx.supplierId;
                    balances.set(primaryCreditorId, (balances.get(primaryCreditorId) || 0) - (tx.totalAmount || 0));
                } else if (tx.txType === 'Receipt') {
                    balances.set(tx.partyId, (balances.get(tx.partyId) || 0) - (tx.amount + (tx.cashDiscount || 0)));
                } else if (tx.txType === 'Payment') {
                    balances.set(tx.partyId, (balances.get(tx.partyId) || 0) + (tx.amount || 0));
                } else if (tx.txType === 'PurchaseReturn') {
                    const p = purchases.find(p => p.id === tx.originalPurchaseId);
                    if (p) {
                        const primaryCreditorId = p.agentId || p.supplierId;
                        balances.set(primaryCreditorId, (balances.get(primaryCreditorId) || 0) + (tx.returnAmount || 0));
                    }
                } else if (tx.txType === 'SaleReturn') {
                    const s = sales.find(s => s.id === tx.originalSaleId);
                    if (s) {
                        const primaryDebtorId = s.brokerId || s.customerId;
                        balances.set(primaryDebtorId, (balances.get(primaryDebtorId) || 0) - (tx.returnAmount || 0));
                    }
                }
            }
        });

        // 2. Process transactions within the financial year
        allTransactionsSorted.forEach(tx => {
            if (!isDateInFinancialYear(tx.date, financialYear)) return;

            if (tx.txType === 'Sale') {
                const primaryDebtorId = tx.brokerId || tx.customerId;
                balances.set(primaryDebtorId, (balances.get(primaryDebtorId) || 0) + (tx.billedAmount || 0));

                const brokerCommission = (tx.expenses || []).find(e => e.account === 'Broker Commission')?.amount || 0;
                if (tx.brokerId && brokerCommission > 0) {
                    balances.set(tx.brokerId, (balances.get(tx.brokerId) || 0) - brokerCommission);
                }
                
            } else if (tx.txType === 'Purchase') {
                const primaryCreditorId = tx.agentId || tx.supplierId;
                balances.set(primaryCreditorId, (balances.get(primaryCreditorId) || 0) - (tx.totalAmount || 0));
            } else if (tx.txType === 'Receipt') {
                balances.set(tx.partyId, (balances.get(tx.partyId) || 0) - (tx.amount + (tx.cashDiscount || 0)));
            } else if (tx.txType === 'Payment') {
                balances.set(tx.partyId, (balances.get(tx.partyId) || 0) + (tx.amount || 0));
            } else if (tx.txType === 'PurchaseReturn') {
                const p = purchases.find(p => p.id === tx.originalPurchaseId);
                if (p) {
                    const primaryCreditorId = p.agentId || p.supplierId;
                    balances.set(primaryCreditorId, (balances.get(primaryCreditorId) || 0) + (tx.returnAmount || 0));
                }
            } else if (tx.txType === 'SaleReturn') {
                const s = sales.find(s => s.id === tx.originalSaleId);
                if (s) {
                    const primaryDebtorId = s.brokerId || s.customerId;
                    balances.set(primaryDebtorId, (balances.get(primaryDebtorId) || 0) - (tx.returnAmount || 0));
                }
            } else if (tx.txType === 'LedgerEntry' && tx.partyId && tx.paymentMode === 'Pending') {
                 balances.set(tx.partyId, (balances.get(tx.partyId) || 0) + (tx.debit - tx.credit));
            }
        });

        return balances;
    }, [isAppHydrating, financialYear, allMasters, purchases, sales, receipts, payments, purchaseReturns, saleReturns, ledger, isTransactionsLoaded]);

    const { receivableParties, payableParties } = useMemo(() => {
        const receivableParties: MasterItem[] = [];
        const payableParties: MasterItem[] = [];

        allMasters.forEach(party => {
            const balance = balances.get(party.id);
            if (balance === undefined) return;
            
            if (balance > 0.01) { 
                receivableParties.push({ ...party, balance });
            } else if (balance < -0.01) {
                payableParties.push({ ...party, balance });
            }
        });
        
        receivableParties.sort((a,b) => Math.abs(b.balance || 0) - Math.abs(a.balance || 0));
        payableParties.sort((a,b) => Math.abs(b.balance || 0) - Math.abs(a.balance || 0));
        
        return { receivableParties, payableParties };
    }, [allMasters, balances]);


    const getPartyName = (partyId: string) => {
        const party = allMasters.find(p => p.id === partyId);
        return party?.name || partyId;
    }

    return {
        receivableParties,
        payableParties,
        getPartyName,
        balances,
        isBalancesLoading: isAppHydrating || !isTransactionsLoaded
    };
};
