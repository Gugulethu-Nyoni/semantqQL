// semantqQL/server.config.js

export default {
  database: {
    adapter: 'mysql',
    config: {
      host: process.env.DB_MYSQL_HOST || 'localhost',
      port: process.env.DB_MYSQL_PORT ? parseInt(process.env.DB_MYSQL_PORT) : 3306,
      user: process.env.DB_MYSQL_USER || 'root',
      password: process.env.DB_MYSQL_PASSWORD || 'db-pw',
      database: process.env.DB_MYSQL_NAME || 'dbname',
      connectionLimit: process.env.DB_MYSQL_POOL_LIMIT || 10,
    },
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3003,
  },
  packages: {
    autoMount: true,
  },
  email: {
    driver: process.env.EMAIL_DRIVER || 'resend',
    resend_api_key: process.env.RESEND_API_KEY || 're_xxx',
    email_from: process.env.EMAIL_FROM || 'noreply@sender.somewebsite.com',
    email_from_name: process.env.EMAIL_FROM_NAME || 'Team Example',
  },
  brand: {
    name: process.env.BRAND_NAME || 'Example',
    support_email: process.env.BRAND_SUPPORT_EMAIL || 'support@example.com',
    frontend_base_url: process.env.FRONTEND_BASE_URL || 'http://localhost:3000',
  },
  allowedOrigins: [
    process.env.FRONTEND_BASE_URL,
    'http://localhost:5173',
    'http://localhost:3000',
    'https://gobotaniq.com',
    'https://www.somewebsite.com'
  ].filter(Boolean),
  environment: process.env.NODE_ENV || 'development',
};