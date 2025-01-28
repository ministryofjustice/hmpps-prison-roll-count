Cypress.Commands.add('signIn', (options = { failOnStatusCode: true }) => {
  cy.request('/')
  return cy.task('getSignInUrl').then((url: string) => cy.visit(url, options))
})

Cypress.Commands.add('setupUserAuth', (options = {}) => {
  cy.task('stubSignIn', options)
  cy.task('stubUserLocations', options.locations)
})

Cypress.Commands.add('setupUserCaseloads', (options = {}) => {
  cy.task(
    'stubUserCaseLoads',
    options.caseLoads || [
      {
        caseLoadId: 'LEI',
        currentlyActive: true,
        description: 'Leeds (HMP)',
        type: '',
        caseloadFunction: '',
      },
    ],
  )
})
