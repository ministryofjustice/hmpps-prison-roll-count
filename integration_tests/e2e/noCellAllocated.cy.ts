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

context('In reception Page', () => {
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
    page.noCellAllocatedRows().should('have.length', 3)

    page.noCellAllocatedRows().first().find('td').eq(1).should('contain.text', 'Shannon, Eddie')
    page.noCellAllocatedRows().first().find('td').eq(2).should('contain.text', 'A1234AB')
    page.noCellAllocatedRows().first().find('td').eq(3).should('contain.text', '1-1-2')
    page.noCellAllocatedRows().first().find('td').eq(4).should('contain.text', '00:00')
    page.noCellAllocatedRows().first().find('td').eq(5).should('contain.text', 'Edwin Shannon')
  })

  it('makes Name and "Time moved out" sortable but not the other columns', () => {
      const page = Page.verifyOnPage(NoCellAllocatedPage)
  
      // Sortable columns expose aria-sort
      page.noCellAllocatedRows().eq(1).should('have.attr', 'aria-sort') // Name
      page.noCellAllocatedRows().eq(4).should('have.attr', 'aria-sort') // Time moved out

      // Non-sortable columns do not
      page.noCellAllocatedRows().eq(2).should('not.have.attr', 'aria-sort') // Prison number
      page.noCellAllocatedRows().eq(3).should('not.have.attr', 'aria-sort') // Previous cell
      page.noCellAllocatedRows().eq(5).should('not.have.attr', 'aria-sort') // Moved out by
    })

  it('should display allocation link if user has cell move', () => {
    visitPageWithRoles([`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`, `ROLE_${Role.CellMove}`])

    const page = Page.verifyOnPage(NoCellAllocatedPage)
    page.noCellAllocatedRows().should('have.length', 3)

    page
      .noCellAllocatedRows()
      .first()
      .find('td')
      .eq(6)
      .find('a[href="http://localhost:3002/prisoner/A1234AB/cell-move/search-for-cell"]')
      .should('contain.text', 'Allocate cell')
  })
})
