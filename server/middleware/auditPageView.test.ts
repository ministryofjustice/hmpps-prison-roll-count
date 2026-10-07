import type { AuditService } from '@ministryofjustice/hmpps-audit-client'
import { randomUUID } from 'crypto'
import express from 'express'
import request from 'supertest'

import type { HmppsUser } from '../interfaces/hmppsUser'
import auditPageView, { setAuditPage } from './auditPageView'

const auditService = {
  logAuditEvent: jest.fn().mockResolvedValue(undefined),
} as unknown as jest.Mocked<AuditService>

function appWithStatus(statusCode: number, userUuid: string) {
  const app = express()
  app.use((req, res, next) => {
    req.id = 'request-id'
    res.locals.user = { username: 'test-user' } as HmppsUser
    next()
  })
  app.get('*any', auditPageView(auditService))
  app.use((_req, res, next) => {
    res.locals.user = { ...res.locals.user, userUuid: userUuid as HmppsUser['userUuid'] } as HmppsUser
    next()
  })
  app.get('/home', setAuditPage('HOME'), (_req, res) => res.sendStatus(statusCode))
  return app
}

beforeEach(() => {
  auditService.logAuditEvent.mockClear()
})

describe('auditPageView', () => {
  it.each([
    [200, 'VIEW_HOME_SUCCESS'],
    [400, 'VIEW_HOME_FAILURE'],
  ])('audits a %i response as %s', async (statusCode, what) => {
    const userUuid = randomUUID()
    await request(appWithStatus(statusCode, userUuid)).get('/home').expect(statusCode)

    expect(auditService.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ what, correlationId: 'request-id', details: { pageUrl: '/home', userUuid } }),
      expect.anything(),
    )
  })
})
