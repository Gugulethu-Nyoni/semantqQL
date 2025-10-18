// semantqQL/server.js

import dotenv from 'dotenv';
dotenv.config();

import multer from 'multer';
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

// 🆕 Import both database adapters from their respective files
import supabaseAdapter from './models/adapters/supabase.js';
import mysqlAdapter from './models/adapters/mysql.js';

// Import config loader
import configPromise from './config_loader.js';

// Setup __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Init Express
const app = express();
const PORT = process.env.PORT || 3003;

// --- FILE UPLOAD (MULTER) CONFIGURATION ---

// Define the absolute path to the uploads directory (semantqQL/uploads)
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Initialize Multer using the absolute path
// We use a general name (uploadMiddleware) to store the instance
const uploadMiddleware = multer({ dest: UPLOAD_DIR });

// Store the instance on the Express app for global access by the route loader
app.set('uploadMiddleware', uploadMiddleware); 

console.log(`${CONFIG_ICON} ${cyan('Uploads directory set to:')} ${gray(UPLOAD_DIR)}`);

// --- END MULTER CONFIGURATION ---


(async () => {
 try {
  console.log(`${CONFIG_ICON} ${purpleBright('Loading configuration...')}`);
 
    // Ensure the uploads directory exists before starting
    const dirExists = await pathExists(UPLOAD_DIR);
    if (!dirExists) {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
        console.log(`${SUCCESS_ICON} ${green('Uploads directory created.')}`);
    } else {
        console.log(`${SUCCESS_ICON} ${green('Uploads directory already exists.')}`);
    }
 
  // ✓ Load config
  const semantqConfig = await configPromise();
  console.log(`${SUCCESS_ICON} ${green('Configuration loaded successfully')}`);

  // ✅ DEBUG: Check what's actually in the config
  console.log('DEBUG - Full config structure:', Object.keys(semantqConfig));
  console.log('DEBUG - Database config exists:', !!semantqConfig.database);

  // ✅ SAFE ACCESS: Ensure database config exists
  if (!semantqConfig.database) {
    console.log(`${WARNING_ICON} ${yellow('Database config missing, creating default...')}`);
    semantqConfig.database = {
      adapter: 'mysql',
      config: {
        host: process.env.DB_MYSQL_HOST || 'localhost',
        port: process.env.DB_MYSQL_PORT || 3306,
        user: process.env.DB_MYSQL_USER || 'root',
        password: process.env.DB_MYSQL_PASSWORD || 'my-secret-pw',
        database: process.env.DB_MYSQL_NAME || 'botaniq',
      }
    };
  }

  // Now this should work safely
  const selectedAdapter = semantqConfig.database.adapter;
  console.log(`${MODULE_ICON} ${blue(`Initializing '${selectedAdapter}' adapter...`)}`);

  // ✓ CORS config using allowedOrigins from loaded config
  // ✅ SAFE ACCESS: Check if allowedOrigins exists
  const allowedOrigins = semantqConfig.allowedOrigins || [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://gobotaniq.com',
    'https://www.gobotaniq.com'
  ];
  
  app.use(cors({
   origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
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
 
  // ⚠️ DYNAMIC ADAPTER INITIALIZATION
  switch (selectedAdapter) {
    case 'supabase':
        await supabaseAdapter.init(semantqConfig);
        break;
    case 'mysql':
        // ✅ PASS THE DATABASE CONFIG ONLY, not the entire semantqConfig
        await mysqlAdapter.init(semantqConfig.database.config);
        break;
    default:
        console.log(`${WARNING_ICON} ${yellow(`No database adapter specified or unknown adapter '${selectedAdapter}'.`)}`);
  }
  console.log(`${SUCCESS_ICON} ${green('Database adapter initialized')}`);

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