const OS = require('opensubtitles-api');
const crypto = require('crypto');
const user = {
  username: 'vanduc1102',
  password: 'cud0123456789',
}
const userDefaultLang = 'en';

let Cache = {};

const OpenSubtitles = new OS({
    useragent: getUserAgent(),
    username: user.username,
    password : encryptMd5(user.password),
    ssl: true
});
/**
 * return hashed md5 of a string.
 * @param {string} str
 */
function encryptMd5 ( str ){
  return crypto.createHash('md5').update(str).digest('hex');
}

function getUserAgent(){
  return 'TemporaryUserAgent';
}

function getToken(){
  if(Cache['token']) {
    return Promise.resolve(Cache['token']);
  }
  return OpenSubtitles.api.LogIn(user.username, user.password, userDefaultLang , getUserAgent())
  .then(response => {
    Cache['token'] = response.token;
    return Cache['token'];
  });
}

/**
 * Search a movie by file path or text search
 * @param {string} options
 */
function search(options){
  return OpenSubtitles.search(options);
}

/**
 * Search subtitles for list of movies.
 * @param {Array} movies
 */
function SearchSubtitles(movies){
  return getToken().then(token => OpenSubtitles.api.SearchSubtitles(token, movies));
}

function DownloadSubtitles(subtitleIds){
  return getToken().then(token => OpenSubtitles.api.DownloadSubtitles(token , subtitleIds));
}
/**
 *
 * @param {Array} files array of full file path.
 */
function getHashs(files){
  let getHashPromises = files.map(absoluteFile => __getHash(absoluteFile));
  return Promise.all(getHashPromises);
}

function __getHash(absoluteFile){
  return OpenSubtitles.hash(absoluteFile).then(response =>{
    response.absoluteFile = absoluteFile;
    return response;
  }, reason => reason);
}

module.exports = {
  search,
  SearchSubtitles,
  DownloadSubtitles,
  getHash :OpenSubtitles.hash,
  getHashs
};
