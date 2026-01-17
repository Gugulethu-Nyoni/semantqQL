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

// CLI Color palette
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
const SERVER_ICON = purple('🌐');
const MODULE_ICON = blue('🧩');
const CONFIG_ICON = purpleBright('⚙️');
const HEALTH_ICON = green('❤️');
const SECURITY_ICON = green('🔒');

// Import config loader
import configPromise from './config_loader.js';

// Setup __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Init Express
const app = express();
const PORT = process.env.PORT || 3003;

// --- FILE UPLOAD (MULTER) CONFIGURATION ---
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const uploadMiddleware = multer({ dest: UPLOAD_DIR });
app.set('uploadMiddleware', uploadMiddleware); 

console.log(`${CONFIG_ICON} ${cyan('Uploads directory set to:')} ${gray(UPLOAD_DIR)}`);

// Helper to check if a path exists
async function pathExists(p) {
    try {
        await fs.access(p);
        return true;
    } catch {
        return false;
    }
}

(async () => {
  try {
    console.log(`${CONFIG_ICON} ${purpleBright('Loading configuration...')}`);

    // Ensure the uploads directory exists
    const dirExists = await pathExists(UPLOAD_DIR);
    if (!dirExists) {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      console.log(`${SUCCESS_ICON} ${green('Uploads directory created.')}`);
    } else {
      console.log(`${SUCCESS_ICON} ${green('Uploads directory already exists.')}`);
    }

    /** * SURGICAL FIX: 
     * Handles both cases: if config_loader exports a function OR a promise directly.
     */
    const semantqConfig = typeof configPromise === 'function' 
        ? await configPromise() 
        : await configPromise;

    console.log(`${SUCCESS_ICON} ${green('Configuration loaded successfully')}`);

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
          database: process.env.DB_MYSQL_NAME || 'semantq',
        }
      };
    }

    const selectedAdapter = semantqConfig.database.adapter;
    console.log(`${MODULE_ICON} ${blue(`Initializing '${selectedAdapter}' adapter...`)}`);

    // ✓ CORS config
    const allowedOrigins = semantqConfig.allowedOrigins || [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'http://localhost:3003'
    ];
    
    app.use(cors({
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        } else {
          console.log(`${WARNING_ICON} ${yellow(`CORS blocked: ${origin} not in allowed origins`)}`);
          return callback(null, false);
        }
      },
      credentials: true
    }));

    app.use(bodyParser.json());
    app.use(cookieParser());

    // Health check
    app.get('/', (req, res) => {
      res.json({ 
        status: 'Semantq Server is running',
        version: '1.0.0',
        adapter: selectedAdapter,
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // ⚠️ DYNAMIC ADAPTER INITIALIZATION
    switch (selectedAdapter) {
      case 'supabase':
        try {
          const { default: supabaseAdapter } = await import('./models/adapters/supabase.js');
          await supabaseAdapter.init(semantqConfig);
          console.log(`${SUCCESS_ICON} ${green('Supabase adapter initialized successfully')}`);
        } catch (error) {
          console.error(`${ERROR_ICON} ${errorRed('Failed to initialize Supabase adapter:')} ${error.message}`);
          process.exit(1);
        }
        break;
        
      case 'mysql':
        try {
          const { default: mysqlAdapter } = await import('./models/adapters/mysql.js');
          await mysqlAdapter.init(semantqConfig.database.config);
          console.log(`${SUCCESS_ICON} ${green('MySQL adapter initialized successfully')}`);
        } catch (error) {
          console.error(`${ERROR_ICON} ${errorRed('Failed to initialize MySQL adapter:')} ${error.message}`);
          process.exit(1);
        }
        break;
        
      default:
        console.error(`${ERROR_ICON} ${errorRed(`Unknown database adapter: '${selectedAdapter}'`)}`);
        process.exit(1);
    }

    // Load core routes
    const coreRoutesPath = path.resolve(__dirname, 'routes');
    if (await pathExists(coreRoutesPath)) {
      console.log(`${MODULE_ICON} ${blue('Loading core routes from:')} ${gray(coreRoutesPath)}`);
      await loadRoutes(app, coreRoutesPath);
      console.log(`${SUCCESS_ICON} ${green('Core routes loaded successfully')}`);
    }

    // Load routes from modules
    console.log(`${MODULE_ICON} ${blue('Discovering Semantq modules...')}`);
    const moduleSources = await discoverSemantqModules();
    
    if (moduleSources.length > 0) {
      for (const module of moduleSources) {
        const moduleRoutesPath = path.join(module.path, 'routes');
        if (await pathExists(moduleRoutesPath)) {
          await loadRoutes(app, moduleRoutesPath, `/${module.name}`);
          console.log(`${SUCCESS_ICON} ${green(`Module '${module.name}' routes loaded`)}`);
        }
      }
    }

    // Global error handler
    app.use((err, req, res, next) => {
      console.error(`${ERROR_ICON} ${errorRed('Unhandled error:')}`, err.message);
      res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      });
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ error: 'Route not found', path: req.path });
    });

    app.listen(PORT, () => {
      console.log(`\n${SERVER_ICON} ${purpleBright('Semantq Server running on port:')} ${blue(PORT)}`);
      console.log(`${SECURITY_ICON} ${green('Automatic security enforced')}\n`);
    });
  } catch (err) {
    console.error(`\n${ERROR_ICON} ${errorRed('Failed to initialize server:')}`, err);
    process.exit(1);
  }
})();