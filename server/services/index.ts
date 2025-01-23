import { dataAccess } from '../data'
import AuditService from './auditService'
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
    applicationInfo,
    auditService,
    establishmentRollService,
    movementsService,
    locationsService,
  }
}

export type Services = ReturnType<typeof services>
