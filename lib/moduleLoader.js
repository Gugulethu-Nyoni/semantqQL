//lib/moduleLoader.js

// semantq_server/lib/moduleLoader.js
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

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

  // 1. Scan 'packages' directory
  if (await pathExists(packagesDir)) {
    const internalPackages = await fs.readdir(packagesDir);
    for (const pkgName of internalPackages) {
      const pkgPath = path.join(packagesDir, pkgName);
      const pkgPackageJsonPath = path.join(pkgPath, 'package.json');
      if (await pathExists(pkgPackageJsonPath)) {
        const pkgJson = JSON.parse(await fs.readFile(pkgPackageJsonPath, 'utf8'));
        if (pkgJson['semantiq-module']) {
          moduleSources.push({ name: pkgJson.name || pkgName, path: pkgPath }); // Use pkgJson.name if available
        }
      }
    }
  }

  // 2. Scan 'node_modules' for Semantq modules
  if (await pathExists(nodeModulesDir)) {
    const npmPackages = await fs.readdir(nodeModulesDir);
    for (const pkgName of npmPackages) {
      // Handle scoped npm packages (e.g., @scope/my-module)
      if (pkgName.startsWith('@')) {
        const scopedPackagesPath = path.join(nodeModulesDir, pkgName);
        const scopedPackages = await fs.readdir(scopedPackagesPath);
        for (const scopedPkgName of scopedPackages) {
          const pkgPath = path.join(scopedPackagesPath, scopedPkgName);
          const pkgPackageJsonPath = path.join(pkgPath, 'package.json');
          if (await pathExists(pkgPackageJsonPath)) {
            const pkgJson = JSON.parse(await fs.readFile(pkgPackageJsonPath, 'utf8'));
            if (pkgJson['semantiq-module']) {
              moduleSources.push({ name: pkgJson.name, path: pkgPath });
            }
          }
        }
      } else {
        const pkgPath = path.join(nodeModulesDir, pkgName);
        const pkgPackageJsonPath = path.join(pkgPath, 'package.json');
        if (await pathExists(pkgPackageJsonPath)) {
          const pkgJson = JSON.parse(await fs.readFile(pkgPackageJsonPath, 'utf8'));
          if (pkgJson['semantiq-module']) {
            moduleSources.push({ name: pkgJson.name, path: pkgPath });
          }
        }
      }
    }
  }
  return moduleSources;
}
