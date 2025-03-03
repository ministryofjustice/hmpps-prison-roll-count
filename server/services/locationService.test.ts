import prisonApiClientMock from '../test/mocks/prisonApiClientMock'
import LocationService from './locationsService'
import { locationMock } from '../mocks/locationMock'
import locationsInsidePrisonApiClientMock from '../test/mocks/locationsInsidePrisonApiClientMock'

describe('LocationService', () => {
  let locationRollService: LocationService

  beforeEach(() => {
    locationRollService = new LocationService(
      () => prisonApiClientMock,
      () => locationsInsidePrisonApiClientMock,
    )
  })

  describe('getLocationInfo', () => {
    it('should call prison API and return response', async () => {
      prisonApiClientMock.getLocation = jest.fn().mockResolvedValueOnce(locationMock)

      const locationInfo = await locationRollService.getLocationInfo('token', 'MDI')

      expect(prisonApiClientMock.getLocation).toHaveBeenCalledWith('MDI')
      expect(locationInfo).toEqual(locationMock)
    })

    it('should handle errors when calling prisonApiClient fails', async () => {
      prisonApiClientMock.getLocation = jest.fn().mockRejectedValueOnce(new Error('API Error'))

      try {
        await locationRollService.getLocationInfo('token', 'MDI')
      } catch (error) {
        expect(error).toEqual(new Error('API Error'))
      }
    })
  })

  describe('isActivePrison', () => {
    it('should call locations API, returning true if prison is active', async () => {
      locationsInsidePrisonApiClientMock.isActivePrison = jest.fn().mockResolvedValueOnce(true)

      const isActive = await locationRollService.isActivePrison('token', 'prisonId')

      expect(locationsInsidePrisonApiClientMock.isActivePrison).toHaveBeenCalledWith('prisonId')
      expect(isActive).toBe(true)
    })

    it('should call locations API, returning false if prison is inactive', async () => {
      locationsInsidePrisonApiClientMock.isActivePrison = jest.fn().mockResolvedValueOnce(false)

      const isActive = await locationRollService.isActivePrison('token', 'prisonId')

      expect(locationsInsidePrisonApiClientMock.isActivePrison).toHaveBeenCalledWith('prisonId')
      expect(isActive).toBe(false)
    })

    it('should handle errors when call to locations API fails', async () => {
      locationsInsidePrisonApiClientMock.isActivePrison = jest.fn().mockRejectedValueOnce(new Error('API Error'))

      try {
        await locationRollService.isActivePrison('token', 'prisonId')
      } catch (error) {
        expect(error).toEqual(new Error('API Error'))
      }
    })
  })

  describe('getInternalLocationInfo', () => {
    it('should call locationsI API and return the internal location info', async () => {
      const internalLocationMock = { id: '123', description: 'Location Description' }
      locationsInsidePrisonApiClientMock.getLocation = jest.fn().mockResolvedValueOnce(internalLocationMock)

      const internalLocationInfo = await locationRollService.getInternalLocationInfo('token', 'MDI')

      expect(locationsInsidePrisonApiClientMock.getLocation).toHaveBeenCalledWith('MDI')
      expect(internalLocationInfo).toEqual(internalLocationMock)
    })

    it('should handle errors when locations API call fails', async () => {
      locationsInsidePrisonApiClientMock.getLocation = jest.fn().mockRejectedValueOnce(new Error('API Error'))

      try {
        await locationRollService.getInternalLocationInfo('token', 'MDI')
      } catch (error) {
        expect(error).toEqual(new Error('API Error'))
      }
    })
  })
})
