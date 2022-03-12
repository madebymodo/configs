/**
 *
 * @param {NodeJS.ReadableStream | null} readableStream
 * @returns {Promise<string>}
 */
const streamToString = async (readableStream) => {
  return new Promise((resolve, reject) => {
    /** @type string[] */
    const chunks = []
    readableStream?.on('data', (data) => {
      chunks.push(data.toString())
    })
    readableStream?.on('end', () => {
      resolve(chunks.join(''))
    })
    readableStream?.on('error', reject)
  })
}

export default streamToString
