// semantqQL/config_loader.js

import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs/promises';

// Get the directory of this file (i.e., semantq_server/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to config file in the same directory
const configPath = path.join(__dirname, 'server.config.js');
const configUrl = pathToFileURL(configPath).href;

// Cache with file stats for smart invalidation
let cachedConfig = null;
let configStats = null;

/**
 * Loads the Semantq configuration from the same directory.
 * @returns {Promise<object>} The loaded configuration object.
 * @throws {Error} If the config file is missing or unreadable.
 */
async function loadServerConfig() {
  try {
    await fs.access(configPath, fs.constants.R_OK);
    console.log(`[Config Loader] Using config at: ${configPath}`);
    
    // ✅ FIX: Properly handle the default export
    const importedModule = await import(configUrl);
    const config = importedModule.default || importedModule;
    
    console.log('[Config Loader] Config loaded successfully:', {
      hasDatabase: !!config.database,
      adapter: config.database?.adapter,
      host: config.database?.config?.host
    });
    
    return config;
  } catch (err) {
    const errorMessage = `[Config Loader] Failed to load config from: ${configPath} – ${err.message}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Check if config file has been modified since last load
 */
async function hasConfigChanged() {
  try {
    const stats = await fs.stat(configPath);
    
    if (!configStats) {
      configStats = stats;
      return true; // First load
    }
    
    // Check if mtime (modification time) has changed
    const hasChanged = stats.mtime.getTime() !== configStats.mtime.getTime();
    if (hasChanged) {
      configStats = stats;
    }
    return hasChanged;
  } catch (err) {
    // If we can't stat the file, assume it changed
    return true;
  }
}

export default async () => {
  const configChanged = await hasConfigChanged();
  
  if (cachedConfig && !configChanged) {
    return cachedConfig;
  }
  
  // Reload config if it changed or doesn't exist
  cachedConfig = await loadServerConfig();
  return cachedConfig;
};