'use strict'
const debug = require('debug')('download')
const fileHelper = require('./file-helper')
const OpenSubtitles = require('./os-api')
const CONST = require('./constants')
const { put } = require('./cache-file')

const ENG_LANG = 'eng'

/**
 * Download subtitle
 * @param {Array} folders List of directory
 * @param {Array} languages List of languageCode, E.g: eng, vie
 */
async function download (folders, languages = [ENG_LANG], user, pass) {
  console.log(
    'Downloading subtitles for movies:\nFolder:\n',
    folders,
    '\nLanguages:\n',
    languages
  )
  for (const folder of folders) {
    await downloadFolder(folder, languages, user, pass)
  }
}

async function downloadFolder (folderPath, languages, user, pass) {
  const movieObjects = await fileHelper.getMoviesAndSubtitles(folderPath)
  const moviesHasSubtitle = []
  const movieNeedSubtitlesMap = new Map()
  movieObjects.forEach((m) => {
    if (m.file.startsWith('._')) {
      return
    }
    const missingLanguages = __findMissingSubtitle(m, languages)
    if (missingLanguages && missingLanguages.length) {
      movieNeedSubtitlesMap.set(m.absolutePath, {
        ...m,
        missingLanguages
      })
    } else {
      moviesHasSubtitle.push(m.file)
    }
  })

  console.log('List movies have subtile:\n', moviesHasSubtitle)

  const movieNeedSubtitleList = Array.from(movieNeedSubtitlesMap)
    .map((kv) => kv[1])
    .filter((movie) => !movie.file.startsWith('._'))
  console.log(
    'Searching subtitles for movies:\n',
    movieNeedSubtitleList.map((item) => item.file)
  )

  if (!movieNeedSubtitleList.length) {
    console.log('Subtitles are ready, no need to search.')
    process.exit(0)
  }

  const movieHashedList = await OpenSubtitles.getHashs(movieNeedSubtitleList)
  const listMovieHashed = []
  movieHashedList.forEach((movieHash) => {
    const movie = movieNeedSubtitlesMap.get(movieHash.absoluteFile)
    if (movie.missingLanguages && movie.missingLanguages.length) {
      listMovieHashed.push({
        sublanguageid: movie.missingLanguages.join(','),
        moviehash: movieHash.moviehash,
        moviebytesize: movieHash.moviebytesize,
        filename: fileHelper.fileNameToText(movieHash.filename)
      })
    }
  })
  debug('listMovieHashed:', listMovieHashed)
  const searchResponse = await OpenSubtitles.SearchSubtitles(
    listMovieHashed,
    user,
    pass
  )
  debug('Search result: ', searchResponse)
  if (!searchResponse || !searchResponse.status.includes('200')) {
    await isUnAuthorized(searchResponse)
    console.log('Error', searchResponse)
  }

  const subDescList = searchResponse.data
    ? __filterByBestScore(searchResponse.data)
    : []
  const subDescListFiltered = []
  for (const subDesc of subDescList) {
    const movie = movieHashedList.find(
      (movie) => movie.moviehash === subDesc.MovieHash
    )
    if (movie) {
      subDesc.absoluteFile = movie.absoluteFile
      subDescListFiltered.push(subDesc)
    }
  }

  const subIds = subDescListFiltered.map((subtitle) => subtitle.IDSubtitleFile)
  const subtitlesDataResponse = await OpenSubtitles.DownloadSubtitles(
    subIds,
    user,
    pass
  )
  await isUnAuthorized(subtitlesDataResponse)
  const subs = await __buildSubFileName(
    subtitlesDataResponse.data,
    subDescListFiltered
  )
  for (const sub of subs) {
    await fileHelper.unZippedBase64(sub.data, sub.absoluteFile)
  }
}

async function __buildSubFileName (subDataList, subDescList) {
  if (!subDataList || subDataList.length === 0) {
    return []
  }
  return Promise.all(
    subDataList.map(async (subData) => {
      const subDesc = subDescList.find(
        (subDesc) => subDesc.IDSubtitleFile === subData.idsubtitlefile
      )
      const absoluteFile = await __createSubFileName(subDesc)
      return {
        absoluteFile,
        data: subData.data
      }
    })
  )
}

async function __createSubFileName (subDesc) {
  const movieFileName = subDesc.absoluteFile
  if (!movieFileName) {
    return subDesc.SubFileName
  }
  const movieExtension = subDesc.absoluteFile.substr(
    movieFileName.lastIndexOf('.')
  )

  const defaultName = movieFileName.replace(
    movieExtension,
    '.' + subDesc.SubFormat
  )
  if (!(await fileHelper.exists(defaultName))) {
    return defaultName
  }

  const nameWithLang = movieFileName.replace(
    movieExtension,
    '.' + subDesc.SubLanguageID + '.' + subDesc.SubFormat
  )

  return nameWithLang
}

function __filterByBestScore (subDescList) {
  const bestSubOfMovieMap = {}
  for (const subDesc of subDescList) {
    const hasKey = `${subDesc.MovieHash}-${subDesc.SubLanguageID}`
    if (bestSubOfMovieMap[hasKey]) {
      if (subDesc.Score > bestSubOfMovieMap[hasKey].Score) {
        bestSubOfMovieMap[hasKey] = subDesc
      }
    } else {
      bestSubOfMovieMap[hasKey] = subDesc
    }
  }
  return Object.keys(bestSubOfMovieMap).map((key) => bestSubOfMovieMap[key])
}

function __findMissingSubtitle (movieObject, languages) {
  if (!movieObject.subtitles.length) {
    return languages.slice()
  }
  if (languages[0] === 'all') {
    return Object.keys(CONST.languages)
  }

  const filteredLang = languages.filter((lang) => {
    const foundSubtitle = movieObject.subtitles.filter((sub) => {
      return __isSubtitle(movieObject.file, sub, lang)
    })
    return !foundSubtitle.length
  })
  return filteredLang
}

function __isSubtitle (moveFilename, subFileName, lang = ENG_LANG) {
  const m = moveFilename.split('.').slice(0, -1).join('.')
  const sub = subFileName.split('.').slice(0, -1).join('.')
  return m === sub || m === `${sub}.${lang}`
}

async function isUnAuthorized (response) {
  if (response && response.status.includes('401')) {
    await put('token', '')
    console.log(
      'Unauthorized, Please re-run command with user and password of OpenSubtitles.org'
    )
    process.exit(1)
  }
}

module.exports = {
  download
}
