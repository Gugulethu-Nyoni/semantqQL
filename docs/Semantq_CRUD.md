## 📖 **Semantq Server:  CRUD (MCSR) Guide**


##  Important Note

**Before following this guide, please ensure you’ve gone through these setup guides in order:**

1. **[Semantq Server](https://github.com/Gugulethu-Nyoni/semantq_server)** — core backend framework and service layer.
2. **[Semantq Auth](https://github.com/Gugulethu-Nyoni/semantq_auth)** *(optional, but recommended for projects using the Semantq Full Stack ecosystem)* — provides secure, email-based authentication with MySQL or Supabase adapters.
3. **[Semantq Auth UI](https://github.com/Gugulethu-Nyoni/semantq_auth_ui)** *(also optional, but integrates seamlessly with Semantq Auth for a full-stack experience)* — prebuilt frontend components for authentication flows.

⚠️ **It’s strongly advised to set up at least Semantq Server first, as it forms the foundation for other packages in the Semantq ecosystem.**

> **For MySQL adapter (will include Supabase/Mongo/SQLite later)**

## 📂 Project Structure Overview

```
semantq_server/
├── controllers/
│   └── productsController.js
├── models/
│   ├── adapters/
│   │   └── mysql.js
│   ├── migrations/
│   │   └── mysql/
│   │       └── 0002-products.js
│   ├── mysql/
│   │   └── productsModel.js
│   └── index.js
├── routes/
│   └── productsRoutes.js         # ← Only place dev needs to declare API endpoints
├── services/
│   └── productsService.js
├── semantiq.config.js
├── .env                          # Database logins & env vars
└── server.js                     # No route edits needed — uses auto-loader
```

For this guide - we are going to be working with a products CRUD (Create, read, update, delete) as well front end data flow. 


## 1️⃣ **Create a Migration**

Migrations are adapter specific - since we are working with a mysql adapter in this guide you will create your migration in: 

**`models/migrations/mysql/0002-products.js`**
(The adapter is specified in your project root or semantq_server semantq.config.js) - Semantq Server Guide. 

```js
export const up = async (db) => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      sku VARCHAR(100) UNIQUE NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      stock_quantity INT DEFAULT 0,
      status ENUM('active', 'inactive', 'discontinued') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_name (name),
      INDEX idx_sku (sku),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
};

export const down = async (db) => {
  await db.query(`DROP TABLE IF EXISTS products`);
};
```


##  2️⃣ **Build the MCSR Stack**

###  Model — `models/mysql/productsModel.js`

```js
import db from '../adapters/mysql.js';

const productsModel = {
  async findAllProducts() {
    const [rows] = await db.query('SELECT * FROM products');
    return rows;
  },
  // add findById, createProduct, updateProduct, deleteProduct...
};

export default productsModel;
```



### Service — `services/productsService.js`

```js
import models from '../models/index.js';

const productsService = {
  async getAllProducts() {
    return await models.productsModel.findAllProducts();
  }
};

export default productsService;
```

### Controller — `controllers/productsController.js`

```js
import productsService from '../services/productsService.js';

const productsController = {
  async getAllProducts(req, res) {
    try {
      const products = await productsService.getAllProducts();
      res.json({ success: true, data: products });
    } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch products' });
    }
  }
};

export default productsController;
```



### Route — `routes/productsRoutes.js`

```js
import express from 'express';
import productsController from '../controllers/productsController.js';

const router = express.Router();

router.get('/products', productsController.getAllProducts);
// add post, put, delete routes as needed

export default router;
```



## No Manual Route Registration

**You don’t need to touch `server.js` in your semantq_server directory.**
Semantq’s **route loader automatically detects any `.js` files in `/routes/`** and mounts them based on filename conventions.

**✔️ Example:**
`productsRoutes.js` is mounted as `/products` automatically.



## ⚙️ Critical Config Files

**`.env`**
Contains your DB credentials, ports, secret keys, etc.

```bash
# --- MySQL/MariaDB ---
DB_MYSQL_HOST=localhost
DB_MYSQL_PORT=3306
DB_MYSQL_USER=root
DB_MYSQL_PASSWORD=you-dv-pass
DB_MYSQL_NAME=testdb
DB_MYSQL_POOL_LIMIT=10
```



**`semantq.config.js`**

```js
export default {
  database: {
    adapter: 'mysql' // or 'supabase' | 'mongodb' | 'sqlite'
  },
  server: {
    port: 3003
  },
  packages: {
    autoMount: true  // ← enables route auto-loading
  }
};
```



## Frontend API Call Example

you can use this js in front end page (route) e.g. if you installed @semantq/auth you can create a products page in `src/routes/auth/dashboard/products` then use this js in your @page.s,q file or you can import it from the public dir: `import '/public/getProducts.js'` 

```js
// public/getProducts.js
import AppConfig from '/public/app.config.js';

let products = [];

export async function fetchProducts() {
  try {
    const res = await fetch(`${AppConfig.SERVER_BASE_URL}/products/products`);
    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    const result = await res.json();

    if (result.success) {
      products = result.data;
      console.log('✅ Products populated inside fetchProducts():', products);
      return products;
    } else {
      throw new Error(result.message || 'Failed to fetch products');
    }
  } catch (err) {
    console.error('💥 fetchProducts error:', err);
    throw err;
  }
}

export function getProducts() {
  return products;
}

console.log('🟡 Before fetchProducts() call — products:', products);
// don't use the products object here

async function init() {
  await fetchProducts();
  console.log('🟢 After fetchProducts() — products:', products);
  // use the products object here 
}

init();

```

## ✅ Recap: Dev Workflow

| Step | Action                                             |
| : | :- |
| 1️⃣  | Create migration in `models/migrations/mysql/`     |
| 2️⃣  | Run `npm run migrate`                              |
| 3️⃣  | Create Model, Service, Controller                  |
| 4️⃣  | Define API routes in `routes/productsRoutes.js`    |
| 5️⃣  | Test frontend JS calls (no server.js edits needed) |
| 🔄   | Add new resources by repeating steps 1–5           |



## 🎉 Done.

This workflow keeps your CRUD services modular, auto-mounted, and easy to expand without extra manual server setup.

