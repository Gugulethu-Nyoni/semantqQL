import fs from 'fs';
import path from 'path';
import express from 'express';

/**
 * Dynamically load and mount routes from a directory
 * @param {express.Application} app - Express app instance
 * @param {string} routesPath - Path to the routes folder
 * @param {string} mountBasePath - Base URL path to mount routes under, e.g. "/auth"
 */
export async function loadRoutes(app, routesPath, mountBasePath = '') {
  const files = fs.readdirSync(routesPath);

  for (const file of files) {
    if (file.endsWith('.js')) {
      const routeModule = await import(path.join(routesPath, file));
      // Route filename (without .js) as path, e.g. "authRoutes.js" -> "/authRoutes"
      const routeName = file.replace(/Routes?\.js$/i, '').toLowerCase();

      // Mount path can be from param or derived
      const routePath = mountBasePath || `/${routeName}`;

      if (routeModule.default && typeof routeModule.default === 'function') {
        app.use(routePath, routeModule.default);
        console.log(`Mounted route '${routePath}' from '${file}'`);
      }
    }
  }
}
