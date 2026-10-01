import { stubFor } from './wiremock'
import { CaseLoad } from '../../server/data/interfaces/caseLoad'
import { Location } from '../../server/data/interfaces/location'
import { locationMock, locationsMock } from '../../server/mocks/locationMock'
import { movementsInMock } from '../../server/test/mocks/movementsInMock'
import { movementsOutMock } from '../../server/test/mocks/movementsOutMock'
import { movementsEnRouteMock } from '../../server/test/mocks/movementsEnRouteMock'
import { movementsInReceptionMock } from '../../server/test/mocks/movementsInReceptionMock'
import { movementsRecentMock } from '../../server/test/mocks/movementsRecentMock'
import { movementsOvernightMock } from '../../server/test/mocks/movementsOvernightMock'
import { offenderCellHistoryMock } from '../../server/test/mocks/offenderCellHistoryMock'
import userDetailsMock from '../../server/test/mocks/userDetailsMock'
import pagedListMock from '../../server/test/mocks/pagedListMock'
import prisonRollCountMock from '../../server/mocks/prisonRollCountMock'
import prisonRollCountForWingWithSpurMock from '../../server/mocks/prisonRollCountForWingWithSpurMock'
import prisonEstablishmentRollSummaryMock from '../../server/mocks/prisonRollCountSummaryMock'

const stubOffenderMovementHistory = (offenderNo: string, payload: unknown[]) =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/prison/api/movements/offender/${offenderNo}?movementsAfter=.*`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: payload,
    },
  })

const stubInTodayOffenderMovements = (payloadByOffender: Record<string, unknown[]>) =>
  Promise.all(
    Object.entries(payloadByOffender).map(([offenderNo, payload]) => stubOffenderMovementHistory(offenderNo, payload)),
  )

export default {
  stubPrisonApiPing: () =>
    stubFor({
      request: {
        method: 'GET',
        urlPath: '/prison/health/ping',
      },
      response: {
        status: 200,
      },
    }),
  stubUserCaseLoads: (caseLoads: CaseLoad[] = []) => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/prison/api/users/me/caseLoads\\?allCaseloads=true`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: caseLoads.length > 0 ? caseLoads : [],
      },
    })
  },

  stubUserLocations: (locations: Location[] = locationsMock) => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/prison/api/users/me/locations`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: locations.length > 0 ? locations : [],
      },
    })
  },

  stubPrisonRollCount: ({ prisonCode = 'LEI', payload = prisonRollCountMock } = {}) => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/prison/api/prison/roll-count/${prisonCode}`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: payload,
      },
    })
  },

  stubPrisonRollCountSummary: ({ prisonCode = 'LEI' } = {}) => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/prison/api/prison/roll-count/${prisonCode}/summary`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: { ...prisonEstablishmentRollSummaryMock, prisonId: prisonCode },
      },
    })
  },

  stubPrisonRollCountForLanding: ({
    prisonCode = 'LEI',
    landingId = '123',
    payload = prisonRollCountForWingWithSpurMock,
  } = {}) => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/prison/api/prison/roll-count/${prisonCode}/cells-only/${landingId}`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: payload,
      },
    })
  },

  stubMovementsIn: (prisonCode = 'LEI') => {
    const today = new Date().toISOString().split('T')[0]
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/prison/api/movements/${prisonCode}/in/${today}`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: movementsInMock,
      },
    })
  },

  stubMovementsOut: (prisonCode = 'LEI') => {
    const today = new Date().toISOString().split('T')[0]
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/prison/api/movements/${prisonCode}/out/${today}`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: movementsOutMock,
      },
    })
  },

  stubMovementsEnRoute: (prisonCode = 'LEI') => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/prison/api/movements/${prisonCode}/enroute`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: movementsEnRouteMock,
      },
    })
  },

  stubOutToday: (livingUnitId = 'abc') => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/prison/api/movements/livingUnit/${livingUnitId}/currently-out`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: movementsOutMock,
      },
    })
  },

  stubOutTotal: (prisonCode = 'LEI') => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/prison/api/movements/agency/${prisonCode}/currently-out`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: movementsOutMock,
      },
    })
  },

  stubMovementsInReception: (prisonCode = 'LEI') => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: `/prison/api/movements/rollcount/${prisonCode}/in-reception`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: movementsInReceptionMock,
      },
    })
  },

  stubRecentMovements: () => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: `/prison/api/movements/offenders`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: movementsRecentMock,
      },
    })
  },

  stubInTodayMovementHistoryDefault: () => {
    return stubInTodayOffenderMovements({
      A1234AA: [{ ...movementsRecentMock[0], movementType: 'TRN' }],
      A1234AB: [{ ...movementsRecentMock[1], movementType: 'TRN' }],
    })
  },

  stubInTodayTwoRecentMovements: () => {
    return stubInTodayOffenderMovements({
      A1234AA: [
        { ...movementsRecentMock[0], movementType: 'TRN', movementDate: '2024-05-10', movementTime: '10:00' },
        { ...movementsRecentMock[0], movementType: 'ADM', movementDate: '2024-05-10', movementTime: '12:00' },
      ],
      A1234AB: [{ ...movementsRecentMock[1], movementType: 'TRN' }],
    })
  },

  stubInTodayNewAdmissionsMovements: () => {
    return stubInTodayOffenderMovements({
      A1234AA: [{ ...movementsRecentMock[0], movementType: 'ADM' }],
      A1234AB: [{ ...movementsRecentMock[1], movementType: 'ADM' }],
    })
  },

  stubInTodayTransfersInMovements: () => {
    return stubInTodayOffenderMovements({
      A1234AA: [{ ...movementsRecentMock[0], movementType: 'TRN' }],
      A1234AB: [{ ...movementsRecentMock[1], movementType: 'TRN' }],
    })
  },

  stubInTodayReturnsMovements: () => {
    return stubInTodayOffenderMovements({
      A1234AA: [{ ...movementsRecentMock[0], movementType: 'CRT' }],
      A1234AB: [{ ...movementsRecentMock[1], movementType: 'TAP' }],
    })
  },

  stubInTodayMixedMovementTypes: () => {
    return stubInTodayOffenderMovements({
      A1234AA: [{ ...movementsRecentMock[0], movementType: 'ADM' }],
      A1234AB: [{ ...movementsRecentMock[1], movementType: 'TRN' }],
    })
  },

  stubRecentOvernightMovements: () => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: `/prison/api/movements/offenders`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: movementsOvernightMock,
      },
    })
  },

  stubGetLocation: ({ locationId = 123, payload = locationMock } = {}) => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/prison/api/locations/${locationId}`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: payload,
      },
    })
  },

  stubSetActiveCaseload: (status = 200) => {
    return stubFor({
      request: {
        method: 'PUT',
        urlPattern: `/prison/api/users/me/activeCaseLoad`,
      },
      response: {
        status,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {},
      },
    })
  },

  stubGetOffenderCellHistory: (bookingId = 123) => {
    return stubFor({
      request: {
        method: 'GET',
        url: `/prison/api/bookings/${bookingId}/cell-history?page=0&size=2000`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: pagedListMock(offenderCellHistoryMock),
      },
    })
  },

  getUserDetailsList: () => {
    return stubFor({
      request: {
        method: 'POST',
        url: '/prison/api/users/list',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: userDetailsMock,
      },
    })
  },

  stubNewAdmissionsMovements: () => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: `/prison/api/movements/offenders`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: [
          {
            offenderNo: 'A1234AB',
            movementType: 'ADM',
          },
          {
            offenderNo: 'A1234AC',
            movementType: 'ADM',
          },
        ],
      },
    })
  },

  stubTransfersInMovements: () => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: `/prison/api/movements/offenders`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: [
          {
            offenderNo: 'A1234AB',
            movementType: 'TRN',
          },
          {
            offenderNo: 'A1234AC',
            movementType: 'TRN',
          },
        ],
      },
    })
  },

  stubReturnsMovements: () => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: `/prison/api/movements/offenders`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: [
          {
            offenderNo: 'A1234AB',
            movementType: 'CRT',
          },
          {
            offenderNo: 'A1234AC',
            movementType: 'TAP',
          },
        ],
      },
    })
  },

  stubMixedMovementTypes: () => {
    return stubFor({
      request: {
        method: 'POST',
        urlPattern: `/prison/api/movements/offenders`,
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: [
          {
            offenderNo: 'A1234AB',
            movementType: 'ADM',
          },
          {
            offenderNo: 'A1234AC',
            movementType: 'TRN',
          },
          {
            offenderNo: 'A1234AD',
            movementType: 'CRT',
          },
        ],
      },
    })
  },
}
