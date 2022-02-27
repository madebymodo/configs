#!/usr/bin/env node

import path from 'path'
import { existsSync, writeFileSync } from 'fs'
import { copyFile, unlink } from 'fs/promises'
import { URL } from 'url'

import ora from 'ora'
import chalk from 'chalk'
import inquirer from 'inquirer'
import os from 'os'
import spawn from 'cross-spawn'
import { cosmiconfig } from 'cosmiconfig'
import { default as validateNpmName } from 'validate-npm-package-name'

import getDependecies from './utils/getDependencies.mjs'
import removeKeysFromPackageJson from './utils/removeKeysFromPackageJson.mjs'
import streamToString from './utils/streamToString.mjs'

const possibleTools = [
  { name: 'eslint', packageProp: 'eslintConfig', configFileName: '.eslintrc.json' },
  { name: 'prettier', packageProp: 'prettier', configFileName: '.prettierrc.json' },
]

/** @typedef {("js" | "react")} ProjectType */

/**
 * @returns {Promise<ProjectType>}
 */
const askForProjectType = async () => {
  const { projectType } = await inquirer.prompt({
    type: 'list',
    name: 'projectType',
    message: 'Install configs for:',
    choices: [
      'js',
      // react-config is broken rn
      // 'react'
    ],
    default: 'js',
  })
  console.log('')

  return projectType
}

const checkForExistingConfigs = async () => {
  const task = ora('Checking for existing configs...').start()

  const existingConfig = await Promise.all(
    possibleTools.map((tool) =>
      cosmiconfig(tool.name, {
        packageProp: tool.packageProp,
        stopDir: process.cwd(),
      }).search()
    )
  )

  if (!existingConfig.filter(Boolean).length) {
    task.succeed('No existing configs detected')
    console.log('')
  } else {
    task.warn('Existing configs found:')
    existingConfig.map((config, i) =>
      config ? console.log(`${chalk.bold(possibleTools[i].name)}: ${config.filepath}`) : null
    )

    console.log('')
    console.log(chalk.bgYellow.white.bold('  WARNING  '))
    console.log('Having multiple configs can cause unexepected behaviour.')
    console.log(
      `The script ${chalk.bold('will remove the existing configs')} before installing the new ones.`
    )
    console.log('')

    const { shouldContinue } = await inquirer.prompt({
      type: 'confirm',
      name: 'shouldContinue',
      message: 'Would you like to proceed anyway?',
      default: false,
    })
    console.log('')
    if (shouldContinue) {
      // Remove existing configs
      const deleteTask = ora('Removing existing configs...').start()

      const filesToRemove = []
      const keysToRemove = []

      existingConfig.forEach((config, i) => {
        if (!config) return

        if (config.filepath.endsWith('package.json')) {
          keysToRemove.push(possibleTools[i].packageProp)
          return
        }

        filesToRemove.push(config.filepath)
      })

      await Promise.all(filesToRemove.map((path) => unlink(path)))

      console.log(keysToRemove)

      removeKeysFromPackageJson(keysToRemove)

      deleteTask.succeed('Existing configs deleted.')
      console.log('')
    } else {
      console.log('Shutting down...')
      process.exit(0)
    }
  }
}

const checkForPackageJson = async () => {
  const task = ora('Checking for existing package.json...').start()
  const hasPackageJson = existsSync(path.join(process.cwd(), 'package.json'))

  if (hasPackageJson) {
    task.info('Detected existing package.json, no init required.')
  } else {
    task.succeed('No package.json found. A new project will be created.')

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
      path.join(process.cwd(), 'package.json'),
      JSON.stringify(packageJson, null, 2) + os.EOL
    )

    console.log(`Initialized new package.json with name: ${chalk.bold(projectName)}`)
  }

  console.log('')

  return
}

/**
 * @param {ProjectType} projectType
 */
const installDependencies = async (projectType) => {
  const task = ora('Installing dependencies...').start()

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
  ].concat(getDependecies(projectType))

  const spawnNpmInstall = async () => {
    const child = spawn(command, args, { stdio: 'pipe' })
    const stderr = await streamToString(child.stderr)

    return new Promise((resolve) => {
      child.on('close', (code) => {
        if (code !== 0) {
          task.fail('An error has occured while installing the dependencies, more info below:')
          console.log(stderr)
          process.exit(1)
        }
        resolve()
      })
    })
  }

  await spawnNpmInstall()

  task.succeed('Dependencies installed!')
  console.log('')
}

/**
 *
 * @param {ProjectType} projectType
 */
const createConfigFiles = async (projectType) => {
  const task = ora('Copying selected configurations...')

  const currentUrl = new URL('.', import.meta.url).pathname
  const fromUrl = path.join(currentUrl, 'templates', projectType)
  const toUrl = process.cwd()

  await Promise.all(
    possibleTools.map((tool) =>
      copyFile(path.join(fromUrl, tool.configFileName), path.join(toUrl, tool.configFileName))
    )
  )

  task.succeed('Configuration files copied successfully')
  console.log('')
}

const create = async () => {
  console.log(`Initializing ${chalk.bgBlue.bold.white(' MODO ')} project`)
  console.log('')

  const projectType = await askForProjectType()

  await checkForExistingConfigs()

  await checkForPackageJson()

  await installDependencies(projectType)

  await createConfigFiles(projectType)

  console.log(`${chalk.green('Done!')}`)

  return
}

await create()
