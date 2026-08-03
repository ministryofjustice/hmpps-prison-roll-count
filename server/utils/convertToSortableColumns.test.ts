import { convertToSortableColumns } from './convertToSortableColumns'

describe('convertToSortableColumns', () => {
  it('updates aria-sort and preserves existing heading attributes', () => {
    const headings = [
      {
        text: 'Name',
        key: 'lastName',
        attributes: {
          'aria-sort': 'descending',
          'data-persistent-id': 'prisoner-name',
        },
      },
      {
        text: 'Reason',
        key: 'reason',
      },
    ]

    const [nameHeading, reasonHeading] = convertToSortableColumns(headings, 'lastName,asc') as Array<{
      attributes: Record<string, string>
      html: string
    }>

    expect(nameHeading.attributes).toEqual({
      'aria-sort': 'ascending',
      'data-persistent-id': 'prisoner-name',
    })
    expect(nameHeading.html).toContain('sort=lastName,desc')

    expect(reasonHeading.attributes).toEqual({
      'aria-sort': 'none',
    })
    expect(reasonHeading.html).toContain('sort=reason,asc')
  })
})

