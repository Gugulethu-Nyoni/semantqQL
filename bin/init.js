#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// Console styling
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

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const semantqServerDir = path.resolve(__dirname, '..');
const projectRoot = path.resolve(semantqServerDir, '..');

// Utility: copy only if destination does not exist
function copyIfNotExists(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`${WARNING_ICON} ${yellow('Source not found:')} ${gray(src)}`);
    return;
  }

  if (!fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
    console.log(`${SUCCESS_ICON} ${FILE_ICON} ${green('Created:')} ${gray(dest)}`);
  } else {
    console.log(`${WARNING_ICON} ${gray('Already exists:')} ${gray(dest)}`);
  }
}

// Begin init
console.log(`${CONFIG_ICON} ${purple('Initializing configuration files...')}`);

try {
  // Copy .env
  const envExample = path.join(semantqServerDir, '.env.example');
  const envFile = path.join(projectRoot, '.env');
  console.log(`${ENV_ICON} ${blue('Setting up environment:')}`);
  copyIfNotExists(envExample, envFile);

  // Copy config
  const configExample = path.join(semantqServerDir, 'config', 'semantq.config.example.js');
  const configFile = path.join(semantqServerDir, 'semantq.config.js');
  console.log(`${CONFIG_ICON} ${blue('Setting up configuration:')}`);
  copyIfNotExists(configExample, configFile);

  console.log(`${SUCCESS_ICON} ${green('Initialization complete!')}`);
} catch (err) {
  console.error(`${ERROR_ICON} ${errorRed('Initialization failed:')}`, err);
  process.exit(1);
}
