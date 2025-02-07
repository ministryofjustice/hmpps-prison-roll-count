import * as govukFrontend from 'govuk-frontend'
import * as mojFrontend from '@ministryofjustice/frontend'
import establishmentRoll from './establishment-roll'
import initMoj from './initMoj'
import printPage from './printPage'

govukFrontend.initAll()
mojFrontend.initAll()
establishmentRoll()
printPage()
initMoj()

