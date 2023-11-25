import OS from 'opensubtitles-api';
import crypto from 'crypto';
import { put, get } from './cache-file.js';
import createDebugger from 'debug';

const debug = createDebugger('os-api');
const userDefaultLang = 'en';

const OpenSubtitles = new OS({
  useragent: getUserAgent(),
  ssl: true,
});

/**
 * return hashed md5 of a string.
 * @param {string} str
 */
function encryptMd5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

function getUserAgent() {
  return 'cli-subtitle-downloader v1.0';
}

async function getToken(user = '', pass = '') {
  try {
    const token = await get('token');
    if (token) {
      debug('Access token is cached.');
      return Promise.resolve(token);
    }
    const response = await OpenSubtitles.api.LogIn(
      user,
      encryptMd5(pass),
      userDefaultLang,
      getUserAgent(),
    );
    debug('Authentication successfullys');
    if (response) {
      await put('token', response.token);
      return response.token;
    } else {
      await put('token', '');
      throw new Error(
        'Cant authentication to OpenSubtitle, please correct your username and password.',
      );
    }
  } catch (ex) {
    throw new Error(
      'Cant authentication to OpenSubtitle, please correct your username and password.',
      ex,
    );
  }
}

/**
 * Search a movie by hash or text search
 * @param {string} options
 */
function search(options) {
  return OpenSubtitles.search(options);
}

/**
 * Search subtitles for list of movies.
 * @param {Array} movies
 */
async function SearchSubtitles(movies, user, pass) {
  const token = await getToken(user, pass);
  return OpenSubtitles.api.SearchSubtitles(token, movies);
}

async function DownloadSubtitles(subtitleIds, user, pass) {
  const token = await getToken(user, pass);
  return OpenSubtitles.api.DownloadSubtitles(token, subtitleIds);
}
/**
 *
 * @param {Array} movieFiles array of movieFile object contains absolute file path
 * and file name
 */
function getHashList(movieFiles) {
  if (movieFiles && !movieFiles.length) {
    return [];
  }
  const getHashPromises = movieFiles.map((movieFile) => __getHash(movieFile));
  return Promise.all(getHashPromises);
}
/**
 *
 * @param {Object} movieFile movieFile object contains absolutePath and fileName
 */
function __getHash(movieFile) {
  return OpenSubtitles.hash(movieFile.absolutePath).then(
    (response) => {
      response.absoluteFile = movieFile.absolutePath;
      response.filename = movieFile.file;
      return response;
    },
    (reason) => reason,
  );
}

export default {
  search,
  SearchSubtitles,
  DownloadSubtitles,
  getHash: OpenSubtitles.hash,
  getHashList,
};
