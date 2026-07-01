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
      cy.task('stubPrisonConfiguration')
      cy.setupUserAuth()
      cy.setupUserCaseloads()
    })

    it('Homepage is visible', () => {
      cy.visit('/sign-in')
      cy.signIn()
      Page.verifyOnPage(IndexPage)
    })
  })

  context('Establishment Roll feature flag functionality using locations API', () => {
    beforeEach(() => {
      cy.task('reset')
      cy.task('resetFeatureFlags')
      cy.task('stubUserCaseLoads')
      cy.task('stubUserLocations')
      cy.task('stubActivePrisons', { activeAgencies: ['LEI'] })
      cy.task('stubLocationPrisonRollCount')
      cy.task('stubPrisonConfiguration', { prisonId: 'LEI', resiLocationServiceActive: 'ACTIVE' })
      cy.setupUserAuth()
      cy.setupUserCaseloads()
    })

    it('Loads the overnights card when eRollRebuild feature flag is enabled (locations API)', () => {
      cy.task('setFeatureFlag', { eRollRebuild: true })
      cy.visit('/sign-in')
      cy.signIn()

      cy.contains('h2', /Today['’]s roll/).should('exist')
      cy.get('[data-qa="unlock-roll-card"]').should('exist')
      cy.get('[data-qa="overnights-card"]').should('exist')
    })

    it('Does not load the overnights card after resetting feature flags (locations API)', () => {
      cy.task('setFeatureFlag', { eRollRebuild: true })
      cy.task('resetFeatureFlags')
      cy.visit('/sign-in')
      cy.signIn()

      cy.contains('h1', 'Establishment roll for').should('exist')
      cy.get('[data-qa="unlock-roll-card"]').should('exist')
      cy.get('[data-qa="overnights-card"]').should('not.exist')
    })
  })

  context('Establishment Roll feature flag functionality not using locations API', () => {
    beforeEach(() => {
      cy.task('reset')
      cy.task('resetFeatureFlags')
      cy.task('stubUserCaseLoads')
      cy.task('stubUserLocations')
      cy.task('stubActivePrisons', { activeAgencies: ['LEI'] })
      cy.task('stubPrisonRollCount')
      cy.task('stubPrisonConfiguration', { prisonId: 'LEI', resiLocationServiceActive: 'INACTIVE' })
      cy.setupUserAuth()
      cy.setupUserCaseloads()
    })

    it('Does not render the overnights card when eRollRebuild feature flag is enabled (prison API)', () => {
      cy.task('setFeatureFlag', { eRollRebuild: true })
      cy.visit('/sign-in')
      cy.signIn()

      cy.contains('h2', /Today['’]s roll/).should('exist')
      cy.get('[data-qa="unlock-roll-card"]').should('exist')
      cy.get('[data-qa="overnights-card"]').should('not.exist')
    })

    it('Does not render the overnights card after resetting feature flags (prison API)', () => {
      cy.task('setFeatureFlag', { eRollRebuild: true })
      cy.task('resetFeatureFlags')
      cy.visit('/sign-in')
      cy.signIn()

      cy.contains('h1', 'Establishment roll for').should('exist')
      cy.get('[data-qa="unlock-roll-card"]').should('exist')
      cy.get('[data-qa="overnights-card"]').should('not.exist')
    })
  })
})
