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
    cy.task('stubPrisonConfiguration')
    cy.signIn({ redirectPath: '/arrived-today' })
    cy.visit('/arrived-today')
  })

  it('Page is visible', () => {
    Page.verifyOnPage(ArrivedTodayPage)
  })

  it('should display a table row for each prisoner', () => {
    const page = Page.verifyOnPage(ArrivedTodayPage)
    page.arrivedTodayRows().should('have.length', 2)

    page.arrivedTodayRows().first().find('td').eq(1).should('contain.text', 'Shannon, Eddie')
    page.arrivedTodayRows().first().find('td').eq(2).should('contain.text', 'A1234AB')
    page.arrivedTodayRows().first().find('td').eq(3).should('contain.text', '01/01/1980')
    page.arrivedTodayRows().first().find('td').eq(4).should('contain.text', '1-1-1')
    page.arrivedTodayRows().first().find('td').eq(5).should('contain.text', '10:30')
    page.arrivedTodayRows().first().find('td').eq(6).should('contain.text', 'York Train Station, York, YO24 1AB')
    // Column index 7 checked in the alerts and category test
  })

  it('should display alerts and category if cat A', () => {
    const page = Page.verifyOnPage(ArrivedTodayPage)

    page.arrivedTodayRows().eq(1).find('td').eq(8).should('contain.text', 'Hidden disability')
    page.arrivedTodayRows().eq(1).find('td').eq(8).should('contain.text', 'CAT A')
  })

  it('makes Name, "Time arrived", "Arrived from" and "CSRA" sortable but not the other columns', () => {
    const page = Page.verifyOnPage(ArrivedTodayPage)

    // Sortable columns expose aria-sort
    page.arrivedTodayHeaders().eq(1).should('have.attr', 'aria-sort') // Name
    page.arrivedTodayHeaders().eq(5).should('have.attr', 'aria-sort') // Time arrived
    page.arrivedTodayHeaders().eq(6).should('have.attr', 'aria-sort') // Arrived from
    page.arrivedTodayHeaders().eq(7).should('have.attr', 'aria-sort') // CSRA

    // Non-sortable columns do not
    page.arrivedTodayHeaders().eq(2).should('not.have.attr', 'aria-sort') // Prison number
    page.arrivedTodayHeaders().eq(3).should('not.have.attr', 'aria-sort') // Date of birth
    page.arrivedTodayHeaders().eq(4).should('not.have.attr', 'aria-sort') // Location
    page.arrivedTodayHeaders().eq(8).should('not.have.attr', 'aria-sort') // Alert flags
  })

  it('name link returns to the arrived-today page via the prisoner profile back link', () => {
    const page = Page.verifyOnPage(ArrivedTodayPage)

    page
      .arrivedTodayRows()
      .first()
      .find('td')
      .eq(1)
      .find('a')
      .should('have.attr', 'href')
      .and('contain', '/save-backlink')
      .and('contain', 'service=prison-roll-count')
      .and('contain', 'backLinkText=Back%20to%20In%20today')
      .and('contain', 'returnPath=/arrived-today')
      .and('contain', 'redirectPath=/prisoner/A1234AB')
  })
})

context('Arrived Today page without prisoner data', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.setupUserAuth({ roles: [`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`] })
    cy.setupComponentsData()
    cy.task('stubMovementsInEmpty')
    cy.task('stubPostSearchPrisonersById')
    cy.task('stubActivePrisons', { activeAgencies: ['LEI'] })
    cy.task('stubPrisonRollCount')
    cy.task('stubLocationPrisonRollCount')
    cy.task('stubPrisonConfiguration')
    cy.signIn({ redirectPath: '/arrived-today' })
    cy.visit('/arrived-today')
  })

  it('Page is visible', () => {
    Page.verifyOnPage(ArrivedTodayPage)
  })

  it('should display a single table row explaining there is no data to display', () => {
    const page = Page.verifyOnPage(ArrivedTodayPage)
    page.arrivedTodayRows().should('have.length', 1)

    page.arrivedTodayRows().first().find('td').should('contain.text', 'No people to display')
  })
})
