// semantq_server/lib/moduleLoader.js
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
 * Discovers all installed Semantq modules from 'packages/' and 'node_modules/'.
 * @returns {Promise<Array<{name: string, path: string}>>} An array of discovered modules.
 */
export async function discoverSemantqModules() {
  const packagesDir = path.join(projectRoot, 'packages');
  const nodeModulesDir = path.join(projectRoot, 'node_modules');

  const moduleSources = [];

  console.log(`${MODULE_ICON} ${purple('Scanning for modules in:')} ${gray(packagesDir)}`);
  
  // 1. Scan 'packages' directory
  if (await pathExists(packagesDir)) {
    const internalPackages = await fs.readdir(packagesDir);
    for (const pkgName of internalPackages) {
      const pkgPath = path.join(packagesDir, pkgName);
      const pkgPackageJsonPath = path.join(pkgPath, 'package.json');
      
      if (await pathExists(pkgPackageJsonPath)) {
        try {
          const pkgJson = JSON.parse(await fs.readFile(pkgPackageJsonPath, 'utf8'));
          if (pkgJson['semantq-module']) {
            moduleSources.push({ name: pkgJson.name || pkgName, path: pkgPath });
            console.log(`${SUCCESS_ICON} ${green('Discovered local module:')} ${pkgJson.name || pkgName}`);
          }
        } catch (jsonError) {
          console.error(`${ERROR_ICON} ${red('Error parsing package.json for')} ${pkgName} ${gray('at')} ${pkgPackageJsonPath}:`, jsonError.message);
        }
      } else {
        console.log(`${PACKAGE_ICON} ${gray('No package.json found for')} ${pkgName} ${gray('at')} ${pkgPackageJsonPath}`);
      }
    }
  } else {
    console.log(`${MODULE_ICON} ${gray('packages/ directory not found at')} ${gray(packagesDir)}`);
  }

  console.log(`${MODULE_ICON} ${purple('Scanning for modules in:')} ${gray(nodeModulesDir)}`);

  // 2. Scan 'node_modules' for Semantq modules
  if (await pathExists(nodeModulesDir)) {
    const npmPackages = await fs.readdir(nodeModulesDir);
    for (const pkgName of npmPackages) {
      // Handle scoped npm packages (e.g., @scope/my-module)
      if (pkgName.startsWith('@')) {
        const scopedPackagesPath = path.join(nodeModulesDir, pkgName);
        const scopedPackages = await fs.readdir(scopedPackagesPath);
        for (const scopedPkgName of scopedPackages) {
          const fullPkgName = `${pkgName}/${scopedPkgName}`;
          const pkgPath = path.join(scopedPackagesPath, scopedPkgName);
          const pkgPackageJsonPath = path.join(pkgPath, 'package.json');
          
          if (await pathExists(pkgPackageJsonPath)) {
            try {
              const pkgJson = JSON.parse(await fs.readFile(pkgPackageJsonPath, 'utf8'));
              if (pkgJson['semantq-module']) {
                moduleSources.push({ name: pkgJson.name, path: pkgPath });
                console.log(`${SUCCESS_ICON} ${green('Discovered npm module:')} ${pkgJson.name}`);
              }
            } catch (jsonError) {
              console.error(`${ERROR_ICON} ${red('Error parsing package.json for')} ${fullPkgName} ${gray('at')} ${pkgPackageJsonPath}:`, jsonError.message);
            }
          } else {
            console.log(`${PACKAGE_ICON} ${gray('No package.json found for')} ${fullPkgName} ${gray('at')} ${pkgPackageJsonPath}`);
          }
        }
      } else {
        const pkgPath = path.join(nodeModulesDir, pkgName);
        const pkgPackageJsonPath = path.join(pkgPath, 'package.json');
        
        if (await pathExists(pkgPackageJsonPath)) {
          try {
            const pkgJson = JSON.parse(await fs.readFile(pkgPackageJsonPath, 'utf8'));
            if (pkgJson['semantq-module']) {
              moduleSources.push({ name: pkgJson.name, path: pkgPath });
              console.log(`${SUCCESS_ICON} ${green('Discovered npm module:')} ${pkgJson.name}`);
            }
          } catch (jsonError) {
            console.error(`${ERROR_ICON} ${red('Error parsing package.json for')} ${pkgName} ${gray('at')} ${pkgPackageJsonPath}:`, jsonError.message);
          }
        } else {
          console.log(`${PACKAGE_ICON} ${gray('No package.json found for')} ${pkgName} ${gray('at')} ${pkgPackageJsonPath}`);
        }
      }
    }
  } else {
    console.log(`${MODULE_ICON} ${gray('node_modules/ directory not found at')} ${gray(nodeModulesDir)}`);
  }

  return moduleSources;
}