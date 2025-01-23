enum Role {
  UpdateAlert = 'UPDATE_ALERT',
  InactiveBookings = 'INACTIVE_BOOKINGS',
  DeleteSensitiveCaseNotes = 'DELETE_SENSITIVE_CASE_NOTES',
  PathfinderUser = 'PF_USER',
  PathfinderStdPrison = 'PF_STD_PRISON',
  PathfinderStdProbation = 'PF_STD_PROBATION',
  PathfinderApproval = 'PF_APPROVAL',
  PathfinderHQ = 'PF_HQ',
  PathfinderNationalReader = 'PF_NATIONAL_READER',
  PathfinderLocalReader = 'PF_LOCAL_READER',
  PathfinderPolice = 'PF_POLICE',
  PathfinderPsychologist = 'PF_PSYCHOLOGIST',
  SocCustody = 'SOC_CUSTODY',
  SocCommunity = 'SOC_COMMUNITY',
  CreateCategorisation = 'CREATE_CATEGORISATION',
  CreateRecategorisation = 'CREATE_RECATEGORISATION',
  ApproveCategorisation = 'APPROVE_CATEGORISATION',
  CategorisationSecurity = 'CATEGORISATION_SECURITY',
  GlobalSearch = 'GLOBAL_SEARCH',
  PomUser = 'POM',
  ViewProbationDocuments = 'VIEW_PROBATION_DOCUMENTS',
  PrisonUser = 'PRISON',
  ReceptionUser = 'PRISON_RECEPTION',
  CellMove = 'CELL_MOVE',
  KeyWorker = 'KW',
}

export default Role
