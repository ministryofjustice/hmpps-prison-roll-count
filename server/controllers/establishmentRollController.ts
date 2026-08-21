import { Request, RequestHandler, Response } from 'express'
import EstablishmentRollService from '../services/establishmentRollService'
import MovementsService from '../services/movementsService'
import LocationService from '../services/locationsService'
import { userHasRoles } from '../utils/utils'
import Role from '../enums/role'


const getSortParam = (
  query: Request['query'],
  defaultSortKey: string,
  defaultDirection: 'ascending' | 'descending',
) => {
  const sortKey = typeof query?.sort === 'string' ? query.sort : defaultSortKey
  const direction = typeof query?.direction === 'string' ? query.direction : defaultDirection

  return `${sortKey}&direction=${direction}`
}

const pageSize = 5

const getCurrentPage = (query: Request['query'], totalPages: number) => {
  const requestedPage =
    typeof query?.page === 'string' && Number.parseInt(query.page, 10) > 0 ? Number.parseInt(query.page, 10) : 1

  if (totalPages === 0) return 1

  return Math.min(requestedPage, totalPages)
}

export default class EstablishmentRollController {
  constructor(
    private readonly establishmentRollService: EstablishmentRollService,
    private readonly movementsService: MovementsService,
    private readonly locationService: LocationService,
  ) {}

  public getEstablishmentRoll(forceUseLocationsApi: boolean = false): RequestHandler {
    return async (req: Request, res: Response) => {
      const { user } = res.locals
      const { clientToken } = req.middleware
      const establishmentRollCounts = await this.establishmentRollService.getEstablishmentRollCounts(
        clientToken,
        user.activeCaseLoadId,
        forceUseLocationsApi,
      )

      const useLocationsApi =
        forceUseLocationsApi ||
        (await this.establishmentRollService.isResiLocationServiceActive(clientToken, user.activeCaseLoadId))

      const eRollEnabled = req.featureFlags?.eRollRebuild

      res.render('pages/establishmentRoll', {
        establishmentRollCounts: establishmentRollCounts || null,
        date: new Date(),
        useWorkingCapacity: useLocationsApi,
        displayOvernights: useLocationsApi && eRollEnabled,
      })
    }
  }

  public getEstablishmentRollForLanding(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { user } = res.locals
      const { clientToken } = req.middleware
      const { landingId, wingId } = req.params as { landingId: string; wingId: string }
      const sort = getSortParam(req.query, 'cellLocationCode', 'ascending')

      const rollCounts = await this.establishmentRollService.getLandingRollCounts(
        clientToken,
        user.activeCaseLoadId,
        wingId,
        landingId,
        sort,
      )

      res.render('pages/establishmentRollLanding', { ...rollCounts, sort })
    }
  }

  public getArrivedToday(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { user } = res.locals
      const { clientToken } = req.middleware

      const arrivedPrisoners = await this.movementsService.getArrivedTodayPrisoners(clientToken, user.activeCaseLoadId)

      res.render('pages/arrivingToday', { prisoners: arrivedPrisoners })
    }
  }

  public getOutToday(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { user } = res.locals
      const { clientToken } = req.middleware

      const prisonersOutToday = await this.movementsService.getOutTodayPrisoners(clientToken, user.activeCaseLoadId)

      res.render('pages/outToday', { prisoners: prisonersOutToday })
    }
  }

  public getEnRoute(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { user } = res.locals
      const { clientToken } = req.middleware

      const prisonersEnRoute = await this.movementsService.getEnRoutePrisoners(clientToken, user.activeCaseLoadId)

      res.render('pages/enRoute', { prisoners: prisonersEnRoute, prison: user.activeCaseLoad.description })
    }
  }

  public getInReception(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { user } = res.locals
      const { clientToken } = req.middleware

      const prisonersEnRoute = await this.movementsService.getInReceptionPrisoners(clientToken, user.activeCaseLoadId)

      const totalResults = prisonersEnRoute.length
      const totalPages = Math.ceil(prisonersEnRoute.length / pageSize)
      const currentPage = getCurrentPage(req.query, totalPages)
      const startIndex = (currentPage - 1) * pageSize
      const prisonersForCurrentPage = prisonersEnRoute.slice(startIndex, startIndex + pageSize)

      res.render('pages/inReception', {
        prisoners: prisonersForCurrentPage,
        prison: user.activeCaseLoad.description,
        currentPage,
        totalPages,
        totalResults,
        pageSize,
      })
    }
  }

  public getUnallocated(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { user } = res.locals
      const { clientToken } = req.middleware

      const unallocatedPrisoners = await this.movementsService.getNoCellAllocatedPrisoners(
        clientToken,
        user.activeCaseLoadId,
      )

      res.render('pages/noCellAllocated', {
        prisoners: unallocatedPrisoners,
        userCanAllocateCell: userHasRoles([Role.CellMove], user.userRoles),
      })
    }
  }

  public getCurrentlyOut(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { livingUnitId } = req.params as { livingUnitId: string }
      const { clientToken } = req.middleware
      const { user } = res.locals

      const useLocationsApi = await this.establishmentRollService.isResiLocationServiceActive(
        clientToken,
        user.activeCaseLoadId,
      )

      if (useLocationsApi) {
        const [prisonersCurrentlyOut, location] = await Promise.all([
          this.movementsService.getOffendersCurrentlyOutOfBed(clientToken, livingUnitId),
          this.locationService.getInternalLocationInfo(clientToken, livingUnitId),
        ])

        res.render('pages/currentlyOut', {
          prisoners: prisonersCurrentlyOut,
          locationName: location.localName ? location.localName : location.pathHierarchy,
        })
      } else {
        const [prisonersCurrentlyOut, location] = await Promise.all([
          this.movementsService.getOffendersCurrentlyOutOfLivingUnit(clientToken, livingUnitId),
          this.locationService.getLocationInfo(clientToken, livingUnitId),
        ])

        res.render('pages/currentlyOut', {
          prisoners: prisonersCurrentlyOut,
          locationName: location.userDescription ? location.userDescription : location.description,
        })
      }
    }
  }

  public getTotalCurrentlyOut(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { user } = res.locals
      const { clientToken } = req.middleware

      const prisonersCurrentlyOut = await this.movementsService.getOffendersCurrentlyOutTotal(
        clientToken,
        user.activeCaseLoadId,
      )

      res.render('pages/currentlyOut', {
        prisoners: prisonersCurrentlyOut,
        locationName: null,
      })
    }
  }

  public getOvernights(): RequestHandler {
    return async (req: Request, res: Response) => {
      const { user } = res.locals
      const { clientToken } = req.middleware
      const sort = getSortParam(req.query, 'timeDateDeparted', 'descending')

      const prisonersOutOvernight = await this.movementsService.getOvernightPrisoners(
        clientToken,
        user.activeCaseLoadId,
        sort,
      )

      res.render('pages/overnights', {
        prisoners: prisonersOutOvernight,
        prison: user.activeCaseLoad.description,
        sort,
      })
    }
  }
}
