import Page from '../pages/page'
import Role from '../../server/enums/role'
import ArrivedTodayPage from '../pages/arrivedToday'

context('Arrived Today Page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.setupUserAuth({ roles: [`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`] })
    cy.setupComponentsData()
    cy.task('stubMovementsIn')
    cy.task('stubPostSearchPrisonersById')
    cy.task('stubActivePrisons', { activeAgencies: ['LEI'] })
    cy.task('stubPrisonRollCount')
    cy.task('stubLocationPrisonRollCount')
    cy.signIn({ redirectPath: '/arrived-today' })
    cy.visit('/arrived-today')
  })

  it('Page is visible', () => {
    Page.verifyOnPage(ArrivedTodayPage)
  })

  it('should display a table row for each wing level assignedRollCount', () => {
    const page = Page.verifyOnPage(ArrivedTodayPage)
    page.arrivedTodayRows().should('have.length', 2)

    const firstRow = page.arrivedTodayRows().first()
    firstRow.find('td').eq(1).should('contain.text', 'Shannon, Eddie')
    firstRow.find('td').eq(2).should('contain.text', 'A1234AB')
    firstRow.find('td').eq(3).should('contain.text', '01/01/1980')
    firstRow.find('td').eq(4).should('contain.text', '1-1-1')
    firstRow.find('td').eq(5).should('contain.text', '10:30')
    firstRow.find('td').eq(6).should('contain.text', 'York Train Station, York, YO24 1AB')
    firstRow.find('td').eq(7).should('contain.text', '')
  })

  it('should display alerts and category if cat A', () => {
    const page = Page.verifyOnPage(ArrivedTodayPage)
    page.arrivedTodayRows().should('have.length', 2)

    const lastRow = page.arrivedTodayRows().last()
    lastRow.find('td').eq(7).should('contain.text', 'Hidden disability')
    lastRow.find('td').eq(7).should('contain.text', 'CAT A')
  })
})
