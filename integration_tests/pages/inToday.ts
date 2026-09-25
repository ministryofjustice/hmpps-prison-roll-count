import Page, { PageElement } from './page'

export default class inTodayPage extends Page {
  constructor() {
    super(`In today`)
  }

  inTodayRows = (): PageElement => cy.get('table.in-today-roll__table tbody tr')

  inTodayHeaders = (): PageElement => cy.get('table.in-today-roll__table thead th')
}
