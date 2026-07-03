import RestClient from './restClient'
import { PagedList } from './interfaces/pagedList'
import { Prisoner } from './interfaces/prisoner'
import { PrisonerSearchClient } from './interfaces/prisonerSearchClient'

export default class PrisonerSearchRestClient implements PrisonerSearchClient {
  constructor(private restClient: RestClient) {}

  async getPrisonersById(prisonerNumbers: string[]): Promise<Prisoner[]> {
    return this.restClient.post<Prisoner[]>({
      path: '/prisoner-search/prisoner-numbers',
      data: { prisonerNumbers },
    })
  }

  async getCswapPrisonersInEstablishment(prisonId: string): Promise<PagedList<Prisoner>> {
    const attributeRequest = {
      joinType: 'AND',
      queries: [
        {
          joinType: 'AND',
          matchers: [
            {
              type: 'String',
              attribute: 'prisonId',
              condition: 'IS',
              searchTerm: prisonId,
            },
            {
              type: 'String',
              attribute: 'cellLocation',
              condition: 'IN',
              searchTerm: 'CSWAP',
            },
          ],
        },
      ],
    }
    return this.restClient.post<PagedList<Prisoner>>({
      path: '/attribute-search?size=2000',
      data: attributeRequest,
    })
  }

  async getOvernightPrisonersInEstablishment(prisonId: string): Promise<PagedList<Prisoner>> {
    const date = new Date()
    date.setDate(date.getDate() - 1) // for yesterday's date
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const yesterday = String(date.getDate()).padStart(2, '0')

    const yesterdaysDate = `${year}-${month}-${yesterday}`

    const attributeRequest = {
      joinType: 'AND',
      queries: [
        {
          joinType: 'AND',
          matchers: [
            {
              type: 'String',
              attribute: 'prisonId',
              condition: 'IS',
              searchTerm: prisonId,
            },
            {
              type: 'String',
              attribute: 'status',
              condition: 'IS',
              searchTerm: 'ACTIVE OUT',
            },
            {
              type: 'Date',
              attribute: 'lastMovementDate',
              minValue: '1970-01-01',
              maxValue: yesterdaysDate,
            },
          ],
        },
        {
          joinType: 'OR',
          matchers: [
            {
              type: 'String',
              attribute: 'lastMovementTypeCode',
              condition: 'IS',
              searchTerm: 'CRT',
            },
            {
              type: 'String',
              attribute: 'lastMovementTypeCode',
              condition: 'IS',
              searchTerm: 'TAP',
            },
          ],
        },
      ],
    }
    return this.restClient.post<PagedList<Prisoner>>({
      path: '/attribute-search?size=2000',
      data: attributeRequest,
    })
  }
}
