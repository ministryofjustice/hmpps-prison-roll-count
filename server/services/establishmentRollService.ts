import { RestClientBuilder } from '../data'
import EstablishmentRollCount from './interfaces/EstablishmentRollCount'
import EstablishmentRollSummary from './interfaces/EstablishmentRollSummary'
import { PrisonApiClient } from '../data/interfaces/prisonApiClient'
import { LocationsInsidePrisonApiClient } from '../data/interfaces/locationsInsidePrisonApiClient'

export default class EstablishmentRollService {
  constructor(
    private readonly prisonApiClientBuilder: RestClientBuilder<PrisonApiClient>,
    private readonly locationsInsidePrisonApiClientBuilder: RestClientBuilder<LocationsInsidePrisonApiClient>,
  ) {}

  public async isResiLocationServiceActive(clientToken: string, caseLoadId: string): Promise<boolean> {
    const locationsApi = this.locationsInsidePrisonApiClientBuilder(clientToken)
    const { resiLocationServiceActive } = await locationsApi.getPrisonConfiguration(caseLoadId)
    return resiLocationServiceActive === 'ACTIVE'
  }

  public async getEstablishmentRollCounts(
    clientToken: string,
    caseLoadId: string,
    forceUseLocationsApi: boolean = false,
  ): Promise<EstablishmentRollCount> {
    const prisonApi = this.prisonApiClientBuilder(clientToken)
    const locationsApi = this.locationsInsidePrisonApiClientBuilder(clientToken)

    const resiLocationServiceActive = await this.isResiLocationServiceActive(clientToken, caseLoadId)

    const rollCount =
      forceUseLocationsApi || resiLocationServiceActive
        ? await locationsApi.getPrisonRollCount(caseLoadId)
        : await prisonApi.getPrisonRollCount(caseLoadId)

    return {
      todayStats: {
        unlockRoll: rollCount.numUnlockRollToday,
        inToday: rollCount.numArrivedToday,
        outToday: rollCount.numOutToday,
        currentRoll: rollCount.numCurrentPopulation,
        unassignedIn: rollCount.numInReception,
        enroute: rollCount.numStillToArrive,
        noCellAllocated: rollCount.numNoCellAllocated,
        overnights: rollCount.numOvernights,
      },
      totals: rollCount.totals,
      wings: rollCount.locations,
    }
  }

  public async getLandingRollCounts(clientToken: string, caseLoadId: string, wingId: string, landingId: string) {
    const locationsApi = this.locationsInsidePrisonApiClientBuilder(clientToken)
    const prisonApi = this.prisonApiClientBuilder(clientToken)

    const prisonIsActiveForResi = await this.isResiLocationServiceActive(clientToken, caseLoadId)

    const rollCountForWing = prisonIsActiveForResi
      ? await locationsApi.getPrisonRollCountForLocation(caseLoadId, wingId)
      : await prisonApi.getPrisonRollCountForLocation(caseLoadId, wingId)

    const wing = rollCountForWing.locations[0]

    const landingOnWing = rollCountForWing.locations[0].subLocations.find(location => location.locationId === landingId)
    if (landingOnWing) {
      return {
        wingName: wing.localName || wing.locationCode,
        landingName: landingOnWing.localName || landingOnWing.locationCode,
        cellRollCounts: landingOnWing.subLocations,
        useWorkingCapacity: prisonIsActiveForResi,
        displayOvernights: prisonIsActiveForResi,
      }
    }

    const spur = wing.subLocations.find(location =>
      location.subLocations.find(subLocation => subLocation.locationId === landingId),
    )

    const landing = spur?.subLocations.find(location => location.locationId === landingId)

    return {
      wingName: wing.localName || wing.locationCode,
      spurName: spur?.localName || spur?.locationCode,
      landingName: landing?.localName || landing?.locationCode,
      cellRollCounts: landing.subLocations,
      useWorkingCapacity: prisonIsActiveForResi,
      displayOvernights: prisonIsActiveForResi,
    }
  }

  getEstablishmentRollSummary(clientToken: string, caseLoadId: string): Promise<EstablishmentRollSummary> {
    const prisonApi = this.prisonApiClientBuilder(clientToken)
    return prisonApi.getPrisonRollCountSummary(caseLoadId)
  }
}
