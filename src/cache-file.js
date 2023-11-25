import os from 'os';
import path from 'path';
import fileHelper from './file-helper.js';

const CACHE_FILE_PREFIX = 'subtitle-downloader';

/**
 * Store value in cache file.
 * @param {String} key Key of cache
 * @param {Object} value Value to cache
 */
export async function put(key, value) {
  return fileHelper.writeString(
    path.resolve(os.tmpdir(), `${CACHE_FILE_PREFIX}-${key}`),
    JSON.stringify({ value }),
  );
}

/**
 *
 * @param {String} key Key of cached
 */
export async function get(key) {
  try {
    const data = await fileHelper.readString(
      path.resolve(os.tmpdir(), `${CACHE_FILE_PREFIX}-${key}`),
    );
    return data ? JSON.parse(data).value : null;
  } catch (error) {
    return null;
  }
}
