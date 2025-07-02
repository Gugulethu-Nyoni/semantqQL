// semantq_server/bin/migrate.js

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { discoverSemantqModules } from '../lib/moduleLoader.js';
import config from '../config/semantiq.config.js';
import { default as getDbAdapter } from '../models/adapters/index.js';
import { pathToFileURL } from 'url'; // Ensure pathToFileURL is imported for dynamic imports

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

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

async function runMigrations() {
  console.log('🚀 Starting database migrations...');

  const dbAdapterName = config.database.adapter;
  if (!dbAdapterName) {
    console.error('❌ Error: No database adapter configured in config/semantiq.config.js');
    process.exit(1);
  }

  let db;
  try {
    db = await getDbAdapter(dbAdapterName); // Await the getDbAdapter call
    if (!db) {
      throw new Error(`Could not load database adapter for: ${dbAdapterName}`);
    }
    console.log(`✅ Database adapter '${dbAdapterName}' loaded.`);
  } catch (err) {
    console.error(`❌ Error loading database adapter '${dbAdapterName}':`, err);
    process.exit(1);
  }

  const allMigrationFiles = [];

  // 1. Collect migrations from the main server's models/migrations
  const coreMigrationsPath = path.join(projectRoot, 'models', 'migrations', dbAdapterName);
  if (await pathExists(coreMigrationsPath)) {
    const files = await fs.readdir(coreMigrationsPath);
    for (const file of files) {
      if (file.endsWith('.js') || file.endsWith('.sql')) {
        allMigrationFiles.push({
          name: file,
          path: path.join(coreMigrationsPath, file),
          source: 'core'
        });
      }
    }
  } else {
    console.warn(`⚠️ No core migrations found for adapter '${dbAdapterName}' at ${coreMigrationsPath}.`);
  }

  // 2. Collect migrations from installed Semantq modules
  const modules = await discoverSemantqModules();
  for (const module of modules) {
    // Corrected path to include 'models' subdirectory for module migrations
    const moduleMigrationsPath = path.join(module.path, 'models', 'migrations', dbAdapterName);
    if (await pathExists(moduleMigrationsPath)) {
      const files = await fs.readdir(moduleMigrationsPath);
      for (const file of files) {
        if (file.endsWith('.js') || file.endsWith('.sql')) {
          allMigrationFiles.push({
            name: file,
            path: path.join(moduleMigrationsPath, file),
            source: `module:${module.name}`
          });
        }
      }
    } else {
      console.warn(`⚠️ No migrations found for module '${module.name}' (adapter: ${dbAdapterName}) at ${moduleMigrationsPath}.`);
    }
  }

  // Sort migrations by name (assuming numeric prefixes like 001_...)
  allMigrationFiles.sort((a, b) => a.name.localeCompare(b.name));

  if (allMigrationFiles.length === 0) {
    console.log('ℹ️ No migration files found to run.');
    return;
  }

  console.log(`\nFound ${allMigrationFiles.length} migration files for '${dbAdapterName}':`);
  allMigrationFiles.forEach(m => console.log(`  - ${m.name} (${m.source})`));
  console.log('\nRunning migrations...');

  for (const migration of allMigrationFiles) {
    console.log(`  ▶️ Running migration: ${migration.name} (${migration.source})`);
    try {
      if (migration.name.endsWith('.js')) {
        const migrationModule = await import(pathToFileURL(migration.path).href);
        if (migrationModule.up && typeof migrationModule.up === 'function') {
          await migrationModule.up(db);
          console.log(`  ✅ Successfully ran JS migration: ${migration.name}`);
        } else {
          console.warn(`  ⚠️ JS migration '${migration.name}' does not export an 'up' function. Skipping.`);
        }
      } else if (migration.name.endsWith('.sql')) {
        const sql = await fs.readFile(migration.path, 'utf8');
        await db.query(sql); // Assuming your db adapter has a generic query method that can execute raw SQL
        console.log(`  ✅ Successfully ran SQL migration: ${migration.name}`);
      }
    } catch (err) {
      console.error(`  ❌ Failed to run migration: ${migration.name}`);
      console.error(err);
      console.error('Migration failed. Aborting further migrations.');
      process.exit(1);
    }
  }

  console.log('\n🎉 All migrations completed successfully!');
  if (db && typeof db.end === 'function') {
      await db.end();
  }
}

runMigrations();
