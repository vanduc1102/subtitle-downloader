#!/usr/bin/env node

const program = require('commander')
const { download } = require('./src/download')

program
  .option('-l, --lang  <items>', 'Language code ISO639-2, E.g: eng,vie')
  .option('-u, --user [value]', 'OpenSubtitle username')
  .option('-p, --pass  [value]', 'OpenSubtitle password')
  .action(callDownload)
  .parse(process.argv)

async function callDownload (directory, options) {
  const langs = options.lang ? options.lang.split(',') : ['eng']
  const directories = [directory]
  await download(directories, langs)
}
