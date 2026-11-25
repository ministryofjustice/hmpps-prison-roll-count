import config from '../config'
import { CaseLoad } from '../data/interfaces/caseLoad'

const serviceName = 'prison-roll-count'

export function prisonerProfileUrl(prisonerNumber: string, subPath?: string): string {
  return `${config.serviceUrls.prisonerProfile}/prisoner/${prisonerNumber}${subPath ?? ''}`
}

export function prisonerProfileBackLinkUrl(
  backLinkText: string,
  returnPath: string,
  prisonerNumber: string,
  subPath?: string,
): string {
  const returnPathParam = returnPath.includes('?') ? encodeURIComponent(returnPath) : returnPath
  return `${config.serviceUrls.prisonerProfile}/save-backlink?service=${serviceName}&backLinkText=${encodeURIComponent(backLinkText)}&returnPath=${returnPathParam}&redirectPath=/prisoner/${prisonerNumber}${subPath ?? ''}`
}

export function residentialUrl(caseLoad: CaseLoad, cellLocationId: string): string {
  return `${config.serviceUrls.locationsInsidePrison}/${caseLoad}/${cellLocationId}/view`
}

export function inactiveCellUrl(caseLoad: CaseLoad, wing: string): string {
  return `${config.serviceUrls.locationsInsidePrison}/${caseLoad}/${wing}/inactive-cells/`
}

export function residentialServiceBackLinkUrl(
  caseLoad: CaseLoad,
  cellLocationId: string,
  backLinkText: string,
  returnPath: string,
): string {
  const returnPathParam = returnPath.includes('?') ? encodeURIComponent(returnPath) : returnPath
  return `${config.serviceUrls.locationsInsidePrison}/save-backlink?service=${serviceName}&backLinkText=${encodeURIComponent(backLinkText)}&returnPath=${returnPathParam}&redirectPath=/${caseLoad}/${cellLocationId}/view`
}
