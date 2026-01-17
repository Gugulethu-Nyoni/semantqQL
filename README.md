## `semantqQL` Server

### Introduction

**`semantqQL`** is a swift, modern, **Node.js backend framework** built on **Express.js**.
Although framework-agnostic, it’s purposefully designed to complement and power the **Semantq JavaScript full-stack framework**.

It ships with the following:

* **CRUD-ready scaffolds**
* Modular **MCSR pattern** (Models, Controllers, Services, Routes)
* Out-the-box **multi-adapter database support**:

  * **MySQL**
  * **Supabase**
  * **MongoDB** - to be added 
  * **SQLite**  - to be added
* Elegant **migration runner** for database schema management
* Seamless **package/module auto-loading system** for extending functionality with minimal setup


## Installation

In a real-world project structure:

* Your **Semantq project root** (e.g. `myapp/`)
* `semantqQL` will sit inside your project as:
  `myapp/semantqQL/`

The install command in production-ready Semantq CLI will be:

```bash
semantq install:server
```

This will clone the semantqQL repo to the root of your app e.g. myapp/semantqQL

## Configuration Setup

After installing the server module:

### 1. Initialising the server 

Use the commands below to into the server directory to initialise it. 

```bash
cd semantqQL
npm run init
```

In the Semantq project context `npm run init` will pick up existence of .env and server.config.js in your Semantq project root and you're sorted.

You just need to add this to your semantqproject/server.config.js:

```bash
export default {
  // other configs here
  someConfigs: {


  },  
// add these configs for the server 
  database: {
    adapter: 'supabase' // or 'mysql' | 'mongodb' | 'sqlite'
  },
  server: {
    port: 3002
  },
  packages: {
    autoMount: true
  }
/// end of server configs

};
```


**Note** If you are deploying the server as a stand alone (outside the Semantq JS Framework) you will need to run this command:

```bash
npm run env:copy
```


This will copy example config & Env files

From inside `semantqQL/` run:

```bash
npm run env:copy
npm run init
```

* **`.env.example`** → `.env`
* **`semantiq.config.example.js`** → `semantiq.config.js`

These files contain **example credentials and configuration keys** you must review and adjust for your environment.

**⚠️ Critical: Ensure both `.env` and `semantiq.config.js` exist and have valid configs before proceeding.**
The server relies on these files to:

* Determine active DB adapter
* Load database connection credentials
* Load environment settings


## Running Migrations


** Migration Templates**

We’ve provided **template migration sample files** inside:

```
models/migration_repos/name_of_db_adapter e.g. models/migration_repos/mysql
```

To activate them:

* **Copy the relevant migration files** from `models/migration_repos/<adapter>/`
  **to**
  `models/migrations/<adapter>/`

**Example:**
To set up MySQL migrations:

```bash
cp models/migration_repos/mysql/* models/migrations/mysql/
```

Do the same based on your specified db adaper e.g. `supabase/`, `mongodb/`, or `sqlite/` as needed.

**ℹ️ Note:** Only files inside `models/migrations/<adapter>/` are picked up and executed by the migration runner.

**Note** For Supabase, you will need to copy the sample migrations and modify them according to your needs or create new ones, following the standard Supabase migration format and location. You can copy the provided templates into your project’s projectroot/supabase/migrations directory.


Run database migrations based on the adapter you selected in `semantiq.config.js`:

```bash
npm run migrate
```

* Automatically detects the adapter (e.g. `mysql`, `supabase`)
* Runs all pending migrations from:

  ```
  semantqQL/models/migrations/<adapter>/
  ```
* Tracks applied migrations in a `migrations` table


## 🛠️ Development Commands

| Command            | Description                                |
| :----------------- | :----------------------------------------- |
| `npm run dev`      | Start server in development mode (nodemon) |
| `npm start`        | Start server normally                      |
| `npm run env:copy` | Copy `.env.example` to `.env`              |
| `npm run init`     | Copy config example file if missing        |
| `npm run migrate`  | Run pending DB migrations                  |


## 📦 Architecture (MCSR Pattern)

**Core Semantq Server follows a clean MCSR pattern**:

```
models/       → data models + adapter connectors + migrations  
services/     → pure business logic  
controllers/  → API endpoint handlers  
routes/       → Express routes mounting controllers  
packages/     → plug-and-play Semantq-compatible modules  
config/       → environment and Semantq config files  
lib/          → core utilities and package auto-loader  
server.js     → application entry point  
```


## Important Notes

* When deploying for production, you may add a local `.env` inside `semantqQL/` if needed, but the **project root `.env` should always be the master source**.
* Packages/modules added into `semantqQL/packages/` must follow the MCSR structure to be auto-loaded.


## CRUD Implementation with MCSR Pattern

### Overview of MCSR

Semantq Server follows a clean **MCSR architecture** pattern for structuring API functionality:

* **M**odel — direct interaction with the database (raw queries)
* **C**ontroller — handles HTTP request and response logic
* **S**ervice — business logic layer, interacts with models
* **R**oute — defines API endpoints and assigns controllers to handle them

## 📑 CRUD Implementation Steps

We already covered database migrations earlier.
Now let’s break down CRUD implementation in **MCSR order** — starting with the **Route**, down to the **Model**:


### 1️⃣ Create a Route

Routes live in the `/routes/` directory.

**File:** `routes/userRoutes.js`

```javascript
import express from 'express';
import userController from '../controllers/userController.js';

const router = express.Router();

router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUserById);
router.post('/users', userController.createUser);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

export default router;
```

**➡ Why first?**
Setting up routes early lets you map your planned API structure cleanly and drive what controllers need to exist.


###  2️⃣ Create the Controller

Controllers handle incoming HTTP requests, call services, and return responses.

**File:** `controllers/userController.js`

```javascript
import userService from '../services/userService.js';

const userController = {
  async getAllUsers(req, res) {
    const users = await userService.getAllUsers();
    res.json({ success: true, data: users });
  },
  async getUserById(req, res) {
    const user = await userService.getUserById(req.params.id);
    res.json({ success: true, data: user });
  },
  async createUser(req, res) {
    const newUser = await userService.createUser(req.body);
    res.status(201).json({ success: true, data: newUser });
  },
  async updateUser(req, res) {
    const updatedUser = await userService.updateUser(req.params.id, req.body);
    res.json({ success: true, data: updatedUser });
  },
  async deleteUser(req, res) {
    await userService.deleteUser(req.params.id);
    res.status(204).end();
  }
};

export default userController;
```


### Create the Service

Services handle business logic and act as a bridge between controllers and models.

**File:** `services/userService.js`

```javascript
import models from '../models/index.js';

const userService = {
  async getAllUsers() {
    return await models.User.findAllUsers();
  },
  async getUserById(id) {
    return await models.User.findUserById(id);
  },
  async createUser(data) {
    return await models.User.createUser(data);
  },
  async updateUser(id, data) {
    return await models.User.updateUser(id, data);
  },
  async deleteUser(id) {
    return await models.User.deleteUser(id);
  }
};

export default userService;
```

** Why third?**
Services allow you to encapsulate app logic separately from HTTP handling or DB logic — keeping things modular and clean.


### Create the Model

Models handle direct database access using raw SQL or an ORM.

**File:** `models/mysql/User.js`

```javascript
import { v4 as uuidv4 } from 'uuid';
import db from '../adapters/mysql.js';

const User = {
  async findAllUsers() {
    const [rows] = await db.query('SELECT * FROM users');
    return rows;
  },
  async findUserById(id) {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  },
  async createUser(data) {
    const { email, password } = data;
    const uuid = uuidv4();
    await db.query(
      'INSERT INTO users (uuid, email, password_hash) VALUES (?, ?, ?)',
      [uuid, email, password]
    );
    const [rows] = await db.query('SELECT * FROM users WHERE uuid = ?', [uuid]);
    return rows[0];
  },
  async updateUser(id, data) {
    const { email, password, name } = data;
    await db.query(
      'UPDATE users SET email = ?, password_hash = ?, name = ? WHERE id = ?',
      [email, password, name, id]
    );
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  },
  async deleteUser(id) {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    return true;
  }
};

export default User;
```


## Recap Flow

✔️ **Route** calls →
✔️ **Controller** calls →
✔️ **Service** calls →
✔️ **Model** interacts with DB

Each layer stays clean and handles a specific single responsibility.



## 📁 Folder Structure

```bash
routes/
  userRoutes.js
controllers/
  userController.js
services/
  userService.js
models/
  mysql/
    User.js
```



## Testing CRUD via `curl`

You can run curl api calls on the terminal or use Postman to test this server. 
Example calls:

**Create User**

```bash
curl -X POST http://localhost:3000/user/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"abc123"}'
```

**Get User**

```bash
curl -X GET http://localhost:3000/user/users/1
```

**Update User**

```bash
curl -X PUT http://localhost:3000/user/users/1 \
  -H "Content-Type: application/json" \
  -d '{"email":"updated@example.com","password":"newpass","name":"Updated Name"}'
```

**Delete User**

```bash
curl -X DELETE http://localhost:3000/user/users/1
```

## API and Packages Documentation
- [semantqQL Routing](docs/Routing.md)
- [Semantq API Reference](docs/SemantqApi.md)
- [Semantq Packages Guide](docs/SemantqPackages.md)
- [Full Stack Semantq CRUD Guide](docs/Semantq_CRUD.md)
- [Production Deployment Guide](docs/ProductionDeploymentGuide.md)


# SemantqQL Module Management CLI

## Background: MCSR Architecture & Auto-Discovery

SemantqQL follows the **MCSR (Model, Controller, Service, Route)** architecture with intelligent auto-discovery. This means:

- **No manual route registration**: SemantqQL automatically discovers and loads modules from `node_modules/` and `packages/` directories
- **Zero-config for valid modules**: Any package with `"semantq-module": true` in its `package.json` is automatically loaded
- **Automatic route mounting**: Module routes are mounted under their package name (e.g., `@semantq/auth` routes become available at `/@semantq/auth/*`)

## The Problem: npm Modules in Production

When you install Semantq modules via npm:

```bash
npm install @semantq/auth
```

They get installed to `node_modules/@semantq/auth/`. While this works for development, it creates issues in production:

### Issues with npm Modules in Production:

1. **Customization Loss**: When deploying to services like Render.com, Vercel, or AWS, the platform reinstalls all `node_modules` from your `package.json`
2. **Changes Overwritten**: Any customizations you make to modules in `node_modules/` are lost during deployment
3. **Version Conflicts**: You might be locked into npm versions when you need to customize

### The Solution: Local Package Directory

The `packages/` directory provides a safe space for:

1. **Custom Semantq modules** you develop locally
2. **Customized npm modules** moved from `node_modules/`
3. **Version-controlled modifications** that persist across deployments

## Module Auto-Discovery Rules

SemantqQL discovers modules with these criteria:

### 1. Required: `semantq-module` Flag
```json
{
  "name": "@semantq/auth",
  "semantq-module": true,  // ← REQUIRED FOR AUTO-DISCOVERY
  "version": "1.0.10"
}
```

### 2. Valid Locations:
```
my-project/
├── packages/                    # Custom & moved modules
│   ├── semantq-api-proxy/      # Non-scoped package
│   └── @semantq/               # Scoped namespace
│       └── auth/               # Scoped package
├── node_modules/               # npm-installed modules
│   └── @semantq/
│       ├── auth/               # Will be discovered
│       └── forms/              # Will be discovered
└── server.js                   # Auto-loads all valid modules
```

### 3. Route Structure:
Modules must have this structure:
```
@semantq/auth/
├── package.json
├── index.js
└── routes/
    └── authRoutes.js          # Auto-mounted at /@semantq/auth
```

## CLI Commands: `semantq modules:move`

### Basic Usage:
```bash
# Move specific module from node_modules to packages
semantq modules:move @semantq/auth

# Move ALL Semantq modules
semantq modules:move --all

# Dry run (see what would happen without moving)
semantq modules:move @semantq/auth --dry-run
```

### Advanced Options:

```bash
# Force move (overwrite existing in packages/)
semantq modules:move @semantq/auth --force

# Create symlink (keep node_modules compatibility)
semantq modules:move @semantq/auth --symlink

# Combination: force + symlink
semantq modules:move @semantq/auth --force --symlink
```

## When to Use Which Command

### Scenario 1: Standard Development
```bash
# Move module and create symlink for seamless development
semantq modules:move @semantq/auth --symlink

# Benefits:
# - Module in packages/ (safe from npm overwrites)
# - Symlink in node_modules/ (imports still work)
# - Edits persist across deployments
```

### Scenario 2: Customizing a Module
```bash
# 1. Move module to packages
semantq modules:move @semantq/forms

# 2. Customize the module in packages/@semantq/forms/
# 3. Commit changes to git
git add packages/@semantq/forms
git commit -m "Customize forms module"

# 4. Deploy - customizations persist!
```

### Scenario 3: Production Deployment
```bash
# In Dockerfile or CI/CD pipeline:
RUN semantq modules:move --all
# No symlinks needed for production
```

## Workflow Examples

### Example 1: Full Development Setup
```bash
# 1. Install npm modules
npm install @semantq/auth @semantq/forms @semantq/notifications

# 2. Move all to packages with symlinks
semantq modules:move --all --symlink

# 3. Customize modules in packages/
code packages/@semantq/auth/routes/authRoutes.js

# 4. Run server - changes immediately available
npm run dev
```

### Example 2: Team Collaboration
```bash
# Developer A:
semantq modules:move @semantq/auth
git add packages/@semantq/auth
git commit -m "Move auth module to packages"

# Developer B:
git pull
# Module is already in packages/, ready to use
```

### Example 3: Production Ready
```bash
# Development environment:
semantq modules:move @semantq/auth --symlink

# Production build (in Dockerfile):
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN semantq modules:move --all  # No symlinks
CMD ["npm", "start"]
```

## Important Notes

### 1. Git Considerations
```bash
# Add packages/ to version control
echo "/packages/" >> .gitignore

# But track specific modules:
git add packages/@semantq/auth
```

### 2. npm Script Integration
Add to your `package.json`:
```json
{
  "scripts": {
    "postinstall": "semantq modules:move --all --symlink",
    "prebuild": "semantq modules:move --all"
  }
}
```

### 3. Module Discovery Priority
1. **First**: `packages/` directory
2. **Second**: `node_modules/` directory
3. **Duplicates**: Modules in `packages/` take precedence

## Troubleshooting

### Common Issues:

1. **Module not discovered?**
   - Check `package.json` has `"semantq-module": true`
   - Verify module has `routes/` directory
   - Ensure module is in correct location

2. **Symlink issues on Windows?**
   ```bash
   # Run as administrator or use WSL
   semantq modules:move @semantq/auth --symlink
   ```

3. **Permission errors?**
   ```bash
   # Use sudo on Linux/Mac
   sudo semantq modules:move @semantq/auth
   ```

4. **Routes not working after move?**
   - Restart the SemantqQL server
   - Check server logs for module loading messages

## Best Practices

1. **Development**: Always use `--symlink` for local work
2. **Production**: Never use symlinks in production builds
3. **Version Control**: Commit customized modules in `packages/`
4. **Dependencies**: Remove moved modules from `package.json` dependencies
5. **Testing**: Test both symlinked and non-symlinked setups

## FAQ

### Q: Do I need to update imports after moving modules?
**A:** No! If you use `--symlink`, imports continue working. If not, update imports from `@semantq/auth` to `../../packages/@semantq/auth`.

### Q: What happens to the original in node_modules?
**A:** It's moved to `packages/`. With `--symlink`, a symlink remains in `node_modules/`.

### Q: Can I move non-Semantq modules?
**A:** Only modules with `"semantq-module": true` will be discovered by SemantqQL.

### Q: How does this affect npm updates?
**A:** Moved modules won't receive npm updates. You'll need to manually update them in `packages/`.

### Q: What about peer dependencies?
**A:** Ensure required peer dependencies are still in `package.json`.

## Summary

The `semantq modules:move` command bridges the gap between npm convenience and production reliability:

- **Development**: Keep modules in `packages/` with `node_modules/` symlinks
- **Customization**: Safely modify modules without npm interference
- **Deployment**: Ensure customizations persist in production
- **Zero-config**: SemantqQL auto-discovers everything automatically

This approach gives you the best of both worlds: npm's ease of installation with the safety and flexibility of local modules.



### Suggested Modules

#### [`@semantq/auth`](https://github.com/Gugulethu-Nyoni/semantq_auth)

A full-stack, database-backed authentication module for Semantq Server.
Includes built-in support for email-based registration, confirmation, login, and password recovery.


#### [`Semantq Auth UI`](https://github.com/Gugulethu-Nyoni/semantq_auth_ui)

Plug-and-play frontend UI for `@semantq/auth`.
Includes all necessary HTML, CSS, and JS assets to get your authentication flow working out of the box.




