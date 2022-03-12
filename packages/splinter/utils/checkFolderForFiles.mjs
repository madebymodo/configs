import { readdir } from 'fs/promises'
import { intersection } from 'lodash-es'

/**
 * Checks if some files exists in the provided folder
 * @param {string} path The path of the folder to check
 * @param {string[]} files The files to look for
 * @returns {Promise<string[]>} A promise which resolves to an array containing the found files, empty if none
 */
const checkFolderForFiles = async (path, files) => {
  const destinationFolderContents = (await readdir(path, { withFileTypes: true })).map(
    (dirent) => dirent.name
  )

  return intersection(destinationFolderContents, files)
}

export default checkFolderForFiles
