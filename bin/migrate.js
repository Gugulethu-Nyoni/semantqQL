// semantq_server/bin/migrate.js

import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { discoverSemantqModules } from '../lib/moduleLoader.js';
// import config from '../config/semantq.config.js'; // REMOVED - will be loaded dynamically
import { default as getDbAdapter } from '../models/adapters/index.js';
// pathToFileURL is already imported above, no need to re-import

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// projectRoot calculation needs to be aware of __dirname which is /semantq_server/bin
// So '../..' from __dirname is the directory containing semantq_server
// This 'projectRoot' is the place where semantq_server is installed (e.g., myapp/)
const projectParentDir = path.resolve(__dirname, '..', '..'); // This is the 'project root' for the containing application
const semantqServerDir = path.resolve(__dirname, '..'); // This is the 'semantq_server' directory itself

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
 * Dynamically loads the Semantq configuration, preferring a root-level config
 * over the internal semantq_server/config one.
 * @returns {Promise<object>} The loaded configuration object.
 * @throws {Error} If no config file is found or accessible.
 */
async function loadConfig() {
    // Potential path for config file two levels up (in the containing project's root)
    const rootConfigPath = path.join(projectParentDir, 'semantq.config.js');
    const rootConfigUrl = pathToFileURL(rootConfigPath).href; // Convert to file URL for dynamic import

    // Path for config file in semantq_server/config/
    const internalConfigPath = path.join(semantqServerDir, 'config', 'semantq.config.js');
    const internalConfigUrl = pathToFileURL(internalConfigPath).href; // Convert to file URL

    try {
        // 1. Check if config exists two levels up (in project root)
        await fs.access(rootConfigPath, fs.constants.R_OK); // Check if file exists and is readable
        console.log(`Using config from project root: ${rootConfigPath}`);
        // Dynamically import and return the config from the project root
        const { default: config } = await import(rootConfigUrl);
        return config;
    } catch (rootConfigError) {
        // If it doesn't exist or isn't readable, try the internal one
        if (rootConfigError.code === 'ENOENT' || rootConfigError.code === 'EACCES') {
            console.warn(`⚠️ Project root config not found or inaccessible at ${rootConfigPath}. Falling back to internal config.`);
            try {
                // 2. Check if internal config exists
                await fs.access(internalConfigPath, fs.constants.R_OK); // Check if file exists and is readable
                console.log(`Using internal config: ${internalConfigPath}`);
                // Dynamically import and return the internal config
                const { default: config } = await import(internalConfigUrl);
                return config;
            } catch (internalConfigError) {
                console.error(`✖ Neither project root config (${rootConfigPath}) nor internal config (${internalConfigPath}) found or accessible.`);
                throw new Error('Semantq config file not found or accessible.');
            }
        } else {
            // Re-throw other unexpected errors for the root config check
            throw rootConfigError;
        }
    }
}


async function runMigrations() {
    console.log('🚀 Starting database migrations...');

    let config; // Declare config here
    try {
        config = await loadConfig(); // Load the configuration dynamically
    } catch (err) {
        console.error('❌ Error loading configuration:', err.message);
        process.exit(1);
    }

    const dbAdapterName = config.database.adapter;
    if (!dbAdapterName) {
        console.error('❌ Error: No database adapter configured in config/semantiq.config.js (or semantq.config.js in project root).');
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
    // Use semantqServerDir for paths within the semantq_server package
    const coreMigrationsPath = path.join(semantqServerDir, 'models', 'migrations', dbAdapterName);
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

// Ensure runMigrations is called within an async context
// Since it's the main execution block, we can just call it directly
runMigrations();