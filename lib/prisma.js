// lib/prisma.js
import { PrismaClient } from '@prisma/client';
import configLoader from '../config_loader.js';

const globalForPrisma = globalThis;
let prismaPromise;

export default async function getPrismaClient() {
  if (!prismaPromise) {
    prismaPromise = (async () => {
      const config = await configLoader;
      const isProduction = config.environment === 'production';
      const client = new PrismaClient({ log: ['query', 'error', 'warn'] });

      if (!isProduction) {
        globalForPrisma.prisma = client;
      }
      return client;
    })();
  }
  return prismaPromise;
}