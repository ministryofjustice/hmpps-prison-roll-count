import prisonApiClientMock from '../test/mocks/prisonApiClientMock'
import MovementsService from './movementsService'
import prisonerSearchApiClientMock from '../test/mocks/prisonerSearchApiClientMock'
import { movementsInMock } from '../test/mocks/movementsInMock'
import prisonerSearchMock from '../test/mocks/prisonerSearchMock'
import { movementsOutMock } from '../test/mocks/movementsOutMock'
import { movementsIncomingTransfersMock } from '../test/mocks/movementsIncomingTransfersMock'
import { movementsInReceptionMock } from '../test/mocks/movementsInReceptionMock'
import { movementsRecentMock } from '../test/mocks/movementsRecentMock'
import { offenderCellHistory2Mock, offenderCellHistoryMock } from '../test/mocks/offenderCellHistoryMock'
import userDetailsMock from '../test/mocks/userDetailsMock'
import pagedListMock from '../test/mocks/pagedListMock'
import locationsInsidePrisonApiClientMock from '../test/mocks/locationsInsidePrisonApiClientMock'
import { Prisoner } from '../data/interfaces/prisoner'

describe('movementsService', () => {
  let movementsService: MovementsService

  beforeEach(() => {
    movementsService = new MovementsService(
      () => prisonApiClientMock,
      () => prisonerSearchApiClientMock,
      () => locationsInsidePrisonApiClientMock,
    )
  })

  describe.each(['getInTodayPrisoners', 'getOutTodayPrisoners'] as const)('%s current status', method => {
    it('displays and sorts statuses relative to the current caseload', async () => {
      const prisoners: Prisoner[] = [
        { ...prisonerSearchMock[0], prisonerNumber: 'OTHER', prisonId: 'MDI', inOutStatus: 'IN' as const, status: 'A' },
        { ...prisonerSearchMock[0], prisonerNumber: 'HERE', prisonId: 'LEI', inOutStatus: 'IN' as const, status: 'Z' },
        { ...prisonerSearchMock[0], prisonerNumber: 'AWAY', prisonId: 'LEI', inOutStatus: 'OUT' as const },
        { ...prisonerSearchMock[0], prisonerNumber: 'TRANSIT', prisonId: 'LEI', inOutStatus: 'TRN' as const },
        { ...prisonerSearchMock[0], prisonerNumber: 'UAL', prisonId: 'LEI', inOutStatus: 'UAL' as const },
        { ...prisonerSearchMock[0], prisonerNumber: 'UNKNOWN', prisonId: undefined, inOutStatus: 'IN' as const },
        { ...prisonerSearchMock[0], prisonerNumber: 'NO_STATUS', prisonId: 'LEI', inOutStatus: undefined },
      ]
      const offenderNumbers = [...prisoners.map(prisoner => prisoner.prisonerNumber), 'NOT_FOUND']
      prisonerSearchApiClientMock.getPrisonersById = jest.fn().mockResolvedValue(prisoners)
      prisonApiClientMock.getRecentMovements = jest.fn().mockResolvedValue([])
      prisonApiClientMock.getMovementsIn = jest
        .fn()
        .mockResolvedValue(offenderNumbers.map(offenderNo => ({ ...movementsInMock[0], offenderNo })))
      prisonApiClientMock.getMovementsOut = jest
        .fn()
        .mockResolvedValue(offenderNumbers.map(offenderNo => ({ ...movementsOutMock[0], offenderNo })))

      const ascending = await movementsService[method]('token', 'LEI', 'currentStatus&direction=ascending')
      expect(ascending.map(({ currentStatus }) => currentStatus)).toEqual([
        undefined,
        undefined,
        undefined,
        'IN',
        'OUT',
        'OUT',
        'OUT',
        'OUT',
      ])
      expect(ascending.find(prisoner => prisoner.prisonerNumber === 'OTHER')).toMatchObject({
        inOutStatus: 'IN',
        currentStatus: 'OUT',
      })
      expect(ascending.find(prisoner => prisoner.prisonerNumber === 'HERE')?.currentStatus).toBe('IN')
      expect(ascending.find(prisoner => prisoner.prisonerNumber === 'AWAY')?.currentStatus).toBe('OUT')
      expect(ascending.find(prisoner => prisoner.prisonerNumber === 'TRANSIT')?.currentStatus).toBe('OUT')
      expect(ascending.find(prisoner => prisoner.prisonerNumber === 'UAL')?.currentStatus).toBe('OUT')

      const descending = await movementsService[method]('token', 'LEI', 'currentStatus&direction=descending')
      expect(descending.map(({ currentStatus }) => currentStatus)).toEqual([
        'OUT',
        'OUT',
        'OUT',
        'OUT',
        'IN',
        undefined,
        undefined,
        undefined,
      ])
    })
  })

  describe('getInTodayPrisoners', () => {
    it('should return prisoners returned from movements api', async () => {
      prisonApiClientMock.getMovementsIn = jest.fn().mockResolvedValue(movementsInMock)
      prisonerSearchApiClientMock.getPrisonersById = jest.fn().mockResolvedValue(prisonerSearchMock)
      prisonApiClientMock.getRecentMovements = jest.fn().mockResolvedValue(movementsRecentMock)

      const result = await movementsService.getInTodayPrisoners('token', 'LEI')
      expect(prisonerSearchApiClientMock.getPrisonersById).toHaveBeenCalledWith(['A1234AA', 'A1234AB'])
      expect(prisonApiClientMock.getRecentMovements).not.toHaveBeenCalled()

      expect(result).toEqual([
        {
          ...prisonerSearchMock[1],
          currentStatus: undefined,
          alertFlags: [],
          arrivedFrom: 'York Train Station, York, YO24 1AB',
          arrivalType: 'ROTL',
          movementDate: '2024-05-10',
          movementTime: '10:30:00',
          movementReason: 'Temporary release',
          movementType: 'ROTL',
        },
        {
          ...prisonerSearchMock[0],
          currentStatus: undefined,
          alertFlags: [
            {
              alertCodes: ['HID'],
              alertIds: ['HID'],
              classes: 'dps-alert-status dps-alert-status--medical',
              label: 'Hidden disability',
            },
          ],
          arrivedFrom: 'Leeds',
          arrivalType: 'ROTL',
          movementDate: '2024-05-10',
          movementTime: '10:00:00',
          movementReason: 'Normal ROTL',
          movementType: 'ROTL',
        },
      ])
    })

    it('should use TRN as arrivalType when one of the last two movementTypes is a transfer', async () => {
      prisonApiClientMock.getMovementsIn = jest.fn().mockResolvedValue([
        { ...movementsInMock[0], movementType: 'ADM', movementTime: '12:00:00' },
        { ...movementsInMock[1], movementType: 'ROTL' },
      ])
      prisonerSearchApiClientMock.getPrisonersById = jest.fn().mockResolvedValue(prisonerSearchMock)
      prisonApiClientMock.getRecentMovements = jest.fn().mockResolvedValue([
        {
          ...movementsRecentMock[0],
          offenderNo: 'A1234AA',
          bookingId: 1,
          movementType: 'ADM',
          movementDate: '2024-05-10',
          movementTime: '12:00',
        },
        {
          ...movementsRecentMock[0],
          offenderNo: 'A1234AA',
          movementType: 'TRN',
          movementDate: '2024-05-10',
          movementTime: '10:00',
        },
        ...movementsRecentMock.filter(movement => movement.offenderNo === 'A1234AB'),
      ])

      const result = await movementsService.getInTodayPrisoners('token', 'LEI')

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            prisonerNumber: 'A1234AA',
            arrivalType: 'TRN',
          }),
        ]),
      )
    })

    it('should use TRN as arrivalType when recent movements are returned as TRN then ADM', async () => {
      prisonApiClientMock.getMovementsIn = jest.fn().mockResolvedValue([
        { ...movementsInMock[0], movementType: 'ADM' },
        { ...movementsInMock[1], movementType: 'ROTL' },
      ])
      prisonerSearchApiClientMock.getPrisonersById = jest.fn().mockResolvedValue(prisonerSearchMock)
      prisonApiClientMock.getRecentMovements = jest.fn().mockResolvedValue([
        {
          ...movementsRecentMock[0],
          offenderNo: 'A1234AA',
          movementType: 'TRN',
          movementDate: '2024-05-10',
          movementTime: '09:00',
        },
        {
          ...movementsRecentMock[0],
          offenderNo: 'A1234AA',
          bookingId: 1,
          movementType: 'ADM',
          movementDate: '2024-05-10',
          movementTime: '10:00',
        },
        ...movementsRecentMock.filter(movement => movement.offenderNo === 'A1234AB'),
      ])

      const result = await movementsService.getInTodayPrisoners('token', 'LEI')

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            prisonerNumber: 'A1234AA',
            arrivalType: 'TRN',
          }),
        ]),
      )
    })

    it('should use the latest TRN and ADM movements when history is returned oldest-first', async () => {
      prisonApiClientMock.getMovementsIn = jest.fn().mockResolvedValue([
        { ...movementsInMock[0], movementType: 'ADM', movementTime: '12:00:00' },
        { ...movementsInMock[1], movementType: 'ROTL' },
      ])
      prisonerSearchApiClientMock.getPrisonersById = jest.fn().mockResolvedValue(prisonerSearchMock)
      prisonApiClientMock.getRecentMovements = jest.fn().mockResolvedValue([
        {
          ...movementsRecentMock[0],
          offenderNo: 'A1234AA',
          movementType: 'ADM',
          movementDate: '2024-05-08',
          movementTime: '08:00',
        },
        {
          ...movementsRecentMock[0],
          offenderNo: 'A1234AA',
          movementType: 'ADM',
          movementDate: '2024-05-09',
          movementTime: '09:00',
        },
        {
          ...movementsRecentMock[0],
          offenderNo: 'A1234AA',
          movementType: 'TRN',
          movementDate: '2024-05-10',
          movementTime: '10:00',
        },
        {
          ...movementsRecentMock[0],
          offenderNo: 'A1234AA',
          bookingId: 1,
          movementType: 'ADM',
          movementDate: '2024-05-10',
          movementTime: '12:00',
        },
        ...movementsRecentMock.filter(movement => movement.offenderNo === 'A1234AB'),
      ])

      const result = await movementsService.getInTodayPrisoners('token', 'LEI')

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            prisonerNumber: 'A1234AA',
            arrivalType: 'TRN',
          }),
        ]),
      )
    })

    it('should use the latest history after sorting movement rows by date and time', async () => {
      prisonApiClientMock.getMovementsIn = jest.fn().mockResolvedValue([
        { ...movementsInMock[0], movementType: 'ADM', movementTime: '12:00:00' },
        { ...movementsInMock[1], movementType: 'ROTL' },
      ])
      prisonerSearchApiClientMock.getPrisonersById = jest.fn().mockResolvedValue(prisonerSearchMock)
      prisonApiClientMock.getRecentMovements = jest.fn().mockResolvedValue([
        {
          ...movementsRecentMock[0],
          offenderNo: 'A1234AA',
          bookingId: 1,
          movementType: 'ADM',
          movementDate: '2024-05-10',
          movementTime: '12:00',
        },
        {
          ...movementsRecentMock[0],
          offenderNo: 'A1234AA',
          movementType: 'TRN',
          movementDate: '2024-05-10',
          movementTime: '10:00',
        },
        {
          ...movementsRecentMock[0],
          offenderNo: 'A1234AA',
          movementType: 'ADM',
          movementDate: '2024-05-09',
          movementTime: '06:00',
        },
        {
          ...movementsRecentMock[0],
          offenderNo: 'A1234AA',
          movementType: 'ADM',
          movementDate: '2024-05-08',
          movementTime: '14:00',
        },
        ...movementsRecentMock.filter(movement => movement.offenderNo === 'A1234AB'),
      ])

      const result = await movementsService.getInTodayPrisoners('token', 'LEI')

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            prisonerNumber: 'A1234AA',
            arrivalType: 'TRN',
          }),
        ]),
      )
    })

    it('should use TRN as arrivalType when Prison API returns ADM with a transfer-related reason', async () => {
      prisonApiClientMock.getMovementsIn = jest.fn().mockResolvedValue([
        { ...movementsInMock[0], movementType: 'ADM' },
        { ...movementsInMock[1], movementType: 'ROTL' },
      ])
      prisonerSearchApiClientMock.getPrisonersById = jest.fn().mockResolvedValue(prisonerSearchMock)
      prisonApiClientMock.getRecentMovements = jest.fn().mockResolvedValue([
        {
          ...movementsRecentMock[0],
          offenderNo: 'A1234AA',
          bookingId: 1,
          movementType: 'ADM',
          movementDate: '2024-05-10',
          movementTime: '10:00',
          movementReason: 'Transfer In from Other Establishment',
          movementReasonDescription: 'Transfer In from Other Establishment',
        },
        ...movementsRecentMock.filter(movement => movement.offenderNo === 'A1234AB'),
      ])

      const result = await movementsService.getInTodayPrisoners('token', 'LEI')

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            prisonerNumber: 'A1234AA',
            arrivalType: 'TRN',
          }),
        ]),
      )
    })

    it('should sort by arrivalType ascending when requested', async () => {
      prisonApiClientMock.getMovementsIn = jest.fn().mockResolvedValue([
        { ...movementsInMock[0], movementType: 'TRN' },
        { ...movementsInMock[1], movementType: 'ADM' },
      ])
      prisonerSearchApiClientMock.getPrisonersById = jest.fn().mockResolvedValue(prisonerSearchMock)
      prisonApiClientMock.getRecentMovements = jest.fn().mockResolvedValue([
        { ...movementsRecentMock[0], offenderNo: 'A1234AA', movementType: 'TRN' },
        {
          ...movementsRecentMock[1],
          offenderNo: 'A1234AB',
          movementType: 'ADM',
          movementTypeDescription: 'Admission',
          movementReason: 'NEW',
          movementReasonDescription: 'New admission',
        },
      ])

      const result = await movementsService.getInTodayPrisoners('token', 'LEI', 'arrivalType&direction=ascending')

      expect(result.map(prisoner => prisoner.prisonerNumber)).toEqual(['A1234AB', 'A1234AA'])
    })

    it('should count duplicate offender numbers as two separate arrivals', async () => {
      const duplicateMovements = [
        { ...movementsInMock[0], movementTime: '09:00:00', movementDateTime: '2024-05-10T09:00:00' },
        { ...movementsInMock[0], movementTime: '10:00:00', movementDateTime: '2024-05-10T10:00:00' },
      ]

      prisonApiClientMock.getMovementsIn = jest.fn().mockResolvedValue(duplicateMovements)
      prisonerSearchApiClientMock.getPrisonersById = jest.fn().mockResolvedValue([prisonerSearchMock[0]])
      prisonApiClientMock.getRecentMovements = jest
        .fn()
        .mockResolvedValue([movementsRecentMock[0], movementsRecentMock[1]])

      const result = await movementsService.getInTodayPrisoners('token', 'LEI')

      expect(result).toHaveLength(2)
      expect(result.map(prisoner => prisoner.prisonerNumber)).toEqual(['A1234AA', 'A1234AA'])
    })

    it('keeps the admission and subsequent return as separate arrivals', async () => {
      prisonApiClientMock.getMovementsIn = jest.fn().mockResolvedValue([
        {
          ...movementsInMock[0],
          movementType: 'ADM',
          movementTime: '09:20:00',
          movementDateTime: '2024-05-10T09:20:00',
          movementReasonDescription: 'Imprisonment Without Option',
          fromAgencyDescription: 'Court',
        },
        {
          ...movementsInMock[0],
          movementType: 'TAP',
          movementTime: '10:53:25',
          movementDateTime: '2024-05-10T10:53:25',
          movementReasonDescription: 'Outside Prison Activity',
          fromAgencyDescription: 'Temporary absence',
        },
      ])
      prisonerSearchApiClientMock.getPrisonersById = jest.fn().mockResolvedValue([prisonerSearchMock[0]])
      prisonApiClientMock.getRecentMovements = jest.fn().mockResolvedValue([
        {
          ...movementsRecentMock[0],
          bookingId: 1,
          movementType: 'TAP',
          movementDate: '2024-05-10',
          movementTime: '10:53:25',
          directionCode: 'IN',
        },
        {
          ...movementsRecentMock[0],
          bookingId: 1,
          movementType: 'ADM',
          movementDate: '2024-05-10',
          movementTime: '09:20:00',
          movementReason: 'Imprisonment Without Option',
          movementReasonDescription: 'Imprisonment Without Option',
        },
        {
          ...movementsRecentMock[0],
          bookingId: 1,
          movementType: 'TAP',
          movementDate: '2024-05-10',
          movementTime: '10:51:57',
          directionCode: 'OUT',
        },
      ])

      const result = await movementsService.getInTodayPrisoners('token', 'LEI')

      expect(result).toEqual([
        expect.objectContaining({
          prisonerNumber: 'A1234AA',
          arrivalType: 'TAP',
          movementDate: '2024-05-10',
          movementTime: '10:53:25',
          arrivedFrom: 'Temporary absence',
        }),
        expect.objectContaining({
          prisonerNumber: 'A1234AA',
          arrivalType: 'ADM',
          movementDate: '2024-05-10',
          movementTime: '09:20:00',
          arrivedFrom: 'Court',
        }),
      ])
    })

    it('classifies each admission using its own preceding history', async () => {
      prisonApiClientMock.getMovementsIn = jest.fn().mockResolvedValue([
        { ...movementsInMock[0], movementType: 'ADM', movementTime: '09:00:00' },
        { ...movementsInMock[0], movementType: 'ADM', movementTime: '12:00:00' },
      ])
      prisonerSearchApiClientMock.getPrisonersById = jest.fn().mockResolvedValue([prisonerSearchMock[0]])
      prisonApiClientMock.getRecentMovements = jest.fn().mockResolvedValue([
        {
          ...movementsRecentMock[0],
          bookingId: 1,
          movementType: 'TAP',
          movementDate: '2024-05-10',
          movementTime: '13:00:00',
        },
        {
          ...movementsRecentMock[0],
          bookingId: 1,
          movementType: 'ADM',
          movementDate: '2024-05-10',
          movementTime: '12:00:00',
          movementReason: 'New admission',
          movementReasonDescription: 'New admission',
        },
        {
          ...movementsRecentMock[0],
          bookingId: 1,
          movementType: 'TRN',
          movementDate: '2024-05-10',
          movementTime: '11:00:00',
        },
        {
          ...movementsRecentMock[0],
          bookingId: 1,
          movementType: 'ADM',
          movementDate: '2024-05-10',
          movementTime: '09:00:00',
          movementReason: 'New admission',
          movementReasonDescription: 'New admission',
        },
      ])

      const result = await movementsService.getInTodayPrisoners('token', 'LEI')

      expect(result.map(({ movementTime, arrivalType }) => ({ movementTime, arrivalType }))).toEqual([
        { movementTime: '12:00:00', arrivalType: 'TRN' },
        { movementTime: '09:00:00', arrivalType: 'ADM' },
      ])
    })

    it('uses the admission itself when the corresponding history is missing', async () => {
      prisonApiClientMock.getMovementsIn = jest.fn().mockResolvedValue([
        { ...movementsInMock[0], movementType: 'ADM', movementReasonDescription: 'New admission' },
        {
          ...movementsInMock[0],
          movementType: 'ADM',
          movementTime: '11:00:00',
          movementReasonDescription: 'Transfer in',
        },
      ])
      prisonerSearchApiClientMock.getPrisonersById = jest.fn().mockResolvedValue([prisonerSearchMock[0]])
      prisonApiClientMock.getRecentMovements = jest.fn().mockResolvedValue([
        { ...movementsRecentMock[0], movementType: 'TAP', movementDate: '2024-05-10', movementTime: '12:00:00' },
        {
          ...movementsRecentMock[0],
          bookingId: 99,
          movementType: 'ADM',
          movementDate: '2024-05-10',
          movementTime: '10:00:00',
          movementReason: 'Transfer in',
        },
      ])

      const result = await movementsService.getInTodayPrisoners('token', 'LEI')

      expect(result.map(({ movementTime, arrivalType }) => ({ movementTime, arrivalType }))).toEqual([
        { movementTime: '11:00:00', arrivalType: 'TRN' },
        { movementTime: '10:00:00', arrivalType: 'ADM' },
      ])
    })

    it('should return empty api if no incoming prisoners', async () => {
      prisonApiClientMock.getMovementsIn = jest.fn().mockResolvedValue([])
      prisonerSearchApiClientMock.getPrisonersById = jest.fn().mockResolvedValue(prisonerSearchMock)
      prisonApiClientMock.getRecentMovements = jest.fn()

      const result = await movementsService.getInTodayPrisoners('token', 'LEI')
      expect(prisonerSearchApiClientMock.getPrisonersById).not.toHaveBeenCalled()
      expect(prisonApiClientMock.getRecentMovements).not.toHaveBeenCalled()

      expect(result).toEqual([])
    })
  })

  describe('getOutTodayPrisoners', () => {
    beforeEach(() => {
      prisonApiClientMock.getTemporaryAbsences = jest.fn().mockResolvedValue([])
    })

    it('should return prisoners from movements api', async () => {
      prisonApiClientMock.getMovementsOut = jest.fn().mockResolvedValue(movementsOutMock)
      prisonerSearchApiClientMock.getPrisonersById = jest.fn().mockResolvedValue(prisonerSearchMock)
      prisonApiClientMock.getRecentMovements = jest.fn().mockResolvedValue(movementsRecentMock)

      const result = await movementsService.getOutTodayPrisoners('token', 'LEI')
      expect(prisonerSearchApiClientMock.getPrisonersById).toHaveBeenCalledWith(['A1234AA', 'A1234AB'])
      expect(prisonApiClientMock.getRecentMovements).toHaveBeenCalledWith(['A1234AA', 'A1234AB'], false)
      expect(prisonApiClientMock.getTemporaryAbsences).not.toHaveBeenCalled()

      expect(result).toEqual([
        {
          ...prisonerSearchMock[1],
          currentStatus: undefined,
          alertFlags: [],
          reasonDescription: 'Another transfer',
          goingTo: 'HMP Moorland',
          timeOut: '11:00:00',
          departureTypeCode: 'TRN',
        },
        {
          ...prisonerSearchMock[0],
          currentStatus: undefined,
          alertFlags: [
            {
              alertCodes: ['HID'],
              alertIds: ['HID'],
              classes: 'dps-alert-status dps-alert-status--medical',
              label: 'Hidden disability',
            },
          ],
          reasonDescription: 'Transfer',
          timeOut: '10:00:00',
          goingTo: 'HMP Leeds',
          departureTypeCode: 'TRN',
        },
      ])
    })

    it('uses the destination of each matching outgoing movement for the same prisoner', async () => {
      const today = new Date().toISOString().split('T')[0]
      prisonApiClientMock.getMovementsOut = jest.fn().mockResolvedValue([
        { ...movementsOutMock[0], movementType: 'CRT', timeOut: '12:16:39', toAddress: undefined },
        { ...movementsOutMock[0], movementType: 'CRT', timeOut: '12:21:21', toAddress: undefined },
      ])
      prisonerSearchApiClientMock.getPrisonersById = jest.fn().mockResolvedValue([prisonerSearchMock[0]])
      prisonApiClientMock.getRecentMovements = jest.fn().mockResolvedValue([
        {
          ...movementsRecentMock[0],
          directionCode: 'OUT',
          movementType: 'CRT',
          movementDate: today,
          movementTime: '12:21:21',
          toAgencyDescription: 'Margate Youth Court',
        },
        {
          ...movementsRecentMock[0],
          directionCode: 'OUT',
          movementType: 'CRT',
          movementDate: today,
          movementTime: '12:16:39',
          toAgencyDescription: 'Leicester Youth Court',
        },
      ])

      const result = await movementsService.getOutTodayPrisoners('token', 'LEI')

      expect(result.map(({ timeOut, goingTo }) => ({ timeOut, goingTo }))).toEqual([
        { timeOut: '12:21:21', goingTo: 'Margate Youth Court' },
        { timeOut: '12:16:39', goingTo: 'Leicester Youth Court' },
      ])
    })

    it('uses the matching history for each TAP movement, including city and times without seconds', async () => {
      const today = new Date().toISOString().split('T')[0]
      prisonApiClientMock.getMovementsOut = jest.fn().mockResolvedValue([
        { ...movementsOutMock[0], movementType: 'TAP', timeOut: '10:00:00', toAddress: undefined },
        { ...movementsOutMock[0], movementType: 'TAP', timeOut: '11:00:00', toAddress: undefined },
      ])
      prisonerSearchApiClientMock.getPrisonersById = jest.fn().mockResolvedValue([prisonerSearchMock[0]])
      prisonApiClientMock.getRecentMovements = jest.fn().mockResolvedValue([
        {
          ...movementsRecentMock[0],
          directionCode: 'OUT',
          movementType: 'TAP',
          movementDate: today,
          movementTime: '10:00',
          toAgencyDescription: '',
          toCity: 'Leicester',
        },
        {
          ...movementsRecentMock[0],
          directionCode: 'OUT',
          movementType: 'TAP',
          movementDate: today,
          movementTime: '11:00:00',
          toAgencyDescription: '',
          toCity: 'Margate',
        },
      ])

      const result = await movementsService.getOutTodayPrisoners('token', 'LEI')

      expect(result.map(({ timeOut, goingTo }) => ({ timeOut, goingTo }))).toEqual([
        { timeOut: '11:00:00', goingTo: 'Margate' },
        { timeOut: '10:00:00', goingTo: 'Leicester' },
      ])
    })

    it('should return empty api if no incoming prisoners', async () => {
      prisonApiClientMock.getMovementsOut = jest.fn().mockResolvedValue([])
      prisonerSearchApiClientMock.getPrisonersById = jest.fn().mockResolvedValue(prisonerSearchMock)

      const result = await movementsService.getOutTodayPrisoners('token', 'LEI')
      expect(prisonerSearchApiClientMock.getPrisonersById).not.toHaveBeenCalled()

      expect(result).toEqual([])
    })
  })

  describe('getIncomingTransfersPrisoners', () => {
    it('should return prisoners from movements api', async () => {
      prisonApiClientMock.getMovementsIncomingTransfers = jest.fn().mockResolvedValue(movementsIncomingTransfersMock)
      prisonerSearchApiClientMock.getPrisonersById = jest.fn().mockResolvedValue(prisonerSearchMock)

      const result = await movementsService.getIncomingTransfersPrisoners('token', 'LEI')
      expect(prisonerSearchApiClientMock.getPrisonersById).toHaveBeenCalledWith(['A1234AA', 'A1234AB'])

      expect(result).toEqual([
        {
          ...prisonerSearchMock[0],
          from: 'Leeds',
          reason: 'Normal Transfer',
          alertFlags: [],
          movementTime: '11:00',
          movementDate: '2023-12-25',
        },
        {
          ...prisonerSearchMock[1],
          alertFlags: [
            {
              alertCodes: ['HID'],
              alertIds: ['HID'],
              classes: 'dps-alert-status dps-alert-status--medical',
              label: 'Hidden disability',
            },
          ],
          from: 'Leeds',
          reason: 'Normal Transfer',
          movementDate: '2023-12-25',
          movementTime: '10:00',
        },
      ])
    })

    it('should return empty api if no incoming prisoners', async () => {
      prisonApiClientMock.getMovementsIncomingTransfers = jest.fn().mockResolvedValue([])
      prisonerSearchApiClientMock.getPrisonersById = jest.fn().mockResolvedValue(prisonerSearchMock)

      const result = await movementsService.getIncomingTransfersPrisoners('token', 'LEI')
      expect(prisonerSearchApiClientMock.getPrisonersById).not.toHaveBeenCalled()

      expect(result).toEqual([])
    })
  })

  describe('getInReceptionPrisoners', () => {
    it('should return prisoners from movements api', async () => {
      prisonApiClientMock.getMovementsInReception = jest.fn().mockResolvedValue(movementsInReceptionMock)
      prisonerSearchApiClientMock.getPrisonersById = jest.fn().mockResolvedValue(prisonerSearchMock)
      prisonApiClientMock.getRecentMovements = jest.fn().mockResolvedValue(movementsRecentMock)

      const result = await movementsService.getInReceptionPrisoners('token', 'LEI')
      expect(prisonerSearchApiClientMock.getPrisonersById).toHaveBeenCalledWith(
        expect.arrayContaining(['A1234AA', 'A1234AB']),
      )
      expect(prisonApiClientMock.getRecentMovements).toHaveBeenCalledWith(
        expect.arrayContaining(['A1234AA', 'A1234AB']),
      )

      expect(result.map(prisoner => prisoner.prisonerNumber)).toEqual(['A1234AB', 'A1234AA'])
      expect(result.map(prisoner => prisoner.from)).toEqual(['Leeds', 'Leicester'])
      expect(result.map(prisoner => prisoner.timeArrived)).toEqual(['11:00', '10:00'])
      expect(result[0].alertFlags).toEqual([])
      expect(result[1].alertFlags).toEqual([
        {
          alertCodes: ['HID'],
          alertIds: ['HID'],
          classes: 'dps-alert-status dps-alert-status--medical',
          label: 'Hidden disability',
        },
      ])
    })

    it('should default to sorting by prisonerName ascending', async () => {
      prisonApiClientMock.getMovementsInReception = jest.fn().mockResolvedValue(movementsInReceptionMock)
      prisonerSearchApiClientMock.getPrisonersById = jest.fn().mockResolvedValue(prisonerSearchMock)
      prisonApiClientMock.getRecentMovements = jest.fn().mockResolvedValue(movementsRecentMock)

      const result = await movementsService.getInReceptionPrisoners('token', 'LEI')

      expect(result.map(prisoner => prisoner.prisonerNumber)).toEqual(['A1234AB', 'A1234AA'])
    })

    it('should return empty api if no incoming prisoners', async () => {
      prisonApiClientMock.getMovementsInReception = jest.fn().mockResolvedValue([])
      prisonerSearchApiClientMock.getPrisonersById = jest.fn().mockResolvedValue(prisonerSearchMock)
      prisonApiClientMock.getRecentMovements = jest.fn().mockResolvedValue(movementsRecentMock)

      const result = await movementsService.getInReceptionPrisoners('token', 'LEI')
      expect(prisonerSearchApiClientMock.getPrisonersById).not.toHaveBeenCalled()
      expect(prisonApiClientMock.getRecentMovements).not.toHaveBeenCalled()

      expect(result).toEqual([])
    })
  })

  describe('getOvernightPrisoners', () => {
    beforeEach(() => {
      prisonerSearchApiClientMock.getOvernightPrisonersInEstablishment = jest
        .fn()
        .mockResolvedValue(pagedListMock(prisonerSearchMock))
      prisonerSearchApiClientMock.getPrisonersById = jest.fn().mockResolvedValue(prisonerSearchMock)
      prisonApiClientMock.getRecentMovements = jest.fn().mockResolvedValue(movementsRecentMock)
    })

    it('should return prisoners sorted by time and date departed (descending) by default', async () => {
      const result = await movementsService.getOvernightPrisoners('token', 'LEI')

      expect(prisonerSearchApiClientMock.getOvernightPrisonersInEstablishment).toHaveBeenCalledWith('LEI')
      expect(prisonerSearchApiClientMock.getPrisonersById).toHaveBeenCalledWith(
        expect.arrayContaining(['A1234AA', 'A1234AB']),
      )
      expect(prisonApiClientMock.getRecentMovements).toHaveBeenCalledWith(
        expect.arrayContaining(['A1234AA', 'A1234AB']),
      )
      expect(result.map(prisoner => prisoner.prisonerNumber)).toEqual(['A1234AB', 'A1234AA'])
    })

    it('should sort by last name ascending when requested', async () => {
      const result = await movementsService.getOvernightPrisoners('token', 'LEI', 'lastName&direction=ascending')

      expect(result.map(prisoner => prisoner.prisonerNumber)).toEqual(['A1234AB', 'A1234AA'])
    })

    it('should sort by departed time ascending when requested', async () => {
      const result = await movementsService.getOvernightPrisoners('token', 'LEI', 'timeDateDeparted,asc')

      expect(result.map(prisoner => prisoner.prisonerNumber)).toEqual(['A1234AA', 'A1234AB'])
    })

    it('should return empty array if no overnight prisoners', async () => {
      prisonerSearchApiClientMock.getOvernightPrisonersInEstablishment = jest.fn().mockResolvedValue(pagedListMock([]))

      const result = await movementsService.getOvernightPrisoners('token', 'LEI')

      expect(prisonerSearchApiClientMock.getPrisonersById).not.toHaveBeenCalled()
      expect(prisonApiClientMock.getRecentMovements).not.toHaveBeenCalled()
      expect(result).toEqual([])
    })
  })

  describe('getNoCellAllocatedPrisoners', () => {
    beforeEach(() => {
      prisonerSearchApiClientMock.getCswapPrisonersInEstablishment = jest
        .fn()
        .mockResolvedValue(pagedListMock(prisonerSearchMock))

      prisonApiClientMock.getOffenderCellHistory = jest
        .fn()
        .mockResolvedValueOnce(pagedListMock(offenderCellHistoryMock))
        .mockResolvedValueOnce(pagedListMock(offenderCellHistory2Mock))
      prisonApiClientMock.getUserDetailsList = jest.fn().mockResolvedValue(userDetailsMock)
    })

    it('should search for prisoners with CSWAP living unit and return result for each prisoner', async () => {
      const result = await movementsService.getNoCellAllocatedPrisoners('token', 'MDI')
      expect(prisonApiClientMock.getOffenderCellHistory).toHaveBeenCalledTimes(2)
      expect(prisonApiClientMock.getOffenderCellHistory).toHaveBeenCalledWith(123)
      expect(prisonApiClientMock.getOffenderCellHistory).toHaveBeenCalledWith(456)
      expect(prisonApiClientMock.getUserDetailsList).toHaveBeenCalledWith(['ESHANNON', 'CWADDLE'])

      expect(result).toEqual([
        expect.objectContaining(prisonerSearchMock[0]),
        expect.objectContaining(prisonerSearchMock[1]),
      ])
    })

    it('should add the name of the staff member who made the most recent move', async () => {
      const result = await movementsService.getNoCellAllocatedPrisoners('token', 'MDI')

      expect(result).toEqual([
        expect.objectContaining({
          movedBy: 'Edwin Shannon',
        }),
        expect.objectContaining({
          movedBy: 'Chris Waddle',
        }),
      ])
    })

    it('should add the previous cell from the penultimate cell', async () => {
      const result = await movementsService.getNoCellAllocatedPrisoners('token', 'MDI')

      expect(result).toEqual([
        expect.objectContaining({
          previousCell: '1-1-2',
        }),
        expect.objectContaining({
          previousCell: '2-1-3',
        }),
      ])
    })

    it('should add the timeOut from the penultimate cell', async () => {
      const result = await movementsService.getNoCellAllocatedPrisoners('token', 'MDI')

      expect(result).toEqual([
        expect.objectContaining({
          timeOut: '2021-02-01T00:00:00',
        }),
        expect.objectContaining({
          timeOut: '2021-02-01T00:00:00',
        }),
      ])
    })

    it('should return empty api if no CSWAP prisoners', async () => {
      prisonerSearchApiClientMock.getCswapPrisonersInEstablishment = jest.fn().mockResolvedValue({ content: [] })

      prisonApiClientMock.getOffenderCellHistory = jest.fn().mockResolvedValue(offenderCellHistoryMock)
      prisonApiClientMock.getUserDetailsList = jest.fn().mockResolvedValue(userDetailsMock)

      const result = await movementsService.getNoCellAllocatedPrisoners('token', 'LEI')
      expect(prisonApiClientMock.getOffenderCellHistory).not.toHaveBeenCalled()
      expect(prisonApiClientMock.getUserDetailsList).not.toHaveBeenCalled()

      expect(result).toEqual([])
    })
  })

  describe('getOffendersCurrentlyOutOfLivingUnit', () => {
    beforeEach(() => {
      prisonApiClientMock.getPrisonersCurrentlyOutOfLivingUnit = jest.fn().mockResolvedValue(movementsOutMock)
      prisonerSearchApiClientMock.getPrisonersById = jest.fn().mockResolvedValue(prisonerSearchMock)
      prisonApiClientMock.getRecentMovements = jest.fn().mockResolvedValue(movementsRecentMock)
    })

    it('should search for prisoners for prisoners from getPrisonersCurrentlyOutOfLivingUnit', async () => {
      const result = await movementsService.getOffendersCurrentlyOutOfLivingUnit('token', 'MDI')
      expect(prisonerSearchApiClientMock.getPrisonersById).toHaveBeenCalledWith(['A1234AA', 'A1234AB'])
      expect(prisonApiClientMock.getRecentMovements).toHaveBeenCalledWith(['A1234AA', 'A1234AB'])

      expect(result).toEqual([
        expect.objectContaining(prisonerSearchMock[0]),
        expect.objectContaining(prisonerSearchMock[1]),
      ])
    })

    it('should decorate the alertFlags for each prisoner', async () => {
      const result = await movementsService.getOffendersCurrentlyOutOfLivingUnit('token', 'MDI')

      expect(result).toEqual([
        expect.objectContaining({
          alertFlags: [],
        }),
        expect.objectContaining({
          alertFlags: [
            {
              alertCodes: ['HID'],
              alertIds: ['HID'],
              classes: 'dps-alert-status dps-alert-status--medical',
              label: 'Hidden disability',
            },
          ],
        }),
      ])
    })

    it('should add the currentLocation from latest movement toCity', async () => {
      const result = await movementsService.getOffendersCurrentlyOutOfLivingUnit('token', 'MDI')

      expect(result).toEqual([
        expect.objectContaining({
          currentLocation: 'Sheffield',
        }),
        expect.objectContaining({
          currentLocation: 'Doncaster',
        }),
      ])
    })

    it('should add the movementComment from latest movement commentText', async () => {
      const result = await movementsService.getOffendersCurrentlyOutOfLivingUnit('token', 'MDI')

      expect(result).toEqual([
        expect.objectContaining({
          movementComment: 'Some Sheffield comment',
        }),
        expect.objectContaining({
          movementComment: 'Some Doncaster comment',
        }),
      ])
    })

    it('should return empty api if no currently out prisoners', async () => {
      prisonApiClientMock.getPrisonersCurrentlyOutOfLivingUnit = jest.fn().mockResolvedValue([])

      const result = await movementsService.getOffendersCurrentlyOutOfLivingUnit('token', 'LEI')
      expect(prisonerSearchApiClientMock.getPrisonersById).not.toHaveBeenCalled()
      expect(prisonApiClientMock.getRecentMovements).not.toHaveBeenCalled()

      expect(result).toEqual([])
    })
  })

  describe('getOffendersCurrentlyOutTotal', () => {
    beforeEach(() => {
      prisonApiClientMock.getPrisonersCurrentlyOutOfPrison = jest.fn().mockResolvedValue(movementsOutMock)
      prisonerSearchApiClientMock.getPrisonersById = jest.fn().mockResolvedValue(prisonerSearchMock)
      prisonApiClientMock.getRecentMovements = jest.fn().mockResolvedValue(movementsRecentMock)
    })

    it('should search for prisoners for prisoners from getPrisonersCurrentlyOutOfPrison', async () => {
      const result = await movementsService.getOffendersCurrentlyOutTotal('token', 'MDI')
      expect(prisonerSearchApiClientMock.getPrisonersById).toHaveBeenCalledWith(['A1234AA', 'A1234AB'])
      expect(prisonApiClientMock.getRecentMovements).toHaveBeenCalledWith(['A1234AA', 'A1234AB'])

      expect(result).toEqual([
        expect.objectContaining(prisonerSearchMock[0]),
        expect.objectContaining(prisonerSearchMock[1]),
      ])
    })

    it('should add the currentLocation from latest movement toCity', async () => {
      const result = await movementsService.getOffendersCurrentlyOutTotal('token', 'MDI')

      expect(result).toEqual([
        expect.objectContaining({
          currentLocation: 'Sheffield',
        }),
        expect.objectContaining({
          currentLocation: 'Doncaster',
        }),
      ])
    })

    it('should add the movementComment from latest movement commentText', async () => {
      const result = await movementsService.getOffendersCurrentlyOutTotal('token', 'MDI')

      expect(result).toEqual([
        expect.objectContaining({
          movementComment: 'Some Sheffield comment',
        }),
        expect.objectContaining({
          movementComment: 'Some Doncaster comment',
        }),
      ])
    })

    it('should return empty api if no currently out prisoners', async () => {
      prisonApiClientMock.getPrisonersCurrentlyOutOfPrison = jest.fn().mockResolvedValue([])

      const result = await movementsService.getOffendersCurrentlyOutTotal('token', 'LEI')
      expect(prisonerSearchApiClientMock.getPrisonersById).not.toHaveBeenCalled()
      expect(prisonApiClientMock.getRecentMovements).not.toHaveBeenCalled()

      expect(result).toEqual([])
    })
  })

  it('should prefer the actual out-today movement type over the last historical movement type', async () => {
    prisonApiClientMock.getMovementsOut = jest.fn().mockResolvedValue([
      {
        offenderNo: 'A1234AA',
        dateOfBirth: '1980-01-01',
        firstName: 'John',
        lastName: 'Smith',
        timeOut: '10:00:00',
        movementType: 'CRT',
        reasonDescription: 'Court',
        toAddress: 'Leeds Magistrates Court',
      },
      {
        offenderNo: 'A1234AA',
        dateOfBirth: '1980-01-01',
        firstName: 'John',
        lastName: 'Smith',
        timeOut: '11:00:00',
        movementType: 'ADM',
        reasonDescription: 'New admission',
      },
    ])
    prisonerSearchApiClientMock.getPrisonersById = jest.fn().mockResolvedValue(prisonerSearchMock.slice(0, 1))

    const result = await movementsService.getOutTodayPrisoners('token', 'LEI')

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          departureTypeCode: 'CRT',
        }),
      ]),
    )
  })
})
