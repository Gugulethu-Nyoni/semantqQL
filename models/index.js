// models/index.js
import config from '../semantq.config.js'; // This direct import of config is problematic for config_loader
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import chalk from 'chalk';

// Consistent with other files
const green = chalk.hex('#6ef0b5');
const yellow = chalk.hex('#f0e66e');
const errorRed = chalk.hex('#ff4d4d');
const gray = chalk.hex('#aaaaaa');
const purple = chalk.hex('#b56ef0');

// Icons
const SUCCESS_ICON = green('✓');
const ERROR_ICON = errorRed('✗');
const MODEL_ICON = purple('🗄️');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect selected adapter
const adapter = config.database.adapter; // Problematic if config not loaded by config_loader
if (!adapter) {
  console.error(`${ERROR_ICON} ${errorRed('No database adapter configured in semantiq.config.js')}`);
  throw new Error('No database adapter configured in semantiq.config.js');
}

// Path to the adapter-specific models directory
const modelsDir = path.join(__dirname, adapter);

// Dynamically load all model files in the adapter directory
const models = {};

console.log(`${MODEL_ICON} ${purple(`Loading models for adapter:`)} ${gray(adapter)}`);

const files = fs.readdirSync(modelsDir);
for (const file of files) {
  if (file.endsWith('.js')) {
    const modelName = path.basename(file, '.js');
    const modulePath = pathToFileURL(path.join(modelsDir, file)).href;
    const modelModule = await import(modulePath);
    models[modelName] = modelModule.default || modelModule;
    console.log(`${SUCCESS_ICON} ${green(`Loaded model:`)} ${modelName} ${gray(`from`)} ${file}`);
  }
}

export default models;