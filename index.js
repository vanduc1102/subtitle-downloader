#!/usr/bin/env node

'use strict'

const program = require('commander')
const pkg = require('./package.json')

program
  .version(pkg.version, '-v, --version')
  .command('download <directory>', 'Download subtitles for movies.')
  .command('upload <directory>', 'Upload subtitles to OpenSubtitle.')
  .parse(process.argv)
