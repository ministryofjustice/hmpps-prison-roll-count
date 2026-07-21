import Page from '../pages/page'
import Role from '../../server/enums/role'
import EnRoutePage from '../pages/enRoute'

context('En Route Page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.setupUserAuth({ roles: [`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`] })
    cy.setupComponentsData()
    cy.task('stubMovementsEnRoute')
    cy.task('stubPostSearchPrisonersById')
    cy.task('stubActivePrisons', { activeAgencies: ['LEI'] })
    cy.task('stubLocationPrisonRollCount')
    cy.task('stubPrisonConfiguration')
    cy.signIn({ redirectPath: '/en-route' })
    cy.visit('/en-route')
  })

  it('Page is visible', () => {
    Page.verifyOnPage(EnRoutePage)
  })

  it('should display a table row for each prisoner', () => {
    const page = Page.verifyOnPage(EnRoutePage)
    page.enRouteRows().should('have.length', 2)

    page.enRouteRows().first().find('td').eq(1).should('contain.text', 'Shannon, Eddie')
    page.enRouteRows().first().find('td').eq(2).should('contain.text', 'A1234AB')
    page.enRouteRows().first().find('td').eq(3).should('contain.text', '01/01/1980')
    page.enRouteRows().first().find('td').eq(4).should('contain.text', '11:0025/12/2023')
    page.enRouteRows().first().find('td').eq(5).should('contain.text', 'Leeds')
    page.enRouteRows().first().find('td').eq(6).should('contain.text', 'Normal Transfer')
    // Column index 7 checked in the CSRA level test
    // Column index 8 checked in the alerts and category test
  })

  it('should display the CSRA level for each prisoner', () => {
    const page = Page.verifyOnPage(EnRoutePage)
    page.enRouteRows().should('have.length', 2)

    page.enRouteRows().first().find('td').eq(7).should('contain.text', 'None')
    page.enRouteRows().eq(1).find('td').eq(7).should('contain.text', 'High')
  })

  it('should display alerts and category if cat A', () => {
    const page = Page.verifyOnPage(EnRoutePage)

    page.enRouteRows().eq(1).find('td').eq(8).should('contain.text', 'Hidden disability')
    page.enRouteRows().eq(1).find('td').eq(8).should('contain.text', 'CAT A')
  })

  it('makes Name, Departed, "En route from" and CSRA sortable but not the other columns', () => {
    const page = Page.verifyOnPage(EnRoutePage)

    // Sortable columns expose aria-sort
    page.enRouteHeaders().eq(1).should('have.attr', 'aria-sort') // Name
    page.enRouteHeaders().eq(4).should('have.attr', 'aria-sort') // Departed
    page.enRouteHeaders().eq(5).should('have.attr', 'aria-sort') // En route from
    page.enRouteHeaders().eq(7).should('have.attr', 'aria-sort') // CSRA

    // Non-sortable columns do not
    page.enRouteHeaders().eq(2).should('not.have.attr', 'aria-sort') // Prison number
    page.enRouteHeaders().eq(3).should('not.have.attr', 'aria-sort') // Date of birth
    page.enRouteHeaders().eq(6).should('not.have.attr', 'aria-sort') // Reason
    page.enRouteHeaders().eq(8).should('not.have.attr', 'aria-sort') // Alert flags
  })

  it('name link returns to the en-route page via the prisoner profile back link', () => {
    const page = Page.verifyOnPage(EnRoutePage)

    page
      .enRouteRows()
      .first()
      .find('td')
      .eq(1)
      .find('a')
      .should('have.attr', 'href')
      .and('contain', '/save-backlink')
      .and('contain', 'service=prison-roll-count')
      .and('contain', 'backLinkText=Back%20to%20Incoming%20transfers')
      .and('contain', 'returnPath=/en-route')
      .and('contain', 'redirectPath=/prisoner/A1234AB')
  })

  it('CSRA link goes to the CSRA history page and returns to the en-route page via the back link', () => {
    const page = Page.verifyOnPage(EnRoutePage)

    page
      .enRouteRows()
      .first()
      .find('td')
      .eq(7)
      .find('a')
      .should('have.attr', 'href')
      .and('contain', '/save-backlink')
      .and('contain', 'service=prison-roll-count')
      .and('contain', 'backLinkText=Back%20to%20Incoming%20transfers')
      .and('contain', 'returnPath=/en-route')
      .and('contain', 'redirectPath=/prisoner/A1234AB/csra-history')
  })
})

context('En Route Page without prisoner data', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.setupUserAuth({ roles: [`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`] })
    cy.setupComponentsData()
    cy.task('stubPostSearchPrisonersById', { payload: [] })
    cy.task('stubMovementsEnRouteEmpty')
    cy.task('stubActivePrisons', { activeAgencies: ['LEI'] })
    cy.task('stubLocationPrisonRollCount')
    cy.task('stubPrisonConfiguration')
    cy.signIn({ redirectPath: '/en-route' })
    cy.visit('/en-route')
  })

  it('Page is visible', () => {
    Page.verifyOnPage(EnRoutePage)
  })

  it('should display a single table row explaining there is no data to display', () => {
    const page = Page.verifyOnPage(EnRoutePage)
    page.enRouteRows().should('have.length', 1)

    page.enRouteRows().first().find('td').should('contain.text', 'No people to display')
  })
})
