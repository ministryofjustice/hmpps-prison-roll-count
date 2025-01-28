import jwt from 'jsonwebtoken'
import { Response } from 'superagent'

import { stubFor, getMatchingRequests } from './wiremock'
import tokenVerification from './tokenVerification'
import Role from '../../server/enums/role'

export interface UserToken {
  name?: string
  username?: string
  userId?: string
  roles?: string[]
}

const createToken = (userToken: UserToken) => {
  const authorities =
    ( [`ROLE_${Role.PrisonUser}`]).map(role => (role.startsWith('ROLE_') ? role : `ROLE_${role}`)) ||
    []
  const payload = {
    name: userToken.name || 'john smith',
    scope: ['read'],
    auth_source: 'nomis',
    userId: 'JSMITH',
    authorities,
    jti: '83b50a10-cca6-41db-985f-e87efb303ddb',
    client_id: 'clientid',
  }

  return jwt.sign(payload, 'secret', { expiresIn: '1h' })
}

const getSignInUrl = (): Promise<string> =>
  getMatchingRequests({
    method: 'GET',
    urlPath: '/auth/oauth/authorize',
  }).then(data => {
    const { requests } = data.body
    const stateValue = requests[requests.length - 1].queryParams.state.values[0]
    return `/sign-in/callback?code=codexxxx&state=${stateValue}`
  })

const favicon = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/favicon.ico',
    },
    response: {
      status: 200,
    },
  })

const ping = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/auth/health/ping',
    },
    response: {
      status: 200,
    },
  })

const redirect = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/auth/oauth/authorize\\?response_type=code&redirect_uri=.+?&state=.+?&client_id=clientid',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        Location: 'http://localhost:3007/sign-in/callback?code=codexxxx&state=stateyyyy',
      },
      body: '<html><body>SignIn page<h1>Sign in</h1></body></html>',
    },
  })

const signOut = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/auth/sign-out.*',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: '<html><body>SignIn page<h1>Sign in</h1></body></html>',
    },
  })

const manageDetails = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/auth/account-details.*',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: '<html><body><h1>Your account details</h1></body></html>',
    },
  })

const token = (userToken: UserToken) =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern: '/auth/oauth/token',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        Location: 'http://localhost:3007/sign-in/callback?code=codexxxx&state=stateyyyy',
      },
      jsonBody: {
        access_token: createToken(userToken),
        auth_source: 'nomis',
        token_type: 'bearer',
        user_name: userToken.username || 'USER1',
        expires_in: 599,
        scope: 'read',
        internalUser: true,
      },
    },
  })


export default {
  getSignInUrl,
  stubAuthPing: ping,
  stubAuthManageDetails: manageDetails,
  stubSignIn: (userToken: UserToken): Promise<[Response, Response, Response, Response, Response, Response]> =>
    Promise.all([
      favicon(),
      redirect(),
      signOut(),
      manageDetails(),
      token(userToken),
      tokenVerification.stubVerifyToken(),
    ]),
}
