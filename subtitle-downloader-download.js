#!/usr/bin/env node

import { Command } from 'commander';
import { download } from './src/download.js';

const program = new Command();
program
  .option('-l, --lang  <items>', 'Language code ISO639-2, E.g: eng,vie')
  .option('-u, --user [value]', 'OpenSubtitle username')
  .option('-p, --pass  [value]', 'OpenSubtitle password')
  .action(callDownload)
  .parse(process.argv);

program.on('--help', function () {
  console.log('');
  console.log('Examples:');
  console.log(
    '  $ subtitle-downloader download ~/Downloads -l eng,vie -u user -p password',
  );
  console.log('  $ subtitle-downloader download ~/Downloads -l eng,vie');
  console.log('  $ subtitle-downloader download -l eng,vie ~/a ~/b ~/c ');
});

async function callDownload(directory, options) {
  try {
    const langs = options.lang ? options.lang.split(',') : ['eng'];
    const directories = program.args;
    const username = options.user || process.env.OS_USERNAME;
    const password = options.pass || process.env.OS_PASSWORD;
    await download(directories, langs, username, password);
  } catch (ex) {
    console.error(ex);
    console.log(
      'Something wrong, please try: \n$ subtitle-downloader download --help',
    );
  }
}
