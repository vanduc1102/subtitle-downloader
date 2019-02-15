const fs = require('fs');
const fsAsync = require('fs').promises;
const path = require('path');
const http = require('http');
const zlib = require('zlib');

/**
 * List all files in for a given folderPath.
 * @param {string} folderPath
 */
async function walk(folderPath, extensionRegex) {
  let results = [];
  const files = fsAsync.readdir(folderPath);
  if (err) {
    return [];
  }
  files.forEach(async (file) => {
    const filePath = path.resolve(folderPath, file);
    const fileStat = await fsAsync.stat(filePath);
    if (fileStat && fileStat.isDirectory()) {
      return walk(filePath, extensionRegex);
    }
    if (isMovie(file)) {
      results.push({
        file,
        path: filePath
      });
    }
  });
};

async function isFile(path) {
  const stat = await fs.lstat('test.txt');
  return stat.isFile();
}

function downloadFile() {
  let file = fs.createWriteStream("file.jpg");
  let request = http.get("http://i3.ytimg.com/vi/J---aiyznGQ/mqdefault.jpg", function (response) {
    response.pipe(file);
  });
}

function writeString(filePath, strContent) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path.resolve(filePath), strContent, function (err) {
      if (err) {
        console.log('writeString : ', err);
        return reject(err);
      }
      resolve(filePath);
    });
  });
}

function unZippedBase64(zippedBase64, filePath) {
  return new Promise((response, reject) => {
    let bufZipped = new Buffer(zippedBase64, 'base64');
    zlib.gunzip(bufZipped, function (err, buf) {
      if (err) {
        return reject(err);
      }
      filePath = __createUniquePath(filePath);
      let stream = fs.createWriteStream(filePath);
      stream.write(buf);
      stream.end();
      stream.on("finish", function () {
        console.log('saved : ', filePath);
        return response(filePath);
      });
      stream.on('error', (error) => {
        return reject(error);
      });
    });
  });
}

function __createUniquePath(absolutePath) {
  if (!fs.existsSync(absolutePath)) {
    return absolutePath;
  }
  let extension = absolutePath.substr(absolutePath.lastIndexOf('.'));
  absolutePath = absolutePath.replace(extension, Date.now() % 10 + extension);
  return __createUniquePath(absolutePath);
}

function checkValidExtensions(fileName, extensionRegex) {
  return extensionRegex.test(fileName);
}

module.exports = {
  walk,
  unZippedBase64,
  writeString
}
