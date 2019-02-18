'use strict'
const debug = require('debug')('download')
const fileHelper = require('./file-helper')
const OpenSubtitles = require('./os-api')
const CONST = require('./constants')
const {
  put
} = require('./cache-file')

/**
 * Download subtitle
 * @param {Array} folders List of directory
 * @param {Array} languages List of languageCode, E.g: eng, vie
 */
async function download (folders, languages = ['eng'], user, pass) {
  console.log('Downloading subtitles for movies:\n\tfolder: ', folders, '\n\tlanguages: ', languages)
  for (const folder of folders) {
    await downloadFolder(folder, languages, user, pass)
  }
}

async function downloadFolder (folderPath, languages, user, pass) {
  const movieObjects = await fileHelper.getMoviesAndSubtitles(folderPath)
  let moviesHasSubtitle = []
  let movieNeedSubtitlesMap = new Map()
  movieObjects.forEach(m => {
    const missingLanguages = findMissingSubtitle(m, languages)
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

  const movieNeedSubtitleList = Array.from(movieNeedSubtitlesMap).map(kv => kv[1])
  console.log('Searching subtitle for movies:\n',
    movieNeedSubtitleList.map(item => item.file))
  if (!movieNeedSubtitleList.length) {
    console.log('Subtitles are ready, no need to search.')
    process.exit(0)
  }

  const movieHashedList = await OpenSubtitles.getHashs(movieNeedSubtitleList)
  let listMovieHashed = []
  movieHashedList.forEach(movieHash => {
    const movie = movieNeedSubtitlesMap.get(movieHash.absoluteFile)
    if (movie.missingLanguages && movie.missingLanguages.length) {
      listMovieHashed.push({
        sublanguageid: movie.missingLanguages.join(','),
        moviehash: movieHash.moviehash,
        moviebytesize: movieHash.moviebytesize,
        filename: movieHash.filename
      })
    }
  })
  debug('listMovieHashed:', listMovieHashed)
  const searchResponse = await OpenSubtitles.SearchSubtitles(listMovieHashed, user, pass)
  debug('Search result: ', searchResponse)
  if (!searchResponse || !searchResponse.status.includes('200')) {
    await isUnAuthorized(searchResponse)
    console.log('Error', searchResponse)
    return
  }

  let subDescList = __filterByBestScore(searchResponse.data)
  let subDescListFiltered = []
  for (let subDesc of subDescList) {
    let movie = movieHashedList.find(movie => movie.moviehash === subDesc.MovieHash)
    if (movie) {
      subDesc.absoluteFile = movie.absoluteFile
      subDescListFiltered.push(subDesc)
    }
  };

  let subIds = subDescListFiltered.map(subtitle => subtitle.IDSubtitleFile)
  const subtitlesDataResponse = await OpenSubtitles.DownloadSubtitles(subIds, user, pass)
  await isUnAuthorized(subtitlesDataResponse)
  let subs = __buildSubFileName(subtitlesDataResponse.data, subDescListFiltered)
  for (let sub of subs) {
    await fileHelper.unZippedBase64(sub.data, sub.absoluteFile)
  }
}

function __buildSubFileName (subDataList, subDescList) {
  if (!subDataList || subDataList.length === 0) {
    return []
  }
  let subtitleList = subDataList.map(subData => {
    let subDesc = subDescList.find(subDesc => subDesc.IDSubtitleFile === subData.idsubtitlefile)
    return {
      absoluteFile: __createSubFileName(subDesc),
      data: subData.data
    }
  })
  return subtitleList
}

function __createSubFileName (subDesc) {
  let movieFileName = subDesc.absoluteFile
  if (!movieFileName) {
    return subDesc.SubFileName
  }
  let movieExtension = subDesc.absoluteFile.substr(movieFileName.lastIndexOf('.'))
  return movieFileName.replace(movieExtension, '.' + subDesc.SubLanguageID + '.' + subDesc.SubFormat)
}

function __filterByBestScore (subDescList) {
  let bestSubOfMovieMap = {}
  for (let subDesc of subDescList) {
    const hasKey = `${subDesc.MovieHash}-${subDesc.SubLanguageID}`
    if (bestSubOfMovieMap[hasKey]) {
      if (subDesc.Score > bestSubOfMovieMap[hasKey]['Score']) {
        bestSubOfMovieMap[hasKey] = subDesc
      }
    } else {
      bestSubOfMovieMap[hasKey] = subDesc
    }
  }
  return Object.keys(bestSubOfMovieMap).map(key => bestSubOfMovieMap[key])
}

function findMissingSubtitle (movieObject, languages) {
  if (!movieObject.subtitles.length) {
    return languages.slice()
  }
  if (languages[0] === 'all') {
    return Object.keys(CONST.languages)
  }
  const filteredLang = languages.filter((lang) => {
    const foundSubtitle = movieObject.subtitles.filter((sub) => {
      return sub.includes(`.${lang}.`)
    })
    return !foundSubtitle.length
  })
  return filteredLang
}

async function isUnAuthorized (response) {
  if (response && response.status.includes('401')) {
    await put('token', '')
    console.log('Unauthorized, Please rerun command with user and password.')
    process.exit(1)
  }
}

module.exports = {
  download
}
