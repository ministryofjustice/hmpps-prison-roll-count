import Page from '../pages/page'
import Role from '../../server/enums/role'
import NoCellAllocatedPage from '../pages/noCellAllocated'
import prisonerSearchMock from '../../server/test/mocks/prisonerSearchMock'

function visitPageWithRoles(roles: string[]) {
  cy.setupUserAuth({ roles })
  cy.setupComponentsData({
    caseLoads: [
      { caseloadFunction: '', caseLoadId: 'MDI', currentlyActive: true, description: 'Moorland (HMP)', type: '' },
    ],
  })
  cy.signIn({ redirectPath: '/no-cell-allocated' })
  cy.visit('/no-cell-allocated')
}

context('No Cell Allocated Page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubPostAttributeSearch')
    cy.task('stubGetOffenderCellHistory', prisonerSearchMock[0].bookingId)
    cy.task('stubGetOffenderCellHistory', prisonerSearchMock[1].bookingId)
    cy.task('getUserDetailsList')
    cy.task('stubActivePrisons', { activeAgencies: ['MDI'] })
    cy.task('stubLocationPrisonRollCount', { prisonCode: 'MDI' })
    cy.task('stubPrisonConfiguration', { prisonId: 'MDI', resiLocationServiceActive: 'ACTIVE' })
  })

  it('Page is visible', () => {
    visitPageWithRoles([`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`])

    Page.verifyOnPage(NoCellAllocatedPage)
  })

  it('should display a table row for each prisoner', () => {
    visitPageWithRoles([`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`])

    const page = Page.verifyOnPage(NoCellAllocatedPage)
    page.noCellAllocatedRows().should('have.length', 2)

    page.noCellAllocatedRows().first().find('td').eq(1).should('contain.text', 'Shannon, Eddie')
    page.noCellAllocatedRows().first().find('td').eq(2).should('contain.text', 'A1234AB')
    page.noCellAllocatedRows().first().find('td').eq(3).should('contain.text', '1-1-2')
    page.noCellAllocatedRows().first().find('td').eq(4).should('contain.text', '00:00')
    page.noCellAllocatedRows().first().find('td').eq(5).should('contain.text', 'Edwin Shannon')
  })

  it('makes Name and "Time moved out" sortable but not the other columns', () => {
    visitPageWithRoles([`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`])

    const page = Page.verifyOnPage(NoCellAllocatedPage)

    // Sortable columns expose aria-sort
    page.noCellAllocatedHeaders().eq(1).should('have.attr', 'aria-sort') // Name
    page.noCellAllocatedHeaders().eq(4).should('have.attr', 'aria-sort') // Time moved out

    // Non-sortable columns do not
    page.noCellAllocatedHeaders().eq(2).should('not.have.attr', 'aria-sort') // Prison number
    page.noCellAllocatedHeaders().eq(3).should('not.have.attr', 'aria-sort') // Previous cell
    page.noCellAllocatedHeaders().eq(5).should('not.have.attr', 'aria-sort') // Moved out by
  })

  it('should display allocation link if user has cell move', () => {
    visitPageWithRoles([`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`, `ROLE_${Role.CellMove}`])

    const page = Page.verifyOnPage(NoCellAllocatedPage)

    page
      .noCellAllocatedRows()
      .first()
      .find('td')
      .eq(6)
      .find('a[href="http://localhost:3002/prisoner/A1234AB/cell-move/search-for-cell"]')
      .should('contain.text', 'Allocate cell')
  })

  it('name link returns to the no-cell-allocated page via the prisoner profile back link', () => {
    visitPageWithRoles([`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`])

    const page = Page.verifyOnPage(NoCellAllocatedPage)

    page
      .noCellAllocatedRows()
      .first()
      .find('td')
      .eq(1)
      .find('a')
      .should('have.attr', 'href')
      .and('contain', '/save-backlink')
      .and('contain', 'service=prison-roll-count')
      .and('contain', 'backLinkText=Back%20to%20No%20cell%20allocated')
      .and('contain', 'returnPath=/no-cell-allocated')
      .and('contain', 'redirectPath=/prisoner/A1234AB')
  })
})

context('No Cell Allocated Page without prisoner data', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubPostAttributeSearch', { payload: [] })
    cy.task('stubGetOffenderCellHistory', '')
    cy.task('getUserDetailsList')
    cy.task('stubActivePrisons', { activeAgencies: ['MDI'] })
    cy.task('stubLocationPrisonRollCount', { prisonCode: 'MDI' })
    cy.task('stubPrisonConfiguration', { prisonId: 'MDI', resiLocationServiceActive: 'ACTIVE' })
  })

  it('Page is visible', () => {
    visitPageWithRoles([`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`])
    Page.verifyOnPage(NoCellAllocatedPage)
  })

  it('should display a message explaining there is no data to display', () => {
    visitPageWithRoles([`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`])

    cy.contains('h1', 'No cell allocated').should('exist')

    cy.contains('p', 'No people to display').should('exist')
  })
})
