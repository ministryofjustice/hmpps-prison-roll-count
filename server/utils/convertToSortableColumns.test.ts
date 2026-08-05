import { convertToSortableColumns } from './convertToSortableColumns'

describe('convertToSortableColumns', () => {
  it('updates aria-sort and preserves existing heading attributes', () => {
    const headings = [
      {
        text: 'Time and date departed',
        key: 'timeDateDeparted',
        attributes: {
          'aria-sort': 'descending',
          'data-persistent-id': 'timeDateDeparted',
        },
      },
      {
        text: 'Reason',
        key: 'reason',
      },
    ]

    const [nameHeading, reasonHeading] = convertToSortableColumns(headings, 'timeDateDeparted,desc') as Array<{
      attributes: Record<string, string>
      html: string
    }>

    expect(nameHeading.attributes).toEqual({
      'aria-sort': 'descending',
      'data-persistent-id': 'timeDateDeparted',
    })
    expect(nameHeading.html).toContain('sort=timeDateDeparted,asc')

    expect(reasonHeading.attributes).toEqual({
      'aria-sort': 'none',
    })
    expect(reasonHeading.html).toContain('sort=reason,desc')
  })
})
