import Dexie, { type Table } from 'dexie';
import type { TransactionEvent } from './types';

export class AppDatabase extends Dexie {
  // 'events' is the name of our table.
  events!: Table<TransactionEvent>; 

  constructor() {
    super('vyapar-saathi-db');
    this.version(1).stores({
      // The '++id' defines an auto-incrementing primary key.
      // The other fields are indexed to allow for efficient querying if needed later.
      events: '++id, type, timestamp',
    });
  }
}

export const db = new AppDatabase();
