import dpsShared from '@ministryofjustice/hmpps-connect-dps-shared-items'
import { RestClientBuilder } from '../data'
import EstablishmentRollCount from './interfaces/EstablishmentRollCount'
import EstablishmentRollSummary from './interfaces/EstablishmentRollSummary'
import { PrisonApiClient } from '../data/interfaces/prisonApiClient'
import { LocationsInsidePrisonApiClient } from '../data/interfaces/locationsInsidePrisonApiClient'
import { PrisonerSearchClient } from '../data/interfaces/prisonerSearchClient'
import { ResidentialLocation } from '../data/interfaces/prisonRollCount'

export default class EstablishmentRollService {
  constructor(
    private readonly prisonApiClientBuilder: RestClientBuilder<PrisonApiClient>,
    private readonly locationsInsidePrisonApiClientBuilder: RestClientBuilder<LocationsInsidePrisonApiClient>,
    private readonly prisonerSearchClientBuilder: RestClientBuilder<PrisonerSearchClient>,
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

  public async getLandingRollCounts(
    clientToken: string,
    caseLoadId: string,
    wingId: string,
    landingId: string,
    sort: string = 'cellLocationCode&direction=ascending',
  ) {
    const locationsApi = this.locationsInsidePrisonApiClientBuilder(clientToken)
    const prisonApi = this.prisonApiClientBuilder(clientToken)

    const prisonIsActiveForResi = await this.isResiLocationServiceActive(clientToken, caseLoadId)

    const rollCountForWing = prisonIsActiveForResi
      ? await locationsApi.getPrisonRollCountForLocation(caseLoadId, wingId)
      : await prisonApi.getPrisonRollCountForLocation(caseLoadId, wingId)

    const [sortKey = 'cellLocationCode', sortDirection = 'ascending'] = sort.split('&direction=')

    const isAscending = sortDirection === 'ascending'
    const prisonersByCell: Record<string, { csra?: string }[]> = {}

    const compareStrings = (left: string, right: string) => left.localeCompare(right, 'en', { ignorePunctuation: true })
    const compareNumbers = (left: number, right: number) => left - right

    const getCellCsraSortValue = (cell: ResidentialLocation) => {
      const prisonerCsraValues = (prisonersByCell[cell.fullLocationPath] || []).map(prisoner => prisoner.csra || 'None')
      return prisonerCsraValues.sort(compareStrings)[0] || 'None'
    }

    const sortCellRollCounts = (cellRollCounts: ResidentialLocation[]) => {
      return [...cellRollCounts].sort((left, right) => {
        let comparison = 0

        switch (sortKey) {
          case 'bedsInUse':
            comparison = compareNumbers(left.rollCount?.bedsInUse || 0, right.rollCount?.bedsInUse || 0)
            break
          case 'csra':
            comparison = compareStrings(getCellCsraSortValue(left), getCellCsraSortValue(right))
            break
          case 'cellLocationCode':
          default:
            comparison = compareStrings(left.localName || left.locationCode, right.localName || right.locationCode)
            break
        }

        return isAscending ? comparison : -comparison
      })
    }

    // Get prisoner details for the wing: 
    //  Legacy (non-resi) establishments can use wing IDs that are invalid for /prisoner-locations/id/{locationId}.
    // Fall back to prison-level lookup in that mode, then map by cell path
    const prisonersInLocations = prisonIsActiveForResi
      ? await locationsApi.getPrisonersAtLocation(wingId)
      : await locationsApi.getPrisonersInPrison(caseLoadId)
    prisonersInLocations.forEach(pl => {
      prisonersByCell[pl.cellLocation] = pl.prisoners.map(prisoner => ({
        ...prisoner,
        alertFlags: dpsShared.getAlertFlagLabelsForAlerts(prisoner.alerts || []),
      }))
    })

    const wing = rollCountForWing.locations[0]

    const landingOnWing = rollCountForWing.locations[0].subLocations.find(location => location.locationId === landingId)
    if (landingOnWing) {
      return {
        wingName: wing.localName || wing.locationCode,
        landingName: landingOnWing.localName || landingOnWing.locationCode,
        cellRollCounts: sortCellRollCounts(landingOnWing.subLocations),
        useWorkingCapacity: prisonIsActiveForResi,
        prisonersByCell,
        landingId,
        wingId,
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
      cellRollCounts: sortCellRollCounts(landing.subLocations),
      useWorkingCapacity: prisonIsActiveForResi,
      prisonersByCell,
      landingId,
      wingId,
    }
  }

  getEstablishmentRollSummary(clientToken: string, caseLoadId: string): Promise<EstablishmentRollSummary> {
    const prisonApi = this.prisonApiClientBuilder(clientToken)
    return prisonApi.getPrisonRollCountSummary(caseLoadId)
  }
}
