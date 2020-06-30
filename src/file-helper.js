const fs = require('fs-extra')
const path = require('path')
const zlib = require('zlib')

/**
 * List all files in for a given folderPath.
 * @param {string} folderPath
 */
async function findMoviesRecursive (folderPath, result = []) {
  const files = await fs.readdir(folderPath)

  if (!files || !files.length) {
    return []
  }

  for (const file of files) {
    const absolutePath = path.resolve(folderPath, file)
    const fileStat = await fs.stat(absolutePath)

    if (fileStat &&
      fileStat.isDirectory() &&
      !isExcludedFolder(file)) {
      const subfiles = await findMoviesRecursive(absolutePath)
      if (subfiles.length) {
        result = [...result, ...subfiles]
      }
    } else if (isMovie(file)) {
      result.push({
        file,
        folder: folderPath,
        absolutePath
      })
    }
  };

  return result
}

/**
 * Check if there is a list of subtitles for movies.
 * @param {Array} movies object list
 */
async function getExistLocalSubtlMovieList (movies) {
  const result = []
  for (const movie of movies) {
    result.push(await getExistLocalSubtlMovie(movie))
  }
  return result
}

async function getExistLocalSubtlMovie (movieObject) {
  const files = await fs.readdir(movieObject.folder)
  const subtitles = []

  for (const file of files) {
    const filePath = path.resolve(movieObject.folder, file)
    const fileStat = await fs.stat(filePath)
    if (fileStat && !fileStat.isDirectory() &&
      !isMovie(file) &&
      isSubtitleOfAMovie(movieObject.file, file)) {
      subtitles.push(file)
    }
  }

  return {
    ...movieObject,
    subtitles
  }
}

function writeString (filePath, strContent) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path.resolve(filePath), strContent, {
      flag: 'w+'
    }, function (err) {
      if (err) {
        return reject(err)
      }
      resolve(filePath)
    })
  })
}

async function readString (filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', function (error, data) {
      if (error) {
        return resolve(null)
      }
      return resolve(data)
    })
  })
}

function unZippedBase64 (zippedBase64, filePath) {
  return new Promise((resolve, reject) => {
    const bufZipped = Buffer.from(zippedBase64, 'base64')
    zlib.gunzip(bufZipped, function (err, buf) {
      if (err) {
        return reject(err)
      }
      filePath = __createUniquePath(filePath)
      const stream = fs.createWriteStream(filePath)
      stream.write(buf)
      stream.end()
      stream.on('finish', function () {
        console.log('Saved: ', filePath)
        return resolve(filePath)
      })
      stream.on('error', (error) => {
        return reject(error)
      })
    })
  })
}

function __createUniquePath (absolutePath) {
  if (!fs.existsSync(absolutePath)) {
    return absolutePath
  }
  const extension = absolutePath.substr(absolutePath.lastIndexOf('.'))
  absolutePath = absolutePath.replace(extension, `.${Date.now() % 100}${extension}`)
  return __createUniquePath(absolutePath)
}

function isMovie (fileName) {
  return /(.webm|.avi|.mp4|.mkv|.flv|.wmv)$/i.test(fileName)
}

function isExcludedFolder (folderName) {
  return /^(node_modules|\.)/i.test(folderName)
}

function isSubtitleFile (fileName) {
  return /(.srt|.sub|.sbv)$/i.test(fileName)
}

function isSubtitleOfAMovie (movieFileName, subtitleFileName) {
  if (isSubtitleFile(subtitleFileName)) {
    const movieName = movieFileName
      .replace(/('.webm|.avi|.mp4|.mkv|.flv|.wmv')$/i, '')
    return subtitleFileName.includes(movieName)
  }
  return false
}

async function getMoviesAndSubtitles (folderPath) {
  const movies = await findMoviesRecursive(folderPath)
  return getExistLocalSubtlMovieList(movies)
}

module.exports = {
  getMoviesAndSubtitles,
  unZippedBase64,
  writeString,
  readString
}
