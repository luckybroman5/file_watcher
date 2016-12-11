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
let isChanging = false;
const changeDelay = 500;
let changeQueue = [];

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

function createQueueObject(file, script) {
  return {
    script,
    time: Date.now(),
    file,
  };
}

function addToQueue(queueObject) {
  changeQueue.push(queueObject);
}

/**
 * Runs the script
 * @param {STRING} the sting with all args 
 * */
function runScript(scr) {
  if (!scr || typeof scr !== 'string') throw new Error('Invalid Script!');
  console.log(`Executing Script: ${script} \n`);
  exec(scr, scriptCallback);
}

function changeHandler(eventType, filename) {
  console.log(`** DETECTED ${eventType.toUpperCase()}! **\n`);

  addToQueue(createQueueObject(filename, script));
}

function processQueue() {
  // Get the latest Change
  const uniqueUpdates = changeQueue.map((queueObject) => {
    if (!queueObject || !queueObject.file || !queueObject.time) return;
    const matches = changeQueue.map((qo) => {
      if (!qo || !qo.file || !qo.time) return null;
      if (queueObject.file === qo.file) return qo;
      return null;
    }).filter(q => q);

    let soonestTime = 0;

    matches.forEach((match) => {
      if (match && match.time && match.time > soonestTime) soonestTime = match.time;
      else match.overriden = true;
    });

    return matches.find((possible) => {
      if (possible && possible.time && soonestTime && possible.time === soonestTime) return possible;
      return null;
    });
  }).filter(u => u);

  uniqueUpdates.forEach((uniqueUpdate) => {
    if (!uniqueUpdate || !uniqueUpdate.script) return;
    runScript(uniqueUpdate.script);
    uniqueUpdate.ran = true;
  });

  cleanupQueue();
}

function cleanupQueue() {
  changeQueue = changeQueue.map((qo) => {
    if (qo.overriden || qo.ran) return null;
    return qo;
  }).filter(q => q);
}

function runQueue() {
  setTimeout(() => {
    processQueue();
    runQueue();
  }, changeDelay);
}

if (!script) die('Please Specify a script!', true);
if (!file) die('Please Specify a file!', true);

const Main = () => {
  console.log(`Watching file: "${file}"`);
  console.log(`Will run script: "${script}" on change`);
  fs.watch(file, null, changeHandler);
  runQueue();
};

Main();

module.exports = Main;