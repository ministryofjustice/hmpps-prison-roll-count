import nock from 'nock'
import config from '../config'
import LocationsInsidePrisonApiRestClient from './locationsInsidePrisonApiClient'
import { restClientBuilder } from '.'
import { ApplicationInfo } from '../applicationInfo'

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

describe('LocationsInsidePrisonApiRestClient', () => {
  let fakeLocationsInsidePrisonApi: nock.Scope
  let client: LocationsInsidePrisonApiRestClient

  beforeEach(() => {
    fakeLocationsInsidePrisonApi = nock(config.apis.locationsInsidePrisonApi.url)
    client = restClientBuilder(
      'Locations Inside Prison API',
      config.apis.locationsInsidePrisonApi,
      LocationsInsidePrisonApiRestClient,
    )(token.access_token)
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })

  describe('getPrisonConfiguration', () => {
    it('should return prison configuration from the API', async () => {
      const prisonId = 'MDI'
      const prisonConfigMock = { prisonId, resiLocationServiceActive: true }

      fakeLocationsInsidePrisonApi
        .get(`/prison-configuration/${prisonId}`)
        .matchHeader('authorization', `Bearer ${token.access_token}`)
        .reply(200, prisonConfigMock)

      const output = await client.getPrisonConfiguration(prisonId)
      expect(output).toEqual(prisonConfigMock)
    })

    it('should return prison configuration with resiLocationServiceActive false', async () => {
      const prisonId = 'LEI'
      const prisonConfigMock = { prisonId, resiLocationServiceActive: false }

      fakeLocationsInsidePrisonApi
        .get(`/prison-configuration/${prisonId}`)
        .matchHeader('authorization', `Bearer ${token.access_token}`)
        .reply(200, prisonConfigMock)

      const output = await client.getPrisonConfiguration(prisonId)
      expect(output).toEqual(prisonConfigMock)
    })
  })
})
