import { OffenderMovement } from '../data/interfaces/offenderMovement'

type ArrivalTypeMovement = Pick<OffenderMovement, 'offenderNo' | 'movementType'> &
  Partial<Pick<OffenderMovement, 'movementDate' | 'movementTime' | 'movementReason' | 'movementReasonDescription'>>

const getNormalisedArrivalType = (movement?: ArrivalTypeMovement): OffenderMovement['movementType'] | undefined => {
  if (!movement) return undefined

  const movementReasonText =
    `${movement.movementReason || ''} ${movement.movementReasonDescription || ''}`.toLowerCase()
  // We should also use TRN as arrivalType when Prison API returns ADM with a transfer-related reason
  if (movement.movementType === 'ADM' && movementReasonText.includes('transfer')) return 'TRN'

  return movement.movementType
}

// Get last two movements to determine if either of them have a 'TRN' movement type, which would indicate that the offender is a transfer in, even if the most recent movement is an 'ADM' movement type.
export const getLastTwoMovements = <T>(movements: T[]) => movements.slice(-2)

export const getMovementHistoryStartDate = (movementDateTime?: string) => {
  const movementDate = movementDateTime?.split('T')[0]

  if (!movementDate) return new Date().toISOString().split('T')[0]

  const parsedMovementDate = new Date(movementDate)
  if (Number.isNaN(parsedMovementDate.getTime())) return movementDate

  parsedMovementDate.setDate(parsedMovementDate.getDate() - 30)
  return parsedMovementDate.toISOString().split('T')[0]
}

// Determine the effective arrival type based on the last two movements. If either of the last two movements is a transfer in ('TRN'), then the effective arrival type is 'TRN'. If the most recent movement is a transfer in, then the effective arrival type is 'TRN'. Otherwise, the effective arrival type is the most recent movement type.
export const getEffectiveArrivalType = (
  recentMovements: ArrivalTypeMovement[],
): OffenderMovement['movementType'] | undefined => {
  const lastTwoMovements = getLastTwoMovements(recentMovements)
  const twoMostRecentMovementTypes = lastTwoMovements.map(getNormalisedArrivalType)

  if (twoMostRecentMovementTypes.includes('TRN') && twoMostRecentMovementTypes.includes('ADM')) return 'TRN'

  if (getNormalisedArrivalType(lastTwoMovements[0]) === 'TRN') return 'TRN'

  return getNormalisedArrivalType(lastTwoMovements[1] || lastTwoMovements[0])
}
