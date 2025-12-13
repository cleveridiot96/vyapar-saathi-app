import type { MasterItem, MasterItemType } from './types';

export const FIXED_WAREHOUSES: readonly MasterItem[] = [
    { id: 'wh-mumbai', type: 'Warehouse', name: 'Mumbai' },
    { id: 'wh-origin', type: 'Warehouse', name: 'Origin' },
] as const;


export const FIXED_EXPENSES: readonly MasterItem[] = [
    { id: 'exp-freight', type: 'Expense', name: 'Freight' },
    { id: 'exp-labour', type: 'Expense', name: 'Labour' },
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
