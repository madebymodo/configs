#!/usr/bin/env node

import { join } from 'path'
import { existsSync, writeFileSync } from 'fs'
import { copyFile, unlink } from 'fs/promises'
import { URL } from 'url'
import os from 'os'

import ora from 'ora'
import chalk from 'chalk'
import inquirer from 'inquirer'
import spawn from 'cross-spawn'
import { default as validateNpmName } from 'validate-npm-package-name'

import { toolsMeta } from './utils/config.mjs'
import removeKeysFromPackageJson from './utils/removeKeysFromPackageJson.mjs'
import streamToString from './utils/streamToString.mjs'
import listDirectoriesInDirectory from './utils/listDirectoriesInDirectory.mjs'
import checkFolderForFiles from './utils/checkFolderForFiles.mjs'
import checkPackageJsonForKeys from './utils/checkPackageJsonForKeys.mjs'

/**
 * @typedef ProjectMeta
 * @prop {string[]} tools
 * @prop {string[]} dependencies
 */

const scriptUrl = new URL('.', import.meta.url).pathname
const destinationFolder = process.cwd()

const create = async () => {
  console.log('')
  console.log(chalk.bold(`Initializing ${chalk.bgBlue.white(' MODO ')} tooling configurations...`))
  console.log('')

  /**
   * Get possible config, ask for desired config, get related meta
   */

  const possibleConfigs = await listDirectoriesInDirectory(join(scriptUrl, 'templates'))

  const { projectType } = await inquirer.prompt({
    type: 'list',
    name: 'projectType',
    message: 'Which kind of project are you working on?',
    choices: possibleConfigs,
    default: 'js',
  })
  console.log('')

  /** @type ProjectMeta */
  const projectTypeMeta = await import(`./templates/${projectType}/_meta.mjs`)
  const requestedToolsMeta = projectTypeMeta.tools
    .map((tool) => toolsMeta.find((t) => t.name === tool))
    .flatMap((x) => (x ? x : []))

  const hasPackageJson = existsSync(join(destinationFolder, 'package.json'))

  /**
   * Check for eventual existing config, ask for confirmation before deleting them
   */

  const checkConfigSpinner = ora('Checking for existing configs...').start()

  const filesToChecks = requestedToolsMeta
    .map((tool) => tool.possibleConfigs)
    .flat()
    .filter((file) => file !== 'package.json')

  const keysToCheck = requestedToolsMeta.map((tool) => tool.packageProp).filter(Boolean)

  const [foundFiles, foundKeys] = await Promise.all([
    checkFolderForFiles(destinationFolder, filesToChecks),
    hasPackageJson ? checkPackageJsonForKeys(destinationFolder, keysToCheck) : [],
  ])

  if (!foundFiles.length && !foundKeys.length) {
    checkConfigSpinner.succeed('No existing configs detected')
    console.log('')
  } else {
    checkConfigSpinner.warn('Existing configs found:')
    if (foundFiles.length) {
      console.log('  ' + foundFiles.map((file) => chalk.dim(file)).join('\n  '))
    }
    if (foundKeys.length) {
      console.log(
        '  ' + foundKeys.map((file) => chalk.dim(`${file} key in package.json`)).join('\n  ')
      )
    }
    console.log('  Having multiple configs can cause unexepected behaviour.')
    console.log(
      `  The script ${chalk.bold(
        'will remove the existing configs'
      )} before installing the new ones.`
    )
    console.log('')

    const { shouldContinue } = await inquirer.prompt({
      type: 'confirm',
      name: 'shouldContinue',
      message: 'Would you like to continue and remove the existing configurations?',
      default: false,
    })
    console.log('')

    if (shouldContinue) {
      const deleteExistingConfigSpinner = ora('Removing existing configs...').start()

      if (foundFiles.length) {
        await Promise.all(foundFiles.map((file) => unlink(join(destinationFolder, file))))
      }

      if (hasPackageJson && foundKeys.length) {
        removeKeysFromPackageJson(destinationFolder, foundKeys)
      }

      deleteExistingConfigSpinner.succeed('Existing configs removed.')
      console.log('')
    } else {
      console.log('Shutting down...')
      process.exit(0)
    }
  }

  /**
   * Create a new project if no package.json exists
   */

  if (hasPackageJson) {
    ora().info('Detected existing package.json, no init required.')
  } else {
    ora().succeed('No package.json found. A new project will be created.')

    const projectName = await inquirer
      .prompt({
        type: 'input',
        name: 'projectName',
        default: 'new-app',
        message: 'Insert a name for the project (can be changed later):',
        validate(value) {
          if (value.trim() !== '' && validateNpmName(value.trim())) {
            return true
          }

          return 'Please enter a valid name'
        },
      })
      .then(({ projectName }) => projectName)

    const packageJson = {
      name: projectName,
      version: '0.1.0',
      private: true,
    }

    writeFileSync(
      join(destinationFolder, 'package.json'),
      JSON.stringify(packageJson, null, 2) + os.EOL
    )

    console.log(`  Initialized new package.json with name: ${chalk.bold(projectName)}`)
  }
  console.log('')

  /**
   * Install required dependencies
   */

  const installingDepsSpinner = ora('Installing dependencies...').start()

  const command = 'npm'
  const args = [
    'install',
    '--audit',
    'false',
    '--fund',
    'false',
    '--save',
    '--save-exact',
    '--loglevel',
    'error',
  ].concat(projectTypeMeta.dependencies)

  const spawnNpmInstall = async () => {
    const child = spawn(command, args, { stdio: 'pipe' })
    const stderr = await streamToString(child.stderr)

    return new Promise((resolve) => {
      child.on('close', (code) => {
        if (code !== 0) {
          installingDepsSpinner.fail(
            'An error has occured while installing the dependencies, more info below:'
          )
          console.log(stderr)
          process.exit(1)
        }
        resolve(undefined)
      })
    })
  }

  await spawnNpmInstall()

  installingDepsSpinner.succeed('Dependencies installed.')
  console.log('')

  /**
   * Import required files
   */

  const task = ora('Copying selected configurations...')

  const fromUrl = join(scriptUrl, 'templates', projectType)
  const toUrl = destinationFolder

  await Promise.all(
    requestedToolsMeta.map((tool) =>
      copyFile(join(fromUrl, tool.configFileName), join(toUrl, tool.configFileName))
    )
  )

  task.succeed('Configuration files copied')
  console.log('')

  console.log(chalk.green(`Done, fresh ${chalk.bold(projectType)} configs set up!`))
  console.log('')

  return
}

await create()
