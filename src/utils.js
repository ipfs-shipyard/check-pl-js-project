'use strict'

/* eslint-disable no-console */

const fs = require('fs')
const path = require('path')
const prompt = require('prompt')
const chalk = require('chalk')
const Diff = require('diff')

async function ensureFileHasContents (projectDir, filePath, expectedContents) {
  const fileExists = fs.existsSync(path.join(projectDir, filePath))

  if (expectedContents == null) {
    expectedContents = fs.readFileSync(path.join(__dirname, 'files', filePath), {
      encoding: 'utf-8'
    })
  }

  let existingContents = ''

  if (fileExists) {
    existingContents = fs.readFileSync(path.join(projectDir, filePath), {
      encoding: 'utf-8'
    })

    if (filePath.endsWith('.json')) {
      existingContents = JSON.stringify(JSON.parse(existingContents), null, 2)
    }
  } else {
    if (process.env.CI) {
      throw new Error(`${filePath} did not exist`)
    }

    console.warn(chalk.yellow(`${filePath} did not exist`))

    const { createFile } = await prompt.get({
      properties: {
        createFile: {
          description: `Create ${filePath}?`,
          type: 'boolean',
          default: true
        }
      }
    })

    if (!createFile) {
      throw new Error(`Not creating ${filePath} file`)
    }

    fs.mkdirSync(path.dirname(path.join(projectDir, filePath)), {
      recursive: true
    })
    fs.writeFileSync(path.join(projectDir, filePath), expectedContents)

    return
  }

  if (existingContents === expectedContents) {
    console.info(chalk.green(`${filePath} contents ok`))
  } else {
    if (process.env.CI) {
      throw new Error(`${filePath} contents not ok`)
    }

    console.warn(chalk.yellow(`${filePath} contents not ok`))
    console.warn('Diff', chalk.green('added'), chalk.red('removed'), chalk.grey('unchanged'))

    const diff = Diff.diffLines(existingContents, expectedContents)

    diff.forEach((part) => {
      // green for additions, red for deletions
      // grey for common parts
      if (part.added) {
        console.info(chalk.green(part.value))
      } else if (part.removed) {
        console.info(chalk.red(part.value))
      } else {
        console.info(chalk.grey(part.value))
      }
    })

    const { overwriteFile } = await prompt.get({
      properties: {
        overwriteFile: {
          description: `Overwrite ${filePath}?`,
          type: 'boolean',
          default: true
        }
      }
    })

    if (!overwriteFile) {
      throw new Error(`Not overwriting ${filePath} file`)
    }

    fs.mkdirSync(path.dirname(path.join(projectDir, filePath)), {
      recursive: true
    })
    fs.writeFileSync(path.join(projectDir, filePath), expectedContents)
  }
}

async function ensureFileNotPresent (projectDir, filePath) {
  const fileExists = fs.existsSync(path.join(projectDir, filePath))

  if (fileExists) {
    if (process.env.CI) {
      throw new Error(`${filePath} exists`)
    }

    console.warn(chalk.yellow(`${filePath} exist`))

    const { removeFile } = await prompt.get({
      properties: {
        removeFile: {
          description: `Remove ${filePath}?`,
          type: 'boolean',
          default: true
        }
      }
    })

    if (!removeFile) {
      throw new Error(`Not removing ${filePath} file`)
    }

    fs.rmSync(filePath)
  }
}

function sortFields (obj) {
  if (!obj) {
    return
  }

  const keys = Object.keys(obj).sort()
  const output = {}

  keys.forEach(key => {
    output[key] = obj[key]
  })

  return output
}

function sortManifest (manifest) {
  const sorted = {
    ...manifest
  }

  sorted.dependencies = sortFields(manifest.dependencies)
  sorted.devDependencies = sortFields(manifest.devDependencies)
  sorted.optionalDependencies = sortFields(manifest.optionalDependencies)
  sorted.peerDependencies = sortFields(manifest.peerDependencies)
  sorted.peerDependenciesMeta = sortFields(manifest.peerDependenciesMeta)
  sorted.bundledDependencies = (manifest.bundledDependencies || []).sort()

  if (!sorted.bundledDependencies.length) {
    delete sorted.bundledDependencies
  }

  return sorted
}

module.exports = {
  ensureFileHasContents,
  ensureFileNotPresent,
  sortManifest,
  sortFields
}
