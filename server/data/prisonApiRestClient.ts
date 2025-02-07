import * as querystring from 'querystring'
import { Readable } from 'stream'
import RestClient from './restClient'
import { PrisonApiClient } from './interfaces/prisonApiClient'
import { CaseLoad } from './interfaces/caseLoad'
import { Location } from './interfaces/location'
import { Movements } from './interfaces/movements'
import { OffenderIn } from './interfaces/offenderIn'
import { OffenderOut } from './interfaces/offenderOut'
import { OffenderMovement } from './interfaces/offenderMovement'
import { OffenderInReception } from './interfaces/offenderInReception'
import { UserDetail } from './interfaces/userDetail'
import { BedAssignment } from './interfaces/bedAssignment'
import { PagedList } from './interfaces/pagedList'
import PrisonRollCount from './interfaces/prisonRollCount'
import EstablishmentRollSummary from '../services/interfaces/EstablishmentRollSummary'

export default class PrisonApiRestClient implements PrisonApiClient {
  constructor(private restClient: RestClient) {}

  private get<T>(args: object): Promise<T> {
    return this.restClient.get<T>(args)
  }

  private put<T>(args: object): Promise<T> {
    return this.restClient.put<T>(args)
  }

  private async post<T>(args: object): Promise<T> {
    return this.restClient.post<T>(args)
  }

  getUserCaseLoads(): Promise<CaseLoad[]> {
    return this.get<CaseLoad[]>({ path: '/api/users/me/caseLoads', query: 'allCaseloads=true' })
  }

  getUserLocations(): Promise<Location[]> {
    return this.get<Location[]>({ path: '/api/users/me/locations' })
  }

  getMovements(prisonId: string): Promise<Movements> {
    return this.get<Movements>({ path: `/api/movements/rollcount/${prisonId}/movements` })
  }

  getRecentMovements(prisonerNumbers: string[]): Promise<OffenderMovement[]> {
    return this.post<OffenderMovement[]>({ path: `/api/movements/offenders`, data: prisonerNumbers })
  }

  getMovementsIn(prisonId: string, movementDate: string): Promise<OffenderIn[]> {
    return this.get<OffenderIn[]>({ path: `/api/movements/${prisonId}/in/${movementDate.split('T')[0]}` })
  }

  getMovementsOut(prisonId: string, movementDate: string): Promise<OffenderOut[]> {
    return this.get<OffenderOut[]>({ path: `/api/movements/${prisonId}/out/${movementDate.split('T')[0]}` })
  }

  getMovementsEnRoute(prisonId: string): Promise<OffenderMovement[]> {
    return this.get<OffenderMovement[]>({ path: `/api/movements/${prisonId}/enroute` })
  }

  getMovementsInReception(prisonId: string): Promise<OffenderInReception[]> {
    return this.get<OffenderInReception[]>({ path: `/api/movements/rollcount/${prisonId}/in-reception` })
  }

  getLocation(locationId: string): Promise<Location> {
    return this.get<Location>({ path: `/api/locations/${locationId}` })
  }

  setActiveCaseload(caseLoad: CaseLoad): Promise<Record<string, string>> {
    return this.put<Record<string, string>>({ path: '/api/users/me/activeCaseLoad', data: caseLoad })
  }

  getPrisonerImage(prisonerNumber: string, fullSizeImage: boolean): Promise<Readable> {
    return this.restClient.stream({
      path: `/api/bookings/offenderNo/${prisonerNumber}/image/data?fullSizeImage=${fullSizeImage}`,
    })
  }

  getOffenderCellHistory(
    bookingId: number,
    pagedParams: { page: number; size: number } = { page: 0, size: 2000 },
  ): Promise<PagedList<BedAssignment>> {
    return this.get<PagedList<BedAssignment>>({
      path: `/api/bookings/${bookingId}/cell-history`,
      query: querystring.stringify(pagedParams),
    })
  }

  getUserDetailsList(usernames: string[]): Promise<UserDetail[]> {
    return this.post<UserDetail[]>({ path: '/api/users/list', data: usernames })
  }

  getPrisonersCurrentlyOutOfLivingUnit(livingUnitId: string): Promise<OffenderOut[]> {
    return this.get<OffenderOut[]>({ path: `/api/movements/livingUnit/${livingUnitId}/currently-out` })
  }

  getPrisonersCurrentlyOutOfPrison(prisonId: string): Promise<OffenderOut[]> {
    return this.get<OffenderOut[]>({ path: `/api/movements/agency/${prisonId}/currently-out` })
  }

  getPrisonRollCount(prisonId: string): Promise<PrisonRollCount> {
    return this.get<PrisonRollCount>({ path: `/api/prison/roll-count/${prisonId}` })
  }

  getPrisonRollCountForLocation(prisonId: string, locationId: string): Promise<PrisonRollCount> {
    return this.get<PrisonRollCount>({ path: `/api/prison/roll-count/${prisonId}/cells-only/${locationId}` })
  }

  getPrisonRollCountSummary(prisonId: string): Promise<EstablishmentRollSummary> {
    return this.get<PrisonRollCount>({ path: `/api/prison/roll-count/${prisonId}/summary` })
  }
}
