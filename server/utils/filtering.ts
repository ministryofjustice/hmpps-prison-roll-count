export const enum sortDirection {
  ascending = 'ascending',
  descending = 'descending',
}

export function reverseSortDirection(direction: sortDirection): sortDirection {
  return direction === sortDirection.ascending ? sortDirection.descending : sortDirection.ascending
}
