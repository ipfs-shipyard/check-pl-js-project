'use strict'

const { semanticReleaseConfig } = require('../semantic-release-config')
const merge = require('merge-options').bind({ ignoreUndefined: true })
const { sortFields } = require('../utils')

const manifestFields = {
  main: 'src/index.js',
  type: 'module',
  types: 'types/src/index.d.ts',
  typesVersions: {
    '*': {
      '*': [
        'types/*',
        'types/src/*'
      ],
      'types/*': [
        'types/*',
        'types/src/*'
      ]
    }
  },
  files: [
    '*',
    '!**/*.tsbuildinfo'
  ],
  exports: {
    '.': {
      import: './src/index.js'
    }
  },
  eslintConfig: {
    extends: 'ipfs',
    parserOptions: {
      sourceType: 'module'
    }
  },
  release: {},
  scripts: {
    lint: 'aegir lint',
    'dep-check': 'aegir dep-check',
    build: 'aegir build',
    test: 'aegir test',
    'test:chrome': 'npm run test -- -t browser --cov',
    'test:chrome-webworker': 'npm run test -- -t webworker',
    'test:firefox': 'npm run test -- -t browser -- --browser firefox',
    'test:firefox-webworker': 'npm run test -- -t webworker -- --browser firefox',
    'test:node': 'npm run test -- -t node --cov',
    'test:electron-main': 'npm run test -- -t electron-main',
    release: 'semantic-release'
  }
}

async function typedESMManifest (projectDir, manifest, branchName, repoUrl, homePage = repoUrl) {
  let proposedManifest = {
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    homepage: `${homePage}#readme`,
    license: 'Apache-2.0 OR MIT',
    repository: {
      type: 'git',
      url: `git+${repoUrl}.git`
    },
    bugs: {
      url: `${repoUrl}/issues`
    },
    ...manifestFields,
    dependencies: manifest.dependencies,
    devDependencies: manifest.devDependencies,
    peerDependencies: manifest.peerDependencies,
    peerDependenciesMeta: manifest.peerDependenciesMeta,
    optionalDependencies: manifest.optionalDependencies,
    bundledDependencies: manifest.bundledDependencies
  }

  proposedManifest.release = semanticReleaseConfig(branchName, 'dist')
  proposedManifest.exports = merge(manifest.exports, proposedManifest.exports)
  proposedManifest.eslintConfig = merge(proposedManifest.eslintConfig, manifest.eslintConfig)
  proposedManifest.scripts = merge(proposedManifest.scripts, manifest.scripts)

  const rest = {
    ...sortFields(manifest)
  }

  for (const key of Object.keys(proposedManifest)) {
    delete rest[key]
  }

  proposedManifest = {
    ...proposedManifest,
    ...rest,
    contributors: undefined,
    leadMaintainer: undefined
  }

  return proposedManifest
}

module.exports = {
  typedESMManifest
}
