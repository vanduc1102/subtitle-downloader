#!/usr/bin/env node

import { Command } from 'commander';

import dotenv from 'dotenv';

import pkg from './package.json' assert { type: 'json' };

dotenv.config();

const program = new Command();

program
  .version(pkg.version, '-v, --version')
  .command('download <directory>', 'Download subtitles for movies.')
  .command('upload <directory>', 'Upload subtitles to OpenSubtitle.')
  .parse(process.argv);
