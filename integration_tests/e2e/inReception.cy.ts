import Page from '../pages/page'
import Role from '../../server/enums/role'
import InReceptionPage from '../pages/inReception'

context('In reception Page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.setupUserAuth({ roles: [`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`] })
    cy.setupComponentsData()
    cy.task('stubMovementsInReception')
    cy.task('stubRecentMovements')
    cy.task('stubPostSearchPrisonersById')
    cy.task('stubActivePrisons', { activeAgencies: ['LEI'] })
    cy.task('stubLocationPrisonRollCount')
    cy.task('stubPrisonConfiguration')
    cy.signIn({ redirectPath: '/in-reception' })
    cy.visit('/in-reception')
  })

  it('Page is visible', () => {
    Page.verifyOnPage(InReceptionPage)
  })

  it('should display a table row for each prisoner', () => {
    const page = Page.verifyOnPage(InReceptionPage)
    page.inReceptionRows().should('have.length', 2)

    page.inReceptionRows().first().find('td').eq(1).should('contain.text', 'Shannon, Eddie')
    page.inReceptionRows().first().find('td').eq(2).should('contain.text', 'A1234AB')
    page.inReceptionRows().first().find('td').eq(3).should('contain.text', '01/01/1980')
    page.inReceptionRows().first().find('td').eq(4).should('contain.text', '11:00')
    page.inReceptionRows().first().find('td').eq(5).should('contain.text', 'Leeds')
    // Column index 6 checked in the CSRA level test
    // Column index 7 checked in the alerts and category test
  })

  it('should display the CSRA level for each prisoner', () => {
    const page = Page.verifyOnPage(InReceptionPage)
    page.inReceptionRows().should('have.length', 2)

    page.inReceptionRows().first().find('td').eq(6).should('contain.text', 'None')
    page.inReceptionRows().eq(1).find('td').eq(6).should('contain.text', 'High')
  })

  it('should display alerts and category if cat A', () => {
    const page = Page.verifyOnPage(InReceptionPage)

    page.inReceptionRows().eq(1).find('td').eq(7).should('contain.text', 'Hidden disability')
    page.inReceptionRows().eq(1).find('td').eq(7).should('contain.text', 'CAT A')
  })

  it('name link returns to the In reception page via the prisoner profile back link', () => {
    const page = Page.verifyOnPage(InReceptionPage)

    page
      .inReceptionRows()
      .first()
      .find('td')
      .eq(1)
      .find('a')
      .should('have.attr', 'href')
      .and('contain', '/save-backlink')
      .and('contain', 'service=prison-roll-count')
      .and('contain', 'returnPath=/in-reception')
      .and('contain', 'redirectPath=/prisoner/A1234AB')
  })

  it('CSRA link goes to the CSRA history page and returns to the In reception page via the back link', () => {
    const page = Page.verifyOnPage(InReceptionPage)

    page
      .inReceptionRows()
      .first()
      .find('td')
      .eq(6)
      .find('a')
      .should('have.attr', 'href')
      .and('contain', '/save-backlink')
      .and('contain', 'service=prison-roll-count')
      .and('contain', 'returnPath=/in-reception')
      .and('contain', 'redirectPath=/prisoner/A1234AB/csra-history')
  })

  it('makes Name, Date of birth, Time arrived and CSRA sortable but not the other columns', () => {
    const page = Page.verifyOnPage(InReceptionPage)

    // Sortable columns expose aria-sort
    page.inReceptionHeaders().eq(1).should('have.attr', 'aria-sort') // Name
    page.inReceptionHeaders().eq(3).should('have.attr', 'aria-sort') // Date of birth
    page.inReceptionHeaders().eq(4).should('have.attr', 'aria-sort') // Time arrived
    page.inReceptionHeaders().eq(6).should('have.attr', 'aria-sort') // CSRA

    // Non-sortable columns do not
    page.inReceptionHeaders().eq(2).should('not.have.attr', 'aria-sort') // Prison number
    page.inReceptionHeaders().eq(5).should('not.have.attr', 'aria-sort') // Arrived from
    page.inReceptionHeaders().eq(7).should('not.have.attr', 'aria-sort') // Alert flags
  })

  it('sorts Date of birth chronologically using the ISO date as the sort value', () => {
    const page = Page.verifyOnPage(InReceptionPage)

    page.inReceptionRows().first().find('td').eq(3).should('have.attr', 'data-sort-value', '1980-01-01')
  })

  it('applies the govuk-!-font-size-16 override to the body cells', () => {
    const page = Page.verifyOnPage(InReceptionPage)

    page.inReceptionRows().first().find('td').eq(1).should('have.class', 'govuk-!-font-size-16')
    page.inReceptionRows().first().find('td').eq(3).should('have.class', 'govuk-!-font-size-16')
    page.inReceptionRows().first().find('td').eq(7).should('have.class', 'govuk-!-font-size-16')
  })

  it('name link returns to the in-reception page via the prisoner profile back link', () => {
    const page = Page.verifyOnPage(InReceptionPage)

    page
      .inReceptionRows()
      .first()
      .find('td')
      .eq(1)
      .find('a')
      .should('have.attr', 'href')
      .and('contain', '/save-backlink')
      .and('contain', 'service=prison-roll-count')
      .and('contain', 'backLinkText=Back%20to%20In%20reception')
      .and('contain', 'returnPath=/in-reception')
      .and('contain', 'redirectPath=/prisoner/A1234AB')
  })
})

context('In reception Page without prisoner data', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.setupUserAuth({ roles: [`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`] })
    cy.setupComponentsData()
    cy.task('stubMovementsInReceptionEmpty')
    cy.task('stubRecentMovements')
    cy.task('stubPostSearchPrisonersById')
    cy.task('stubActivePrisons', { activeAgencies: ['LEI'] })
    cy.task('stubLocationPrisonRollCount')
    cy.task('stubPrisonConfiguration')
    cy.signIn({ redirectPath: '/in-reception' })
    cy.visit('/in-reception')
  })

  it('Page is visible', () => {
    Page.verifyOnPage(InReceptionPage)
  })

  it('should display a single table row explaining there is no data to display', () => {
    const page = Page.verifyOnPage(InReceptionPage)
    page.inReceptionRows().should('have.length', 1)

    page.inReceptionRows().first().find('td').should('contain.text', 'No people to display')
  })
})
