// semantq_server/semantq.config.js

export default {
  database: {
    adapter: 'mysql',
    config: {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'my-secret-pw',
      database: 'centimap',
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
    resend_api_key: 're_8AFucjci_GEDk1y2txzGWkkFXhAcQXKYw',
    email_from: 'noreply@sender.formiquejs.com',
    email_from_name: 'Centimap Team',
  },
  brand: {
    name: 'Centimap',
    support_email: 'support@centimap.com',
    frontend_base_url: 'http://localhost:3000',
  },

  allowedOrigins: [
    'http://localhost:5173', // for Vite
    'http://localhost:3000', // if React or other dev server
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ],
};
