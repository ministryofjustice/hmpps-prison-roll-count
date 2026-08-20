function urlFromTemplate(hrefTemplate: string, key: string, direction: string) {
  return hrefTemplate.replace('{sortKey}', key).replace('{sortDirection}', direction)
}

// update column header links and add aria-sort attributes to govukTable head row so that moj-sortable-table css will be applied
export const convertToSortableColumns = (
  headings: { text: string; key?: string }[],
  sort: string,
  hrefTemplate: string = '?sort={sortKey}&direction={sortDirection}',
) => {
  const [sortingKey, sortingDirection] = sort.split('&direction=')
  const resolvedSortingDirection = sortingDirection === 'ascending' ? 'ascending' : 'descending'

  return headings.map(heading => {
    const { text, key, ...others } = heading

    const existingAttributes = ((others as { attributes?: Record<string, string> }).attributes ?? {}) as Record<
      string,
      string
    >

    if (!key) {
      return heading
    }

    if (key === sortingKey) {
      const nextDirection = resolvedSortingDirection === 'ascending' ? 'descending' : 'ascending'
      return {
        ...others,
        attributes: {
          ...existingAttributes,
          'aria-sort': resolvedSortingDirection,
        },
        html: `<a href="${urlFromTemplate(hrefTemplate, key, nextDirection)}" role="button">${text}</a>`,
      }
    }

    return {
      ...others,
      attributes: {
        ...existingAttributes,
        'aria-sort': 'none',
      },
      html: `<a href="${urlFromTemplate(hrefTemplate, key, 'ascending')}" role="button">${text}</a>`,
    }
  })
}

export default convertToSortableColumns
