import fs from 'fs';
import path from 'path';
import express from 'express';
import { pathToFileURL } from 'url';
import chalk from 'chalk';

const green = chalk.hex('#6ef0b5');
const yellow = chalk.hex('#f0e66e');
const errorRed = chalk.hex('#ff4d4d');
const gray = chalk.hex('#aaaaaa');
const blue = chalk.hex('#6ec7ff');

const SUCCESS_ICON = green('✓');
const WARNING_ICON = yellow('⚠');
const ERROR_ICON = errorRed('✗');
const ROUTE_ICON = blue('⇨');

export async function loadRoutes(app, routesPath, mountBasePath = '') {
  console.log(`${ROUTE_ICON} ${gray(`Loading routes from:`)} ${gray(routesPath)}`);
  const files = fs.readdirSync(routesPath);

  for (const file of files) {
    if (file.endsWith('.js')) {
      const routeFilePath = path.join(routesPath, file);
      
      try {
        const routeModule = await import(pathToFileURL(routeFilePath).href);
        const routeName = file.replace(/Routes?\.js$/i, '').toLowerCase();
        const routePath = mountBasePath || `/${routeName}`;

        if (routeModule.default && typeof routeModule.default === 'function') {
          app.use(routePath, routeModule.default);
          console.log(`${SUCCESS_ICON} ${green(`Mounted`)} '${routePath}' ${gray(`from`)} '${file}'`);
        }
      } catch (error) {
        console.error(`${ERROR_ICON} ${errorRed(`Failed to load`)} '${file}':`, error.message);
      }
    }
  }
}