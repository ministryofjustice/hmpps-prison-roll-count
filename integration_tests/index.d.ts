import { Location } from '../server/data/interfaces/location'
import { UserToken } from './mockApis/auth'
import { CaseLoad } from '../server/data/interfaces/caseLoad'

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to signIn. Set failOnStatusCode to false if you expect and non 200 return code
       * @example cy.signIn({ failOnStatusCode: boolean })
       */
      signIn(options?: { failOnStatusCode?: boolean; redirectPath?: string }): Chainable<AUTWindow>

      setupUserAuth(
        options?: UserToken & {
          locations?: Location[]
        },
      ): Chainable<AUTWindow>

      setupUserCaseloads(options?: { caseLoads?: CaseLoad[] }): Chainable<AUTWindow>
    }
  }
}
