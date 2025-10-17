# semantqQL Production Deployment Guide

This guide outlines the complete setup for deploying a full-stack Semantq application. The docs is specifically for: **Frontend hosted on cPanel** and the **Backend (semantqQL) hosted on Render.com**.

## 1\. Database and Remote Access Setup (cPanel)

The first step is to establish your production database and allow the remote backend service (on Render.com) to connect to it.

### 1.1 Create Database and Credentials

1.  Log in to your cPanel account.
2.  Navigate to **MySQL Databases**.
3.  **Create a new Database.**
4.  **Create a new Database User** with a strong password.
5.  **Add the User to the Database**, ensuring you grant **ALL PRIVILEGES**.
6.  **Securely save** the Database Name, Username, and Password.

### 1.2 Determine Connection Details

1.  **Shared IP Address:** Locate your server's **Shared IP Address** on the cPanel landing page (typically under **General Information**).

      * *Example: `169.797.000.11`*

2.  **Construct the `DATABASE_URL`:** Use these credentials to form the full database connection string.

    ```bash
    DATABASE_URL=mysql://dbuser:dbpassword@sharedIp_address/dbname

    # Example: mysql://some_user:securepassword@169.797.000.11/some_db
    ```

### 1.3 Configure Remote Database Access

You must explicitly grant permission for your remote Render.com instance to access your cPanel database.

1.  In cPanel, go to **Remote Database Access** (or **Remote MySQL**).
2.  Obtain the **Public IP Address** of your Render.com instance (you may need to deploy it first to get this, or check Render's documentation for static outgoing IPs if available).
3.  In the **Add Access Host** field, enter the Render.com IP address.
4.  Click the **Add Host Button** to save.


## 2\. Backend Setup and Version Control (semantqQL & GitHub)

Prepare your backend code and push it to your repository for deployment.

1.  **Deploy to GitHub:** Ensure your complete Semantq full-stack application code is pushed to a **GitHub repository**.
2.  **Identify Backend Root:** Note that the backend code root is **`semantqQL`**. This will be used during the Render.com setup.


## 3\. Render.com Deployment and Environment Variables

Deploy the backend service and configure the necessary production settings and database credentials.

### 3.1 Create Render Web Service

1.  On Render.com, create a **New Web Service**.
2.  Connect your GitHub repository to the service.
3.  Set the **Root Directory** for the service to **`semantqQL`**.

### 3.2 Configure Environment Variables

Add your production environment variables to the Render.com dashboard (as key-value pairs). 

```bash
KEY=VALUE
ANOTHER_KEY=ANOTHER_VALUE
```

These should match the variables used locally but contain the production-ready values, including the new cPanel database details.

| Key | Example Value | Purpose |
| :--- | :--- | :--- |
| **`NODE_ENV`** | `production` | Ensures the application runs in production mode. |
| **`PORT`** | `3003` | The port the backend should listen on. |
| **`BASE_URL`** | `https://api-app-prod.onrender.com` | The URL of the Render backend. |
| **`FRONTEND_BASE_URL`**| `https://my-app-domain.com` | The public URL of the frontend. |
| **`DB_MYSQL_HOST`** | `192.168.0.50` | The **cPanel Shared IP Address**. |
| **`DB_MYSQL_PORT`** | `3306` | MySQL port. |
| **`DB_MYSQL_USER`** | `cpaneluser_dbadmin` | The cPanel DB username. |
| **`DB_MYSQL_PASSWORD`** | `pAsSwOrD!123S3cr3t` | The cPanel DB password. |
| **`DB_MYSQL_NAME`** | `cpaneluser_proddb` | The cPanel Database Name. |
| **`DATABASE_URL`** | `mysql://cpaneluser_dbadmin:pAsSwOrD!123S3cr3t@192.168.0.50/cpaneluser_proddb` | Full database connection string. |
| **`RESEND_API_KEY`** | `re_prod_XXXXXXXXXXXXXXXXXXXX` | Live Resend API Key. |
| **`JWT_SECRET`** | `aVerySecureKeyForJWTs12345` | Secure secret for JWTs. |
| *... (Other variables like `YOCO_SECRET_KEY`, `HASH_SECRET`, etc.)* | | |


## 4\. Frontend Build and Deployment (cPanel)

Finalize the frontend configuration, build the production files, and upload them to your cPanel hosting.

### 4.1 Update Configuration Files

1.  **Set `targetHost` in `semnatq.config.js`:**
    Set the `targetHost` to your **remote domain URL** before building the frontend. This is essential for ensuring the build constructs correct URLs and routing for your production version particularly if you have semantqNav enabled in your config. 

    ```javascript
    // semnatq.config.js
    export default {
        // ...
        targetHost: 'https://yourwebsite.com', // Set to your live public domain
        // ...
    };
    ```

2.  **Update Authentication URL:**
    Set the `production` URL in the `BASE_URLS` object in `project_root/public/auth/js/config.js` to point to your deployed **Render.com backend URL**.

    ```javascript
    // project_root/public/auth/js/config.js
    BASE_URLS: {
        development: 'http://localhost:3003/@semantq/auth',
        production: 'https://example-ghhr.onrender.com/@semantq/auth'
    },
    ```

### 4.2 Build and Upload

1.  **Run Build:** Execute the build command to generate the production files.

    ```bash
    npm run build
    ```

2.  **Zip and Upload:**

      * Create a ZIP archive of the generated **`dist`** directory (`project_root/dist`).
      * Upload this ZIP file to the **correct directory** on your cPanel via the File Manager (e.g., `public_html`).
      * **Unzip** the archive.
      * **Move the contents** of the unzipped directory into the final public web directory (e.g., move all contents from `/dist` to `/public_html`).

## 5\. 🔒 Cross-Origin Communication Security

Since the frontend (cPanel) and backend (Render.com) are on different domains, ensure security headers and client calls are correctly configured for cross-site cookie handling.

### 5.1 Cookie Policy (Backend/semantqQL)

The backend must set the `sameSite` and `secure` cookie flags correctly:

  * **Production:** `sameSite: 'none'` and `secure: true`. This allows the browser to send cookies in cross-site contexts, but only over HTTPS (which Render and cPanel should provide).
  * **Development:** `sameSite: 'lax'` is typically used. **For semantqQL (with @semantq/auth) this is taken care of by default.**

### 5.2 Frontend API Calls (`credentials: 'include'`)

If you are using custom `fetch` calls from the frontend, you must explicitly include credentials:

  * **Using semantqQL Abstraction:** If you are using the framework's built-in API abstraction (`smQL`), this step is **handled for you**.
  * **Direct `fetch` Calls:** For any raw `fetch` requests, the `credentials: 'include'` option is **mandatory** to send authentication cookies (like session tokens) to the cross-origin backend.

<!-- end list -->

```javascript
// Example: Direct fetch POST with credentials
const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // CRITICAL: Tells the browser to attach cookies
    credentials: 'include', 
    body: JSON.stringify(userData)
};

fetch('https://api.your-backend.com/users/profile', options)
    // ...
```

You can then deploy your instance to ensure that the front end can communicate with the backend of app. 


## semantQL Main Documentation: [semantQL](https://github.com/Gugulethu-Nyoni/semantqQL)
## Semantq Main Documentation: [Semantq](https://github.com/Gugulethu-Nyoni/semantq).

**License**
Semantq is open-source software licensed under the **MIT License**.
