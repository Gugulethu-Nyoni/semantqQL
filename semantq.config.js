//semantiq.config.js

export default {
  database: {
    adapter: 'supabase'
  },
  packages: {
    autoMount: true,        // enables automatic package detection
    dir: './packages'
  }
};
