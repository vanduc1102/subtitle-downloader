#!/usr/bin/env node

import { Command } from 'commander';

const program = new Command();

program
  .option('-l, --lang  <items>', 'Language code ISO639-2, E.g: eng,vie')
  .option('-u, --user [value]', 'OpenSubtitle username')
  .option('-p, --pass  [value]', 'OpenSubtitle password')
  //  .action(callDownload)
  .parse(process.argv);
