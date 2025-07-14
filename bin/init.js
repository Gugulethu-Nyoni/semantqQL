#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// Consistent with main CLI styling
const purple = chalk.hex('#b56ef0');
const purpleBright = chalk.hex('#d8a1ff');
const blue = chalk.hex('#6ec7ff');
const green = chalk.hex('#6ef0b5');
const yellow = chalk.hex('#f0e66e');
const errorRed = chalk.hex('#ff4d4d');
const gray = chalk.hex('#aaaaaa');

// Icons
const SUCCESS_ICON = green('✓');
const WARNING_ICON = yellow('⚠');
const ERROR_ICON = errorRed('✗');
const FILE_ICON = blue('📄');
const CONFIG_ICON = purple('⚙️');
const ENV_ICON = purpleBright('🔑');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the 'semantq_server' directory itself (parent of 'bin')
const semantqServerDir = path.resolve(__dirname, '..');

// Path to the overall project root (parent of 'semantq_server')
const containingProjectRoot = path.resolve(__dirname, '..', '..');

function copyIfNotExists(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
    console.log(`${SUCCESS_ICON} ${FILE_ICON} ${green('Created:')} ${gray(dest)}`);
  } else {
    console.log(`${WARNING_ICON} ${gray('File exists:')} ${gray(dest)}`);
  }
}

// .env file setup
//const envExample = path.join(semantqServerDir, '.env.example');
//const envFile = path.join(containingProjectRoot, '.env');

// .env file setup
const envExample = path.join(semantqServerDir, '.env.example');
const envFile = path.join(semantqServerDir, '.env');


// Config file setup
//const configExample = path.join(semantqServerDir, 'config', 'semantq.config.example.js');
//const configFile = path.join(semantqServerDir, 'semantq.config.js');

console.log(`${CONFIG_ICON} ${purple('Initializing configuration files...')}`);

try {
  // Copy environment files
  console.log(`${ENV_ICON} ${blue('Setting up environment:')}`);
  copyIfNotExists(envExample, envFile);
  
  // Copy config files
  //console.log(`${CONFIG_ICON} ${blue('Setting up configuration:')}`);
  //copyIfNotExists(configExample, configFile);
  
  console.log(`${SUCCESS_ICON} ${green('Initialization complete!')}`);
} catch (err) {
  console.error(`${ERROR_ICON} ${errorRed('Initialization failed:')}`, err);
  process.exit(1);
}