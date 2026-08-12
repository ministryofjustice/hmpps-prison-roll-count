import Page from '../pages/page'
import Role from '../../server/enums/role'
import EstablishmentRollLandingPage from '../pages/establishmentRollLanding'

context('Establishment Roll Landing Page', () => {
  const wingId = '39255'
  const spurId = '39256'
  const landingId = '39270'

  beforeEach(() => {
    cy.task('reset')
    cy.setupUserAuth({ roles: [`ROLE_PRISON`, `ROLE_${Role.GlobalSearch}`] })
    cy.setupComponentsData()
    cy.task('stubActivePrisons', { activeAgencies: ['BXI'] })
    cy.task('stubPrisonConfiguration', { prisonId: 'LEI', resiLocationServiceActive: 'INACTIVE' })
    cy.task('stubPrisonRollCount')
    cy.task('stubPrisonRollCountForLanding', { prisonCode: 'LEI', landingId: wingId })
    cy.task('stubLocationsOutToday', wingId)
    cy.signIn()
    cy.visit(`/wing/${wingId}/spur/${spurId}/landing/${landingId}`, { failOnStatusCode: false })
  })

  it('Page is visible', () => {
    cy.document().then(doc => {
      cy.writeFile('test_results/landing-page-debug.html', doc.documentElement.outerHTML)
    })
    Page.verifyOnPage(EstablishmentRollLandingPage)
  })

  it('should display a row for each cell on the landing', () => {
    const page = Page.verifyOnPage(EstablishmentRollLandingPage)

    page.landingRows().should('have.length', 13)

    page.landingRows().first().find('td').eq(0).should('contain.text', '013')
    page.landingRows().first().find('td').eq(1).should('contain.text', '1')

    page.landingRows().eq(1).find('td').eq(0).should('contain.text', '014')
    page.landingRows().eq(1).find('td').eq(1).should('contain.text', '0')
  })

  it('should display nested occupant rows for each cell', () => {
    const page = Page.verifyOnPage(EstablishmentRollLandingPage)

    page.landingRows().first().find('table.wing-landing__table--prisoner tbody tr').should('have.length', 1)
  })

  it('should display expected table headers', () => {
    const page = Page.verifyOnPage(EstablishmentRollLandingPage)

    page.landingHeaders().eq(0).should('contain.text', 'Cell')
    page.landingHeaders().eq(1).should('contain.text', 'Beds available')
    page.landingHeaders().eq(2).should('contain.text', 'Occupants')
    page.landingHeaders().eq(3).should('contain.text', 'Location')
    page.landingHeaders().eq(4).should('contain.text', 'CSRA')
    page.landingHeaders().eq(5).should('contain.text', 'Relevant alerts')
  })
})
