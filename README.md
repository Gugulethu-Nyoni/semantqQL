## 📦 `semantq_server` Backend

### Introduction

**`semantq_server`** is a swift, modern, **Node.js backend framework** built on **Express.js**.
Although framework-agnostic, it’s purposefully designed to complement and power the **Semantq JavaScript full-stack framework**.

It ships with:

* **CRUD-ready scaffolds**
* Modular **MCSR pattern** (Models, Controllers, Services, Routes)
* Out-the-box **multi-adapter database support**:

  * **MySQL**
  * **Supabase**
  * **MongoDB**
  * **SQLite**
* Elegant **migration runner** for database schema management
* Seamless **package/module auto-loading system** for extending functionality with minimal setup

---

## Installation

In a real-world project structure:

* Your **project root** (e.g. `myapp/`)
* `semantq_server` will sit inside your project as:
  `myapp/semantq_server/`

The install command in production-ready Semantq CLI will be:

```bash
semantq install:server
```

For now — clone or copy it manually into your project root.

---

## Configuration Setup

After installing the server module:

### 1. Copy Example Config & Env Files

From inside `semantq_server/` run:

```bash
npm run env:copy
npm run init
```

* **`.env.example`** → `.env`
* **`semantiq.config.example.js`** → `semantiq.config.js`

These files contain **example credentials and configuration keys** you must review and adjust for your environment.

**⚠️ Critical: Ensure both `.env` and `semantiq.config.js` exist and have valid config before proceeding.**
The server relies on these files to:

* Determine active DB adapter
* Load database connection credentials
* Load environment settings

---

## 📑 Running Migrations


**📌 Migration Templates**

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



Run database migrations based on the adapter you selected in `semantiq.config.js`:

```bash
npm run migrate
```

* Automatically detects the adapter (e.g. `mysql`, `supabase`)
* Runs all pending migrations from:

  ```
  semantq_server/models/migrations/<adapter>/
  ```
* Tracks applied migrations in a `migrations` table

---

## 🛠️ Development Commands

| Command            | Description                                |
| :----------------- | :----------------------------------------- |
| `npm run dev`      | Start server in development mode (nodemon) |
| `npm start`        | Start server normally                      |
| `npm run env:copy` | Copy `.env.example` to `.env`              |
| `npm run init`     | Copy config example file if missing        |
| `npm run migrate`  | Run pending DB migrations                  |

---

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

---

## 📌 Final Notes

* When deploying for production, you may add a local `.env` inside `semantq_server/` if needed, but the **project root `.env` should always be the master source**.
* Packages/modules added into `semantq_server/packages/` must follow the MCSR structure to be auto-loaded.

---

## 📖 Example CLI Install Plan (Coming Soon)

```bash
semantq install:server
cd semantq_server
npm install
npm run env:copy
npm run init
npm run migrate
npm run dev
```

---
