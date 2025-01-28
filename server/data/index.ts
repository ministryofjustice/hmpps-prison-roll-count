/* eslint-disable import/first */
/*
 * Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
 * In particular, applicationinsights automatically collects bunyan logs
 */
import { initialiseAppInsights, buildAppInsightsClient } from '../utils/azureAppInsights'
import applicationInfoSupplier from '../applicationInfo'

const applicationInfo = applicationInfoSupplier()
initialiseAppInsights()
buildAppInsightsClient(applicationInfo)

import HmppsAuthClient from './hmppsAuthClient'
import { createRedisClient } from './redisClient'
import RedisTokenStore from './tokenStore/redisTokenStore'
import InMemoryTokenStore from './tokenStore/inMemoryTokenStore'
import config, { ApiConfig } from '../config'
import HmppsAuditClient from './hmppsAuditClient'
import LocationsInsidePrisonApiRestClient from './locationsInsidePrisonApiClient'
import PrisonApiRestClient from './prisonApiRestClient'
import { PrisonApiClient } from './interfaces/prisonApiClient'
import PrisonerSearchRestClient from './prisonerSearchClient'
import RestClient, { RestClientBuilder as CreateRestClientBuilder } from './restClient'

type RestClientBuilder<T> = (token: string) => T

export default function restClientBuilder<T>(
  name: string,
  options: ApiConfig,
  constructor: new (client: RestClient) => T,
): RestClientBuilder<T> {
  const restClient = CreateRestClientBuilder(name, options)
  return token => new constructor(restClient(token))
}

export const dataAccess = () => {
  const tokenStore = config.redis.enabled ? new RedisTokenStore(createRedisClient()) : new InMemoryTokenStore()
  const hmppsAuthClient = new HmppsAuthClient(tokenStore)

  return {
    applicationInfo,
    hmppsAuthClient,
    systemToken: (username?: string) => hmppsAuthClient.getSystemClientToken(username),
    hmppsAuditClient: new HmppsAuditClient(config.sqs.audit),
    prisonApiClientBuilder: restClientBuilder<PrisonApiClient>(
      'Prison API',
      config.apis.prisonApi,
      PrisonApiRestClient,
    ),
    prisonerSearchApiClientBuilder: restClientBuilder<PrisonerSearchRestClient>(
      'Prisoner Search API',
      config.apis.prisonerSearchApi,
      PrisonerSearchRestClient,
    ),
    locationsInsidePrisonApiClientBuilder: restClientBuilder<LocationsInsidePrisonApiRestClient>(
      'Locations Inside Prison API',
      config.apis.locationsInsidePrisonApi,
      LocationsInsidePrisonApiRestClient,
    ),
  }
}


export {
  HmppsAuthClient,
  RestClientBuilder,
  HmppsAuditClient,
  PrisonApiRestClient,
}
