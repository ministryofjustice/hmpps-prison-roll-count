import Page from '../pages/page'
import Role from '../../server/enums/role'
import OutTodayPage from '../pages/outToday'

context('Out Today Page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.setupUserAuth({ roles: [`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`] })
    cy.setupComponentsData()
    cy.task('stubMovementsOut')
    cy.task('stubPostSearchPrisonersById')
    cy.task('stubActivePrisons', { activeAgencies: ['LEI'] })
    cy.task('stubLocationPrisonRollCount')
    cy.task('stubPrisonConfiguration')
    cy.signIn({ redirectPath: '/out-today' })
    cy.visit('/out-today')
  })

  it('Page is visible', () => {
    Page.verifyOnPage(OutTodayPage)
  })

  it('should display a table row for each prisoner', () => {
    const page = Page.verifyOnPage(OutTodayPage)
    page.outTodayRows().should('have.length', 2)

    page.outTodayRows().first().find('td').eq(1).should('contain.text', 'Shannon, Eddie')
    page.outTodayRows().first().find('td').eq(2).should('contain.text', 'A1234AB')
    page.outTodayRows().first().find('td').eq(3).should('contain.text', '01/01/1980')
    page.outTodayRows().first().find('td').eq(4).should('contain.text', '11:00')
    page.outTodayRows().first().find('td').eq(5).should('contain.text', 'Another transfer')
    // Column index 6 checked in the alerts and category test
  })

  it('should display alerts and category if cat A', () => {
    const page = Page.verifyOnPage(OutTodayPage)

    page.outTodayRows().eq(1).find('td').eq(6).should('contain.text', 'Hidden disability')
    page.outTodayRows().eq(1).find('td').eq(6).should('contain.text', 'CAT A')
  })

  it('makes Name, Departed, "En route from" and CSRA sortable but not the other columns', () => {
    const page = Page.verifyOnPage(OutTodayPage)

    // Sortable columns expose aria-sort
    page.outTodayHeaders().eq(1).should('have.attr', 'aria-sort') // Name
    page.outTodayHeaders().eq(4).should('have.attr', 'aria-sort') // Departed

    // Non-sortable columns do not
    page.outTodayHeaders().eq(2).should('not.have.attr', 'aria-sort') // Prison number
    page.outTodayHeaders().eq(3).should('not.have.attr', 'aria-sort') // Date of birth
    page.outTodayHeaders().eq(5).should('not.have.attr', 'aria-sort') // Reason
    page.outTodayHeaders().eq(6).should('not.have.attr', 'aria-sort') // Alert flags
  })

  it('name link returns to the out-today page via the prisoner profile back link', () => {
    const page = Page.verifyOnPage(OutTodayPage)

    page
      .outTodayRows()
      .first()
      .find('td')
      .eq(1)
      .find('a')
      .should('have.attr', 'href')
      .and('contain', '/save-backlink')
      .and('contain', 'service=prison-roll-count')
      .and('contain', 'backLinkText=Back%20to%20Out%20today')
      .and('contain', 'returnPath=/out-today')
      .and('contain', 'redirectPath=/prisoner/A1234AB')
  })
})

context('Out Today page without prisoner data', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.setupUserAuth({ roles: [`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`] })
    cy.setupComponentsData()
    cy.task('stubMovementsOutEmpty')
    cy.task('stubPostSearchPrisonersById')
    cy.task('stubActivePrisons', { activeAgencies: ['LEI'] })
    cy.task('stubLocationPrisonRollCount')
    cy.task('stubPrisonConfiguration')
    cy.signIn({ redirectPath: '/out-today' })
    cy.visit('/out-today')
  })

  it('Page is visible', () => {
    Page.verifyOnPage(OutTodayPage)
  })

  it('should display a single table row explaining there is no data to display', () => {
    const page = Page.verifyOnPage(OutTodayPage)
    page.outTodayRows().should('have.length', 1)

    page.outTodayRows().first().find('td').should('contain.text', 'No people to display')
  })
})
