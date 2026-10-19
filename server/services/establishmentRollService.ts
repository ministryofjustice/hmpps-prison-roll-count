import dpsShared from '@ministryofjustice/hmpps-connect-dps-shared-items'
import { RestClientBuilder } from '../data'
import EstablishmentRollCount from './interfaces/EstablishmentRollCount'
import EstablishmentRollSummary from './interfaces/EstablishmentRollSummary'
import { PrisonApiClient } from '../data/interfaces/prisonApiClient'
import { LocationsInsidePrisonApiClient } from '../data/interfaces/locationsInsidePrisonApiClient'
import { ResidentialLocation } from '../data/interfaces/prisonRollCount'
import { getEffectiveArrivalType, getMovementHistoryStartDate } from '../utils/movementType'

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

    const [rollCount, arrivedTodayMovements, outTodayMovements] = await Promise.all([
      forceUseLocationsApi || resiLocationServiceActive
        ? locationsApi.getPrisonRollCount(caseLoadId)
        : prisonApi.getPrisonRollCount(caseLoadId),
      prisonApi.getMovementsIn(caseLoadId, new Date().toISOString()),
      prisonApi.getMovementsOut(caseLoadId, new Date().toISOString()),
    ])

    // Calculcate how many new admissions, transfers in and returns there are based on the recent movement history for offenders that arrived today
    const offenderArrivalHistories = await Promise.all(
      (arrivedTodayMovements || []).map(async movement => ({
        offenderNo: movement.offenderNo,
        history: (
          await prisonApi.getOffenderMovements(
            movement.offenderNo,
            getMovementHistoryStartDate(movement.movementDateTime),
          )
        ).slice(-2),
      })),
    )

    // Count arrival types based on recent movement types
    let newAdmissions = 0
    let transfersIn = 0
    let returns = 0

    offenderArrivalHistories.forEach(({ history }) => {
      const arrivalType = getEffectiveArrivalType(history)

      switch (arrivalType) {
        case 'ADM':
          newAdmissions += 1
          break
        case 'TRN':
          transfersIn += 1
          break
        case 'CRT':
        case 'TAP':
          returns += 1
          break
        default:
          break
      }
    })

    // Calculate how many temporary absences, court appearances, releases and transfers out there are based on the recent movement history for offenders that departed today
    const uniqueDepartureOffenderNos = [...new Set((outTodayMovements || []).map(movement => movement.offenderNo))]
    const offenderDepartureHistories = await Promise.all(
      uniqueDepartureOffenderNos.map(async offenderNo => ({
        offenderNo,
        history: (await prisonApi.getOffenderMovements(offenderNo, getMovementHistoryStartDate())).slice(-2),
      })),
    )

    const departureHistoryByOffender = new Map(
      offenderDepartureHistories.map(({ offenderNo, history }) => [offenderNo, history]),
    )

    // Count departure types based on recent movement types
    let temporaryAbsence = 0
    let atCourt = 0
    let released = 0
    let transferredOut = 0

    ;(outTodayMovements || []).forEach(movement => {
      const history = departureHistoryByOffender.get(movement.offenderNo) || []
      const departureType = history[history.length - 1]?.movementType

      switch (departureType) {
        case 'TAP':
          temporaryAbsence += 1
          break
        case 'CRT':
          atCourt += 1
          break
        case 'REL':
          released += 1
          break
        case 'TRN':
          transferredOut += 1
          break
        default:
          break
      }
    })

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
        newAdmissions,
        transfersIn,
        returns,
        temporaryAbsence,
        atCourt,
        released,
        transferredOut,
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

    // Prisons not yet using the residential locations service take capacity from NOMIS, where cell level
    // operational capacity is often 0, so fall back to maximum capacity until working capacity is set
    const getBedsAvailable = (cell: ResidentialLocation) => {
      const { workingCapacity = 0, maxCapacity = 0, bedsInUse = 0 } = cell.rollCount || {}
      const capacity = prisonIsActiveForResi || workingCapacity > 0 ? workingCapacity : maxCapacity
      return capacity - bedsInUse
    }

    const withBedsAvailable = (cells: ResidentialLocation[]) =>
      cells.map(cell => ({ ...cell, bedsAvailable: getBedsAvailable(cell) }))

    const getCellCsraSortValue = (cell: ResidentialLocation) => {
      const prisonerCsraValues = (prisonersByCell[cell.fullLocationPath] || []).map(prisoner => prisoner.csra || 'None')
      return prisonerCsraValues.sort(compareStrings)[0] || 'None'
    }

    const sortCellRollCounts = (cellRollCounts: ReturnType<typeof withBedsAvailable>) => {
      return [...cellRollCounts].sort((left, right) => {
        let comparison: number

        switch (sortKey) {
          case 'bedsAvailable':
            comparison = compareNumbers(left.bedsAvailable, right.bedsAvailable)
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
    // Legacy (non-resi) establishments can use wing IDs that are invalid for /prisoner-locations/id/{locationId}.
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
        cellRollCounts: sortCellRollCounts(withBedsAvailable(landingOnWing.subLocations)),
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
      cellRollCounts: sortCellRollCounts(withBedsAvailable(landing.subLocations)),
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
