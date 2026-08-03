function urlFromTemplate(hrefTemplate: string, key: string, direction: string) {
  return hrefTemplate.replace('{sortKey}', key).replace('{sortDirection}', direction)
}

// add aria-sort attributes to govukTable head row, so that moj-sortable-table css will be applied
export const convertToSortableColumns = (
  headings: { text: string; key?: string }[],
  sort: string,
  hrefTemplate: string = '?sort={sortKey},{sortDirection}',
) => {
  const [sortingKey, sortingDirection] = sort.split(',')

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
      if (sortingDirection === 'asc') {
        return {
          ...others,
          attributes: {
            ...existingAttributes,
            'aria-sort': 'ascending',
          },
          html: `<a href="${urlFromTemplate(hrefTemplate, key, 'desc')}" role="button">${text}</a>`,
        }
      }
      if (sortingDirection === 'desc') {
        return {
          ...others,
          attributes: {
            ...existingAttributes,
            'aria-sort': 'descending',
          },
          html: `<a href="${urlFromTemplate(hrefTemplate, key, 'asc')}" role="button">${text}</a>`,
        }
      }
    }
    return {
      ...others,
      attributes: {
        ...existingAttributes,
        'aria-sort': 'none',
      },
      html: `<a href="${urlFromTemplate(hrefTemplate, key, 'asc')}" role="button">${text}</a>`,
    }
  })
}

export default convertToSortableColumns
