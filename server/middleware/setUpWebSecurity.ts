import crypto from 'crypto'
import express, { Router, Request, Response, NextFunction } from 'express'
import helmet from 'helmet'
import config from '../config'

export default function setUpWebSecurity(): Router {
  const router = express.Router()

  // Secure code best practice - see:
  // 1. https://expressjs.com/en/advanced/best-practice-security.html,
  // 2. https://www.npmjs.com/package/helmet
  router.use((_req: Request, res: Response, next: NextFunction) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('hex')
    next()
  })

  // This nonce allows us to use scripts with the use of the `cspNonce` local, e.g (in a Nunjucks template):
  // <script nonce="{{ cspNonce }}">
  // or
  // <link href="http://example.com/" rel="stylesheet" nonce="{{ cspNonce }}">
  // This ensures only scripts we trust are loaded, and not anything injected into the
  // page by an attacker.
  const connectSrc = [
    "'self'",
    '*.google-analytics.com',
    '*.analytics.google.com',
    '*.googletagmanager.com',
    (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`,
  ]
  const scriptSrc = [
    "'self'",
    '*.google-analytics.com',
    '*.analytics.google.com',
    '*.googletagmanager.com',
    (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`,
  ]
  const styleSrc = ["'self'", (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`]
  const imgSrc = ["'self'", 'data:']
  const fontSrc = ["'self'", config.apis.frontendComponents.url]
  const formAction = [`'self' ${config.apis.hmppsAuth.externalUrl} ${config.serviceUrls.digitalPrisons}`]
  const mediaSrc = ["'self'"]

  if (config.apis.frontendComponents.url) {
    scriptSrc.push(config.apis.frontendComponents.url)
    styleSrc.push(config.apis.frontendComponents.url)
    imgSrc.push(config.apis.frontendComponents.url)
    fontSrc.push(config.apis.frontendComponents.url)
  }

  router.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          connectSrc,
          scriptSrc,
          styleSrc,
          fontSrc,
          formAction,
          imgSrc,
          mediaSrc,
        },
      },
      crossOriginEmbedderPolicy: true,
    }),
  )
  return router
}
