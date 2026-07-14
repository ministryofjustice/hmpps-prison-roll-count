import { prisonerProfileUrl, prisonerProfileBackLinkUrl } from './linkHelpers'

import config from '../config'

const prisonerProfileBaseUrl = config.serviceUrls.prisonerProfile

describe('generate prisoner profile URL', () => {
  it.each([
    ['empty string', '', `${prisonerProfileBaseUrl}/prisoner/`],
    ['Prisoner number', '12345678', `${prisonerProfileBaseUrl}/prisoner/12345678`],
    ['Prisoner number and path', '12345678/csra-history', `${prisonerProfileBaseUrl}/prisoner/12345678/csra-history`],
  ])('%s prisonerProfileUrl(%s)', (_: string, a: string, expected: string) => {
    expect(prisonerProfileUrl(a)).toEqual(expected)
  })
})

describe('generate prisoner profile back link URL', () => {
  it.each([
    [
      'empty strings',
      '',
      '',
      '',
      `${
        prisonerProfileBaseUrl
      }/save-backlink?service=prison-roll-count&backLinkText=&returnPath=&redirectPath=/prisoner/`,
    ],
    [
      'backLinkText to "Back"',
      'Back',
      '',
      '',
      `${
        prisonerProfileBaseUrl
      }/save-backlink?service=prison-roll-count&backLinkText=Back&returnPath=&redirectPath=/prisoner/`,
    ],
    [
      'backLinkText is encoded',
      'Back to previous page',
      '',
      '',
      `${
        prisonerProfileBaseUrl
      }/save-backlink?service=prison-roll-count&backLinkText=Back%20to%20previous%20page&returnPath=&redirectPath=/prisoner/`,
    ],
    [
      'returnPath to /en-route',
      '',
      '/en-route',
      '',
      `${
        prisonerProfileBaseUrl
      }/save-backlink?service=prison-roll-count&backLinkText=&returnPath=/en-route&redirectPath=/prisoner/`,
    ],
    [
      'redirectPath to prisoner number',
      '',
      '',
      '12345678',
      `${
        prisonerProfileBaseUrl
      }/save-backlink?service=prison-roll-count&backLinkText=&returnPath=&redirectPath=/prisoner/12345678`,
    ],
    [
      'redirectPath to prisoner number and path',
      '',
      '',
      '12345678/csra-history',
      `${
        prisonerProfileBaseUrl
      }/save-backlink?service=prison-roll-count&backLinkText=&returnPath=&redirectPath=/prisoner/12345678/csra-history`,
    ],
  ])(
    '%s prisonerProfileBackLinkUrl(%s)',
    (_: string, backLinkText: string, returnPath: string, redirectPath: string, expected: string) => {
      expect(prisonerProfileBackLinkUrl(backLinkText, returnPath, redirectPath)).toEqual(expected)
    },
  )
})
