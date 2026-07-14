import config from '../config'

const serviceName = 'prison-roll-count'

export function prisonerProfileUrl(prisonerNumber: string): string {
    return `${config.serviceUrls.prisonerProfile}/prisoner/${prisonerNumber}`
}

export function prisonerProfileBackLinkUrl(backLinkText: string, returnPath: string, redirectPath: string): string {
    return `${ config.serviceUrls.prisonerProfile }/save-backlink?service=${serviceName}&backLinkText=${encodeURIComponent(backLinkText)}&returnPath=${returnPath}&redirectPath=/prisoner/${redirectPath}`
}


