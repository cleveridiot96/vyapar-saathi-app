
"use client";

import { useMemo } from 'react';
import type { MasterItem } from '@/lib/types';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useMasters } from './useTransactions';

export function useOutstandingBalances() {
    const purchases = useLiveQuery(() => db.purchases.toArray(), []);
    const sales = useLiveQuery(() => db.sales.toArray(), []);
    const payments = useLiveQuery(() => db.payments.toArray(), []);
    const receipts = useLiveQuery(() => db.receipts.toArray(), []);
    const purchaseReturns = useLiveQuery(() => db.purchaseReturns.toArray(), []);
    const saleReturns = useLiveQuery(() => db.saleReturns.toArray(), []);
    const ledger = useLiveQuery(() => db.ledger.toArray(), []);
    
    const { masters, isMastersLoaded } = useMasters();

    const isLoading = [purchases, sales, payments, receipts, purchaseReturns, saleReturns, ledger].some(data => data === undefined) || !isMastersLoaded;
    const allMasters = masters ?? [];

    const balances = useMemo(() => {
        if (isLoading) {
            return new Map<string, number>();
        }

        const balancesMap = new Map<string, number>();
        const safeMasters = masters ?? [];
        const safePurchases = purchases ?? [];
        const safeSales = sales ?? [];
        const safeReceipts = receipts ?? [];
        const safePayments = payments ?? [];
        const safePurchaseReturns = purchaseReturns ?? [];
        const safeSaleReturns = saleReturns ?? [];
        const safeLedger = ledger ?? [];

        // 1. Set opening balances from master data
        safeMasters.forEach(m => {
            if (m.type !== 'Warehouse' && m.type !== 'Expense' && m.type !== 'Product') {
                balancesMap.set(m.id, m.details?.openingBalanceType === 'Cr' ? -(m.details?.openingBalance || 0) : (m.details?.openingBalance || 0));
            }
        });
        
        const allTxs = [
            ...safePurchases, ...safeSales, ...safeReceipts, ...safePayments, ...safePurchaseReturns, ...safeSaleReturns, ...safeLedger
        ].filter(tx => tx && tx.date);
        
        // 2. Process all transactions to establish final balances
        allTxs.forEach(tx => {
            // Sales increase receivables
            if ('billedAmount' in tx && 'isStockPaymentSale' in tx) { // Simple check for Sale
                const s = tx as typeof sales[0];
                const primaryDebtorId = s.brokerId || s.customerId;
                if (primaryDebtorId) {
                    balancesMap.set(primaryDebtorId, (balancesMap.get(primaryDebtorId) || 0) + (s.billedAmount || 0));
                }

                const brokerCommission = (s.expenses || []).find(e => e.account === 'Broker Commission')?.amount || 0;
                if (s.brokerId && brokerCommission > 0) {
                    balancesMap.set(s.brokerId, (balancesMap.get(s.brokerId) || 0) - brokerCommission);
                }
            } 
            // Purchases increase payables
            else if ('totalAmount' in tx && 'supplierId' in tx) { // Simple check for Purchase
                const p = tx as typeof purchases[0];
                const primaryCreditorId = p.agentId || p.supplierId;
                if(primaryCreditorId) {
                    balancesMap.set(primaryCreditorId, (balancesMap.get(primaryCreditorId) || 0) - (p.totalAmount || 0));
                }
            }
            // Receipts decrease receivables
            else if ('paymentMethod' in tx && 'transactionType' in tx && 'cashDiscount' in tx) { // Receipt
                const r = tx as typeof receipts[0];
                if(r.partyId) {
                    balancesMap.set(r.partyId, (balancesMap.get(r.partyId) || 0) - (r.amount + (r.cashDiscount || 0)));
                }
            }
            // Payments decrease payables
            else if ('paymentMethod' in tx && 'paymentType' in tx) { // Payment
                const p = tx as typeof payments[0];
                if(p.partyId) {
                    balancesMap.set(p.partyId, (balancesMap.get(p.partyId) || 0) + (p.amount || 0));
                }
            }
            // Purchase Returns decrease payables
            else if ('originalPurchaseId' in tx && 'returnAmount' in tx) { // Purchase Return
                 const pr = tx as typeof purchaseReturns[0];
                 const p = safePurchases.find(p => p.id === pr.originalPurchaseId);
                 if (p) {
                    const primaryCreditorId = p.agentId || p.supplierId;
                    if(primaryCreditorId) {
                        balancesMap.set(primaryCreditorId, (balancesMap.get(primaryCreditorId) || 0) + (pr.returnAmount || 0));
                    }
                }
            } 
            // Sale Returns decrease receivables
            else if ('originalSaleId' in tx && 'returnAmount' in tx) { // Sale Return
                const sr = tx as typeof saleReturns[0];
                const s = safeSales.find(s => s.id === sr.originalSaleId);
                if (s) {
                    const primaryDebtorId = s.brokerId || s.customerId;
                    if(primaryDebtorId) {
                        balancesMap.set(primaryDebtorId, (balancesMap.get(primaryDebtorId) || 0) - (sr.returnAmount || 0));
                    }
                }
            }
            // Pending expenses increase payables
            else if ('relatedVoucher' in tx && 'type' in tx && tx.type === 'Expense' && 'partyId' in tx && tx.partyId && 'paymentMode' in tx && tx.paymentMode === 'Pending') { // Ledger Entry
                 balancesMap.set(tx.partyId, (balancesMap.get(tx.partyId) || 0) - (tx.debit - tx.credit)); // Expense is a debit, so it's payable
            }
        });


        return balancesMap;
    }, [isLoading, allMasters, purchases, sales, receipts, payments, purchaseReturns, saleReturns, ledger]);

    const { receivableParties, payableParties } = useMemo(() => {
        if (isLoading) return { receivableParties: [], payableParties: [] };

        const receivableParties: MasterItem[] = [];
        const payableParties: MasterItem[] = [];

        (allMasters ?? []).forEach(party => {
            const balance = balances.get(party.id);
            if (balance === undefined) return;
            
            const partyWithType = {
                ...party,
                balance
            };
            
            if (balance > 0.01) { 
                receivableParties.push(partyWithType);
            } else if (balance < -0.01) {
                payableParties.push(partyWithType);
            }
        });
        
        receivableParties.sort((a,b) => Math.abs(b.balance || 0) - Math.abs(a.balance || 0));
        payableParties.sort((a,b) => Math.abs(b.balance || 0) - Math.abs(a.balance || 0));
        
        return { receivableParties, payableParties };
    }, [allMasters, balances, isLoading]);


    const getPartyName = (partyId: string) => {
        const party = (allMasters ?? []).find(p => p.id === partyId);
        return party?.name || partyId;
    }

    return {
        receivableParties,
        payableParties,
        getPartyName,
        balances,
        isBalancesLoading: isLoading,
    };
}
