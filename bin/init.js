#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function copyIfNotExists(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
    console.log(`Created ${dest} from template.`);
  } else {
    console.log(`${dest} already exists.`);
  }
}

// Corrected projectRoot for `semantq_server`
// If init.js is in semantq_server/bin, then '..' takes it to semantq_server
// And '..' again would take it to the parent of semantq_server
// If projectRoot needs to be the semantq_server directory itself:
const projectRoot = path.resolve(__dirname, '..'); // This means semantq_server directory

const envExample = path.join(projectRoot, '.env.example');
const envFile = path.join(projectRoot, '.env');

// Assuming config and semantiq.config.example.js are inside semantq_server/config
const configExample = path.join(projectRoot, 'config', 'semantiq.config.example.js');
const configFile = path.join(projectRoot, 'semantiq.config.js'); // This will create it in semantq_server/semantiq.config.js

try {
  copyIfNotExists(envExample, envFile);
  copyIfNotExists(configExample, configFile);
  console.log('Initialization complete.');
} catch (err) {
  console.error('Error during initialization:', err);
  process.exit(1);
}