import { sortDirection, reverseSortDirection } from './filtering'

export function generateSortableUrl(key: string, direction: sortDirection): string {
  return `?sort=${key}&direction=${direction}`
}

// update column header links and add aria-sort attributes to govukTable head row so that moj-sortable-table css will be applied
export const convertToSortableColumns = (
  headings: { text: string; key?: string }[],
  sort: string,
  direction: sortDirection,
) => {
  console.log(`convertToSortableColumns: sort=${sort}, direction=${direction}`)
  return headings.map(heading => {
    const { text, key, ...others } = heading

    const existingAttributes = ((others as { attributes?: Record<string, string> }).attributes ?? {}) as Record<
      string,
      string
    >

    if (!key) {
      return heading
    }

    if (key === sort) {
      const nextDirection = reverseSortDirection(direction)
      return {
        ...others,
        attributes: {
          ...existingAttributes,
          'aria-sort': direction,
        },
        html: `<a href="${generateSortableUrl(key, nextDirection)}" role="button">${text}</a>`,
      }
    }

    return {
      ...others,
      attributes: {
        ...existingAttributes,
        'aria-sort': 'none',
      },
      html: `<a href="${generateSortableUrl(key, sortDirection.ascending)}" role="button">${text}</a>`,
    }
  })
}
