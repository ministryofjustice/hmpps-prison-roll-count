import Page from '../pages/page'
import Role from '../../server/enums/role'
import IncomingTransfersPage from '../pages/incomingTransfers'

context('En Route Page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.setupUserAuth({ roles: [`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`] })
    cy.setupComponentsData()
    cy.task('stubMovementsIncomingTransfers')
    cy.task('stubPostSearchPrisonersById')
    cy.task('stubLocationPrisonRollCount')
    cy.task('stubPrisonConfiguration')
    cy.task('stubMovementsIn')
    cy.signIn({ redirectPath: '/incoming-transfers' })
    cy.visit('/incoming-transfers')
  })

  it('Page is visible', () => {
    Page.verifyOnPage(IncomingTransfersPage)
  })

  it('should display a table row for each prisoner', () => {
    const page = Page.verifyOnPage(IncomingTransfersPage)
    page.incomingTransfersRows().should('have.length', 2)

    page.incomingTransfersRows().first().find('td').eq(1).should('contain.text', 'Shannon, Eddie')
    page.incomingTransfersRows().first().find('td').eq(2).should('contain.text', 'A1234AB')
    page.incomingTransfersRows().first().find('td').eq(3).should('contain.text', '01/01/1980')
    page.incomingTransfersRows().first().find('td').eq(4).should('contain.text', '11:0025/12/2023')
    page.incomingTransfersRows().first().find('td').eq(5).should('contain.text', 'Leeds')
    page.incomingTransfersRows().first().find('td').eq(6).should('contain.text', 'Normal Transfer')
    // Column index 7 checked in the CSRA level test
    // Column index 8 checked in the alerts and category test
  })

  it('should display the CSRA level for each prisoner', () => {
    const page = Page.verifyOnPage(IncomingTransfersPage)
    page.incomingTransfersRows().should('have.length', 2)

    page.incomingTransfersRows().first().find('td').eq(7).should('contain.text', 'None')
    page.incomingTransfersRows().eq(1).find('td').eq(7).should('contain.text', 'High')
  })

  it('should display alerts and category if cat A', () => {
    const page = Page.verifyOnPage(IncomingTransfersPage)

    page.incomingTransfersRows().eq(1).find('td').eq(8).should('contain.text', 'Hidden disability')
    page.incomingTransfersRows().eq(1).find('td').eq(8).should('contain.text', 'CAT A')
  })

  it('makes Name, Departed, "En route from" and CSRA sortable but not the other columns', () => {
    const page = Page.verifyOnPage(IncomingTransfersPage)

    // Sortable columns expose aria-sort
    page.incomingTransfersHeaders().eq(1).should('have.attr', 'aria-sort') // Name
    page.incomingTransfersHeaders().eq(4).should('have.attr', 'aria-sort') // Departed
    page.incomingTransfersHeaders().eq(5).should('have.attr', 'aria-sort') // En route from
    page.incomingTransfersHeaders().eq(7).should('have.attr', 'aria-sort') // CSRA

    // Non-sortable columns do not
    page.incomingTransfersHeaders().eq(2).should('not.have.attr', 'aria-sort') // Prison number
    page.incomingTransfersHeaders().eq(3).should('not.have.attr', 'aria-sort') // Date of birth
    page.incomingTransfersHeaders().eq(6).should('not.have.attr', 'aria-sort') // Reason
    page.incomingTransfersHeaders().eq(8).should('not.have.attr', 'aria-sort') // Alert flags
  })

  it('name link returns to the incoming-transfers page via the prisoner profile back link', () => {
    const page = Page.verifyOnPage(IncomingTransfersPage)

    page
      .incomingTransfersRows()
      .first()
      .find('td')
      .eq(1)
      .find('a')
      .should('have.attr', 'href')
      .and('contain', '/save-backlink')
      .and('contain', 'service=prison-roll-count')
      .and('contain', 'backLinkText=Back%20to%20Incoming%20transfers')
      .and('contain', 'returnPath=/incoming-transfers')
      .and('contain', 'redirectPath=/prisoner/A1234AB')
  })

  it('CSRA link goes to the CSRA history page and returns to the incoming-transfers page via the back link', () => {
    const page = Page.verifyOnPage(IncomingTransfersPage)

    page
      .incomingTransfersRows()
      .first()
      .find('td')
      .eq(7)
      .find('a')
      .should('have.attr', 'href')
      .and('contain', '/save-backlink')
      .and('contain', 'service=prison-roll-count')
      .and('contain', 'backLinkText=Back%20to%20Incoming%20transfers')
      .and('contain', 'returnPath=/incoming-transfers')
      .and('contain', 'redirectPath=/prisoner/A1234AB/csra-history')
  })
})

context('En Route Page without prisoner data', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.setupUserAuth({ roles: [`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`] })
    cy.setupComponentsData()
    cy.task('stubPostSearchPrisonersById', { payload: [] })
    cy.task('stubMovementsIncomingTransfersEmpty')
    cy.task('stubLocationPrisonRollCount')
    cy.task('stubPrisonConfiguration')
    cy.task('stubMovementsIn')
    cy.signIn({ redirectPath: '/incoming-transfers' })
    cy.visit('/incoming-transfers')
  })

  it('Page is visible', () => {
    Page.verifyOnPage(IncomingTransfersPage)
  })

  it('should display a single table row explaining there is no data to display', () => {
    const page = Page.verifyOnPage(IncomingTransfersPage)
    page.incomingTransfersRows().should('have.length', 1)

    page.incomingTransfersRows().first().find('td').should('contain.text', 'No people to display')
  })
})
