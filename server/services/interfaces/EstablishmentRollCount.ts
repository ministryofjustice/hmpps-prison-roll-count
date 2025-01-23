import PrisonRollCount, { ResidentialLocation } from '../../../../../hmpps-digital-prison-services/server/data/interfaces/prisonRollCount'

export default interface EstablishmentRollCount {
  todayStats: {
    unlockRoll: number
    inToday: number
    outToday: number
    currentRoll: number
    unassignedIn: number
    enroute: number
    noCellAllocated: number
  }
  totals: PrisonRollCount['totals']
  wings: ResidentialLocation[]
}
