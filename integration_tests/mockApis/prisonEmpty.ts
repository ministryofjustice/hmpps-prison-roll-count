import { stubFor } from './wiremock'

export default {
  stubMovementsInEmpty: (prisonCode = 'LEI') => {
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
        jsonBody: [],
      },
    })
  },

  stubMovementsOutEmpty: (prisonCode = 'LEI') => {
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
        jsonBody: [],
      },
    })
  },

  stubMovementsEnRouteEmpty: (prisonCode = 'LEI') => {
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
        jsonBody: [],
      },
    })
  },

  stubMovementsEmpty: () => {
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
        jsonBody: [],
      },
    })
  },

  stubMovementsInReceptionEmpty: (prisonCode = 'LEI') => {
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
        jsonBody: [],
      },
    })
  },
}
