import type { Express } from 'express'
import request from 'supertest'
import { type AuditService } from '@ministryofjustice/hmpps-audit-client'
import { appWithAllRoutes, user } from './testutils/appSetup'

const auditService = {
  logAuditEvent: jest.fn(),
  logPageView: jest.fn(),
} as unknown as jest.Mocked<AuditService>

let app: Express

beforeEach(() => {
  auditService.logAuditEvent.mockResolvedValue(undefined)
  auditService.logPageView.mockResolvedValue(undefined)
  app = appWithAllRoutes({
    services: {
      auditService,
    },
    userSupplier: () => user,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /', () => {
  it('should render index page', () => {
    return request(app).get('/').expect('Content-Type', /html/)
  })

  it('should audit a failed page view against the page name', async () => {
    await request(app).get('/')

    expect(auditService.logAuditEvent).toHaveBeenCalledTimes(1)
    expect(auditService.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ what: 'VIEW_HOME_FAILURE', who: user.username, details: { pageUrl: '/' } }),
      expect.anything(),
    )
  })
})

describe('GET an unknown url', () => {
  it('should audit a page view access attempt', async () => {
    await request(app).get('/invalid-url')

    expect(auditService.logAuditEvent).toHaveBeenCalledTimes(1)
    expect(auditService.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ what: 'VIEW_ATTEMPT_FAILURE', details: { pageUrl: '/invalid-url' } }),
      expect.anything(),
    )
  })
})
