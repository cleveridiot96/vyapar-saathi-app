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

        // 1. Set opening balances from master data
        allMasters.forEach(m => {
            if (m.type !== 'Warehouse' && m.type !== 'Expense' && m.type !== 'Product') {
                balances.set(m.id, m.details?.openingBalanceType === 'Cr' ? -(m.details?.openingBalance || 0) : (m.details?.openingBalance || 0));
            }
        });
        
        // 2. Process all transactions before the current financial year to adjust opening balances
        const preFyTransactions = [
            ...purchases, ...sales, ...receipts, ...payments, ...purchaseReturns, ...saleReturns, ...ledger
        ].filter(tx => tx && tx.date && isDateBeforeFinancialYear(tx.date, financialYear))
         .sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

        preFyTransactions.forEach(tx => {
            if ('billedAmount' in tx) { // Sale
                const s = tx as typeof sales[0];
                const primaryDebtorId = s.brokerId || s.customerId;
                balances.set(primaryDebtorId, (balances.get(primaryDebtorId) || 0) + (s.billedAmount || 0));
            } else if ('totalAmount' in tx) { // Purchase
                const p = tx as typeof purchases[0];
                const primaryCreditorId = p.agentId || p.supplierId;
                balances.set(primaryCreditorId, (balances.get(primaryCreditorId) || 0) - (p.totalAmount || 0));
            } else if ('paymentMethod' in tx && 'amount' in tx) { // Receipt or Payment
                 if('transactionType' in tx) { // Receipt
                    const r = tx as typeof receipts[0];
                    balances.set(r.partyId, (balances.get(r.partyId) || 0) - (r.amount + (r.cashDiscount || 0)));
                } else { // Payment
                    const p = tx as typeof payments[0];
                    balances.set(p.partyId, (balances.get(p.partyId) || 0) + (p.amount || 0));
                }
            } else if ('originalPurchaseId' in tx) { // Purchase Return
                 const pr = tx as typeof purchaseReturns[0];
                 const p = purchases.find(p => p.id === pr.originalPurchaseId);
                 if (p) {
                    const primaryCreditorId = p.agentId || p.supplierId;
                    balances.set(primaryCreditorId, (balances.get(primaryCreditorId) || 0) + (pr.returnAmount || 0));
                }
            } else if ('originalSaleId' in tx) { // Sale Return
                const sr = tx as typeof saleReturns[0];
                const s = sales.find(s => s.id === sr.originalSaleId);
                if (s) {
                    const primaryDebtorId = s.brokerId || s.customerId;
                    balances.set(primaryDebtorId, (balances.get(primaryDebtorId) || 0) - (sr.returnAmount || 0));
                }
            } else if ('relatedVoucher' in tx && tx.type === 'Expense' && tx.partyId && tx.paymentMode === 'Pending') { // Ledger Entry
                 balances.set(tx.partyId, (balances.get(tx.partyId) || 0) + (tx.debit - tx.credit));
            }
        });

        // 3. Process transactions within the financial year
        const fyTransactions = [
            ...purchases, ...sales, ...receipts, ...payments, ...purchaseReturns, ...saleReturns, ...ledger
        ].filter(tx => tx && tx.date && isDateInFinancialYear(tx.date, financialYear))
         .sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
        
        fyTransactions.forEach(tx => {
             if ('billedAmount' in tx) { // Sale
                const s = tx as typeof sales[0];
                const primaryDebtorId = s.brokerId || s.customerId;
                balances.set(primaryDebtorId, (balances.get(primaryDebtorId) || 0) + (s.billedAmount || 0));

                const brokerCommission = (s.expenses || []).find(e => e.account === 'Broker Commission')?.amount || 0;
                if (s.brokerId && brokerCommission > 0) {
                    balances.set(s.brokerId, (balances.get(s.brokerId) || 0) - brokerCommission);
                }
                
            } else if ('totalAmount' in tx) { // Purchase
                const p = tx as typeof purchases[0];
                const primaryCreditorId = p.agentId || p.supplierId;
                balances.set(primaryCreditorId, (balances.get(primaryCreditorId) || 0) - (p.totalAmount || 0));
            } else if ('paymentMethod' in tx && 'amount' in tx) { // Receipt or Payment
                 if('transactionType' in tx) { // Receipt
                    const r = tx as typeof receipts[0];
                    balances.set(r.partyId, (balances.get(r.partyId) || 0) - (r.amount + (r.cashDiscount || 0)));
                } else { // Payment
                    const p = tx as typeof payments[0];
                    balances.set(p.partyId, (balances.get(p.partyId) || 0) + (p.amount || 0));
                }
            } else if ('originalPurchaseId' in tx) { // Purchase Return
                 const pr = tx as typeof purchaseReturns[0];
                 const p = purchases.find(p => p.id === pr.originalPurchaseId);
                 if (p) {
                    const primaryCreditorId = p.agentId || p.supplierId;
                    balances.set(primaryCreditorId, (balances.get(primaryCreditorId) || 0) + (pr.returnAmount || 0));
                }
            } else if ('originalSaleId' in tx) { // Sale Return
                const sr = tx as typeof saleReturns[0];
                const s = sales.find(s => s.id === sr.originalSaleId);
                if (s) {
                    const primaryDebtorId = s.brokerId || s.customerId;
                    balances.set(primaryDebtorId, (balances.get(primaryDebtorId) || 0) - (sr.returnAmount || 0));
                }
            } else if ('relatedVoucher' in tx && tx.type === 'Expense' && tx.partyId && tx.paymentMode === 'Pending') { // Ledger Entry
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
