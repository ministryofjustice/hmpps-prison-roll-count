import {
  convertToTitleCase,
  initialiseName,
  formatName,
  prisonerBelongsToUsersCaseLoad,
  userHasRoles,
  userHasAllRoles,
  kebabCase,
} from './utils'
import { CaseLoad } from '../data/interfaces/caseLoad'
import Role from '../enums/role'

describe('convert to title case', () => {
  it.each([
    [null, null, ''],
    ['empty string', '', ''],
    ['Lower case', 'robert', 'Robert'],
    ['Upper case', 'ROBERT', 'Robert'],
    ['Mixed case', 'RoBErT', 'Robert'],
    ['Multiple words', 'RobeRT SMiTH', 'Robert Smith'],
    ['Leading spaces', '  RobeRT', '  Robert'],
    ['Trailing spaces', 'RobeRT  ', 'Robert  '],
    ['Hyphenated', 'Robert-John SmiTH-jONes-WILSON', 'Robert-John Smith-Jones-Wilson'],
  ])('%s convertToTitleCase(%s, %s)', (_: string, a: string, expected: string) => {
    expect(convertToTitleCase(a)).toEqual(expected)
  })
})

describe('initialise name', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['One word', 'robert', 'r. robert'],
    ['Two words', 'Robert James', 'R. James'],
    ['Three words', 'Robert James Smith', 'R. Smith'],
    ['Double barrelled', 'Robert-John Smith-Jones-Wilson', 'R. Smith-Jones-Wilson'],
  ])('%s initialiseName(%s, %s)', (_: string, a: string, expected: string) => {
    expect(initialiseName(a)).toEqual(expected)
  })
})

describe('format name', () => {
  it.each([
    ['All names proper (no options)', 'John', 'James', 'Smith', undefined, 'John James Smith'],
    ['All names lower (no options)', 'john', 'james', 'smith', undefined, 'John James Smith'],
    ['All names upper (no options)', 'JOHN', 'JAMES', 'SMITH', undefined, 'John James Smith'],
    ['No middle names (no options)', 'JOHN', undefined, 'Smith', undefined, 'John Smith'],
    [
      'Multiple middle names (no options)',
      'John',
      'James GORDON william',
      'Smith',
      undefined,
      'John James Gordon William Smith',
    ],
    ['Hyphen (no options)', 'John', undefined, 'SMITH-JONES', undefined, 'John Smith-Jones'],
    ['Apostrophe (no options)', 'JOHN', 'JAMES', "O'sullivan", undefined, "John James O'Sullivan"],
    [
      'All names (LastCommaFirstMiddle)',
      'John',
      'James',
      'Smith',
      { style: 'lastCommaFirstMiddle' },
      'Smith, John James',
    ],
    [
      'First and last names (LastCommaFirstMiddle)',
      'John',
      undefined,
      'Smith',
      { style: 'lastCommaFirstMiddle' },
      'Smith, John',
    ],
    ['All names (LastCommaFirst)', 'John', 'James', 'Smith', { style: 'lastCommaFirst' }, 'Smith, John'],
    ['First name and last name (LastCommaFirst)', 'John', undefined, 'Smith', { style: 'firstLast' }, 'John Smith'],
  ])(
    '%s: formatName(%s, %s, %s, %s)',
    (
      _: string,
      firstName: string,
      middleNames: string,
      lastName: string,
      options: { style: 'firstMiddleLast' | 'lastCommaFirstMiddle' | 'lastCommaFirst' | 'firstLast' },
      expected: string,
    ) => {
      expect(formatName(firstName, middleNames, lastName, options)).toEqual(expected)
    },
  )
})

describe('prisonerBelongsToUsersCaseLoad', () => {
  it('Should return true when the user has a caseload matching the prisoner', () => {
    const caseLoads: CaseLoad[] = [
      { caseloadFunction: '', caseLoadId: 'ABC', currentlyActive: false, description: '', type: '' },
      { caseloadFunction: '', caseLoadId: 'DEF', currentlyActive: false, description: '', type: '' },
    ]

    expect(prisonerBelongsToUsersCaseLoad('DEF', caseLoads)).toEqual(true)
  })

  it('Should return false when the user has a caseload that doesnt match the prisoner', () => {
    const caseLoads: CaseLoad[] = [
      { caseloadFunction: '', caseLoadId: 'ABC', currentlyActive: false, description: '', type: '' },
      { caseloadFunction: '', caseLoadId: 'DEF', currentlyActive: false, description: '', type: '' },
    ]

    expect(prisonerBelongsToUsersCaseLoad('123', caseLoads)).toEqual(false)
  })
})

describe('userHasRoles', () => {
  it.each([
    { roles: [Role.GlobalSearch], userRoles: [Role.GlobalSearch], result: true },
    { roles: [Role.GlobalSearch], userRoles: ['SOME_ROLE', Role.GlobalSearch], result: true },
    { roles: [Role.GlobalSearch], userRoles: [], result: false },
    { roles: [], userRoles: [Role.GlobalSearch], result: false },
    { roles: [Role.GlobalSearch, 'SOME_ROLE'], userRoles: ['SOME_ROLE'], result: true },
  ])('Should return the correct result when checking user roles', ({ roles, userRoles, result }) => {
    expect(userHasRoles(roles, userRoles)).toEqual(result)
  })
})

describe('userHasAllRoles', () => {
  it.each([
    { roles: [Role.GlobalSearch], userRoles: [Role.GlobalSearch], result: true },
    { roles: [Role.GlobalSearch], userRoles: ['SOME_ROLE', Role.GlobalSearch], result: true },
    {
      roles: [Role.GlobalSearch, Role.InactiveBookings],
      userRoles: [Role.InactiveBookings, Role.GlobalSearch],
      result: true,
    },
    { roles: [Role.GlobalSearch], userRoles: [], result: false },
    { roles: [Role.GlobalSearch, Role.InactiveBookings], userRoles: [Role.GlobalSearch], result: false },
    { roles: [Role.GlobalSearch, Role.InactiveBookings], userRoles: ['SOME_ROLE', Role.GlobalSearch], result: false },
  ])('Should return the correct result when checking user roles', ({ roles, userRoles, result }) => {
    expect(userHasAllRoles(roles, userRoles)).toEqual(result)
  })
})

describe('kebabCase', () => {
  it('returns the correct value', () => {
    expect(kebabCase('ATestValue')).toEqual('a-test-value')
    expect(kebabCase('aTestValue')).toEqual('a-test-value')
    expect(kebabCase('aTestvalue')).toEqual('a-testvalue')
    expect(kebabCase('atestvalue')).toEqual('atestvalue')
    expect(kebabCase('a-test-value')).toEqual('a-test-value')
  })
})
