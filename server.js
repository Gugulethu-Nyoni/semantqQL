import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { loadRoutes } from './lib/routeLoader.js';
import { discoverSemantqModules } from './lib/moduleLoader.js';
import fs from 'fs/promises';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// CLI Color palette (consistent with other files)
const purple = chalk.hex('#b56ef0');
const purpleBright = chalk.hex('#d8a1ff');
const blue = chalk.hex('#6ec7ff');
const green = chalk.hex('#6ef0b5');
const yellow = chalk.hex('#f0e66e');
const errorRed = chalk.hex('#ff4d4d');
const gray = chalk.hex('#aaaaaa');
const cyan = chalk.hex('#6ef0e6');

// Icons (consistent with other files)
const SUCCESS_ICON = green('✓');
const WARNING_ICON = yellow('⚠');
const ERROR_ICON = errorRed('✗');
const SERVER_ICON = purple('🌐');
const MODULE_ICON = blue('🧩');
const CONFIG_ICON = purpleBright('⚙️');
const HEALTH_ICON = green('❤️');

// 🆕 Import Supabase adapter
import supabaseAdapter from './models/adapters/supabase.js';

// 🆕 Import config loader
import configPromise from './config_loader.js';

// Setup __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Init Express
const app = express();
const PORT = process.env.PORT || 3003;

(async () => {
  try {
    console.log(`${CONFIG_ICON} ${purpleBright('Loading configuration...')}`);
    
    // ✓ Load config
    const semantqConfig = await configPromise;
    console.log(`${SUCCESS_ICON} ${green('Configuration loaded successfully')}`);

    // ✓ CORS config using allowedOrigins from loaded config
    app.use(cors({
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (semantqConfig.allowedOrigins.includes(origin)) {
          return callback(null, true);
        } else {
          return callback(new Error(`CORS: Origin ${origin} not allowed`));
        }
      },
      credentials: true
    }));

    app.use(bodyParser.json());
    app.use(cookieParser());

    // Health check
    app.get('/', (req, res) => {
      res.json({ status: 'Semantq Server is running' });
    });

    // Helper to check if a path exists
    async function pathExists(p) {
      try {
        await fs.access(p);
        return true;
      } catch {
        return false;
      }
    }

    console.log(`${MODULE_ICON} ${blue('Initializing Supabase adapter...')}`);
    // ✓ INIT Supabase first with fallback to .env
    await supabaseAdapter.init();
    console.log(`${SUCCESS_ICON} ${green('Supabase adapter initialized')}`);

    // Load core routes
    const coreRoutesPath = path.resolve(__dirname, 'routes');
    if (await pathExists(coreRoutesPath)) {
      console.log(`${MODULE_ICON} ${blue('Loading core routes from:')} ${gray(coreRoutesPath)}`);
      await loadRoutes(app, coreRoutesPath);
      console.log(`${SUCCESS_ICON} ${green('Core routes loaded successfully')}`);
    } else {
      console.log(`${WARNING_ICON} ${yellow('Core routes directory not found at:')} ${gray(coreRoutesPath)}`);
    }

    // Load routes from all discovered Semantq modules
    console.log(`${MODULE_ICON} ${blue('Discovering Semantq modules...')}`);
    const moduleSources = await discoverSemantqModules();
    
    if (moduleSources.length > 0) {
      console.log(`${SUCCESS_ICON} ${green(`Found ${moduleSources.length} module(s)`)}`);
      
      for (const module of moduleSources) {
        const moduleRoutesPath = path.join(module.path, 'routes');
        if (await pathExists(moduleRoutesPath)) {
          console.log(`${MODULE_ICON} ${blue(`Loading routes for module '${module.name}' from:`)} ${gray(moduleRoutesPath)}`);
          await loadRoutes(app, moduleRoutesPath, `/${module.name}`);
          console.log(`${SUCCESS_ICON} ${green(`Module '${module.name}' routes loaded`)}`);
        } else {
          console.log(`${WARNING_ICON} ${yellow(`Module '${module.name}' at '${module.path}' does not have a 'routes' directory`)}`);
        }
      }
    } else {
      console.log(`${WARNING_ICON} ${yellow('No Semantq modules discovered')}`);
    }

    app.listen(PORT, () => {
      console.log(`\n${SERVER_ICON} ${purpleBright('Semantq Server running on port:')} ${blue(PORT)} ${gray(`(Env: ${process.env.NODE_ENV || 'development'})`)}`);
      console.log(`${HEALTH_ICON} ${green('Health check available at:')} ${gray('http://localhost:' + PORT + '/')}\n`);
    });
  } catch (err) {
    console.error(`\n${ERROR_ICON} ${errorRed('Failed to initialize server:')}`, err);
    process.exit(1);
  }
})();