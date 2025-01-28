import { dataAccess } from '../data'
import AuditService from './auditService'
import UserService from './userService'
import EstablishmentRollService from './establishmentRollService'
import MovementsService from './movementsService'
import LocationService from './locationsService'

export const services = () => {
  const {
    prisonApiClientBuilder,
    prisonerSearchApiClientBuilder,
    locationsInsidePrisonApiClientBuilder,
    applicationInfo,
    hmppsAuditClient,
  } = dataAccess()

  const userService = new UserService(prisonApiClientBuilder)
  const auditService = new AuditService(hmppsAuditClient)
  const establishmentRollService = new EstablishmentRollService(
    prisonApiClientBuilder,
    locationsInsidePrisonApiClientBuilder,
  )
  const movementsService = new MovementsService(
    prisonApiClientBuilder,
    prisonerSearchApiClientBuilder,
    locationsInsidePrisonApiClientBuilder,
  )
  const locationsService = new LocationService(prisonApiClientBuilder, locationsInsidePrisonApiClientBuilder)
  return {
    dataAccess,
    applicationInfo,
    auditService,
    userService,
    establishmentRollService,
    movementsService,
    locationsService,
  }
}

export type Services = ReturnType<typeof services>

export { UserService }
