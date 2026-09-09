import { PrisonerSearchClient } from '../../data/interfaces/prisonerSearchClient'

const prisonerSearchApiClientMock: PrisonerSearchClient = {
  getPrisonersById: jest.fn(),
  getCswapPrisonersInEstablishment: jest.fn(),
  getOvernightPrisonersInEstablishment: jest.fn(),
  getNewAdmissionsInEstablishment: jest.fn(),
}

export default prisonerSearchApiClientMock
