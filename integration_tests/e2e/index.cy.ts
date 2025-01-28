import IndexPage from '../pages/index'
import AuthSignInPage from '../pages/authSignIn'
import Page from '../pages/page'


context('Index', () => {
  context('Without the PRISON role', () => {
    beforeEach(() => {
      cy.task('reset')
      cy.task('stubSignIn', { roles: [] })
    })

    it('Unauthenticated user directed to auth', () => {
      cy.visit('/')
      Page.verifyOnPage(AuthSignInPage)
    })

    it('Unauthenticated user navigating to sign in page directed to auth', () => {
      cy.visit('/sign-in')
      Page.verifyOnPage(AuthSignInPage)
    })
  })

  context('With the PRISON role', () => {
    beforeEach(() => {
      cy.task('reset')
      cy.task('stubUserCaseLoads')
      cy.task('stubUserLocations')
      cy.task('stubActivePrisons', { activeAgencies: ['LEI'] })
      cy.task('stubLocationPrisonRollCount')
      cy.setupUserAuth()
      cy.setupUserCaseloads()
    })

    it('Homepage is visible', () => {
      cy.visit('/sign-in')
      cy.signIn()
      Page.verifyOnPage(IndexPage)
    })

  })
})
