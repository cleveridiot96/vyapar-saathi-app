
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

        const balancesMap = new Map<string, number>();

        // 1. Set opening balances from master data
        allMasters.forEach(m => {
            if (m.type !== 'Warehouse' && m.type !== 'Expense' && m.type !== 'Product') {
                balancesMap.set(m.id, m.details?.openingBalanceType === 'Cr' ? -(m.details?.openingBalance || 0) : (m.details?.openingBalance || 0));
            }
        });
        
        const allTransactions = [
            ...purchases, ...sales, ...receipts, ...payments, ...purchaseReturns, ...saleReturns, ...ledger
        ].filter(tx => tx && tx.date);
        
        // 2. Process all transactions to establish final balances
        allTransactions.forEach(tx => {
            // Sales increase receivables
            if ('billedAmount' in tx && tx.type !== 'Purchase' && tx.type !== 'Payment' && tx.type !== 'Receipt' && tx.type !== 'Purchase Return' && tx.type !== 'Sale Return' && tx.type !== 'Expense' && tx.type !== 'Transfer') { // Simple check for Sale
                const s = tx as typeof sales[0];
                const primaryDebtorId = s.brokerId || s.customerId;
                balancesMap.set(primaryDebtorId, (balancesMap.get(primaryDebtorId) || 0) + (s.billedAmount || 0));

                const brokerCommission = (s.expenses || []).find(e => e.account === 'Broker Commission')?.amount || 0;
                if (s.brokerId && brokerCommission > 0) {
                    balancesMap.set(s.brokerId, (balancesMap.get(s.brokerId) || 0) - brokerCommission);
                }
            } 
            // Purchases increase payables
            else if ('totalAmount' in tx) { // Simple check for Purchase
                const p = tx as typeof purchases[0];
                const primaryCreditorId = p.agentId || p.supplierId;
                balancesMap.set(primaryCreditorId, (balancesMap.get(primaryCreditorId) || 0) - (p.totalAmount || 0));
            }
            // Receipts decrease receivables
            else if ('paymentMethod' in tx && 'transactionType' in tx) { // Receipt
                const r = tx as typeof receipts[0];
                balancesMap.set(r.partyId, (balancesMap.get(r.partyId) || 0) - (r.amount + (r.cashDiscount || 0)));
            }
            // Payments decrease payables
            else if ('paymentMethod' in tx) { // Payment
                const p = tx as typeof payments[0];
                balancesMap.set(p.partyId, (balancesMap.get(p.partyId) || 0) + (p.amount || 0));
            }
            // Purchase Returns decrease payables
            else if ('originalPurchaseId' in tx) { // Purchase Return
                 const pr = tx as typeof purchaseReturns[0];
                 const p = purchases.find(p => p.id === pr.originalPurchaseId);
                 if (p) {
                    const primaryCreditorId = p.agentId || p.supplierId;
                    balancesMap.set(primaryCreditorId, (balancesMap.get(primaryCreditorId) || 0) + (pr.returnAmount || 0));
                }
            } 
            // Sale Returns decrease receivables
            else if ('originalSaleId' in tx) { // Sale Return
                const sr = tx as typeof saleReturns[0];
                const s = sales.find(s => s.id === sr.originalSaleId);
                if (s) {
                    const primaryDebtorId = s.brokerId || s.customerId;
                    balancesMap.set(primaryDebtorId, (balancesMap.get(primaryDebtorId) || 0) - (sr.returnAmount || 0));
                }
            }
            // Pending expenses increase payables
            else if ('relatedVoucher' in tx && tx.type === 'Expense' && tx.partyId && tx.paymentMode === 'Pending') { // Ledger Entry
                 balancesMap.set(tx.partyId, (balancesMap.get(tx.partyId) || 0) - (tx.debit - tx.credit)); // Expense is a debit, so it's payable
            }
        });


        return balancesMap;
    }, [isAppHydrating, allMasters, purchases, sales, receipts, payments, purchaseReturns, saleReturns, ledger, isTransactionsLoaded]);

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
