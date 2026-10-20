import Page from '../pages/page'
import Role from '../../server/enums/role'
import OutTodayPage from '../pages/outToday'

context('Out Today Page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.setupUserAuth({ roles: [`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`] })
    cy.setupComponentsData()
    cy.task('stubMovementsOut')
    cy.task('stubInTodayMovementHistoryDefault')
    cy.task('stubPostSearchPrisonersById')
    cy.task('stubActivePrisons', { activeAgencies: ['LEI'] })
    cy.task('stubLocationPrisonRollCount')
    cy.task('stubPrisonConfiguration')
    cy.task('stubMovementsIn')
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
    page.outTodayRows().first().find('td').eq(3).should('contain.text', 'Transfer - Another transfer')
    page.outTodayRows().first().find('td').eq(4).should('contain.text', '11:00')
    page.outTodayRows().first().find('td').eq(5).should('not.be.empty')
    // Column index 6 checked in the current status test, index 7 checked in the alerts and category test
  })

  it('should display alerts and category if cat A', () => {
    const page = Page.verifyOnPage(OutTodayPage)

    page.outTodayRows().eq(1).find('td').eq(7).should('contain.text', 'Hidden disability')
    page.outTodayRows().eq(1).find('td').eq(7).should('contain.text', 'CAT A')
  })

  it('makes Name and Time out sortable but not the other columns', () => {
    const page = Page.verifyOnPage(OutTodayPage)

    // Sortable columns expose aria-sort
    page.outTodayHeaders().eq(1).should('have.attr', 'aria-sort') // Name
    page.outTodayHeaders().eq(4).should('have.attr', 'aria-sort') // Time out

    // Non-sortable columns do not
    page.outTodayHeaders().eq(2).should('not.have.attr', 'aria-sort') // Prison number
    page.outTodayHeaders().eq(3).should('not.have.attr', 'aria-sort') // Reason for absence
    page.outTodayHeaders().eq(5).should('not.have.attr', 'aria-sort') // To location
    page.outTodayHeaders().eq(6).should('not.have.attr', 'aria-sort') // Current status
    page.outTodayHeaders().eq(7).should('not.have.attr', 'aria-sort') // Relevant alerts
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

  it('should display the correct statistics cards', () => {
    cy.get('[data-qa="temporary-absence-card"]').should('exist')
    cy.get('[data-qa="at-court-card"]').should('exist')
    cy.get('[data-qa="released-card"]').should('exist')
    cy.get('[data-qa="transferred-out-card"]').should('exist')
  })

  it('should display the correct counts for departure type cards', () => {
    cy.get('[data-qa="temporary-absence-card"]').find('.establishment-roll-card__count').should('contain.text', '0')
    cy.get('[data-qa="at-court-card"]').find('.establishment-roll-card__count').should('contain.text', '0')
    cy.get('[data-qa="released-card"]').find('.establishment-roll-card__count').should('contain.text', '0')
    cy.get('[data-qa="transferred-out-card"]').find('.establishment-roll-card__count').should('contain.text', '2')
  })
})

context('Out Today page without prisoner data', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.setupUserAuth({ roles: [`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`] })
    cy.setupComponentsData()
    cy.task('stubMovementsOutEmpty')
    cy.task('stubInTodayMovementHistoryDefault')
    cy.task('stubPostSearchPrisonersById')
    cy.task('stubActivePrisons', { activeAgencies: ['LEI'] })
    cy.task('stubLocationPrisonRollCount')
    cy.task('stubPrisonConfiguration')
    cy.task('stubMovementsIn')
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
