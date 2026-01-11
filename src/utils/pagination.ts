export interface PaginationResult<T> {
  total: number;
  count: number;
  offset: number;
  items: T[];
  has_more: boolean;
  next_offset?: number;
}

export function paginateArray<T>(items: T[], offset: number, limit: number): PaginationResult<T> {
  const total = items.length;
  const safeOffset = Math.max(0, Math.min(offset, total));
  const safeLimit = Math.max(0, limit);
  const end = Math.min(safeOffset + safeLimit, total);
  const pageItems = items.slice(safeOffset, end);
  const hasMore = end < total;

  return {
    total,
    count: pageItems.length,
    offset: safeOffset,
    items: pageItems,
    has_more: hasMore,
    ...(hasMore ? { next_offset: end } : {}),
  };
}
