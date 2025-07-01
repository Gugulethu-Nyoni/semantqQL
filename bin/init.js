#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const rootEnvPath = path.resolve(process.cwd(), '../.env');
const localEnvPath = path.resolve(process.cwd(), '.env');
const exampleEnvPath = path.resolve(process.cwd(), '.env.example');

function copyEnvFile(targetPath) {
  if (!fs.existsSync(exampleEnvPath)) {
    console.error('❌ .env.example file not found in semantq_server');
    process.exit(1);
  }
  fs.copyFileSync(exampleEnvPath, targetPath);
  console.log(`✅ Copied .env.example to ${targetPath}`);
}

function main() {
  // Detect root package.json as heuristic for root dir
  const rootPackageJson = path.resolve(process.cwd(), '../package.json');
  const isRootProject = fs.existsSync(rootPackageJson);

  if (fs.existsSync(rootEnvPath)) {
    console.log('✅ Found .env in project root, no action needed');
  } else if (fs.existsSync(localEnvPath)) {
    console.log('✅ Found .env in semantq_server, no action needed');
  } else {
    if (isRootProject) {
      copyEnvFile(rootEnvPath);
    } else {
      copyEnvFile(localEnvPath);
    }
  }
}

main();
