import { Prisoner } from './prisoner'
import { PagedList } from './pagedList'

export interface PrisonerSearchClient {
  getPrisonersById(prisonerNumbers: string[]): Promise<Prisoner[]>
  getCswapPrisonersInEstablishment(prisonId: string): Promise<PagedList<Prisoner>>
  getOvernightPrisonersInEstablishment(prisonId: string): Promise<PagedList<Prisoner>>
  getNewAdmissionsInEstablishment(prisonId: string): Promise<PagedList<Prisoner>>
  getTransfersInEstablishment(prisonId: string): Promise<PagedList<Prisoner>>
  getReturnsInEstablishment(prisonId: string): Promise<PagedList<Prisoner>>
}
