import Page from '../pages/page'
import Role from '../../server/enums/role'
import inTodayPage from '../pages/inToday'

context('In Today Page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.setupUserAuth({ roles: [`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`] })
    cy.setupComponentsData()
    cy.task('stubMovementsIn')
    cy.task('stubInTodayMovementHistoryDefault')
    cy.task('stubPostSearchPrisonersById')
    cy.task('stubPostAttributeSearch')
    cy.task('stubActivePrisons', { activeAgencies: ['LEI'] })
    cy.task('stubPrisonRollCount')
    cy.task('stubLocationPrisonRollCount')
    cy.task('stubPrisonConfiguration')
    cy.signIn({ redirectPath: '/in-today' })
    cy.visit('/in-today')
  })

  it('Page is visible', () => {
    Page.verifyOnPage(inTodayPage)
  })

  it('should display a table row for each prisoner', () => {
    const page = Page.verifyOnPage(inTodayPage)
    page.inTodayRows().should('have.length', 2)

    page.inTodayRows().first().find('td').eq(1).should('contain.text', 'Shannon, Eddie')
    page.inTodayRows().first().find('td').eq(2).should('contain.text', 'A1234AB')
    page.inTodayRows().first().find('td').eq(3).should('contain.text', 'Transfers in')
    page.inTodayRows().first().find('td').eq(4).should('contain.text', '10:30')
    page.inTodayRows().first().find('td').eq(5).should('contain.text', 'York Train Station, York, YO24 1AB')
    // Column index 8 checked in the alerts and category test
  })

  it('should display alerts and category if cat A', () => {
    const page = Page.verifyOnPage(inTodayPage)

    page.inTodayRows().eq(1).find('td').eq(8).should('contain.text', 'Hidden disability')
    page.inTodayRows().eq(1).find('td').eq(8).should('contain.text', 'CAT A')
  })

  it('makes Name, Arrival type, Time arrived, Current status and CSRA sortable but not the other columns', () => {
    const page = Page.verifyOnPage(inTodayPage)

    // Sortable columns expose aria-sort
    page.inTodayHeaders().eq(1).should('have.attr', 'aria-sort') // Name
    page.inTodayHeaders().eq(3).should('have.attr', 'aria-sort') // Arrival type
    page.inTodayHeaders().eq(4).should('have.attr', 'aria-sort') // Time arrived
    page.inTodayHeaders().eq(6).should('have.attr', 'aria-sort') // Current status
    page.inTodayHeaders().eq(7).should('have.attr', 'aria-sort') // CSRA

    // Non-sortable columns do not
    page.inTodayHeaders().eq(2).should('not.have.attr', 'aria-sort') // Prison number
    page.inTodayHeaders().eq(5).should('not.have.attr', 'aria-sort') // Arrived from
    page.inTodayHeaders().eq(8).should('not.have.attr', 'aria-sort') // Alert flags
  })

  it('uses arrivalType as the sort key for the Arrival type column', () => {
    const page = Page.verifyOnPage(inTodayPage)

    page.inTodayHeaders().eq(3).find('a').should('have.attr', 'href').and('contain', 'sort=arrivalType')
  })

  it('uses currentStatus as the sort key for the Current status column', () => {
    const page = Page.verifyOnPage(inTodayPage)

    page.inTodayHeaders().eq(6).find('a').should('have.attr', 'href').and('contain', 'sort=currentStatus')
  })

  it('toggles the time arrived sort and reorders the table', () => {
    const page = Page.verifyOnPage(inTodayPage)

    page.inTodayHeaders().eq(4).should('have.attr', 'aria-sort', 'descending')
    page.inTodayRows().first().find('td').eq(1).should('contain.text', 'Shannon, Eddie')

    page.inTodayHeaders().eq(4).find('a').click()

    page.inTodayHeaders().eq(4).should('have.attr', 'aria-sort', 'ascending')
    page.inTodayRows().first().find('td').eq(1).should('contain.text', 'Smith, John')
  })

  it('name link returns to the in-today page via the prisoner profile back link', () => {
    const page = Page.verifyOnPage(inTodayPage)

    page
      .inTodayRows()
      .first()
      .find('td')
      .eq(1)
      .find('a')
      .should('have.attr', 'href')
      .and('contain', '/save-backlink')
      .and('contain', 'service=prison-roll-count')
      .and('contain', 'backLinkText=Back%20to%20In%20today')
      .and('contain', 'returnPath=%2Fin-today%3Fsort%3DtimeArrived%26direction%3Ddescending')
      .and('contain', 'redirectPath=/prisoner/A1234AB')
  })

  it('should display the correct statistics cards', () => {
    // Verify cards exist with correct QA tags
    cy.get('[data-qa="new-admissions-card"]').should('exist')
    cy.get('[data-qa="transfers-in-card"]').should('exist')
    cy.get('[data-qa="returns-card"]').should('exist')
  })

  it('should display the correct counts for new admissions, transfers in, and returns', () => {
    // Based on the default stubRecentMovements, verify the correct counts are displayed
    // The default mock has 2 prisoners both with movementType 'TRN'
    cy.get('[data-qa="new-admissions-card"]').find('.establishment-roll-card__count').should('contain.text', '0')

    cy.get('[data-qa="transfers-in-card"]').find('.establishment-roll-card__count').should('contain.text', '2')

    cy.get('[data-qa="returns-card"]').find('.establishment-roll-card__count').should('contain.text', '0')
  })
})

context('In Today Page - Arrival Type Statistics', () => {
  it('should display Transfers in when one of the last two movements is TRN', () => {
    cy.task('reset')
    cy.setupUserAuth({ roles: [`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`] })
    cy.setupComponentsData()
    cy.task('stubMovementsIn')
    cy.task('stubInTodayTwoRecentMovements')
    cy.task('stubPostSearchPrisonersById')
    cy.task('stubPostAttributeSearch')
    cy.task('stubActivePrisons', { activeAgencies: ['LEI'] })
    cy.task('stubPrisonRollCount')
    cy.task('stubLocationPrisonRollCount')
    cy.task('stubPrisonConfiguration')
    cy.signIn({ redirectPath: '/in-today' })
    cy.visit('/in-today')

    const page = Page.verifyOnPage(inTodayPage)

    page.inTodayRows().eq(1).find('td').eq(3).should('contain.text', 'Transfers in')
    cy.get('[data-qa="transfers-in-card"]').find('.establishment-roll-card__count').should('contain.text', '2')
  })

  it('should display correct counts when all prisoners are new admissions', () => {
    cy.task('reset')
    cy.setupUserAuth({ roles: [`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`] })
    cy.setupComponentsData()
    cy.task('stubMovementsIn')
    cy.task('stubNewAdmissionsMovements') // Custom stub with all ADM
    cy.task('stubPostSearchPrisonersById')
    cy.task('stubPostAttributeSearch')
    cy.task('stubActivePrisons', { activeAgencies: ['LEI'] })
    cy.task('stubPrisonRollCount')
    cy.task('stubLocationPrisonRollCount')
    cy.task('stubPrisonConfiguration')
    cy.signIn({ redirectPath: '/in-today' })
    cy.visit('/in-today')

    cy.get('[data-qa="new-admissions-card"]').find('.establishment-roll-card__count').should('contain.text', '2')
    cy.get('[data-qa="transfers-in-card"]').find('.establishment-roll-card__count').should('contain.text', '0')
    cy.get('[data-qa="returns-card"]').find('.establishment-roll-card__count').should('contain.text', '0')
  })

  it('should display correct counts when all prisoners are transfers in', () => {
    cy.task('reset')
    cy.setupUserAuth({ roles: [`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`] })
    cy.setupComponentsData()
    cy.task('stubMovementsIn')
    cy.task('stubTransfersInMovements') // Custom stub with all TRN
    cy.task('stubPostSearchPrisonersById')
    cy.task('stubPostAttributeSearch')
    cy.task('stubActivePrisons', { activeAgencies: ['LEI'] })
    cy.task('stubPrisonRollCount')
    cy.task('stubLocationPrisonRollCount')
    cy.task('stubPrisonConfiguration')
    cy.signIn({ redirectPath: '/in-today' })
    cy.visit('/in-today')

    cy.get('[data-qa="new-admissions-card"]').find('.establishment-roll-card__count').should('contain.text', '0')
    cy.get('[data-qa="transfers-in-card"]').find('.establishment-roll-card__count').should('contain.text', '2')
    cy.get('[data-qa="returns-card"]').find('.establishment-roll-card__count').should('contain.text', '0')
  })

  it('should display correct counts when all prisoners are returns', () => {
    cy.task('reset')
    cy.setupUserAuth({ roles: [`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`] })
    cy.setupComponentsData()
    cy.task('stubMovementsIn')
    cy.task('stubReturnsMovements') // Custom stub with CRT/TAP
    cy.task('stubPostSearchPrisonersById')
    cy.task('stubPostAttributeSearch')
    cy.task('stubActivePrisons', { activeAgencies: ['LEI'] })
    cy.task('stubPrisonRollCount')
    cy.task('stubLocationPrisonRollCount')
    cy.task('stubPrisonConfiguration')
    cy.signIn({ redirectPath: '/in-today' })
    cy.visit('/in-today')

    cy.get('[data-qa="new-admissions-card"]').find('.establishment-roll-card__count').should('contain.text', '0')
    cy.get('[data-qa="transfers-in-card"]').find('.establishment-roll-card__count').should('contain.text', '0')
    cy.get('[data-qa="returns-card"]').find('.establishment-roll-card__count').should('contain.text', '2')
  })

  it('should display correct counts with mixed arrival types', () => {
    cy.task('reset')
    cy.setupUserAuth({ roles: [`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`] })
    cy.setupComponentsData()
    cy.task('stubMovementsIn')
    cy.task('stubMixedMovementTypes') // Custom stub with ADM, TRN, and CRT/TAP
    cy.task('stubPostSearchPrisonersById')
    cy.task('stubPostAttributeSearch')
    cy.task('stubActivePrisons', { activeAgencies: ['LEI'] })
    cy.task('stubPrisonRollCount')
    cy.task('stubLocationPrisonRollCount')
    cy.task('stubPrisonConfiguration')
    cy.signIn({ redirectPath: '/in-today' })
    cy.visit('/in-today')

    cy.get('[data-qa="new-admissions-card"]').find('.establishment-roll-card__count').should('contain.text', '1')
    cy.get('[data-qa="transfers-in-card"]').find('.establishment-roll-card__count').should('contain.text', '1')
    cy.get('[data-qa="returns-card"]').find('.establishment-roll-card__count').should('contain.text', '0')
  })
})

context('Arrived Today page without prisoner data', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.setupUserAuth({ roles: [`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`] })
    cy.setupComponentsData()
    cy.task('stubMovementsInEmpty')
    cy.task('stubPostSearchPrisonersById')
    cy.task('stubPostAttributeSearch', { payload: [] })
    cy.task('stubActivePrisons', { activeAgencies: ['LEI'] })
    cy.task('stubPrisonRollCount')
    cy.task('stubLocationPrisonRollCount')
    cy.task('stubPrisonConfiguration')
    cy.signIn({ redirectPath: '/in-today' })
    cy.visit('/in-today')
  })

  it('Page is visible', () => {
    Page.verifyOnPage(inTodayPage)
  })

  it('should display a single table row explaining there is no data to display', () => {
    const page = Page.verifyOnPage(inTodayPage)
    page.inTodayRows().should('have.length', 1)

    page.inTodayRows().first().find('td').should('contain.text', 'No people to display')
  })
})
