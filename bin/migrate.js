#!/usr/bin/env node
import 'dotenv/config';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { discoverSemantqModules } from '../lib/moduleLoader.js';
import loadConfigPromise from '../config_loader.js';
import chalk from 'chalk';

// Consistent with main CLI styling
const purple = chalk.hex('#b56ef0');
const purpleBright = chalk.hex('#d8a1ff');
const blue = chalk.hex('#6ec7ff');
const green = chalk.hex('#6ef0b5');
const yellow = chalk.hex('#f0e66e');
const errorRed = chalk.hex('#ff4d4d');
const gray = chalk.hex('#aaaaaa');
const cyan = chalk.hex('#6ef0e6');

// Icons
const SUCCESS_ICON = green('✓');
const WARNING_ICON = yellow('⚠');
const ERROR_ICON = errorRed('✗');
const DB_ICON = purple('🗄️');
const MIGRATION_ICON = cyan('🔄');
const ROLLBACK_ICON = purpleBright('↩️');
const DEBUG_ICON = gray('🔍');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Enhanced debugging output
console.log(`\n${DEBUG_ICON} ${gray('--- Environment Debugging ---')}`);
console.log(`${DEBUG_ICON} ${gray('Current Working Directory:')} ${process.cwd()}`);
console.log(`${DEBUG_ICON} ${gray('Project Root:')} ${projectRoot}`);
console.log(`${DEBUG_ICON} ${gray('DB Connection Details:')}`, {
  host: process.env.DB_MYSQL_HOST,
  port: process.env.DB_MYSQL_PORT,
  database: process.env.DB_MYSQL_NAME,
  user: process.env.DB_MYSQL_USER
});
console.log(`${DEBUG_ICON} ${gray('--- Environment Debugging End ---')}\n`);

async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureMigrationsTable(db) {
  try {
    await db.raw(`SELECT 1 FROM schema_migrations LIMIT 1`);
  } catch (err) {
    console.log(`${MIGRATION_ICON} ${blue('Initializing migrations table...')}`);
    await db.raw(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL,
        batch INT NOT NULL,
        run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_migration (migration_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    await db.raw(`INSERT INTO schema_migrations (migration_name, batch) VALUES ('0000-migrations-table', 0)`);
  }
}

async function discoverAllMigrations(dbAdapterName) {
  const allMigrationFiles = [];

  // Core migrations
  const coreMigrationsPath = path.join(projectRoot, 'models', 'migrations', dbAdapterName);
  if (await pathExists(coreMigrationsPath)) {
    const files = (await fs.readdir(coreMigrationsPath))
      .filter(file => file.endsWith('.js') || file.endsWith('.sql'))
      .map(file => ({
        name: file,
        path: path.join(coreMigrationsPath, file),
        source: 'core'
      }));
    allMigrationFiles.push(...files);
  }

  // Module migrations
  try {
    const modules = await discoverSemantqModules();
    for (const module of modules) {
      const moduleMigrationsPath = path.join(module.path, 'models', 'migrations', dbAdapterName);
      if (await pathExists(moduleMigrationsPath)) {
        const files = (await fs.readdir(moduleMigrationsPath))
          .filter(file => file.endsWith('.js') || file.endsWith('.sql'))
          .map(file => ({
            name: file,
            path: path.join(moduleMigrationsPath, file),
            source: `module:${module.name}`
          }));
        allMigrationFiles.push(...files);
      }
    }
  } catch (err) {
    console.error(`${ERROR_ICON} ${errorRed('Error discovering module migrations:')}`, err);
  }

  return allMigrationFiles.sort((a, b) => a.name.localeCompare(b.name));
}

async function runJsMigration(migration, db) {
  const migrationModule = await import(pathToFileURL(migration.path).href);
  
  if (!migrationModule.up || typeof migrationModule.up !== 'function') {
    throw new Error('Migration does not export an "up" function');
  }

  await migrationModule.up({
    query: db.query.bind(db),
    raw: db.raw?.bind(db) || db.query.bind(db),
    transaction: db.transaction?.bind(db)
  });
}

async function runSqlMigration(migration, db) {
  const sql = await fs.readFile(migration.path, 'utf8');
  if (db.raw) {
    await db.raw(sql);
  } else if (db.query) {
    await db.query(sql);
  } else {
    throw new Error('Database adapter has no query or raw method');
  }
}

async function safeDbEnd(db) {
  if (db && typeof db.end === 'function') {
    try {
      await db.end();
      console.log(`${SUCCESS_ICON} ${green('Database connection closed')}`);
    } catch (err) {
      console.error(`${ERROR_ICON} ${errorRed('Error closing database connection:')}`, err);
    }
  }
}

async function initializeDatabaseAdapter(config) {
  const dbAdapterName = config.database?.adapter;
  const adapterConfig = config.database?.config || {};

  if (!dbAdapterName) {
    throw new Error('No database adapter configured in semantq.config.js');
  }

  const adapterFilePath = path.join(projectRoot, 'models', 'adapters', `${dbAdapterName}.js`);
  const adapterFileUrl = pathToFileURL(adapterFilePath).href;

  console.log(`${DB_ICON} ${blue('Loading database adapter from:')} ${gray(adapterFilePath)}`);
  const adapterModule = await import(adapterFileUrl);
  const adapter = adapterModule.default;

  if (!adapter || typeof adapter.init !== 'function') {
    throw new Error(`Adapter '${dbAdapterName}' is invalid or missing init method`);
  }

  const dbConnection = await adapter.init(adapterConfig);
  
  // Validate the connection object has required methods
  if (!dbConnection || typeof dbConnection.query !== 'function') {
    throw new Error(`Database adapter '${dbAdapterName}' did not return a valid connection object with query() method`);
  }

  console.log(`${SUCCESS_ICON} ${green('Database adapter initialized:')} ${gray(dbAdapterName)}`);
  return dbConnection;
}


async function runMigrations() {
  console.log(`\n${MIGRATION_ICON} ${purple('Starting database migrations...')}`);

  const config = await loadConfigPromise;
  const db = await initializeDatabaseAdapter(config); // db now holds the actual connection

  const allMigrationFiles = await discoverAllMigrations(config.database.adapter);
  if (allMigrationFiles.length === 0) {
    console.log(`${WARNING_ICON} ${yellow('No migration files found to run')}`);
    await safeDbEnd(db);
    return;
  }

  // Get already run migrations
  let runMigrationNames = new Set();
  try {
    const [runMigrations] = await db.query(`SELECT migration_name FROM schema_migrations`);
    runMigrationNames = new Set(runMigrations.map(m => m.migration_name));
  } catch (err) {
    if (err.code === 'ER_NO_SUCH_TABLE') {
      const initMigration = allMigrationFiles.find(m => m.name === '0000-migrations-table.js');
      if (initMigration) {
        console.log(`${MIGRATION_ICON} ${blue('Initializing migrations table...')}`);
        await runJsMigration(initMigration, db);
        await db.query(
          `INSERT INTO schema_migrations (migration_name, batch) VALUES (?, ?)`,
          [initMigration.name, 0]
        );
      }
      const [runMigrations] = await db.query(`SELECT migration_name FROM schema_migrations`);
      runMigrationNames = new Set(runMigrations.map(m => m.migration_name));
    } else {
      throw err;
    }
  }

  // Filter pending migrations
  const pendingMigrations = allMigrationFiles.filter(m => !runMigrationNames.has(m.name));
  if (pendingMigrations.length === 0) {
    console.log(`${WARNING_ICON} ${yellow('No pending migrations to run')}`);
    await safeDbEnd(db);
    return;
  }

  // Get current batch number
  const [[{ maxBatch }]] = await db.query(`SELECT MAX(batch) as maxBatch FROM schema_migrations`);
  const currentBatch = (maxBatch || 0) + 1;

  // Run pending migrations
  for (const migration of pendingMigrations) {
    console.log(`\n${MIGRATION_ICON} ${blue('Running:')} ${migration.name} ${gray(`(${migration.source})`)}`);
    
    try {
      if (migration.name.endsWith('.js')) {
        await runJsMigration(migration, db);
      } else if (migration.name.endsWith('.sql')) {
        await runSqlMigration(migration, db);
      }
      
      await db.query(
        `INSERT INTO schema_migrations (migration_name, batch) VALUES (?, ?)`,
        [migration.name, currentBatch]
      );
      console.log(`${SUCCESS_ICON} ${green('Success:')} ${migration.name}`);
    } catch (err) {
      console.error(`${ERROR_ICON} ${errorRed('Failed:')} ${migration.name}`, err);
      console.error(`${ERROR_ICON} ${errorRed('Aborting migrations due to failure')}`);
      await safeDbEnd(db);
      process.exit(1);
    }
  }

  console.log(`\n${SUCCESS_ICON} ${green('All migrations completed successfully!')}`);
  await safeDbEnd(db);
}

async function rollbackMigrations(options = {}) {
  console.log(`\n${ROLLBACK_ICON} ${purple('Starting migration rollback...')}`);
  
  const config = await loadConfigPromise;
  const db = await initializeDatabaseAdapter(config); // db now holds the actual connection
  await ensureMigrationsTable(db);

  const allMigrationFiles = await discoverAllMigrations(config.database.adapter);

  // Determine which migrations to rollback
  let migrationsToRollback;
  if (options.target) {
    const [migrations] = await db.query(
      `SELECT migration_name, batch FROM schema_migrations WHERE migration_name = ? ORDER BY id DESC`,
      [options.target]
    );
    migrationsToRollback = migrations;
  } else if (options.all) {
    const [migrations] = await db.query(
      `SELECT migration_name, batch FROM schema_migrations ORDER BY id DESC`
    );
    migrationsToRollback = migrations;
  } else {
    const [migrations] = await db.query(
      `SELECT migration_name, batch FROM schema_migrations ORDER BY id DESC LIMIT ?`,
      [options.steps]
    );
    migrationsToRollback = migrations;
  }

  if (migrationsToRollback.length === 0) {
    console.log(`${WARNING_ICON} ${yellow('No migrations to rollback')}`);
    await safeDbEnd(db);
    return;
  }

  console.log(`\n${ROLLBACK_ICON} ${blue('Rolling back')} ${migrationsToRollback.length} ${blue('migration(s):')}`);
  migrationsToRollback.forEach(m => console.log(` ${gray('-')} ${m.migration_name}`));

  for (const migration of migrationsToRollback) {
    const migrationFile = allMigrationFiles.find(m => m.name === migration.migration_name);
    if (!migrationFile) {
      console.warn(`${WARNING_ICON} ${yellow('Migration file not found for:')} ${migration.migration_name}`);
      continue;
    }

    console.log(`\n${ROLLBACK_ICON} ${blue('Rolling back:')} ${migration.migration_name}`);
    
    try {
      if (migrationFile.name.endsWith('.js')) {
        const migrationModule = await import(pathToFileURL(migrationFile.path).href);
        if (migrationModule.down && typeof migrationModule.down === 'function') {
          await migrationModule.down({
            query: db.query.bind(db),
            raw: db.raw?.bind(db) || db.query.bind(db)
          });
        }
      }
      
      await db.query(
        `DELETE FROM schema_migrations WHERE migration_name = ?`,
        [migration.migration_name]
      );
      console.log(`${SUCCESS_ICON} ${green('Successfully rolled back:')} ${migration.migration_name}`);
    } catch (err) {
      console.error(`${ERROR_ICON} ${errorRed('Failed to rollback:')} ${migration.migration_name}`, err);
      console.error(`${ERROR_ICON} ${errorRed('Aborting rollback due to failure')}`);
      await safeDbEnd(db);
      process.exit(1);
    }
  }

  console.log(`\n${SUCCESS_ICON} ${green('Rollback completed successfully!')}`);
  await safeDbEnd(db);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'migrate';

  try {
    if (command === 'rollback') {
      const options = {
        all: args.includes('--all'),
        steps: parseInt(args.find(arg => arg.startsWith('--steps='))?.split('=')[1] || '1'),
        target: args.find(arg => !arg.startsWith('--'))
      };
      await rollbackMigrations(options);
    } else if (command === 'migrate') {
      await runMigrations();
    } else {
      console.log(`${blue('Usage:')}`);
      console.log(` ${gray('›')} ${purple('node bin/migrate.js migrate')}       ${gray('# Run pending migrations')}`);
      console.log(` ${gray('›')} ${purple('node bin/migrate.js rollback')}      ${gray('# Rollback last migration')}`);
      console.log(` ${gray('›')} ${purple('node bin/migrate.js rollback --steps=3')}  ${gray('# Rollback last 3 migrations')}`);
      console.log(` ${gray('›')} ${purple('node bin/migrate.js rollback --all')}      ${gray('# Rollback all migrations')}`);
      console.log(` ${gray('›')} ${purple('node bin/migrate.js rollback 0002-sessions.js')} ${gray('# Rollback specific migration')}`);
    }
  } catch (err) {
    console.error(`${ERROR_ICON} ${errorRed('Unhandled error:')}`, err);
    process.exit(1);
  }
}

main();
