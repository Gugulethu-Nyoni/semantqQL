// semantq_server/config/semantq.config.example.js

export default {
  database: {
    adapter: 'mysql',
    config: {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'db-pw',
      database: 'dbname',
    },
  },
  server: {
    port: 3003,
  },
  packages: {
    autoMount: true,
  },
  email: {
    driver: 'resend', // 'mailgun' | 'smtp' | 'mock'
    resend_api_key: 're_Abc',
    email_from: 'noreply@some.domain.com',
    email_from_name: 'Brand Name',
  },
  brand: {
    name: 'Brand Name',
    support_email: 'support@brandname.com',
    frontend_base_url: 'http://localhost:3000',
  },

  allowedOrigins: [
    'http://localhost:5173', // for Vite
    'http://localhost:3000', // if React or other dev server
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://localhost:3003'
  ],
    environment: 'development',

};
