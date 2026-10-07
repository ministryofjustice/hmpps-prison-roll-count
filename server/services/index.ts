import { AuditServiceFactory } from '@ministryofjustice/hmpps-audit-client'
import { dataAccess } from '../data'
import logger from '../logger'
import EstablishmentRollService from './establishmentRollService'
import FeComponentsService from './feComponentsService'
import LocationService from './locationsService'
import MovementsService from './movementsService'
import UserService from './userService'

export const services = () => {
  const {
    applicationInfo,
    feComponentsClient,
    locationsInsidePrisonApiClientBuilder,
    prisonApiClientBuilder,
    prisonerSearchApiClientBuilder,
  } = dataAccess()

  const auditService = AuditServiceFactory.configureFromEnv(logger)
  const establishmentRollService = new EstablishmentRollService(
    prisonApiClientBuilder,
    locationsInsidePrisonApiClientBuilder,
  )
  const feComponentsService = new FeComponentsService(feComponentsClient)
  const locationsService = new LocationService(prisonApiClientBuilder, locationsInsidePrisonApiClientBuilder)
  const movementsService = new MovementsService(
    prisonApiClientBuilder,
    prisonerSearchApiClientBuilder,
    locationsInsidePrisonApiClientBuilder,
  )
  const userService = new UserService(prisonApiClientBuilder)

  return {
    dataAccess,
    applicationInfo,
    auditService,
    establishmentRollService,
    feComponentsService,
    locationsService,
    movementsService,
    userService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
