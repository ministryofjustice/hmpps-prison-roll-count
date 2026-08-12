import Page, { PageElement } from './page'

export default class EstablishmentRollLandingPage extends Page {
  constructor() {
    super('2 - 1 - B')
  }

  landingRows = (): PageElement => cy.get('table.wing-landing__table > tbody > tr')

  landingHeaders = (): PageElement => cy.get('table.wing-landing__table > thead > tr > th')
}
