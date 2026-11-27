import { stubFor } from './wiremock'
import locationPrisonRollCountMock from '../../server/mocks/locationPrisonRollCountMock'
import prisonerInLocation from '../../server/test/mocks/prisonersInLocation'
import internalLocationMock from '../../server/mocks/internalLocationMock'

const stubLocationsApiPing = () =>
  stubFor({
    request: {
      method: 'GET',
      url: '/locations/health/ping',
    },
    response: {
      status: 200,
    },
  })

const stubLocationPrisonRollCount = ({ prisonCode = 'LEI', payload = locationPrisonRollCountMock } = {}) => {
  return stubFor({
    request: {
      method: 'GET',
      url: `/locations/prison/roll-count/${prisonCode}`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: payload,
    },
  })
}

const stubLocationsOutToday = (locationId = '01922e9a-ffd2-77cb-ba6b-3c9c9b623194') => {
  return stubFor({
    request: {
      method: 'GET',
      urlPattern: `/locations/prisoner-locations/id/${locationId}`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: prisonerInLocation,
    },
  })
}

const stubLocationsPrisonersInPrison = (prisonId = 'LEI') => {
  return stubFor({
    request: {
      method: 'GET',
      urlPattern: `/locations/prisoner-locations/prison/${prisonId}`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: prisonerInLocation,
    },
  })
}

const stubInternalLocation = ({
  locationId = '01922e9a-ffd2-77cb-ba6b-3c9c9b623194',
  payload = internalLocationMock,
} = {}) => {
  return stubFor({
    request: {
      method: 'GET',
      url: `/locations/locations/${locationId}`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: payload,
    },
  })
}

const stubPrisonConfiguration = ({ prisonId = 'LEI', resiLocationServiceActive = 'ACTIVE' } = {}) => {
  return stubFor({
    request: {
      method: 'GET',
      urlPattern: `/locations/prison-configuration/${prisonId}`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: { prisonId, resiLocationServiceActive },
    },
  })
}

export default {
  stubLocationsApiPing,
  stubLocationPrisonRollCount,
  stubLocationsOutToday,
  stubLocationsPrisonersInPrison,
  stubInternalLocation,
  stubPrisonConfiguration,
}
