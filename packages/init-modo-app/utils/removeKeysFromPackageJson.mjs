import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

/**
 * @param {string[]} keys
 */
const removeKeysFromPackageJson = (keys) => {
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  const packageJson = JSON.parse(readFileSync(packageJsonPath))

  for (let key of keys) {
    console.log(key)
    delete packageJson[key]
  }

  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
}

export default removeKeysFromPackageJson
