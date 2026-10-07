import type { AuditService, PageViewEventDetails, SubjectType } from '@ministryofjustice/hmpps-audit-client'
import type { Request, RequestHandler, Response } from 'express'

import logger from '../logger'

/**
 * Requests that are not page views: anything under /assets and any file-like path
 * (css, js, source maps, images, fonts…)
 */
const notPageViews = [/^\/assets(?:[/?]|$)/, /^[^?]*\/[^/?]*\.[a-z0-9]+(?:\?.*)?$/i]

const prisonerNumberInPath = /\/prisonerImage\/([A-Z][0-9]{4}[A-Z]{2})\b/

type Subject = { subjectType: SubjectType; subjectId?: string }

export function setAuditPage(page: string): RequestHandler {
  return (_req, res, next) => {
    res.locals.auditPage = page
    next()
  }
}

export default function auditPageView(auditService: AuditService): RequestHandler {
  return (req, res, next) => {
    const who = res.locals.user?.username
    if (!who || notPageViews.some(pattern => pattern.test(req.originalUrl))) {
      next()
      return
    }

    const event: PageViewEventDetails = {
      who,
      correlationId: req.id,
      details: {
        userUuid: res.locals.user?.userUuid,
        pageUrl: req.originalUrl,
      },
      ...subjectOfRequest(req),
    }

    let audited = false

    const audit = () => {
      if (audited) return
      audited = true
      auditService
        .logAuditEvent({ ...event, what: getWhatFromResponse(res) }, { throwOnError: false, logOnError: true })
        .catch(error => logger.error(error, 'Failed to audit page view'))
    }

    res.prependOnceListener('close', audit)

    type ResRender = (view: string, options?: object, callback?: (err: Error, html: string) => void) => void
    const resRender = res.render as ResRender
    res.render = (view: string, options?: object) => {
      resRender.call(res, view, options, (err: Error, html: string) => {
        if (err) {
          next(err)
          return
        }

        // send the page first: auditing must never delay or break rendering
        res.send(html)
        audit()
      })
    }

    next()
  }
}

function getWhatFromResponse(res: Response): string {
  const { auditPage } = res.locals

  const what = auditPage ? `VIEW_${auditPage}` : 'VIEW_ATTEMPT'

  return `${what}_${res.statusCode >= 400 ? 'FAILURE' : 'SUCCESS'}`
}

function subjectOfRequest(req: Request): Subject {
  const prisonerNumber = req.originalUrl.match(prisonerNumberInPath)?.[1]
  if (prisonerNumber) {
    return { subjectType: 'PRISONER_ID', subjectId: prisonerNumber }
  }
  return { subjectType: 'NOT_APPLICABLE' }
}
