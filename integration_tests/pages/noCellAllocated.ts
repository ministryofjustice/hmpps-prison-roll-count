import Page, { PageElement } from './page'

export default class NoCellAllocatedPage extends Page {
  constructor() {
    super('No cell allocated')
  }

  noCellAllocatedRows = (): PageElement => cy.get('table.unallocated-roll__table tbody tr')
}
