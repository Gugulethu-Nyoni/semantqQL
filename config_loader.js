// semantq_server/config_loader.js

import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs/promises';

// Get the directory of this file (i.e., semantq_server/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to config file in the same directory
const configPath = path.join(__dirname, 'server.config.js');
const configUrl = pathToFileURL(configPath).href;

/**
 * Loads the Semantq configuration from the same directory.
 * @returns {Promise<object>} The loaded configuration object.
 * @throws {Error} If the config file is missing or unreadable.
 */
async function loadSemantqConfig() {
  try {
    await fs.access(configPath, fs.constants.R_OK);
    console.log(`[Config Loader] Using config at: ${configPath}`);
    const { default: config } = await import(configUrl);
    return config;
  } catch (err) {
    const errorMessage = `[Config Loader] Failed to load config from: ${configPath} – ${err.message}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
}

// Cache the config after first load
let cachedConfig = null;

export default (async () => {
  if (cachedConfig) return cachedConfig;
  cachedConfig = await loadSemantqConfig();
  return cachedConfig;
})();
