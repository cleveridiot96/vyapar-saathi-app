import Dexie, { type Table } from 'dexie';
import type { TransactionEvent } from './types';

export class AppDatabase extends Dexie {
  events!: Table<TransactionEvent>; 

  constructor() {
    super('vyapar-saathi-db');
    this.version(1).stores({
      events: '++id, type, timestamp',
    });
  }
}

export const db = new AppDatabase();
