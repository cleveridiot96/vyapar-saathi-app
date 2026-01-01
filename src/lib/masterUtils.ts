import type { MasterItem } from './types';

const normalizeName = (name: string): string => {
  // Converts to lowercase and removes all non-alphanumeric characters
  return name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

export function doesNameExist(
  name: string,
  type: string,
  currentId: string | undefined,
  allItems: MasterItem[]
): boolean {
  const normalizedNewName = normalizeName(name);
  return allItems.some(
    (item) =>
      normalizeName(item.name) === normalizedNewName &&
      item.type === type &&
      item.id !== currentId
  );
}
