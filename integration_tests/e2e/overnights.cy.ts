import Page from '../pages/page'
import Role from '../../server/enums/role'
import OvernightsPage from '../pages/overnights'
import prisonerSearchOvernightsMock from '../../server/test/mocks/prisonerSearchOvernightsMock'

context('Overnights Page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.setupUserAuth({ roles: [`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`] })
    cy.setupComponentsData()
    cy.task('stubPostAttributeSearch', { payload: prisonerSearchOvernightsMock })
    cy.task('stubPostSearchPrisonersById', { payload: prisonerSearchOvernightsMock })
    cy.task('stubMovementsOvernight')
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
    page.overnightsRows().should('have.length', 4)

    page.overnightsRows().first().find('td').eq(1).should('contain.text', 'Shannon, Eddie')
    page.overnightsRows().first().find('td').eq(2).should('contain.text', 'A1234AB')
    page.overnightsRows().first().find('td').eq(3).should('contain.text', '11:0025/12/2023')
    page.overnightsRows().first().find('td').eq(4).should('contain.text', '')
    page.overnightsRows().first().find('td').eq(5).should('contain.text', 'NTRN')
    page.overnightsRows().first().find('td').eq(6).should('contain.text', 'Standard')
    page.overnightsRows().first().find('td').eq(7).should('contain.text', '')
  })

  it('should display alerts and category if cat A', () => {
    const page = Page.verifyOnPage(OvernightsPage)
    page.overnightsRows().should('have.length', 4)

    page.overnightsRows().eq(1).find('td').eq(7).should('contain.text', 'Hidden disability')
    page.overnightsRows().eq(1).find('td').eq(7).should('contain.text', 'CAT A')
  })

  it('makes Name, Time departed, Reason and CSRA sortable but not the other columns', () => {
    const page = Page.verifyOnPage(OvernightsPage)

    // Sortable columns expose aria-sort
    page.overnightsHeaders().eq(1).should('have.attr', 'aria-sort') // Name
    page.overnightsHeaders().eq(3).should('have.attr', 'aria-sort') // Time departed
    page.overnightsHeaders().eq(5).should('have.attr', 'aria-sort') // Reason
    page.overnightsHeaders().eq(6).should('have.attr', 'aria-sort') // CSRA

    // Non-sortable columns do not
    page.overnightsHeaders().eq(2).should('not.have.attr', 'aria-sort') // Prison number
    page.overnightsHeaders().eq(7).should('not.have.attr', 'aria-sort') // Alert flags
  })
})
