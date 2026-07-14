import Page from '../pages/page'
import Role from '../../server/enums/role'
import OvernightsPage from '../pages/overnights'

context('Overnights Page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.setupUserAuth({ roles: [`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`] })
    cy.setupComponentsData()
    cy.task('stubPostAttributeSearch')
    cy.task('stubPostSearchPrisonersById')
    cy.task('stubRecentMovements')
    cy.task('stubActivePrisons', { activeAgencies: ['LEI'] })
    cy.task('stubLocationPrisonRollCount')
    cy.task('stubPrisonConfiguration')
    cy.task('setFeatureFlag', { eRollRebuild: true })
    cy.signIn({ redirectPath: '/overnights' })
    cy.visit('/overnights')
  })

  it('Page is visible', () => {
    Page.verifyOnPage(OvernightsPage)
  })
})
