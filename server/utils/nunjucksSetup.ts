/* eslint-disable no-param-reassign */
import path from 'path'
import nunjucks from 'nunjucks'
import express from 'express'
import fs from 'fs'
import { formatName, initialiseName, prisonerBelongsToUsersCaseLoad, userHasAllRoles, userHasRoles } from './utils'
import { formatDate, formatDateTime, formatTime, timeFromDate, toUnixTimeStamp } from './dateHelpers'
import config from '../config'
import logger from '../../logger'

export default function nunjucksSetup(app: express.Express): void {
  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Establishment roll'
  app.locals.config = config
  app.locals.dpsUrl = config.serviceUrls.digitalPrisons
  app.locals.environmentName = config.environmentName
  app.locals.environmentNameColour = config.environmentName === 'PRE-PRODUCTION' ? 'govuk-tag--green' : ''
  let assetManifest: Record<string, string> = {}

  try {
    const assetMetadataPath = path.resolve(__dirname, '../../assets/manifest.json')
    assetManifest = JSON.parse(fs.readFileSync(assetMetadataPath, 'utf8'))
  } catch (e) {
    if (process.env.NODE_ENV !== 'test') {
      logger.error(e, 'Could not read asset manifest file')
    }
  }

  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../../server/views'),
      'node_modules/govuk-frontend/dist/',
      'node_modules/govuk-frontend/dist/components/',
      'node_modules/@ministryofjustice/frontend/',
      'node_modules/@ministryofjustice/frontend/moj/components/',
      'node_modules/@ministryofjustice/hmpps-connect-dps-components/dist/assets/',
      'node_modules/@ministryofjustice/hmpps-connect-dps-shared-items/dist/assets/',
    ],
    {
      autoescape: true,
      express: app,
    },
  )
  njkEnv.addGlobal('prisonerBelongsToUsersCaseLoad', prisonerBelongsToUsersCaseLoad)
  njkEnv.addGlobal('userHasRoles', userHasRoles)
  njkEnv.addGlobal('userHasAllRoles', userHasAllRoles)

  njkEnv.addFilter('initialiseName', initialiseName)
  njkEnv.addFilter('formatName', formatName)
  njkEnv.addFilter('assetMap', (url: string) => assetManifest[url] || url)
  njkEnv.addFilter('formatDate', formatDate)
  njkEnv.addFilter('formatDateTime', formatDateTime)
  njkEnv.addFilter('formatTime', formatTime)
  njkEnv.addFilter('toUnixTimeStamp', toUnixTimeStamp)
  njkEnv.addFilter('timeFromDate', timeFromDate)
}
