import { RequestHandler, Router } from 'express'
import { Services } from '../services'
import asyncMiddleware from '../middleware/asyncMiddleware'
import EstablishmentRollController from '../controllers/establishmentRollController'
import ImageController from '../controllers/imageController'
import { dataAccess } from '../data'

export default function establishmentRollRouter(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], ...handlers: RequestHandler[]) =>
    router.get(
      path,
      handlers.map(handler => asyncMiddleware(handler)),
    )

  const { prisonApiClientBuilder } = dataAccess()

  const establishmentRollController = new EstablishmentRollController(
    services.establishmentRollService,
    services.movementsService,
    services.locationsService,
  )

  const imageController = new ImageController(prisonApiClientBuilder)

  get('/', establishmentRollController.getEstablishmentRoll())
  get('/locations/', establishmentRollController.getEstablishmentRoll(true))

  get('/wing/:wingId/landing/:landingId', establishmentRollController.getEstablishmentRollForLanding())
  get('/wing/:wingId/spur/:spurId/landing/:landingId', establishmentRollController.getEstablishmentRollForLanding())
  get('/arrived-today', establishmentRollController.getArrivedToday())
  get('/out-today', establishmentRollController.getOutToday())
  get('/en-route', establishmentRollController.getEnRoute())
  get('/in-reception', establishmentRollController.getInReception())
  get('/no-cell-allocated', establishmentRollController.getUnallocated())
  get('/total-currently-out', establishmentRollController.getTotalCurrentlyOut())
  get('/:livingUnitId/currently-out', establishmentRollController.getCurrentlyOut())

  get('/prisonerImage/:prisonerNumber', imageController.prisonerImage)

  return router
}
