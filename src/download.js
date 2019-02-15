'use strict';
const fileHelper = require('./fileHelper');
const OpenSubtitles = require('./osApi');
const userLang = 'eng'; //eng //vie

const movieFolders = ['/Users/ducnguyen/Downloads/'];

function download(folders, languges) {
  fileHelper.walk(movieFolders.pop(), function (error, listAbsFilePaths) {
    // let fileNames = listAbsFilePaths.map(absPath => absPath.split('/').pop());
    OpenSubtitles.getHashs(listAbsFilePaths).then(moviesInfoList => {

      let listHashedMoviesWithoutAbsFile = moviesInfoList.map(movieInfoItem => {
        return {
          sublanguageid: userLang,
          moviehash: movieInfoItem.moviehash,
          moviebytesize: movieInfoItem.moviebytesize
        };
      });

      OpenSubtitles.SearchSubtitles(listHashedMoviesWithoutAbsFile).then(searchResponse => {
        let subDescList = __filterByBestScore(searchResponse.data);
        // process.exit();
        let subDescListFiltered = [];
        for (let subDesc of subDescList) {
          let movie = moviesInfoList.find(movie => movie.moviehash === subDesc.MovieHash);
          if (movie) {
            subDesc.absoluteFile = movie.absoluteFile;
            subDescListFiltered.push(subDesc);
          }
        };

        let subIds = subDescListFiltered.map(subtitle => subtitle.IDSubtitleFile);
        OpenSubtitles.DownloadSubtitles(subIds).then(subtitlesDataResponse => {
          let subs = __buildSubFileName(subtitlesDataResponse.data, subDescListFiltered);
          for (let sub of subs) {
            fileHelper.unZippedBase64(sub.data, sub.absoluteFile);
          }
        });
      });
    });
  });
}

function __buildSubFileName(subDataList, subDescList) {
  let subtitleList = subDataList.map(subData => {
    let subDesc = subDescList.find(subDesc => subDesc.IDSubtitleFile === subData.idsubtitlefile);
    return {
      absoluteFile: __createSubFileName(subDesc),
      data: subData.data
    }
  });
  return subtitleList;
}

function __createSubFileName(subDesc) {
  let movieFileName = subDesc.absoluteFile;
  if (!movieFileName) {
    return subDesc.SubFileName;
  }
  let movieExtension = subDesc.absoluteFile.substr(movieFileName.lastIndexOf('.'));
  return movieFileName.replace(movieExtension, '.' + subDesc.SubLanguageID + '.' + subDesc.SubFormat);
}

function __filterByBestScore(subDescList) {
  let bestSubOfMovieMap = {};
  for (let subDesc of subDescList) {
    if (bestSubOfMovieMap[subDesc.MovieHash]) {
      if (subDesc.Score > bestSubOfMovieMap[subDesc.MovieHash]['Score']) {
        bestSubOfMovieMap[subDesc.MovieHash] = subDesc;
      }
    } else {
      bestSubOfMovieMap[subDesc.MovieHash] = subDesc;
    }
  }
  return Object.keys(bestSubOfMovieMap).map(key => bestSubOfMovieMap[key]);
}

module.exports = {
  download
}
