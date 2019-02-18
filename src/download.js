'use strict'
const fileHelper = require('./file-helper')
const OpenSubtitles = require('./os-api')

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
  let movieObjects = await fileHelper.getMoviesAndSubtitles(folderPath)
  let moviesHasSubtitle = []
  movieObjects = movieObjects.filter(m => {
    if (m.subtitles && m.subtitles.length === 0) {
      return true
    }
    moviesHasSubtitle.push(m.file)
    return false
  })
  console.log('List movies have subtile:\n', moviesHasSubtitle)
  console.log('Searching subtitle for movies:\n', movieObjects.map(m => m.file))
  const listAbsMoviePath = movieObjects.map(m => m.absolutePath)
  const moviesInfoList = await OpenSubtitles.getHashs(listAbsMoviePath)
  let listMovieHashed = []
  moviesInfoList.forEach(movieInfoItem => {
    languages.forEach(langId => {
      listMovieHashed.push({
        sublanguageid: langId,
        moviehash: movieInfoItem.moviehash,
        moviebytesize: movieInfoItem.moviebytesize
      })
    })
  })

  const searchResponse = await OpenSubtitles.SearchSubtitles(listMovieHashed, user, pass)

  if (!searchResponse.data || searchResponse.data.length === 0) {
    console.log('Not found any subtitle.')
    return
  }
  let subDescList = __filterByBestScore(searchResponse.data)
  let subDescListFiltered = []
  for (let subDesc of subDescList) {
    let movie = moviesInfoList.find(movie => movie.moviehash === subDesc.MovieHash)
    if (movie) {
      subDesc.absoluteFile = movie.absoluteFile
      subDescListFiltered.push(subDesc)
    }
  };

  let subIds = subDescListFiltered.map(subtitle => subtitle.IDSubtitleFile)

  const subtitlesDataResponse = await OpenSubtitles.DownloadSubtitles(subIds, user, pass)
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
    if (bestSubOfMovieMap[subDesc.MovieHash]) {
      if (subDesc.Score > bestSubOfMovieMap[subDesc.MovieHash]['Score']) {
        bestSubOfMovieMap[subDesc.MovieHash] = subDesc
      }
    } else {
      bestSubOfMovieMap[subDesc.MovieHash] = subDesc
    }
  }
  return Object.keys(bestSubOfMovieMap).map(key => bestSubOfMovieMap[key])
}

module.exports = {
  download
}
