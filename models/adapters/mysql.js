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

    const config = {
      host: dbConfig.host || process.env.MYSQL_DB_HOST,
      user: dbConfig.user || process.env.MYSQL_DB_USER,
      password: dbConfig.password || process.env.MYSQL_DB_PASSWORD,
      database: dbConfig.database || process.env.MYSQL_DB_NAME,
      port: dbConfig.port || process.env.MYSQL_DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: dbConfig.connectionLimit || 10,
      queueLimit: 0
    };

    if (!config.host || !config.user || !config.database) {
      console.error(`${ERROR_ICON} ${red('Missing critical MySQL connection details')}`);
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