import nock from 'nock'
import config from '../config'
import PrisonerSearchRestClient from './prisonerSearchClient'
import { restClientBuilder } from '.'
import { ApplicationInfo } from '../applicationInfo'
import { PagedList } from './interfaces/pagedList'
import { Prisoner } from './interfaces/prisoner'

jest.mock('../applicationInfo.ts', () => {
  return {
    __esModule: true,
    default: jest.fn(() => {
      return {
        applicationName: 'test',
        buildNumber: '1',
        gitRef: 'long ref',
        gitShortHash: 'short ref',
      } as ApplicationInfo
    }),
  }
})

const token = { access_token: 'token-1', expires_in: 300 }
const pagedListResponse: PagedList<Prisoner> = {
  content: [],
  totalPages: 1,
  last: true,
  totalElements: 0,
  size: 2000,
  number: 0,
  sort: { empty: true, sorted: false, unsorted: true },
  first: true,
  numberOfElements: 0,
  empty: true,
}

describe('PrisonerSearchRestClient', () => {
  let fakePrisonerSearchApi: nock.Scope
  let client: PrisonerSearchRestClient

  beforeEach(() => {
    fakePrisonerSearchApi = nock(config.apis.prisonerSearchApi.url)
    client = restClientBuilder(
      'Prisoner Search API',
      config.apis.prisonerSearchApi,
      PrisonerSearchRestClient,
    )(token.access_token)
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  it('should search for new admissions in an establishment using ADM as the last movement type', async () => {
    fakePrisonerSearchApi
      .post('/attribute-search?size=2000', {
        joinType: 'AND',
        queries: [
          {
            joinType: 'AND',
            matchers: [
              {
                type: 'String',
                attribute: 'prisonId',
                condition: 'IS',
                searchTerm: 'LEI',
              },
              {
                type: 'String',
                attribute: 'lastMovementTypeCode',
                condition: 'IS',
                searchTerm: 'ADM',
              },
            ],
          },
        ],
      })
      .matchHeader('authorization', `Bearer ${token.access_token}`)
      .reply(200, pagedListResponse)

    const output = await client.getNewAdmissionsInEstablishment('LEI')

    expect(output).toEqual(pagedListResponse)
  })

  it('should search for returns in an establishment using CRT or TAP as the last movement type', async () => {
    fakePrisonerSearchApi
      .post('/attribute-search?size=2000', {
        joinType: 'OR',
        queries: [
          {
            joinType: 'AND',
            matchers: [
              {
                type: 'String',
                attribute: 'prisonId',
                condition: 'IS',
                searchTerm: 'LEI',
              },
              {
                type: 'String',
                attribute: 'lastMovementTypeCode',
                condition: 'IS',
                searchTerm: 'CRT',
              },
            ],
          },
          {
            joinType: 'AND',
            matchers: [
              {
                type: 'String',
                attribute: 'prisonId',
                condition: 'IS',
                searchTerm: 'LEI',
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
      })
      .matchHeader('authorization', `Bearer ${token.access_token}`)
      .reply(200, pagedListResponse)

    const output = await client.getReturnsInEstablishment('LEI')

    expect(output).toEqual(pagedListResponse)
  })
})
