import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

/**
 * Removes the passed keys from the package.json in the provided folder
 * @param {string} path
 * @param {string[]} keys
 */
const removeKeysFromPackageJson = (path, keys) => {
  const packageJsonPath = join(path, 'package.json')
  const packageJson = JSON.parse(readFileSync(packageJsonPath).toString())

  for (let key of keys) {
    delete packageJson[key]
  }

  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
}

export default removeKeysFromPackageJson
