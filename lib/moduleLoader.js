// semantqQL/lib/moduleLoader.js
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import chalk from 'chalk';

// Consistent with other files
const green = chalk.hex('#6ef0b5');
const red = chalk.hex('#ff4d4d');
const yellow = chalk.hex('#f0e66e');
const gray = chalk.hex('#aaaaaa');
const blue = chalk.hex('#6ec7ff');
const purple = chalk.hex('#b56ef0');

// Icons
const SUCCESS_ICON = green('✓');
const ERROR_ICON = red('✗');
const MODULE_ICON = purple('🧩');
const PACKAGE_ICON = blue('📦');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..'); // Go up one level from 'lib' to project root

/**
 * Helper to check if a path exists (using fs.promises)
 * @param {string} p - The path to check.
 * @returns {Promise<boolean>}
 */
async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Recursively scans a directory for package.json files with 'semantq-module': true
 * Handles both regular and scoped packages
 */
async function scanDirectoryForModules(dir, moduleSources, sourceType = 'local') {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const fullPath = path.join(dir, entry.name);
        
        // Check if this is a scoped package directory (starts with @)
        if (entry.name.startsWith('@')) {
          // This is a scoped namespace directory (e.g., @semantq)
          // Recursively scan inside it for actual packages
          await scanDirectoryForModules(fullPath, moduleSources, sourceType);
        } else {
          // Regular package directory - check for package.json
          const pkgJsonPath = path.join(fullPath, 'package.json');
          
          if (await pathExists(pkgJsonPath)) {
            try {
              const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, 'utf8'));
              if (pkgJson['semantq-module']) {
                moduleSources.push({ 
                  name: pkgJson.name, 
                  path: fullPath 
                });
                
                const sourceLabel = sourceType === 'local' ? 'local module' : 'npm module';
                console.log(`${SUCCESS_ICON} ${green(`Discovered ${sourceLabel}:`)} ${pkgJson.name}`);
              }
            } catch (jsonError) {
              console.error(`${ERROR_ICON} ${red('Error parsing package.json at')} ${pkgJsonPath}:`, jsonError.message);
            }
          } else {
            // No package.json found at this level
            // Could be a nested directory structure, recursively scan it
            await scanDirectoryForModules(fullPath, moduleSources, sourceType);
          }
        }
      }
    }
  } catch (error) {
    console.error(`${ERROR_ICON} ${red('Error scanning directory')} ${dir}:`, error.message);
  }
}

/**
 * Discovers all installed Semantq modules from 'packages/' and 'node_modules/'.
 * @returns {Promise<Array<{name: string, path: string}>>} An array of discovered modules.
 */
export async function discoverSemantqModules() {
  const packagesDir = path.join(projectRoot, 'packages');
  const nodeModulesDir = path.join(projectRoot, 'node_modules');

  const moduleSources = [];

  console.log(`${MODULE_ICON} ${purple('Scanning for modules in:')} ${gray(packagesDir)}`);
  
  // 1. Scan 'packages' directory (handles both regular and scoped packages)
  if (await pathExists(packagesDir)) {
    await scanDirectoryForModules(packagesDir, moduleSources, 'local');
  } else {
    console.log(`${MODULE_ICON} ${gray('packages/ directory not found at')} ${gray(packagesDir)}`);
  }

  console.log(`${MODULE_ICON} ${purple('Scanning for modules in:')} ${gray(nodeModulesDir)}`);

  // 2. Scan 'node_modules' for Semantq modules
  if (await pathExists(nodeModulesDir)) {
    await scanDirectoryForModules(nodeModulesDir, moduleSources, 'npm');
  } else {
    console.log(`${MODULE_ICON} ${gray('node_modules/ directory not found at')} ${gray(nodeModulesDir)}`);
  }

  console.log(`${MODULE_ICON} ${purple(`Found ${moduleSources.length} Semantq module(s)`)}`);
  
  return moduleSources;
}