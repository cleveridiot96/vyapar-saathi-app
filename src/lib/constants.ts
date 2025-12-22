import type { MasterItem, MasterItemType } from './types';

export const FIXED_WAREHOUSES: readonly MasterItem[] = [
    { id: 'wh-mumbai', type: 'Warehouse', name: 'Mumbai' },
    { id: 'wh-pune', name:  'Pune', type: 'Warehouse' as const },
    { id: 'wh-chiplun', name: 'Chiplun', type: 'Warehouse' as const },
] as const;


export const FIXED_EXPENSES: readonly MasterItem[] = [
    { id: 'exp-transport', name: 'Transport Charges', type: 'Expense' as const },
    { id: 'exp-labour', name: 'Labour Charges', type: 'Expense' as const },
    { id: 'exp-misc', name: 'Misc Expenses', type: 'Expense' as const },
    { id: 'exp-freight', type: 'Expense', name: 'Freight' },
    { id: 'exp-commission', type: 'Expense', name: 'Broker Commission' },
    { id: 'exp-extra-brokerage', type: 'Expense', name: 'Extra Brokerage' },
] as const;


export const MASTER_TYPES_CONFIG: Record<MasterItemType, { isParty: boolean }> = {
    Customer: { isParty: true },
    Supplier: { isParty: true },
    Broker: { isParty: true },
    Agent: { isParty: true },
    Transporter: { isParty: true },
    Warehouse: { isParty: false },
    Expense: { isParty: false },
    Product: { isParty: false },
};

export const FIXED_WAREHOUSES_LEGACY = {
    MUMBAI_ID: 'wh2',
};
