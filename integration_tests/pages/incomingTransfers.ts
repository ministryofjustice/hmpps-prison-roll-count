import Page, { PageElement } from './page'

export default class IncomingTransfersPage extends Page {
  constructor() {
    super(`Incoming transfers`)
  }

  incomingTransfersRows = (): PageElement => cy.get('table.incoming-transfers-roll__table tbody tr')

  incomingTransfersHeaders = (): PageElement => cy.get('table.incoming-transfers-roll__table thead th')
}
