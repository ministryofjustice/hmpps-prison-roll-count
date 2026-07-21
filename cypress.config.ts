import superagent from 'superagent'
import { defineConfig } from 'cypress'
import { resetStubs } from './integration_tests/mockApis/wiremock'
import auth from './integration_tests/mockApis/auth'
import feComponents from './integration_tests/mockApis/feComponents'
import locations from './integration_tests/mockApis/locations'
import prison from './integration_tests/mockApis/prison'
import prisonEmpty from './integration_tests/mockApis/prisonEmpty'
import prisonerSearch from './integration_tests/mockApis/prisonerSearch'
import tokenVerification from './integration_tests/mockApis/tokenVerification'

async function setFeatureFlag(flags: Record<string, boolean>): Promise<null> {
  const query = Object.fromEntries(Object.entries(flags).map(([key, val]) => [key, val ? 'enabled' : 'disabled']))
  await superagent.get('http://localhost:3007/set-feature-flag').query(query)

  return null
}

async function resetFeatureFlags(): Promise<null> {
  await superagent.get('http://localhost:3007/reset-feature-flags')

  return null
}

export default defineConfig({
  chromeWebSecurity: false,
  fixturesFolder: 'integration_tests/fixtures',
  screenshotsFolder: 'integration_tests/screenshots',
  videosFolder: 'integration_tests/videos',
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    configFile: 'reporter-config.json',
  },
  taskTimeout: 60000,
  e2e: {
    setupNodeEvents(on) {
      on('task', {
        reset: resetStubs,
        setFeatureFlag,
        resetFeatureFlags,
        ...auth,
        ...feComponents,
        ...locations,
        ...prison,
        ...prisonEmpty,
        ...prisonerSearch,
        ...tokenVerification,
      })
    },
    baseUrl: 'http://localhost:3007',
    excludeSpecPattern: '**/!(*.cy).ts',
    specPattern: 'integration_tests/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'integration_tests/support/index.ts',
  },
})
