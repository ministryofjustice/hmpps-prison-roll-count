import { Prisoner } from '../../data/interfaces/prisoner'

const prisonerSearchMock: Prisoner[] = [
  {
    prisonerNumber: 'A1234AA',
    bookingId: 123,
    firstName: 'John',
    lastName: 'Smith',
    dateOfBirth: '1980-01-01',
    gender: '',
    ethnicity: '',
    youthOffender: false,
    maritalStatus: '',
    religion: '',
    nationality: '',
    status: '',
    cellLocation: '1-1-1',
    mostSeriousOffence: '',
    restrictedPatient: false,
    alerts: [
      {
        alertType: 'Hidden disability',
        alertCode: 'HID',
        active: true,
        expired: false,
      },
    ],
    category: 'A',
  },
  {
    prisonerNumber: 'A1234AB',
    bookingId: 456,
    firstName: 'Eddie',
    lastName: 'Shannon',
    dateOfBirth: '1980-01-01',
    gender: '',
    ethnicity: '',
    youthOffender: false,
    maritalStatus: '',
    religion: '',
    nationality: '',
    status: '',
    cellLocation: '1-1-1',
    mostSeriousOffence: '',
    restrictedPatient: false,
    alerts: [],
  },
]

export default prisonerSearchMock
