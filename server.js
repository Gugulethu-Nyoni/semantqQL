import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadRoutes } from './lib/routeLoader.js';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.json({ status: 'Semantq Server is running' });
});

(async () => {
  try {
    const coreRoutesPath = path.resolve(__dirname, 'routes');
    await loadRoutes(app, coreRoutesPath);

    const packagesPath = path.resolve(__dirname, 'packages');
    if (fs.existsSync(packagesPath)) {
      const packages = fs.readdirSync(packagesPath);
      for (const pkgName of packages) {
        const pkgRoutesPath = path.join(packagesPath, pkgName, 'routes');
        if (fs.existsSync(pkgRoutesPath)) {
          await loadRoutes(app, pkgRoutesPath, `/${pkgName}`);
        }
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
