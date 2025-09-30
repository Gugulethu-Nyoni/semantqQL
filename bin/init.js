#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import crypto from 'crypto';

// Get command line arguments, excluding 'node' and the script path
const args = process.argv.slice(2);
const forceKey = args.includes('--force-key'); // Check for the flag

// Console styling (omitted for brevity, assume they are still here)
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

// Utility: Generate a secure application key
function generateAppKey() {
  return crypto.randomBytes(32).toString('hex');
}

// Utility: Reads .env content, generates key, and injects/replaces the APP_KEY line
function injectOrReplaceAppKey(envFilePath, force = false) {
  try {
    let content = fs.readFileSync(envFilePath, 'utf8');
    const keyRegex = /^(APP_KEY\s*=\s*).*$/m;
    const keyExists = keyRegex.test(content);
    const newAppKey = generateAppKey();

    if (!keyExists) {
      // 1. If key is missing, append it
      content += `\nAPP_KEY=${newAppKey}\n`;
      console.log(`${SUCCESS_ICON} ${ENV_ICON} ${green('Generated and appended APP_KEY.')}`);
    } else if (force) {
      // 2. If --force-key is used, replace the existing value
      content = content.replace(keyRegex, `$1${newAppKey}`);
      console.log(`${SUCCESS_ICON} ${ENV_ICON} ${green('FORCE REGENERATED APP_KEY.')}`);
    } else {
      // 3. Key exists, no force flag
      const existingKey = content.match(keyRegex)?.[0].split('=')[1].trim();
      if (!existingKey) {
         // Key is present but empty (APP_KEY=) -> fill it
         content = content.replace(keyRegex, `$1${newAppKey}`);
         console.log(`${SUCCESS_ICON} ${ENV_ICON} ${green('Set initial APP_KEY.')}`);
      } else {
         console.log(`${WARNING_ICON} ${gray('APP_KEY already set.')} Use ${yellow('--force-key')} to regenerate.`);
         return; // Do nothing
      }
    }

    // Write the modified content back
    fs.writeFileSync(envFilePath, content);

  } catch (err) {
    console.error(`${ERROR_ICON} ${errorRed('Failed to read/write .env for APP_KEY:')}`, err);
    throw err;
  }
}

// Utility: Copy only if destination does not exist
function copyIfNotExists(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`${WARNING_ICON} ${yellow('Source not found:')} ${gray(src)}`);
    return false;
  }

  if (!fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
    console.log(`${SUCCESS_ICON} ${FILE_ICON} ${green('Created:')} ${gray(dest)}`);
    return true;
  } else {
    console.log(`${WARNING_ICON} ${gray('Already exists:')} ${gray(dest)}`);
    return false;
  }
}

// Begin init
console.log(`${CONFIG_ICON} ${purple('Initializing configuration files...')}`);

try {
  // --- .env SETUP ---
  const envExample = path.join(semantqServerDir, '.env.example');
  const envFile = path.join(semantqServerDir, '.env');

  console.log(`${ENV_ICON} ${blue('Setting up environment:')}`);
  const envCreated = copyIfNotExists(envExample, envFile);

  // Always attempt to inject/replace the key if the file exists
  if (fs.existsSync(envFile)) {
    // Inject the key on initial creation, or when forced
    const shouldForce = forceKey || envCreated; 
    injectOrReplaceAppKey(envFile, shouldForce);
  }

  // --- config SETUP ---
  const configExample = path.join(semantqServerDir, 'config', 'server.config.example.js');
  const configFile = path.join(semantqServerDir, 'server.config.js');
  console.log(`${CONFIG_ICON} ${blue('Setting up configuration:')}`);
  copyIfNotExists(configExample, configFile);

  console.log(`${SUCCESS_ICON} ${green('Initialization complete!')}`);
} catch (err) {
  console.error(`${ERROR_ICON} ${errorRed('Initialization failed:')}`, err);
  process.exit(1);
}