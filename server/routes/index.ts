import { RequestHandler, Router } from 'express'
import { Services } from '../services'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { setAuditAction, setAuditPage } from '../middleware/auditPageView'
import EstablishmentRollController from '../controllers/establishmentRollController'
import ImageController from '../controllers/imageController'
import { dataAccess } from '../data'

export default function establishmentRollRouter(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], auditPage: string | null, ...handlers: RequestHandler[]) =>
    router.get(
      path,
      ...(auditPage ? [setAuditPage(auditPage)] : []),
      ...handlers.map(handler => asyncMiddleware(handler)),
    )

  const { prisonApiClientBuilder } = dataAccess()

  const establishmentRollController = new EstablishmentRollController(
    services.establishmentRollService,
    services.movementsService,
    services.locationsService,
  )

  const imageController = new ImageController(prisonApiClientBuilder)

  get('/', 'HOME', establishmentRollController.getEstablishmentRoll())
  get('/locations/', 'LOCATIONS', establishmentRollController.getEstablishmentRoll(true))

  get('/wing/:wingId/landing/:landingId', 'LANDING', establishmentRollController.getEstablishmentRollForLanding())
  get(
    '/wing/:wingId/spur/:spurId/landing/:landingId',
    'LANDING',
    establishmentRollController.getEstablishmentRollForLanding(),
  )
  get('/in-today', 'IN_TODAY', establishmentRollController.getInToday())
  get('/out-today', 'OUT_TODAY', establishmentRollController.getOutToday())
  get('/en-route', 'EN_ROUTE', establishmentRollController.getEnRoute())
  get('/in-reception', 'IN_RECEPTION', establishmentRollController.getInReception())
  get('/no-cell-allocated', 'NO_CELL_ALLOCATED', establishmentRollController.getUnallocated())
  get('/total-currently-out', 'TOTAL_CURRENTLY_OUT', establishmentRollController.getTotalCurrentlyOut())
  get('/:livingUnitId/currently-out', 'CURRENTLY_OUT', establishmentRollController.getCurrentlyOut())
  get('/overnights', 'OVERNIGHTS', establishmentRollController.getOvernights())

  router.get(
    '/prisonerImage/:prisonerNumber',
    setAuditAction('VIEW_PRISONER_IMAGE'),
    asyncMiddleware(imageController.prisonerImage),
  )

  return router
}
