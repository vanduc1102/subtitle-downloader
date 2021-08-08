const os = require('os')
const path = require('path')
const {
  writeString,
  readString
} = require('./file-helper')

const CACHE_FILE_PREFIX = 'subtitle-downloader'

/**
 * Store value in cache file.
 * @param {String} key Key of cache
 * @param {Object} value Value to cache
 */
async function put (key, value) {
  return writeString(
    path.resolve(os.tmpdir(), `${CACHE_FILE_PREFIX}-${key}`)
    , JSON.stringify({ value }))
}

/**
 *
 * @param {String} key Key of cached
 */
async function get (key) {
  const data = await readString(
    path.resolve(os.tmpdir()
      , `${CACHE_FILE_PREFIX}-${key}`
    ))
  return data ? JSON.parse(data).value : null
}

module.exports = {
  put, get
}
