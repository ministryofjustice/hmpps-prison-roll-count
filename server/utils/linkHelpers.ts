import config from '../config'

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
