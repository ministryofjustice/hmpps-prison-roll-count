import { PrisonersInLocation } from '../../data/interfaces/prisonRollCount'

const prisonerInLocation: PrisonersInLocation[] = [
  {
    cellLocation: '1-1-1',
    prisoners: [
      {
        prisonerNumber: 'A1234AA',
        firstName: 'John',
        lastName: 'Smith',
        inOutStatus: 'OUT',
        dateOfBirth: '',
        gender: '',
        ethnicity: '',
        youthOffender: false,
        maritalStatus: '',
        religion: '',
        nationality: '',
        status: '',
        mostSeriousOffence: '',
        restrictedPatient: false,
      },
      {
        prisonerNumber: 'A1234AB',
        firstName: 'Eddie',
        lastName: 'Shannon',
        inOutStatus: 'OUT',
        dateOfBirth: '',
        gender: '',
        ethnicity: '',
        youthOffender: false,
        maritalStatus: '',
        religion: '',
        nationality: '',
        status: '',
        mostSeriousOffence: '',
        restrictedPatient: false,
      },
      {
        prisonerNumber: 'A1234AC',
        firstName: 'Fred',
        lastName: 'John',
        inOutStatus: 'IN',
        dateOfBirth: '',
        gender: '',
        ethnicity: '',
        youthOffender: false,
        maritalStatus: '',
        religion: '',
        nationality: '',
        status: '',
        mostSeriousOffence: '',
        restrictedPatient: false,
      },
    ],
  },
]

export default prisonerInLocation
