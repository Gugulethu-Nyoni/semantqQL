// semantq_server/models/adapters/mysql.js
import mysql from 'mysql2/promise';

let connectionPool = null; // Cache the MySQL connection pool instance

const mysqlAdapter = {
  /**
   * Initializes the MySQL connection pool.
   * This method is called by models/adapters/index.js.
   * @param {object} dbConfig - Database configuration from semantiq.config.js.
   * Expected to contain host, user, password, database, and port properties.
   * @returns {object} The initialized MySQL connection pool.
   */
  async init(dbConfig) {
    if (connectionPool) {
      return connectionPool; // Return existing pool if already initialized
    }

    const config = {
      host: dbConfig.host || process.env.MYSQL_DB_HOST,
      user: dbConfig.user || process.env.MYSQL_DB_USER,
      password: dbConfig.password || process.env.MYSQL_DB_PASSWORD,
      database: dbConfig.database || process.env.MYSQL_DB_NAME,
      port: dbConfig.port || process.env.MYSQL_DB_PORT || 3306,
      waitForConnections: true, // Recommended for production
      connectionLimit: dbConfig.connectionLimit || 10, // Max number of connections in pool
      queueLimit: 0 // Unlimited queueing for connections
    };

    // Basic validation for critical config
    if (!config.host || !config.user || !config.database) {
      throw new Error('Missing critical MySQL connection details (host, user, database) in config or environment variables.');
    }

    try {
      connectionPool = mysql.createPool(config);
      // Test the connection to ensure it's valid
      await connectionPool.getConnection(); // Get and release a connection to test pool
      console.log('MySQL connection pool initialized successfully!');
      return connectionPool;
    } catch (error) {
      console.error('Failed to initialize MySQL connection pool:', error);
      throw error;
    }
  },

  /**
   * Executes a SQL query using the initialized connection pool.
   * This provides a consistent interface for models (e.g., db.query(sql, params)).
   * @param {string} sql - The SQL query string.
   * @param {Array<any>} [params] - Parameters for the prepared statement.
   * @returns {Promise<[Array<any>, Array<any>]>} A promise that resolves to [rows, fields].
   */
  async query(sql, params) {
    if (!connectionPool) {
      throw new Error('MySQL connection pool not initialized. Call init() first.');
    }
    // Use execute for prepared statements, which is safer and recommended
    return await connectionPool.execute(sql, params);
  },

  /**
   * Ends all connections in the pool gracefully.
   */
  async end() {
    if (connectionPool) {
      await connectionPool.end();
      console.log('MySQL connection pool closed.');
      connectionPool = null;
    }
  }
};

export default mysqlAdapter;
