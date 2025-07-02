// semantq_server/models/adapters/supabase.js
import { createClient } from '@supabase/supabase-js';

let supabaseClient = null; // Cache the Supabase client instance

const supabaseAdapter = {
  /**
   * Initializes the Supabase client connection.
   * This method is called by models/adapters/index.js.
   * @param {object} dbConfig - Database configuration from semantiq.config.js.
   * Expected to contain 'url' and 'key' properties.
   * @returns {object} The initialized Supabase client.
   */
  async init(dbConfig) {
    if (supabaseClient) {
      return supabaseClient; // Return existing client if already initialized
    }

    const supabaseUrl = dbConfig.url || process.env.SUPABASE_URL;
    const supabaseKey = dbConfig.key || process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Key must be provided in config or environment variables.');
    }

    try {
      supabaseClient = createClient(supabaseUrl, supabaseKey);
      console.log('Supabase client initialized successfully!');
      return supabaseClient;
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      throw error;
    }
  },

  /**
   * Wrapper for Supabase query operations.
   * This provides a consistent interface for models (e.g., models.User.findUserById(id))
   * similar to how mysql2's `query` method works.
   * Models can then use `db.from('table').select('*').eq('id', id)` directly.
   * @param {string} tableName - The name of the table to query.
   * @returns {object} The Supabase query builder for the table.
   */
  from(tableName) {
    if (!supabaseClient) {
      throw new Error('Supabase client not initialized. Call init() first.');
    }
    return supabaseClient.from(tableName);
  },

  // You can add other direct Supabase client methods if needed, e.g.:
  // rpc(functionName, args) {
  //   if (!supabaseClient) { throw new Error('Supabase client not initialized.'); }
  //   return supabaseClient.rpc(functionName, args);
  // },
  // auth: supabaseClient.auth // Expose auth methods if needed directly from adapter
};

export default supabaseAdapter;
