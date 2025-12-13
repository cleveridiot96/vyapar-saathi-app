import type { MasterItem } from './types';

export function doesNameExist(
  name: string,
  type: string,
  currentId: string | undefined,
  allItems: MasterItem[]
): boolean {
  return allItems.some(
    (item) =>
      item.name.toLowerCase() === name.toLowerCase() &&
      item.type === type &&
      item.id !== currentId
  );
}
