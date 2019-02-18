const OS = require('opensubtitles-api')
const crypto = require('crypto')
const { put, get } = require('./cache-file')
const userDefaultLang = 'en'

const OpenSubtitles = new OS({
  useragent: getUserAgent(),
  ssl: true
})

/**
 * return hashed md5 of a string.
 * @param {string} str
 */
function encryptMd5 (str) {
  return crypto.createHash('md5').update(str).digest('hex')
}

function getUserAgent () {
  return 'TemporaryUserAgent'
}

async function getToken (user = '', pass = '') {
  const token = await get('token')
  if (token) {
    console.log('Access token is cached.')
    return Promise.resolve(token)
  }
  try {
    const response = await OpenSubtitles.api.LogIn(
      user,
      encryptMd5(pass),
      userDefaultLang,
      getUserAgent()
    )
    if (response) {
      await put('token', response.token)
      return response.token
    } else {
      await put('token', '')
      console.log('Cant authentication to OpenSubtitle, please correct your username and password.')
    }
  } catch (ex) {
    console.log('Cant authentication to OpenSubtitle, please correct your username and password.', ex)
  }
}

/**
 * Search a movie by hash or text search
 * @param {string} options
 */
function search (options) {
  return OpenSubtitles.search(options)
}

/**
 * Search subtitles for list of movies.
 * @param {Array} movies
 */
async function SearchSubtitles (movies, user, pass) {
  const token = await getToken(user, pass)
  return OpenSubtitles.api.SearchSubtitles(token, movies)
}

async function DownloadSubtitles (subtitleIds, user, pass) {
  const token = await getToken(user, pass)
  return OpenSubtitles.api.DownloadSubtitles(token, subtitleIds)
}
/**
 *
 * @param {Array} files array of full file path.
 */
function getHashs (files) {
  let getHashPromises = files.map(absoluteFile => __getHash(absoluteFile))
  return Promise.all(getHashPromises)
}

function __getHash (absoluteFile) {
  return OpenSubtitles.hash(absoluteFile).then(response => {
    response.absoluteFile = absoluteFile
    return response
  }, reason => reason)
}

module.exports = {
  search,
  SearchSubtitles,
  DownloadSubtitles,
  getHash: OpenSubtitles.hash,
  getHashs
}
