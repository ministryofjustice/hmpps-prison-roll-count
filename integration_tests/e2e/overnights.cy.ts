import Page from '../pages/page'
import Role from '../../server/enums/role'
import OvernightsPage from '../pages/overnights'
import EnRoutePage from '../pages/enRoute'

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

  it('should display a table row for each prisoner out overnight', () => {
    const page = Page.verifyOnPage(OvernightsPage)
    page.overnightsRows().should('have.length', 2)

    page.overnightsRows().first().find('td').eq(1).should('contain.text', 'Shannon, Eddie')
    page.overnightsRows().first().find('td').eq(2).should('contain.text', 'A1234AB')
    page.overnightsRows().first().find('td').eq(3).should('contain.text', '11:0025/12/2023')
    page.overnightsRows().first().find('td').eq(4).should('contain.text', '1A Essex Street PR1 1QE')
    page.overnightsRows().first().find('td').eq(5).should('contain.text', 'NTRN')
    page.overnightsRows().first().find('td').eq(6).should('contain.text', 'Standard')
    page.overnightsRows().first().find('td').eq(7).should('contain.text', '')
  })

  it('should display alerts and category if cat A', () => {
    const page = Page.verifyOnPage(OvernightsPage)
    page.overnightsRows().should('have.length', 2)

    page.overnightsRows().eq(1).find('td').eq(7).should('contain.text', 'Hidden disability')
    page.overnightsRows().eq(1).find('td').eq(7).should('contain.text', 'CAT A')
  })
})
