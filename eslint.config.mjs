import hmppsConfig from '@ministryofjustice/eslint-config-hmpps'

export default hmppsConfig({
  extraIgnorePaths: ['assets', 'server.js', 'server.js.map'],
  extraPathsAllowingDevDependencies: ['.allowed-scripts.mjs'],
})
