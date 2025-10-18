// models/adapters/mysql.js — Updated for consistent raw vs. prepared query support
import mysql from 'mysql2/promise';
import chalk from 'chalk';

// Consistent with other files
const green = chalk.hex('#6ef0b5');
const red = chalk.hex('#ff4d4d');
const yellow = chalk.hex('#f0e66e');
const gray = chalk.hex('#aaaaaa');
const blue = chalk.hex('#6ec7ff');

// Icons
const SUCCESS_ICON = green('✓');
const ERROR_ICON = red('✗');
const STOP_ICON = yellow('🛑');
const DB_ICON = blue('🗄️');

let connectionPool = null;

const mysqlAdapter = {
  async init(dbConfig) {
    if (connectionPool) return connectionPool;

    // CRITICAL FIX: Environment variables take PRIORITY over dbConfig
    const config = {
      host: process.env.DB_MYSQL_HOST || dbConfig.host, // ENV FIRST!
      user: process.env.DB_MYSQL_USER || dbConfig.user, // ENV FIRST!
      password: process.env.DB_MYSQL_PASSWORD || dbConfig.password, // ENV FIRST!
      database: process.env.DB_MYSQL_NAME || dbConfig.database, // ENV FIRST!
      port: process.env.DB_MYSQL_PORT || dbConfig.port || 3306, // ENV FIRST!
      waitForConnections: true,
      connectionLimit: process.env.DB_MYSQL_POOL_LIMIT || dbConfig.connectionLimit || 10,
      queueLimit: 0
    };

    // Debug log to see what config is being used
    console.log(`${DB_ICON} ${blue('MySQL connection config:')}`, {
      host: config.host,
      port: config.port,
      user: config.user,
      database: config.database,
      source: 'env' // Indicates source
    });

    if (!config.host || !config.user || !config.database) {
      console.error(`${ERROR_ICON} ${red('Missing critical MySQL connection details')}`);
      console.error(`${ERROR_ICON} ${red('Required: host, user, database')}`);
      throw new Error('Missing critical MySQL connection details');
    }

    try {
      console.log(`${DB_ICON} ${blue('Initializing MySQL connection pool...')}`);
      connectionPool = mysql.createPool(config);
      await connectionPool.getConnection();
      console.log(`${SUCCESS_ICON} ${green('MySQL connection pool initialized')}`);
      return connectionPool;
    } catch (error) {
      console.error(`${ERROR_ICON} ${red('Failed to initialize MySQL pool:')}`, error);
      throw error;
    }
  },

  async query(sql, params = []) {
    if (!connectionPool) throw new Error('MySQL pool not initialized.');
    return await connectionPool.execute(sql, params); // prepared statement
  },

  async raw(sql) {
    if (!connectionPool) throw new Error('MySQL pool not initialized.');
    return await connectionPool.query(sql); // allows raw, multi-statement execution (non-prepared)
  },

  async end() {
    if (connectionPool) {
      await connectionPool.end();
      console.log(`${STOP_ICON} ${yellow('MySQL pool closed')}`);
      connectionPool = null;
    }
  }
};

export default mysqlAdapter;