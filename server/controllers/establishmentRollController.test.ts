import { NextFunction, Request, Response } from 'express'
import EstablishmentRollController from './establishmentRollController'
import EstablishmentRollService from '../services/establishmentRollService'
import MovementsService from '../services/movementsService'
import LocationService from '../services/locationsService'

const establishmentRollService = {
  getEstablishmentRollCounts: jest.fn(),
  isResiLocationServiceActive: jest.fn(),
}
const movementsService = {
  getOffendersCurrentlyOutOfBed: jest.fn(),
  getOffendersCurrentlyOutOfLivingUnit: jest.fn(),
  getOvernightPrisoners: jest.fn(),
}
const locationService = {
  getInternalLocationInfo: jest.fn(),
  getLocationInfo: jest.fn(),
}

const user = {
  activeCaseLoadId: 'LEI',
  activeCaseLoad: { description: 'Leeds' },
  userRoles: [],
} as { activeCaseLoadId: string; activeCaseLoad: { description: string }; userRoles: string[] }

const mockReq = (params: Record<string, string> = {}) =>
  ({ middleware: { clientToken: 'token' }, params }) as unknown as Request

const mockRes = () =>
  ({
    locals: { user },
    render: jest.fn(),
  }) as unknown as Response

const mockNext = () => jest.fn() as NextFunction

describe('EstablishmentRollController', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getEstablishmentRoll', () => {
    it('sets useWorkingCapacity to true when forceUseLocationsApi is true', async () => {
      establishmentRollService.getEstablishmentRollCounts.mockResolvedValue({ todayStats: {}, totals: {}, wings: [] })
      establishmentRollService.isResiLocationServiceActive.mockResolvedValue(false)

      const controller = new EstablishmentRollController(
        establishmentRollService as unknown as EstablishmentRollService,
        movementsService as unknown as MovementsService,
        locationService as unknown as LocationService,
      )

      const req = mockReq()
      const res = mockRes()
      const next = mockNext()

      await controller.getEstablishmentRoll(true)(req, res, next)

      expect(establishmentRollService.getEstablishmentRollCounts).toHaveBeenCalledWith('token', 'LEI', true)
      expect(establishmentRollService.isResiLocationServiceActive).not.toHaveBeenCalled()
      expect(res.render).toHaveBeenCalledWith(
        'pages/establishmentRoll',
        expect.objectContaining({
          useWorkingCapacity: true,
        }),
      )
    })

    it('sets useWorkingCapacity to true when service reports active and forceUseLocationsApi is false', async () => {
      establishmentRollService.getEstablishmentRollCounts.mockResolvedValue({ todayStats: {}, totals: {}, wings: [] })
      establishmentRollService.isResiLocationServiceActive.mockResolvedValue(true)

      const controller = new EstablishmentRollController(
        establishmentRollService as unknown as EstablishmentRollService,
        movementsService as unknown as MovementsService,
        locationService as unknown as LocationService,
      )

      const req = mockReq()
      const res = mockRes()
      const next = mockNext()

      await controller.getEstablishmentRoll(false)(req, res, next)

      expect(res.render).toHaveBeenCalledWith(
        'pages/establishmentRoll',
        expect.objectContaining({
          useWorkingCapacity: true,
        }),
      )
    })

    it('sets useWorkingCapacity to false when service reports inactive and forceUseLocationsApi is false', async () => {
      establishmentRollService.getEstablishmentRollCounts.mockResolvedValue({ todayStats: {}, totals: {}, wings: [] })
      establishmentRollService.isResiLocationServiceActive.mockResolvedValue(false)

      const controller = new EstablishmentRollController(
        establishmentRollService as unknown as EstablishmentRollService,
        movementsService as unknown as MovementsService,
        locationService as unknown as LocationService,
      )

      const req = mockReq()
      const res = mockRes()
      const next = mockNext()

      await controller.getEstablishmentRoll(false)(req, res, next)

      expect(establishmentRollService.isResiLocationServiceActive).toHaveBeenCalledWith('token', 'LEI')
      expect(res.render).toHaveBeenCalledWith(
        'pages/establishmentRoll',
        expect.objectContaining({
          useWorkingCapacity: false,
        }),
      )
    })
  })

  describe('getCurrentlyOut', () => {
    it('uses locations-based endpoints when prison is active', async () => {
      const prisoners = [{ prisonerNumber: 'A1234BC' }]
      establishmentRollService.isResiLocationServiceActive.mockResolvedValue(true)
      movementsService.getOffendersCurrentlyOutOfBed.mockResolvedValue(prisoners)
      movementsService.getOffendersCurrentlyOutOfLivingUnit.mockResolvedValue([])
      locationService.getInternalLocationInfo.mockResolvedValue({ localName: 'Landing 1', pathHierarchy: 'A-1-1' })
      locationService.getLocationInfo.mockResolvedValue({ userDescription: 'Wing A', description: 'A-WING' })

      const controller = new EstablishmentRollController(
        establishmentRollService as unknown as EstablishmentRollService,
        movementsService as unknown as MovementsService,
        locationService as unknown as LocationService,
      )

      const req = mockReq({ livingUnitId: '123' })
      const res = mockRes()
      const next = mockNext()

      await controller.getCurrentlyOut()(req, res, next)

      expect(establishmentRollService.isResiLocationServiceActive).toHaveBeenCalledWith('token', 'LEI')
      expect(res.render).toHaveBeenCalledWith('pages/currentlyOut', {
        prisoners,
        locationName: 'Landing 1',
      })
    })

    it('uses living-unit endpoints when prison is inactive', async () => {
      const prisoners = [{ prisonerNumber: 'A1234BC' }]
      establishmentRollService.isResiLocationServiceActive.mockResolvedValue(false)
      movementsService.getOffendersCurrentlyOutOfBed.mockResolvedValue([])
      movementsService.getOffendersCurrentlyOutOfLivingUnit.mockResolvedValue(prisoners)
      locationService.getInternalLocationInfo.mockResolvedValue({ localName: 'Landing 1', pathHierarchy: 'A-1-1' })
      locationService.getLocationInfo.mockResolvedValue({ userDescription: 'Wing A', description: 'A-WING' })

      const controller = new EstablishmentRollController(
        establishmentRollService as unknown as EstablishmentRollService,
        movementsService as unknown as MovementsService,
        locationService as unknown as LocationService,
      )

      const req = mockReq({ livingUnitId: '123' })
      const res = mockRes()
      const next = mockNext()

      await controller.getCurrentlyOut()(req, res, next)

      expect(establishmentRollService.isResiLocationServiceActive).toHaveBeenCalledWith('token', 'LEI')
      expect(res.render).toHaveBeenCalledWith('pages/currentlyOut', {
        prisoners,
        locationName: 'Wing A',
      })
    })

    it('falls back to pathHierarchy when localName is not present', async () => {
      establishmentRollService.isResiLocationServiceActive.mockResolvedValue(true)
      movementsService.getOffendersCurrentlyOutOfBed.mockResolvedValue([])
      movementsService.getOffendersCurrentlyOutOfLivingUnit.mockResolvedValue([])
      locationService.getInternalLocationInfo.mockResolvedValue({ pathHierarchy: 'A-1-3' })
      locationService.getLocationInfo.mockResolvedValue({ userDescription: 'Wing A', description: 'A-WING' })

      const controller = new EstablishmentRollController(
        establishmentRollService as unknown as EstablishmentRollService,
        movementsService as unknown as MovementsService,
        locationService as unknown as LocationService,
      )

      const req = mockReq({ livingUnitId: '123' })
      const res = mockRes()
      const next = mockNext()

      await controller.getCurrentlyOut()(req, res, next)

      expect(res.render).toHaveBeenCalledWith('pages/currentlyOut', {
        prisoners: [],
        locationName: 'A-1-3',
      })
    })

    it('falls back to description when userDescription is not present', async () => {
      establishmentRollService.isResiLocationServiceActive.mockResolvedValue(false)
      movementsService.getOffendersCurrentlyOutOfBed.mockResolvedValue([])
      movementsService.getOffendersCurrentlyOutOfLivingUnit.mockResolvedValue([])
      locationService.getInternalLocationInfo.mockResolvedValue({ localName: 'Landing 1', pathHierarchy: 'A-1-1' })
      locationService.getLocationInfo.mockResolvedValue({ description: 'A-WING-DESC' })

      const controller = new EstablishmentRollController(
        establishmentRollService as unknown as EstablishmentRollService,
        movementsService as unknown as MovementsService,
        locationService as unknown as LocationService,
      )

      const req = mockReq({ livingUnitId: '123' })
      const res = mockRes()
      const next = mockNext()

      await controller.getCurrentlyOut()(req, res, next)

      expect(res.render).toHaveBeenCalledWith('pages/currentlyOut', {
        prisoners: [],
        locationName: 'A-WING-DESC',
      })
    })
  })

  describe('getEstablishmentRoll with feature flag rendering', () => {
    it('does not render overnights card when locations API is not used, even if the eRollRebuild flag is true', async () => {
      establishmentRollService.getEstablishmentRollCounts.mockResolvedValue({ todayStats: {}, totals: {}, wings: [] })
      establishmentRollService.isResiLocationServiceActive.mockResolvedValue(false)

      const controller = new EstablishmentRollController(
        establishmentRollService as unknown as EstablishmentRollService,
        movementsService as unknown as MovementsService,
        locationService as unknown as LocationService,
      )

      const req = mockReq()
      const res = mockRes()
      const next = mockNext()
      req.featureFlags = { eRollRebuild: true }

      await controller.getEstablishmentRoll(false)(req, res, next)

      expect(res.render).toHaveBeenCalledWith('pages/establishmentRoll', {
        establishmentRollCounts: expect.any(Object),
        date: expect.anything(),
        useWorkingCapacity: false,
        displayOvernights: false,
      })
    })

    it('does not render overnights card when locations API is used if eRollRebuild flag is false', async () => {
      establishmentRollService.getEstablishmentRollCounts.mockResolvedValue({ todayStats: {}, totals: {}, wings: [] })
      establishmentRollService.isResiLocationServiceActive.mockResolvedValue(true)

      const controller = new EstablishmentRollController(
        establishmentRollService as unknown as EstablishmentRollService,
        movementsService as unknown as MovementsService,
        locationService as unknown as LocationService,
      )

      const req = mockReq()
      const res = mockRes()
      const next = mockNext()
      req.featureFlags = { eRollRebuild: false }

      await controller.getEstablishmentRoll(false)(req, res, next)

      expect(res.render).toHaveBeenCalledWith('pages/establishmentRoll', {
        establishmentRollCounts: expect.any(Object),
        date: expect.anything(),
        useWorkingCapacity: true,
        displayOvernights: false,
      })
    })

    it('renders overnights card when locations API is used and eRollRebuild flag is true', async () => {
      establishmentRollService.getEstablishmentRollCounts.mockResolvedValue({ todayStats: {}, totals: {}, wings: [] })
      establishmentRollService.isResiLocationServiceActive.mockResolvedValue(true)

      const controller = new EstablishmentRollController(
        establishmentRollService as unknown as EstablishmentRollService,
        movementsService as unknown as MovementsService,
        locationService as unknown as LocationService,
      )

      const req = mockReq()
      const res = mockRes()
      const next = mockNext()
      req.featureFlags = { eRollRebuild: true }

      await controller.getEstablishmentRoll(false)(req, res, next)

      expect(res.render).toHaveBeenCalledWith('pages/establishmentRoll', {
        establishmentRollCounts: expect.any(Object),
        date: expect.anything(),
        useWorkingCapacity: true,
        displayOvernights: true,
      })
    })
  })

  describe('getOvernights', () => {
    it('defaults sort to timeDateDeparted&direction=descending when no query is provided', async () => {
      movementsService.getOvernightPrisoners.mockResolvedValue([])

      const controller = new EstablishmentRollController(
        establishmentRollService as unknown as EstablishmentRollService,
        movementsService as unknown as MovementsService,
        locationService as unknown as LocationService,
      )

      const req = mockReq()
      const res = mockRes()
      const next = mockNext()

      await controller.getOvernights()(req, res, next)

      expect(movementsService.getOvernightPrisoners).toHaveBeenCalledWith(
        'token',
        'LEI',
        'timeDateDeparted&direction=descending',
      )
      expect(res.render).toHaveBeenCalledWith('pages/overnights', {
        currentPage: 1,
        pageSize: 5,
        prisoners: [],
        prison: 'Leeds',
        totalPages: 0,
        totalResults: 0,
        sort: 'timeDateDeparted&direction=descending',
      })
    })

    it('combines sort and direction query params when provided', async () => {
      movementsService.getOvernightPrisoners.mockResolvedValue([])

      const controller = new EstablishmentRollController(
        establishmentRollService as unknown as EstablishmentRollService,
        movementsService as unknown as MovementsService,
        locationService as unknown as LocationService,
      )

      const req = {
        ...mockReq(),
        query: { sort: 'reason', direction: 'ascending' },
      } as unknown as Request
      const res = mockRes()
      const next = mockNext()

      await controller.getOvernights()(req, res, next)

      expect(movementsService.getOvernightPrisoners).toHaveBeenCalledWith('token', 'LEI', 'reason&direction=ascending')
      expect(res.render).toHaveBeenCalledWith('pages/overnights', {
        currentPage: 1,
        pageSize: 5,
        prisoners: [],
        prison: 'Leeds',
        sort: 'reason&direction=ascending',
        totalPages: 0,
        totalResults: 0,
      })
    })

    it('renders only prisoners for the requested page', async () => {
      const prisoners = Array.from({ length: 30 }, (_, index) => ({ prisonerNumber: `A${index}` }))
      movementsService.getOvernightPrisoners.mockResolvedValue(prisoners)

      const controller = new EstablishmentRollController(
        establishmentRollService as unknown as EstablishmentRollService,
        movementsService as unknown as MovementsService,
        locationService as unknown as LocationService,
      )

      const req = {
        ...mockReq(),
        query: { page: '2' },
      } as unknown as Request
      const res = mockRes()
      const next = mockNext()

      await controller.getOvernights()(req, res, next)

      expect(res.render).toHaveBeenCalledWith('pages/overnights', {
        currentPage: 2,
        pageSize: 5,
        prisoners: prisoners.slice(5, 10),
        prison: 'Leeds',
        sort: 'timeDateDeparted&direction=descending',
        totalPages: 6,
        totalResults: 30,
      })
    })
  })
})
