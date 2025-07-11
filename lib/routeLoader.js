// semantq_server/lib/routeLoader.js
import fs from 'fs';
import path from 'path';
import express from 'express';
import { pathToFileURL } from 'url';
import chalk from 'chalk';

// Consistent with other files
const green = chalk.hex('#6ef0b5');
const yellow = chalk.hex('#f0e66e');
const errorRed = chalk.hex('#ff4d4d');
const gray = chalk.hex('#aaaaaa');

// Icons
const SUCCESS_ICON = green('✓');
const WARNING_ICON = yellow('⚠');
const ERROR_ICON = errorRed('✗');
const ROUTE_ICON = chalk.hex('#6ec7ff')('⇨');

/**
 * Dynamically load and mount routes from a directory
 * @param {express.Application} app - Express app instance
 * @param {string} routesPath - Path to the routes folder
 * @param {string} mountBasePath - Base URL path to mount routes under, e.g. "/auth"
 */
export async function loadRoutes(app, routesPath, mountBasePath = '') {
  console.log(`${ROUTE_ICON} ${gray(`Attempting to load routes from:`)} ${gray(routesPath)}`);
  const files = fs.readdirSync(routesPath);

  for (const file of files) {
    if (file.endsWith('.js')) {
      const routeFilePath = path.join(routesPath, file);
      console.log(`${ROUTE_ICON} ${gray(`Attempting to import route file:`)} ${gray(routeFilePath)}`);
      try {
        const routeModule = await import(pathToFileURL(routeFilePath).href);

        // Route filename (without Routes.js) as path, e.g. "userRoutes.js" -> "/user"
        const routeName = file.replace(/Routes?\.js$/i, '').toLowerCase();

        // Use mountBasePath if provided, else derive from routeName
        const routePath = mountBasePath || `/${routeName}`;

        if (routeModule.default && typeof routeModule.default === 'function') {
          app.use(routePath, routeModule.default);
          console.log(`${SUCCESS_ICON} ${green(`Mounted route`)} '${routePath}' ${gray(`from`)} '${file}'`);
        } else {
          console.log(`${WARNING_ICON} ${yellow(`Route file`)} '${file}' ${gray(`at`)} '${routeFilePath}' ${yellow(`does not export a default function`)}`);
        }
      } catch (importError) {
        console.error(`${ERROR_ICON} ${errorRed(`Failed to import route file`)} '${file}' ${gray(`at`)} '${routeFilePath}':`, importError);
        // Re-throw to propagate the error up to the server's catch block
        throw importError;
      }
    }
  }
}