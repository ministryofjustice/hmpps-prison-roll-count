import Page from '../pages/page'
import Role from '../../server/enums/role'
import OvernightsPage from '../pages/overnights'

context('Overnights Page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.setupUserAuth({ roles: [`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`] })
    cy.setupComponentsData()
    cy.task('stubPostSearchPrisonersById')
    cy.task('stubActivePrisons', { activeAgencies: ['LEI'] })
    cy.task('stubLocationPrisonRollCount')
    cy.task('stubPrisonConfiguration')
    cy.signIn({ redirectPath: '/overnights' })
    cy.visit('/overnights')
  })

  it('Page is visible', () => {
    Page.verifyOnPage(OvernightsPage)
  })


})
