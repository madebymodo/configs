import { readdir } from 'fs/promises'

/**
 * Lists the directories in the provided directory
 * @param {string} source
 * @returns
 */
const listDirectoriesInDirectory = async (source) =>
  (await readdir(source, { withFileTypes: true }))
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)

export default listDirectoriesInDirectory
