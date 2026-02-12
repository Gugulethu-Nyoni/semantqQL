export default {
  database: {
    default: process.env.DB_DEFAULT || 'postgres',
    connections: {
      mysql: {
        adapter: 'mysql',
        config: {
          host: process.env.DB_MYSQL_HOST || 'dummy-mysql-host',
          port: process.env.DB_MYSQL_PORT ? parseInt(process.env.DB_MYSQL_PORT) : 3306,
          user: process.env.DB_MYSQL_USER || 'dummy_user',
          password: process.env.DB_MYSQL_PASSWORD || 'dummy_password',
          database: process.env.DB_MYSQL_NAME || 'dummy_db',
          connectionLimit: process.env.DB_MYSQL_POOL_LIMIT ? parseInt(process.env.DB_MYSQL_POOL_LIMIT) : 10,
        },
      },
      postgres: {
        adapter: 'postgresql',
        config: {
          host: process.env.DB_POSTGRES_HOST || 'dummy-postgres-host',
          port: process.env.DB_POSTGRES_PORT ? parseInt(process.env.DB_POSTGRES_PORT) : 54320,
          user: process.env.DB_POSTGRES_USER || 'dummy_user',
          password: process.env.DB_POSTGRES_PASSWORD || 'dummy_password',
          database: process.env.DB_POSTGRES_NAME || 'dummy_db',
          schema: process.env.DB_POSTGRES_SCHEMA || 'public',
          ssl: process.env.DB_POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
          connectionLimit: process.env.DB_POSTGRES_POOL_LIMIT ? parseInt(process.env.DB_POSTGRES_POOL_LIMIT) : 10,
          idleTimeoutMillis: 30000,
        },
      },
    },
  },
  
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3003,
  },
  
  // MODULE CONFIGURATIONS
  logistics: {
    autoMount: true,
    
    // Shipping Configuration
    shipping: {
      provider: 'courier_guy',
      config: {
        apiKey: process.env.THE_COURIER_GUY_KEY || 'dummy_courier_key',
        token: process.env.THE_COURIER_GUY_BEARER_TOKEN || 'dummy_courier_token',
        ratesBaseUrl: process.env.THE_COURIER_GUY_RATES_END_POINT || 'https://api.shiplogic.com/v2/rates',
        ordersBaseUrl: process.env.THE_COURIER_GUY_ORDERS_END_POINT || 'https://api.shiplogic.com/v2/shipments',
      },
    },
    
    // Warehouse Configuration
    warehouse: {
      type: "business",
      company: process.env.WAREHOUSE_COMPANY || "Dummy Warehouse Co",
      street_address: process.env.WAREHOUSE_STREET || "123 Dummy Street",
      local_area: process.env.WAREHOUSE_AREA || "Dummy Area",
      city: process.env.WAREHOUSE_CITY || "Dummy City",
      zone: process.env.WAREHOUSE_PROVINCE || "Dummy Province",
      country: process.env.WAREHOUSE_COUNTRY || "ZA",
      code: process.env.WAREHOUSE_POSTAL_CODE || "1234"
    },

    // Payment Gateway Configuration
    gateways: {
      provider: 'yoco',
      config: {
        secretKey: process.env.YOCO_SECRET_KEY || 'dummy_yoco_secret',
        publicKey: process.env.YOCO_PUBLIC_KEY || 'dummy_yoco_public',
      }
    }
  },
  
  // STORAGE CONFIGURATION
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'uploadthing',
    uploadthing: {
      token: process.env.UPLOADTHING_TOKEN || 'dummy_uploadthing_token',
      appId: process.env.UPLOADTHING_APP_ID || 'dummy_app_id',
    },
    s3: {
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET || 'dummy-bucket',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy_access_key',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy_secret_key',
      endpoint: process.env.AWS_S3_ENDPOINT || 'https://dummy-s3-endpoint.com',
      cdnUrl: process.env.AWS_CDN_URL || 'https://dummy-cdn-url.com',
    },
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'dummy_cloud_name',
      apiKey: process.env.CLOUDINARY_API_KEY || 'dummy_api_key',
      apiSecret: process.env.CLOUDINARY_API_SECRET || 'dummy_api_secret',
    },
    maxFileSize: process.env.STORAGE_MAX_FILE_SIZE ? parseInt(process.env.STORAGE_MAX_FILE_SIZE) : 50 * 1024 * 1024,
    maxFiles: process.env.STORAGE_MAX_FILES ? parseInt(process.env.STORAGE_MAX_FILES) : 20,
    defaultFolder: process.env.STORAGE_DEFAULT_FOLDER || 'uploads',
  },
  
  email: {
    driver: process.env.EMAIL_DRIVER || 'resend',
    debug: process.env.EMAIL_DEBUG === 'true',
    resend_api_key: process.env.RESEND_API_KEY || 'dummy_resend_key',
    email_from: process.env.EMAIL_FROM || 'dummy@example.com',
    email_from_name: process.env.EMAIL_FROM_NAME || 'Dummy Sender',
  },
  
  brand: {
    name: process.env.BRAND_NAME || 'Dummy Brand',
    support_email: process.env.BRAND_SUPPORT_EMAIL || 'support@dummy.com',
    admin_notifications: process.env.ADMIN_NOTIFICATIONS_EMAIL || 'admin@dummy.com',
    frontend_base_url: process.env.FRONTEND_BASE_URL || 'http://localhost:5173',
  },
  
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .filter(Boolean)
    .concat([
      'http://localhost:5173',
      'http://localhost:3000',
      'https://gobotaniq.com',
      'https://www.gobotaniq.com'
    ]),
    
  environment: process.env.NODE_ENV || 'development',
};