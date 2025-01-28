import { PagedList } from '../../data/interfaces/pagedList'

const pagedListMock = <T>(content: T[]): PagedList<T> => ({
  empty: false,
  first: false,
  last: false,
  number: 0,
  numberOfElements: 0,
  size: 0,
  sort: { empty: false, sorted: false, unsorted: false },
  totalElements: 0,
  totalPages: 0,
  content,
})

export default pagedListMock
