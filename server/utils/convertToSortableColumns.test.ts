import { convertToSortableColumns } from './convertToSortableColumns'

describe('convertToSortableColumns', () => {
  it('updates aria-sort, preserves existing heading attributes, and defaults non-active headers to ascending', () => {
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

    const [nameHeading, reasonHeading] = convertToSortableColumns(
      headings,
      'timeDateDeparted&direction=descending',
    ) as Array<{
      attributes: Record<string, string>
      html: string
    }>

    expect(nameHeading.attributes).toEqual({
      'aria-sort': 'descending',
      'data-persistent-id': 'timeDateDeparted',
    })
    expect(nameHeading.html).toContain('sort=timeDateDeparted&direction=ascending')

    expect(reasonHeading.attributes).toEqual({
      'aria-sort': 'none',
    })
    expect(reasonHeading.html).toContain('sort=reason&direction=ascending')
  })

  it('toggles active heading from ascending to descending', () => {
    const headings = [
      {
        text: 'Time and date departed',
        key: 'timeDateDeparted',
      },
      {
        text: 'Reason',
        key: 'reason',
      },
    ]

    const [activeHeading, inactiveHeading] = convertToSortableColumns(
      headings,
      'timeDateDeparted&direction=ascending',
    ) as Array<{
      attributes: Record<string, string>
      html: string
    }>

    expect(activeHeading.attributes).toEqual({
      'aria-sort': 'ascending',
    })
    expect(activeHeading.html).toContain('sort=timeDateDeparted&direction=descending')
    expect(inactiveHeading.html).toContain('sort=reason&direction=ascending')
  })
})
