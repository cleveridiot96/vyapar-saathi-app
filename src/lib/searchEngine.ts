import Fuse from 'fuse.js';
import type { SearchableItem } from './types';

let fuse: Fuse<SearchableItem>;

const options: Fuse.IFuseOptions<SearchableItem> = {
  keys: [
    { name: 'title', weight: 0.7 },
    { name: 'description', weight: 0.3 },
  ],
  includeScore: true,
  includeMatches: true,
  threshold: 0.4,
  minMatchCharLength: 2,
};

export const initSearchEngine = (data: SearchableItem[]) => {
  fuse = new Fuse(data, options);
};

export const searchData = (query: string): Fuse.FuseResult<SearchableItem>[] => {
  if (!fuse) {
    console.warn('Search engine not initialized.');
    return [];
  }
  return fuse.search(query);
};
