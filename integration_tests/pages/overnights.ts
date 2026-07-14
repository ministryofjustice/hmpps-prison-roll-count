import Page, { PageElement } from './page'

export default class OvernightsPage extends Page {
  constructor() {
    super(`Overnights due to return`)
  }

  overnightsRows = (): PageElement => cy.get('table.overnights-roll__table tbody tr')
}
