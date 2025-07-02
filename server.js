import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { loadRoutes } from './lib/routeLoader.js';
import { discoverSemantqModules } from './lib/moduleLoader.js'; // Import the new helper
import fs from 'fs/promises'; // Ensure fs.promises is used for consistency

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Semantq Server is running' });
});

// Helper to check if a path exists (using fs.promises)
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
    // Load core routes
    const coreRoutesPath = path.resolve('./routes');
    if (await pathExists(coreRoutesPath)) {
        await loadRoutes(app, coreRoutesPath);
    } else {
        console.warn(`⚠️ Core routes directory not found at ${coreRoutesPath}. Skipping.`);
    }

    // Load routes from all discovered Semantq modules
    const moduleSources = await discoverSemantqModules(); // Use the new helper
    for (const module of moduleSources) {
      const moduleRoutesPath = path.join(module.path, 'routes');
      if (await pathExists(moduleRoutesPath)) {
        await loadRoutes(app, moduleRoutesPath, `/${module.name}`);
      } else {
        console.warn(`⚠️ Module '${module.name}' at '${module.path}' does not have a 'routes' directory. Skipping route loading.`);
      }
    }

    app.listen(PORT, () => {
      console.log(`Semantq Server running on port ${PORT} (Env: ${process.env.NODE_ENV || 'development'})`);
    });
  } catch (err) {
    console.error('Failed to initialize server:', err);
    process.exit(1);
  }
})();
