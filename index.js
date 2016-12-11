'use strict';

// Deps
const fs = require('fs');
const args = require('args');
const exec = require('child_process').exec;

// Args Setup
args
  .option('file', 'the file to watch')
  .option('script', 'the script to run on file change')
  .option('sustain', 'Whether or not to keep the process running and waiting');
  

const flags = args.parse(process.argv);

// Main

const file = flags.file || null;
const script = flags.script || null;

// Global functions 

function die(message, displayHelp) {
  if (displayHelp) args.showHelp();
  if (message) console.log(message);
  process.end();
}

/**
 * the callback handler for the exec functions
 */
function scriptCallback(err, stdout, stderr) {
  if (err) {
    console.log('Child PS ERROR:');
    console.log('-------------------------');
    console.error(err);
    console.log('-------------------------');
    return;
  }
  if (stderr) console.log(`stderr: ${stderr}`);
  if (stdout) {
    console.log(`Executed Command: ${script}`);
    //console.log('-------------------------');
    console.error(stdout);
    //console.log('-------------------------');
    return;
  }
  console.log(`stdout: ${stdout}`);
}

/**
 * Runs the script
 * @param {STRING} the sting with all args 
 * */
function runScript(scr) {
  if (!scr || typeof scr !== 'string') throw new Error('Invalid Script!');

  exec(scr, scriptCallback);
}

function changeHandler(eventType, filename) {
  console.log(`\n ** DETECTED ${eventType.toUpperCase()}! **\n`);
  runScript(script);
}

if (!script) die('Please Specify a script!', true);
if (!file) die('Please Specify a file!', true);

const Main = () => {
  console.log(`Watching file: "${file}"`);
  console.log(`Will run script: "${script}" on change`);
  fs.watch(file, null, changeHandler);
};

Main();