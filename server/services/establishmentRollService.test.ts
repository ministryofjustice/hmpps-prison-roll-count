import EstablishmentRollService from './establishmentRollService'
import prisonApiClientMock from '../test/mocks/prisonApiClientMock'
import prisonRollCountMock from '../mocks/prisonRollCountMock'
import prisonRollCountForWingNoSpurMock from '../mocks/prisonRollCountForWingNoSpurMock'
import prisonRollCountForWingWithSpurMock from '../mocks/prisonRollCountForWingWithSpurMock'
import prisonEstablishmentRollSummaryMock from '../mocks/prisonRollCountSummaryMock'
import locationsInsidePrisonApiClientMock from '../test/mocks/locationsInsidePrisonApiClientMock'

describe('establishmentRollService', () => {
  let establishmentRollService: EstablishmentRollService

  beforeEach(() => {
    jest.clearAllMocks()
    establishmentRollService = new EstablishmentRollService(
      () => prisonApiClientMock,
      () => locationsInsidePrisonApiClientMock,
    )
  })

  describe('getEstablishmentRollCounts', () => {
    beforeEach(() => {
      prisonApiClientMock.getPrisonRollCount = jest.fn().mockResolvedValueOnce(prisonRollCountMock)
      locationsInsidePrisonApiClientMock.getPrisonConfiguration = jest
        .fn()
        .mockResolvedValue({ prisonId: 'LEI', resiLocationServiceActive: 'INACTIVE' })
    })

    it('should return data from API for the today stats', async () => {
      const establishmentRollCounts = await establishmentRollService.getEstablishmentRollCounts('token', 'LEI')

      expect(establishmentRollCounts.todayStats).toEqual({
        currentRoll: 200,
        enroute: 500,
        inToday: 300,
        noCellAllocated: 700,
        outToday: 600,
        unassignedIn: 400,
        unlockRoll: 100,
      })
    })

    it('should return data from API for the total stats', async () => {
      const establishmentRollCounts = await establishmentRollService.getEstablishmentRollCounts('token', 'LEI')

      expect(establishmentRollCounts.totals).toEqual({
        bedsInUse: 10,
        currentlyInCell: 20,
        currentlyOut: 30,
        netVacancies: 50,
        outOfOrder: 60,
        workingCapacity: 40,
      })
    })

    it('should return wing data from API', async () => {
      const establishmentRollCounts = await establishmentRollService.getEstablishmentRollCounts('token', 'LEI')

      expect(establishmentRollCounts.wings).toEqual(prisonRollCountMock.locations)
    })
    it('should use the prisonAPI to get roll count when resiLocationServiceActive is INACTIVE and forceUseLocationsApi is false', async () => {
      await establishmentRollService.getEstablishmentRollCounts('token', 'LEI', false)
      expect(prisonApiClientMock.getPrisonRollCount).toHaveBeenCalledWith('LEI')
      expect(locationsInsidePrisonApiClientMock.getPrisonRollCount).not.toHaveBeenCalled()
    })

    it('should use the locations API to get roll count when forceUseLocationsApi is true', async () => {
      prisonApiClientMock.getPrisonRollCount = jest.fn()
      locationsInsidePrisonApiClientMock.getPrisonConfiguration = jest
        .fn()
        .mockResolvedValue({ prisonId: 'LEI', resiLocationServiceActive: 'INACTIVE' })
      locationsInsidePrisonApiClientMock.getPrisonRollCount = jest.fn().mockResolvedValue(prisonRollCountMock)

      await establishmentRollService.getEstablishmentRollCounts('token', 'LEI', true)

      expect(locationsInsidePrisonApiClientMock.getPrisonRollCount).toHaveBeenCalledWith('LEI')
      expect(prisonApiClientMock.getPrisonRollCount).not.toHaveBeenCalled()
    })

    it('should use the locations API to get roll count when resiLocationServiceActive is ACTIVE', async () => {
      prisonApiClientMock.getPrisonRollCount = jest.fn()
      locationsInsidePrisonApiClientMock.getPrisonConfiguration = jest
        .fn()
        .mockResolvedValue({ prisonId: 'LEI', resiLocationServiceActive: 'ACTIVE' })
      locationsInsidePrisonApiClientMock.getPrisonRollCount = jest.fn().mockResolvedValue(prisonRollCountMock)

      await establishmentRollService.getEstablishmentRollCounts('token', 'LEI', true)

      expect(locationsInsidePrisonApiClientMock.getPrisonRollCount).toHaveBeenCalledWith('LEI')
      expect(prisonApiClientMock.getPrisonRollCount).not.toHaveBeenCalled()
    })
  })

  describe('getLandingRollCounts', () => {
    describe('Two levels of hierarchy', () => {
      beforeEach(() => {
        locationsInsidePrisonApiClientMock.getPrisonConfiguration = jest
          .fn()
          .mockResolvedValue({ prisonId: 'LEI', resiLocationServiceActive: 'INACTIVE' })
        prisonApiClientMock.getPrisonRollCountForLocation = jest
          .fn()
          .mockResolvedValue(prisonRollCountForWingNoSpurMock)
      })

      it('should call api with wingId', async () => {
        await establishmentRollService.getLandingRollCounts('token', 'LEI', '13075', '13076')
        expect(prisonApiClientMock.getPrisonRollCountForLocation).toHaveBeenCalledWith('LEI', '13075')
        expect(locationsInsidePrisonApiClientMock.getPrisonRollCountForLocation).not.toHaveBeenCalled()
      })

      it('should return the wing name', async () => {
        const establishmentRollCounts = await establishmentRollService.getLandingRollCounts(
          'token',
          'LEI',
          '13075',
          '13076',
        )
        expect(establishmentRollCounts.wingName).toEqual('E')
      })

      it('should return the landing name', async () => {
        const establishmentRollCounts = await establishmentRollService.getLandingRollCounts(
          'token',
          'LEI',
          '13075',
          '13076',
        )
        expect(establishmentRollCounts.landingName).toEqual('3')
      })

      it('should return the roll counts for cells within requested landing', async () => {
        const establishmentRollCounts1 = await establishmentRollService.getLandingRollCounts(
          'token',
          'LEI',
          '13075',
          '13076',
        )

        const establishmentRollCounts2 = await establishmentRollService.getLandingRollCounts(
          'token',
          'LEI',
          '13075',
          '13104',
        )

        expect(establishmentRollCounts1.cellRollCounts).toEqual(
          prisonRollCountForWingNoSpurMock.locations[0].subLocations[0].subLocations,
        )
        expect(establishmentRollCounts2.cellRollCounts).toEqual(
          prisonRollCountForWingNoSpurMock.locations[0].subLocations[1].subLocations,
        )
      })

      it('should use locations API when resiLocationServiceActive is ACTIVE', async () => {
        locationsInsidePrisonApiClientMock.getPrisonConfiguration = jest
          .fn()
          .mockResolvedValue({ prisonId: 'LEI', resiLocationServiceActive: 'ACTIVE' })
        locationsInsidePrisonApiClientMock.getPrisonRollCountForLocation = jest
          .fn()
          .mockResolvedValue(prisonRollCountForWingNoSpurMock)
        prisonApiClientMock.getPrisonRollCountForLocation = jest.fn()

        const establishmentRollCounts = await establishmentRollService.getLandingRollCounts(
          'token',
          'LEI',
          '13075',
          '13076',
        )

        expect(locationsInsidePrisonApiClientMock.getPrisonRollCountForLocation).toHaveBeenCalledWith('LEI', '13075')
        expect(prisonApiClientMock.getPrisonRollCountForLocation).not.toHaveBeenCalled()
        expect(establishmentRollCounts.useWorkingCapacity).toBe(true)
      })
    })

    describe('Three levels of hierarchy', () => {
      beforeEach(() => {
        locationsInsidePrisonApiClientMock.getPrisonConfiguration = jest
          .fn()
          .mockResolvedValue({ prisonId: 'HOI', resiLocationServiceActive: 'INACTIVE' })
        prisonApiClientMock.getPrisonRollCountForLocation = jest
          .fn()
          .mockResolvedValue(prisonRollCountForWingWithSpurMock)
      })

      it('should call api with wingId', async () => {
        await establishmentRollService.getLandingRollCounts('token', 'HOI', '39255', '39270')
        expect(prisonApiClientMock.getPrisonRollCountForLocation).toHaveBeenCalledWith('HOI', '39255')
        expect(locationsInsidePrisonApiClientMock.getPrisonRollCountForLocation).not.toHaveBeenCalled()
      })

      it('should return the wing name', async () => {
        const establishmentRollCounts = await establishmentRollService.getLandingRollCounts(
          'token',
          'HOI',
          '39255',
          '39270',
        )
        expect(establishmentRollCounts.wingName).toEqual('2')
      })

      it('should return the spur name', async () => {
        const establishmentRollCounts = await establishmentRollService.getLandingRollCounts(
          'token',
          'HOI',
          '39255',
          '39270',
        )
        expect(establishmentRollCounts.spurName).toEqual('1')
      })

      it('should return the landing name', async () => {
        const establishmentRollCounts = await establishmentRollService.getLandingRollCounts(
          'token',
          'HOI',
          '39255',
          '39270',
        )
        expect(establishmentRollCounts.landingName).toEqual('B')
      })

      it('should return the roll counts for cells within requested landing', async () => {
        const establishmentRollCounts1 = await establishmentRollService.getLandingRollCounts(
          'token',
          'HOI',
          '39255',
          '39270',
        )

        expect(establishmentRollCounts1.cellRollCounts).toEqual(
          prisonRollCountForWingWithSpurMock.locations[0].subLocations[0].subLocations[1].subLocations,
        )
      })
    })
  })

  describe('getEstablishmentRollSummary', () => {
    it('should call the prisonApiClient with the correct parameters', async () => {
      await establishmentRollService.getEstablishmentRollSummary('token', 'LEI')
      expect(prisonApiClientMock.getPrisonRollCountSummary).toHaveBeenCalledWith('LEI')
    })

    it('should return the data from the API', async () => {
      prisonApiClientMock.getPrisonRollCountSummary = jest.fn().mockResolvedValue(prisonEstablishmentRollSummaryMock)
      const establishmentRollSummary = await establishmentRollService.getEstablishmentRollSummary('token', 'LEI')
      expect(establishmentRollSummary).toEqual(prisonEstablishmentRollSummaryMock)
    })
  })
})
