import { join } from 'path'
import { readFile } from 'fs/promises'
import { intersection } from 'lodash-es'

/**
 * Checks if the package.json in the provided path contains the keys in the passed array
 * @param {*} path
 * @param {*} keys
 * @returns
 */
const checkPackageJsonForKeys = async (path, keys) => {
  const packageJsonPath = join(path, 'package.json')
  const packageJson = JSON.parse((await readFile(packageJsonPath)).toString())

  return intersection(Object.keys(packageJson), keys)
}

export default checkPackageJsonForKeys
