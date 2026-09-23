import { PrisonerSearchClient } from '../../data/interfaces/prisonerSearchClient'

const prisonerSearchApiClientMock: PrisonerSearchClient = {
  getPrisonersById: jest.fn(),
  getCswapPrisonersInEstablishment: jest.fn(),
  getOvernightPrisonersInEstablishment: jest.fn(),
  getNewAdmissionsInEstablishment: jest.fn(),
  getTransfersInEstablishment: jest.fn(),
  getReturnsInEstablishment: jest.fn(),
}

export default prisonerSearchApiClientMock
