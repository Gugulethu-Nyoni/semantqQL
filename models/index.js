import config from '../config/semantiq.config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect selected adapter
const adapter = config.database.adapter;
if (!adapter) {
  throw new Error('No database adapter configured in semantiq.config.js');
}

// Path to the adapter-specific models directory
const modelsDir = path.join(__dirname, adapter);

// Dynamically load all model files in the adapter directory
const models = {};

fs.readdirSync(modelsDir).forEach((file) => {
  if (file.endsWith('.js')) {
    const modelName = path.basename(file, '.js');
    const modelModule = await import(path.join(modelsDir, file));
    models[modelName] = modelModule.default || modelModule;
  }
});

export default models;
