#!/usr/bin/env node

'use strict';

const program = require('commander');
const exec = require('child_process').exec;
const pkg = require('./package.json');
const chalk = require("chalk");

program
  .version(pkg.version)
  .command('list [directory]')
  .description('List files and folders')
  .option('-a, --all', 'List all files and folders')
  .option('-l, --long', '')
  .action(listFunction);

program.parse(process.argv);



function listFunction(directory, options) {
  const cmd = 'ls';
  let params = [];

  if (options.all) params.push("a");
  if (options.long) params.push("l");
  let parameterizedCommand = params.length ?
    cmd + ' -' + params.join('') :
    cmd;
  if (directory) parameterizedCommand += ' ' + directory;

  let output = (error, stdout, stderr) => {
    if (error) console.log(chalk.red.bold.underline("exec error:") + error);
    if (stdout) console.log(chalk.green.bold.underline("Result:") + stdout);
    if (stderr) console.log(chalk.red("Error: ") + stderr);
  };

  exec(parameterizedCommand, output);
}
