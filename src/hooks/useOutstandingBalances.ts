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
            if (sale.customerId) {
                partyBalances.set(sale.customerId, (partyBalances.get(sale.customerId) || 0) + sale.billedAmount);
            }
        });
        
        // Brokers from sales (commission is an expense, not a receivable from them)
        // If a broker is also a customer, their sales will be handled above.

        receipts.forEach(receipt => {
            partyBalances.set(receipt.partyId, (partyBalances.get(receipt.partyId) || 0) - receipt.amount - (receipt.cashDiscount || 0));
        });
        
        const allParties = [...(masterData.Customer || []), ...(masterData.Broker || [])];
        
        return allParties.map(party => ({
            ...party,
            balance: partyBalances.get(party.id) || 0
        })).filter(p => p.balance > 1 || p.balance < -1); 

    }, [sales, receipts, masterData.Customer, masterData.Broker]);

    const payableParties = useMemo(() => {
        const partyBalances = new Map<string, number>();

        // Suppliers from purchases
        purchases.forEach(purchase => {
            partyBalances.set(purchase.supplierId, (partyBalances.get(purchase.supplierId) || 0) - purchase.totalAmount);
        });

        // Agents & other expense parties from purchases
        purchases.forEach(purchase => {
             (purchase.expenses || []).forEach(exp => {
                if(exp.partyId && exp.paymentMode === 'Pending') {
                    partyBalances.set(exp.partyId, (partyBalances.get(exp.partyId) || 0) - exp.amount);
                }
             })
        });

        payments.forEach(payment => {
            partyBalances.set(payment.partyId, (partyBalances.get(payment.partyId) || 0) + payment.amount);
        });
        
        const allParties: MasterItem[] = [...(masterData.Supplier || []), ...(masterData.Agent || []), ...(masterData.Transporter || [])];

        return allParties.map(party => ({
            ...party,
            balance: partyBalances.get(party.id) || 0
        })).filter(p => p.balance < -1 || p.balance > 1);

    }, [purchases, payments, masterData.Supplier, masterData.Agent, masterData.Transporter]);

    return { receivableParties, payableParties };
}
