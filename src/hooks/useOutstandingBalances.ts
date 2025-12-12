"use client";

import { useMemo } from 'react';
import { useTransactions } from './useTransactions';
import { useMasterData } from './useMasterData';
import type { MasterItem } from '@/lib/types';

export function useOutstandingBalances() {
    const { sales, receipts, purchases, payments } = useTransactions();
    const { data: masterData } = useMasterData();

    const receivableParties = useMemo(() => {
        const partyBalances = new Map<string, number>();

        // Customers from sales
        sales.forEach(sale => {
            partyBalances.set(sale.customerId, (partyBalances.get(sale.customerId) || 0) + sale.billedAmount);
        });
        
        // Brokers from sales
        sales.forEach(sale => {
            if (sale.brokerId) {
                 const commission = (sale.expenses || []).find(e => e.account === 'Broker Commission' && e.partyId === sale.brokerId)?.amount || 0;
                 partyBalances.set(sale.brokerId, (partyBalances.get(sale.brokerId) || 0) - commission);
            }
        });

        receipts.forEach(receipt => {
            partyBalances.set(receipt.partyId, (partyBalances.get(receipt.partyId) || 0) - receipt.amount - (receipt.cashDiscount || 0));
        });
        
        const allParties = [...(masterData.Customer || []), ...(masterData.Broker || [])];
        
        return allParties.map(party => ({
            ...party,
            balance: partyBalances.get(party.id) || 0
        })).filter(p => p.balance > 1); // Only parties who owe us money

    }, [sales, receipts, masterData.Customer, masterData.Broker]);

    const payableParties = useMemo(() => {
        const partyBalances = new Map<string, number>();

        // Suppliers from purchases
        purchases.forEach(purchase => {
            partyBalances.set(purchase.supplierId, (partyBalances.get(purchase.supplierId) || 0) - purchase.totalAmount);
        });

        // Agents from purchases
        purchases.forEach(purchase => {
            if (purchase.agentId) {
                const commission = (purchase.expenses || []).find(e => e.account === 'Agent Commission' && e.partyId === purchase.agentId)?.amount || 0;
                 partyBalances.set(purchase.agentId, (partyBalances.get(purchase.agentId) || 0) - commission);
            }
        });

        payments.forEach(payment => {
            partyBalances.set(payment.partyId, (partyBalances.get(payment.partyId) || 0) + payment.amount);
        });
        
        const allParties: MasterItem[] = [...(masterData.Supplier || []), ...(masterData.Agent || []), ...(masterData.Transporter || [])];

        return allParties.map(party => ({
            ...party,
            balance: partyBalances.get(party.id) || 0
        })).filter(p => p.balance < -1); // Only parties we owe money to

    }, [purchases, payments, masterData.Supplier, masterData.Agent, masterData.Transporter]);

    return { receivableParties, payableParties };
}
