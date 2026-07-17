import { prisonerProfileUrl, prisonerProfileBackLinkUrl } from './linkHelpers'

import config from '../config'

const prisonerProfileBaseUrl = config.serviceUrls.prisonerProfile

describe('generate prisoner profile URL', () => {
  it.each([
    ['empty string', '', undefined, `${prisonerProfileBaseUrl}/prisoner/`],
    ['Prisoner number', '12345678', undefined, `${prisonerProfileBaseUrl}/prisoner/12345678`],
    [
      'Prisoner number and sub-path',
      '12345678',
      '/csra-history',
      `${prisonerProfileBaseUrl}/prisoner/12345678/csra-history`,
    ],
    ['null subPath', '12345678', null, `${prisonerProfileBaseUrl}/prisoner/12345678`],
    ['undefined subPath', '12345678', undefined, `${prisonerProfileBaseUrl}/prisoner/12345678`],
    ['empty subPath', '12345678', '', `${prisonerProfileBaseUrl}/prisoner/12345678`],
  ])('%s prisonerProfileUrl(%s)', (_: string, a: string, b: string, expected: string) => {
    expect(prisonerProfileUrl(a, b)).toEqual(expected)
  })
})

describe('generate prisoner profile back link URL', () => {
  it.each([
    [
      'empty strings',
      '',
      '',
      '',
      undefined,
      `${
        prisonerProfileBaseUrl
      }/save-backlink?service=prison-roll-count&backLinkText=&returnPath=&redirectPath=/prisoner/`,
    ],
    [
      'backLinkText to "Back"',
      'Back',
      '',
      '',
      undefined,
      `${
        prisonerProfileBaseUrl
      }/save-backlink?service=prison-roll-count&backLinkText=Back&returnPath=&redirectPath=/prisoner/`,
    ],
    [
      'backLinkText is encoded',
      'Back to previous page',
      '',
      '',
      undefined,
      `${
        prisonerProfileBaseUrl
      }/save-backlink?service=prison-roll-count&backLinkText=Back%20to%20previous%20page&returnPath=&redirectPath=/prisoner/`,
    ],
    [
      'returnPath to /en-route',
      '',
      '/en-route',
      '',
      undefined,
      `${
        prisonerProfileBaseUrl
      }/save-backlink?service=prison-roll-count&backLinkText=&returnPath=/en-route&redirectPath=/prisoner/`,
    ],
    [
      'redirectPath to prisoner number',
      '',
      '',
      '12345678',
      undefined,
      `${
        prisonerProfileBaseUrl
      }/save-backlink?service=prison-roll-count&backLinkText=&returnPath=&redirectPath=/prisoner/12345678`,
    ],
    [
      'redirectPath to prisoner number and path',
      '',
      '',
      '12345678',
      '/csra-history',
      `${
        prisonerProfileBaseUrl
      }/save-backlink?service=prison-roll-count&backLinkText=&returnPath=&redirectPath=/prisoner/12345678/csra-history`,
    ],
    [
      'null subPath',
      '',
      '',
      '12345678',
      null,
      `${
        prisonerProfileBaseUrl
      }/save-backlink?service=prison-roll-count&backLinkText=&returnPath=&redirectPath=/prisoner/12345678`,
    ],
    [
      'undefined subPath',
      '',
      '',
      '12345678',
      undefined,
      `${
        prisonerProfileBaseUrl
      }/save-backlink?service=prison-roll-count&backLinkText=&returnPath=&redirectPath=/prisoner/12345678`,
    ],
    [
      'empty subPath',
      '',
      '',
      '12345678',
      '',
      `${
        prisonerProfileBaseUrl
      }/save-backlink?service=prison-roll-count&backLinkText=&returnPath=&redirectPath=/prisoner/12345678`,
    ],
  ])(
    '%s prisonerProfileBackLinkUrl(%s)',
    (
      _: string,
      backLinkText: string,
      returnPath: string,
      prisonerNumber: string,
      subPath: string,
      expected: string,
    ) => {
      expect(prisonerProfileBackLinkUrl(backLinkText, returnPath, prisonerNumber, subPath)).toEqual(expected)
    },
  )
})
