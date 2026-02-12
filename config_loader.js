// semantqQL/config_loader.js
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs/promises';

// Get the directory of this file
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
 */
async function loadServerConfig() {
  try {
    await fs.access(configPath, fs.constants.R_OK);
    
    // ✅ Use a timestamp to bypass the ESM import cache if the file has changed
    const timestamp = Date.now();
    const freshConfigUrl = `${configUrl}?t=${timestamp}`;
    
    const importedModule = await import(freshConfigUrl);
    
    // ✅ Extract the default export correctly
    const rawConfig = importedModule.default || importedModule;
    
    // ✅ SURGICAL FIX: Transform config for adapter compatibility
    // This preserves your original config structure while making it work with the adapter system
    const config = { ...rawConfig };
    
    if (rawConfig.database && rawConfig.database.connections) {
      // Get the default connection name (defaults to 'postgres')
      const defaultDb = rawConfig.database.default || 'postgres';
      
      // Get the default connection config
      const defaultConnection = rawConfig.database.connections[defaultDb];
      
      if (defaultConnection) {
        // Create a flattened database config that the adapter expects
        config.database = {
          // Use the adapter from the connection, or fallback to 'postgresql'
          adapter: defaultConnection.adapter || 'postgresql',
          // Use the config from the connection
          config: defaultConnection.config,
          // Preserve the original structure if other parts of the app need it
          _original: rawConfig.database
        };
      }
    }
    
    // ✅ MOVED LOGGING AFTER SURGICAL FIX
    console.log('[Config Loader] Config loaded successfully:', {
      hasDatabase: !!config.database,
      adapter: config.database?.adapter,      // Now shows 'postgresql'
      host: config.database?.config?.host,    // Now shows the host
      hasLogistics: !!config.logistics
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
    
    const hasChanged = stats.mtime.getTime() !== configStats.mtime.getTime();
    if (hasChanged) {
      configStats = stats;
    }
    return hasChanged;
  } catch (err) {
    return true; // Assume changed on error
  }
}

/**
 * Main default export for server.js
 */
export default async () => {
  const configChanged = await hasConfigChanged();
  
  if (cachedConfig && !configChanged) {
    return cachedConfig;
  }
  
  // Reload config if it changed or doesn't exist
  cachedConfig = await loadServerConfig();
  return cachedConfig;
};