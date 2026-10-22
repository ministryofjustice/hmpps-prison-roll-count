import dpsShared from '@ministryofjustice/hmpps-connect-dps-shared-items'
import { RestClientBuilder } from '../data'
import { PrisonApiClient } from '../data/interfaces/prisonApiClient'
import { PrisonerSearchClient } from '../data/interfaces/prisonerSearchClient'
import { PrisonerWithAlerts } from './interfaces/PrisonerWithAlerts'
import { stripAgencyPrefix } from '../utils/utils'
import { Prisoner } from '../data/interfaces/prisoner'
import { BedAssignment } from '../data/interfaces/bedAssignment'
import { OffenderMovement } from '../data/interfaces/offenderMovement'
import { LocationsInsidePrisonApiClient } from '../data/interfaces/locationsInsidePrisonApiClient'
import { getEffectiveArrivalType, getMovementHistoryStartDate } from '../utils/movementType'

export default class MovementsService {
  constructor(
    private readonly prisonApiClientBuilder: RestClientBuilder<PrisonApiClient>,
    private readonly prisonerSearchClientBuilder: RestClientBuilder<PrisonerSearchClient>,
    private readonly locationsInsidePrisonApiClientBuilder: RestClientBuilder<LocationsInsidePrisonApiClient>,
  ) {}

  private getMovementHistoryStartDateFromMovement(
    movement?: { movementDateTime?: string; movementDate?: string } | string,
  ): string {
    if (typeof movement === 'string') return getMovementHistoryStartDate(movement)

    return getMovementHistoryStartDate(movement?.movementDateTime || movement?.movementDate)
  }

  public async getInTodayPrisoners(
    clientToken: string,
    caseLoadId: string,
    sort: string = 'timeArrived&direction=descending',
  ): Promise<(PrisonerWithAlerts & { movementTime: string; arrivedFrom: string; arrivalType?: string })[]> {
    const prisonApi = this.prisonApiClientBuilder(clientToken)
    const prisonerSearchClient = this.prisonerSearchClientBuilder(clientToken)

    const movements = await prisonApi.getMovementsIn(caseLoadId, new Date().toISOString())
    if (!movements || !movements?.length) return []

    const prisonerNumbers = movements.map(movement => movement.offenderNo)

    const [prisoners, offenderMovements] = await Promise.all([
      prisonerSearchClient.getPrisonersById(prisonerNumbers),
      Promise.all(
        movements.map(
          async prisonerMovement =>
            [
              prisonerMovement.offenderNo,
              (
                await prisonApi.getOffenderMovements(
                  prisonerMovement.offenderNo,
                  this.getMovementHistoryStartDateFromMovement(prisonerMovement),
                )
              )?.slice(-2) || [],
            ] as const,
        ),
      ),
    ])
    const prisonerByNumber = new Map(prisoners.map(prisoner => [prisoner.prisonerNumber, prisoner]))
    const offenderMovementsByOffender = new Map<string, OffenderMovement[]>()

    offenderMovements.forEach(([offenderNo, history]) => {
      const existingHistory = offenderMovementsByOffender.get(offenderNo) || []
      offenderMovementsByOffender.set(offenderNo, [...existingHistory, ...history])
    })

    const mappedPrisoners = movements.map(prisonerMovement => {
      const prisoner = prisonerByNumber.get(prisonerMovement.offenderNo)
      const movementHistory = offenderMovementsByOffender.get(prisonerMovement.offenderNo) || []
      const arrivalType = getEffectiveArrivalType(movementHistory)

      return {
        ...prisoner,
        movementTime: prisonerMovement?.movementTime,
        arrivedFrom: prisonerMovement?.fromAgencyDescription || prisonerMovement?.fromAddress,
        alertFlags: dpsShared.getAlertFlagLabelsForAlerts(prisoner?.alerts || []),
        ...(arrivalType ? { arrivalType } : {}),
      }
    })

    const [sortKey = 'timeArrived', sortDirection = 'descending'] = sort.split('&direction=')
    const isAscending = sortDirection === 'ascending'
    const compareStrings = (left: string, right: string) => left.localeCompare(right, 'en', { ignorePunctuation: true })
    const getArrivalTypeLabel = (arrivalType?: string) => {
      switch (arrivalType) {
        case 'ADM':
          return 'New admission'
        case 'TRN':
          return 'Transfers in'
        case 'CRT':
        case 'TAP':
          return 'Return'
        default:
          return ''
      }
    }

    return mappedPrisoners.sort((left, right) => {
      let comparison: number

      switch (sortKey) {
        case 'arrivalType':
          comparison = compareStrings(getArrivalTypeLabel(left.arrivalType), getArrivalTypeLabel(right.arrivalType))
          break
        case 'timeArrived':
          comparison = compareStrings(left.movementTime || '', right.movementTime || '')
          break
        case 'currentStatus':
          comparison = compareStrings(left.inOutStatus || '', right.inOutStatus || '')
          break
        case 'csra':
          comparison = compareStrings(left.csra || 'None', right.csra || 'None')
          break
        case 'lastName':
        default:
          comparison = compareStrings(left.lastName || '', right.lastName || '')
          if (comparison === 0) {
            comparison = compareStrings(left.firstName || '', right.firstName || '')
          }
      }

      return isAscending ? comparison : -comparison
    })
  }

  public async getOutTodayPrisoners(
    clientToken: string,
    caseLoadId: string,
    sort: string = 'timeOut&direction=descending',
  ): Promise<(PrisonerWithAlerts & { timeOut: string; reasonDescription: string })[]> {
    const prisonApi = this.prisonApiClientBuilder(clientToken)
    const prisonerSearchClient = this.prisonerSearchClientBuilder(clientToken)

    const movements = await prisonApi.getMovementsOut(caseLoadId, new Date().toISOString())
    if (!movements || !movements?.length) return []

    const prisonerNumbers = movements.map(movement => movement.offenderNo)

    const [prisoners, offenderMovements] = await Promise.all([
      prisonerSearchClient.getPrisonersById(prisonerNumbers),
      Promise.all(
        movements.map(
          async prisonerMovement =>
            [
              prisonerMovement.offenderNo,
              (
                await prisonApi.getOffenderMovements(
                  prisonerMovement.offenderNo,
                  this.getMovementHistoryStartDateFromMovement(prisonerMovement),
                )
              )?.slice(-2) || [],
            ] as const,
        ),
      ),
    ])
    const prisonerByNumber = new Map(prisoners.map(prisoner => [prisoner.prisonerNumber, prisoner]))
    const offenderMovementsByOffender = new Map<string, OffenderMovement[]>()

    offenderMovements.forEach(([offenderNo, history]) => {
      const existingHistory = offenderMovementsByOffender.get(offenderNo) || []
      offenderMovementsByOffender.set(offenderNo, [...existingHistory, ...history])
    })

    const mappedPrisoners = movements.map((prisonerMovement, index) => {
      const prisoner = prisonerByNumber.get(prisonerMovement.offenderNo)
      const historyForThisMovement = offenderMovements[index]?.[1] || []
      const departureTypeCode =
        prisonerMovement.movementType || historyForThisMovement[historyForThisMovement.length - 1]?.movementType

      return {
        ...prisoner,
        timeOut: prisonerMovement?.timeOut,
        reasonDescription: prisonerMovement.reasonDescription,
        goingTo: prisonerMovement?.toAddress,
        alertFlags: dpsShared.getAlertFlagLabelsForAlerts(prisoner?.alerts || []),
        ...(departureTypeCode ? { departureTypeCode } : {}),
      }
    })

    const [sortKey = 'timeOut', sortDirection = 'descending'] = sort.split('&direction=')
    const isAscending = sortDirection === 'ascending'
    const compareStrings = (left: string, right: string) => left.localeCompare(right, 'en', { ignorePunctuation: true })
    const getDepartureTypeLabel = (departureTypeCode?: string) => {
      switch (departureTypeCode) {
        case 'TAP':
          return 'Temporary absence'
        case 'CRT':
          return 'At court'
        case 'REL':
          return 'Release'
        case 'TRN':
          return 'Transfer'
        default:
          return ''
      }
    }

    return mappedPrisoners.sort((left, right) => {
      let comparison: number

      switch (sortKey) {
        case 'lastName':
          comparison = compareStrings(left.lastName || '', right.lastName || '')
          if (comparison === 0) {
            comparison = compareStrings(left.firstName || '', right.firstName || '')
          }
          break
        case 'reasonForAbsence':
          comparison = compareStrings(
            getDepartureTypeLabel(left.departureTypeCode) + (left.reasonDescription || ''),
            getDepartureTypeLabel(right.departureTypeCode) + (right.reasonDescription || ''),
          )
          break
        case 'timeOut':
          comparison = compareStrings(left.timeOut || '', right.timeOut || '')
          break
        case 'currentStatus':
          comparison = compareStrings(left.status || '', right.status || '')
          break
        default:
          comparison = compareStrings(left.timeOut || '', right.timeOut || '')
      }

      return isAscending ? comparison : -comparison
    })
  }

  public async getEnRoutePrisoners(
    clientToken: string,
    caseLoadId: string,
  ): Promise<(PrisonerWithAlerts & { from: string; reason: string })[]> {
    const prisonApi = this.prisonApiClientBuilder(clientToken)
    const prisonerSearchClient = this.prisonerSearchClientBuilder(clientToken)

    const movements = await prisonApi.getMovementsEnRoute(caseLoadId)
    if (!movements || !movements?.length) return []

    const prisoners = await prisonerSearchClient.getPrisonersById(movements.map(movement => movement.offenderNo))

    return prisoners
      .sort((a, b) => a.lastName.localeCompare(b.lastName, 'en', { ignorePunctuation: true }))
      .map(prisoner => {
        const prisonerMovement = movements.find(movement => movement.offenderNo === prisoner.prisonerNumber)
        return {
          ...prisoner,
          from: prisonerMovement?.fromAgencyDescription,
          reason: prisonerMovement?.movementReasonDescription,
          alertFlags: dpsShared.getAlertFlagLabelsForAlerts(prisoner.alerts),
          movementTime: prisonerMovement?.movementTime,
          movementDate: prisonerMovement?.movementDate,
        }
      })
  }

  public async getOvernightPrisoners(
    clientToken: string,
    caseLoadId: string,
    sort: string = 'timeDateDeparted&direction=descending',
  ): Promise<(PrisonerWithAlerts & { movementTime: string })[]> {
    const prisonApi = this.prisonApiClientBuilder(clientToken)
    const prisonerSearchClient = this.prisonerSearchClientBuilder(clientToken)

    const { content: overnightPrisoners } = await prisonerSearchClient.getOvernightPrisonersInEstablishment(caseLoadId)
    if (!overnightPrisoners?.length) return []

    const prisonerNumbers = overnightPrisoners.map(prisoner => prisoner.prisonerNumber)

    const [prisoners, recentMovements] = await Promise.all([
      prisonerSearchClient.getPrisonersById(prisonerNumbers),
      prisonApi.getRecentMovements(prisonerNumbers),
    ])

    const mappedPrisoners = prisoners.map(prisoner => {
      const recentMovement = recentMovements.find(movement => movement.offenderNo === prisoner.prisonerNumber)

      return {
        ...prisoner,
        alertFlags: dpsShared.getAlertFlagLabelsForAlerts(prisoner.alerts),
        movementTime: recentMovement?.movementTime,
        movementDate: recentMovement?.movementDate,
        reason: recentMovement?.movementReason,
      }
    })

    // Sorting functionality
    const [sortKey = 'timeDateDeparted', sortDirection = 'descending'] = sort.split('&direction=')

    const isAscending = sortDirection === 'ascending'

    const compareStrings = (left: string, right: string) => left.localeCompare(right, 'en', { ignorePunctuation: true })

    const compareMovementDateTime = (
      left: PrisonerWithAlerts & { movementTime: string; movementDate?: string },
      right: PrisonerWithAlerts & { movementTime: string; movementDate?: string },
    ) => {
      const leftDateTime = `${left.movementDate || ''}T${left.movementTime || ''}`
      const rightDateTime = `${right.movementDate || ''}T${right.movementTime || ''}`
      return compareStrings(leftDateTime, rightDateTime)
    }

    return mappedPrisoners.sort((left, right) => {
      let comparison: number

      switch (sortKey) {
        case 'timeDateDeparted':
          comparison = compareMovementDateTime(left, right)
          break
        case 'reason':
          comparison = compareStrings(left.reason || '', right.reason || '')
          break
        case 'csra':
          comparison = compareStrings(left.csra || 'None', right.csra || 'None')
          break
        case 'lastName':
        default:
          comparison = compareStrings(left.lastName || '', right.lastName || '')
      }

      return isAscending ? comparison : -comparison
    })
  }

  public async getInReceptionPrisoners(
    clientToken: string,
    caseLoadId: string,
    sort: string = 'prisonerName&direction=ascending',
  ): Promise<(PrisonerWithAlerts & { from: string; timeArrived: string })[]> {
    const prisonApi = this.prisonApiClientBuilder(clientToken)
    const prisonerSearchClient = this.prisonerSearchClientBuilder(clientToken)

    const movements = await prisonApi.getMovementsInReception(caseLoadId)
    if (!movements || !movements?.length) return []

    const prisonerNumbers = movements.map(movement => movement.offenderNo)
    const [prisoners, recentMovements] = await Promise.all([
      prisonerSearchClient.getPrisonersById(prisonerNumbers),
      prisonApi.getRecentMovements(prisonerNumbers),
    ])

    const mappedPrisoners = prisoners.map((prisoner: PrisonerWithAlerts) => {
      const recentMovement = recentMovements.find(movement => movement.offenderNo === prisoner.prisonerNumber)

      return {
        ...prisoner,
        alertFlags: dpsShared.getAlertFlagLabelsForAlerts(prisoner.alerts),
        from: recentMovement?.fromAgencyDescription,
        timeArrived: recentMovement?.movementTime,
      }
    })

    const [sortKey = 'prisonerName', sortDirection = 'ascending'] = sort.split('&direction=')
    const isAscending = sortDirection === 'ascending'
    const compareStrings = (left: string, right: string) => left.localeCompare(right, 'en', { ignorePunctuation: true })

    return mappedPrisoners.sort((left, right) => {
      let comparison: number

      switch (sortKey) {
        case 'timeArrived':
          comparison = compareStrings(left.timeArrived || '', right.timeArrived || '')
          break
        case 'dateOfBirth':
          comparison = compareStrings(left.dateOfBirth || '', right.dateOfBirth || '')
          break
        case 'csra':
          comparison = compareStrings(left.csra || 'None', right.csra || 'None')
          break
        case 'prisonerName':
        default: {
          comparison = compareStrings(left.lastName || '', right.lastName || '')
          if (comparison === 0) {
            comparison = compareStrings(left.firstName || '', right.firstName || '')
          }
          break
        }
      }

      return isAscending ? comparison : -comparison
    })
  }

  public async getNoCellAllocatedPrisoners(
    clientToken: string,
    caseLoadId: string,
  ): Promise<(Prisoner & { movedBy: string; previousCell: string; timeOut: string })[]> {
    const prisonApi = this.prisonApiClientBuilder(clientToken)
    const prisonerSearchClient = this.prisonerSearchClientBuilder(clientToken)

    const { content: cellSwapPrisoners } = await prisonerSearchClient.getCswapPrisonersInEstablishment(caseLoadId)
    if (!cellSwapPrisoners?.length) return []

    const prisonersWithLocations: {
      prisoner: Prisoner
      currentLocation: BedAssignment
      previousLocation: BedAssignment
    }[] = await Promise.all(
      cellSwapPrisoners.map(async prisoner => {
        const { content: cellHistory } = await prisonApi.getOffenderCellHistory(prisoner.bookingId)

        const cellHistoryDescendingSequence = cellHistory.sort(
          (left, right) => right.bedAssignmentHistorySequence - left.bedAssignmentHistorySequence,
        )
        const currentLocation = cellHistoryDescendingSequence[0]
        const previousLocation = cellHistoryDescendingSequence[1]

        return {
          prisoner,
          currentLocation,
          previousLocation,
        }
      }),
    )

    const allStaffUsernames = prisonersWithLocations.map(prisoner => prisoner.currentLocation.movementMadeBy)
    const allStaffDetails = allStaffUsernames.length
      ? await prisonApi.getUserDetailsList([...new Set(allStaffUsernames)])
      : []

    return prisonersWithLocations.map(prisonerWithLocations => {
      const { currentLocation, previousLocation, prisoner } = prisonerWithLocations
      const movementMadeBy = allStaffDetails.find(staffUser => staffUser.username === currentLocation.movementMadeBy)

      return {
        ...prisoner,
        movedBy: movementMadeBy ? `${movementMadeBy.firstName} ${movementMadeBy.lastName}` : '',
        previousCell: stripAgencyPrefix(previousLocation.description, caseLoadId),
        timeOut: previousLocation.assignmentEndDateTime,
      }
    })
  }

  public async getOffendersCurrentlyOutOfLivingUnit(
    clientToken: string,
    livingUnitId: string,
  ): Promise<(PrisonerWithAlerts & { currentLocation: string; movementComment?: string })[]> {
    const prisonApi = this.prisonApiClientBuilder(clientToken)
    const prisonerSearchClient = this.prisonerSearchClientBuilder(clientToken)

    const outPrisoners = await prisonApi.getPrisonersCurrentlyOutOfLivingUnit(livingUnitId)
    if (!outPrisoners || !outPrisoners?.length) return []
    const prisonerNumbers = outPrisoners.map(prisoner => prisoner.offenderNo)

    const [prisoners, recentMovements] = await Promise.all([
      prisonerSearchClient.getPrisonersById(prisonerNumbers),
      prisonApi.getRecentMovements(prisonerNumbers),
    ])

    return this.mapCurrentlyOutPrisoners(prisoners, recentMovements)
  }

  public async getOffendersCurrentlyOutOfBed(
    clientToken: string,
    locationId: string,
  ): Promise<(PrisonerWithAlerts & { currentLocation: string; movementComment?: string })[]> {
    const prisonApi = this.prisonApiClientBuilder(clientToken)
    const prisonerSearchClient = this.prisonerSearchClientBuilder(clientToken)
    const locationsApi = this.locationsInsidePrisonApiClientBuilder(clientToken)

    const prisonersInLocations = await locationsApi.getPrisonersAtLocation(locationId)
    const outPrisoners = prisonersInLocations.flatMap(pl => pl.prisoners).filter(p => p.inOutStatus === 'OUT')
    if (!outPrisoners || !outPrisoners?.length) return []
    const prisonerNumbers = outPrisoners.map(prisoner => prisoner.prisonerNumber)

    const [prisoners, recentMovements] = await Promise.all([
      prisonerSearchClient.getPrisonersById(prisonerNumbers),
      prisonApi.getRecentMovements(prisonerNumbers),
    ])

    return this.mapCurrentlyOutPrisoners(prisoners, recentMovements)
  }

  public async getOffendersCurrentlyOutTotal(
    clientToken: string,
    caseLoadId: string,
  ): Promise<(PrisonerWithAlerts & { currentLocation: string; movementComment?: string })[]> {
    const prisonApi = this.prisonApiClientBuilder(clientToken)
    const prisonerSearchClient = this.prisonerSearchClientBuilder(clientToken)

    const outPrisoners = await prisonApi.getPrisonersCurrentlyOutOfPrison(caseLoadId)
    if (!outPrisoners || !outPrisoners?.length) return []
    const prisonerNumbers = outPrisoners.map(prisoner => prisoner.offenderNo)

    const [prisoners, recentMovements] = await Promise.all([
      prisonerSearchClient.getPrisonersById(prisonerNumbers),
      prisonApi.getRecentMovements(prisonerNumbers),
    ])

    return this.mapCurrentlyOutPrisoners(prisoners, recentMovements)
  }

  private mapCurrentlyOutPrisoners(
    prisoners: Prisoner[],
    recentMovements: OffenderMovement[],
  ): (PrisonerWithAlerts & {
    currentLocation: string
    movementComment?: string
  })[] {
    return prisoners
      .sort((a, b) => a.lastName.localeCompare(b.lastName, 'en', { ignorePunctuation: true }))
      .map(prisoner => {
        const recentMovement = recentMovements.find(movement => movement.offenderNo === prisoner.prisonerNumber)

        return {
          ...prisoner,
          alertFlags: dpsShared.getAlertFlagLabelsForAlerts(prisoner.alerts),
          currentLocation: recentMovement?.toCity,
          movementComment: recentMovement?.commentText,
        }
      })
  }
}
