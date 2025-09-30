# semantqQL Auto-Routing System

## Overview

semantqQL provides a powerful auto-routing system where resources are automatically discovered and mounted without any server configuration. Developers simply create resources using the CLI, and everything works out of the box.

# Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
  - [Creating Resources](#creating-resources)
  - [How Auto-Discovery Works](#how-auto-discovery-works)
- [Route Security Levels](#route-security-levels)
  - [Public Routes](#-public-routes)
  - [API Key Routes](#-api-key-routes)
  - [Authenticated Routes](#-authenticated-routes)
  - [Authorized Routes](#-authorized-routes)
  - [Fully Protected Routes](#-fully-protected-routes)
  - [Fully Authorized Routes](#-fully-authorized-routes)
- [Complete Example: Post Resource](#complete-example-post-resource)
  - [Routes Control Levels Break Down](#routes-control-levels-break-down)
- [Route Security Defaults](#route-security-defaults)
  - [Default: Authenticated Routes](#default-authenticated-routes)
  - [Making Routes Public](#making-routes-public)
  - [Quick Security Adjustment](#quick-security-adjustment)
- [Auto-Discovered Endpoints](#auto-discovered-endpoints-based-on-the-routes-set-up-above)
- [Authentication Integration](#authentication-integration)
  - [Built-in Auth System](#built-in-auth-system)
  - [Using JWT Tokens](#using-jwt-tokens)
- [API Key Usage](#api-key-usage)
- [Route Ordering Critical Note](#route-ordering-critical-note)
- [Getting Your App Key](#getting-your-app-key)
  - [Generate Your Key](#generate-your-key)
  - [Regenerate Key](#regenerate-key)
  - [Security Warning](#security-warning)
- [Best Practices](#best-practices)
  - [Default Security Level](#1-default-security-level)
  - [Route Ordering](#2-route-ordering)
  - [Quick Customization](#3-quick-customization)
  - [Access Level Strategy](#4-access-level-strategy)
- [Zero Configuration](#zero-configuration)

## Quick Start

### Creating Resources

From your project root, generate a complete resource stack:

```bash
semantq make:resource Post
```

This single command creates:
-  **Routes** (`routes/postRoutes.js`)
-  **Controller** (`controllers/postController.js`) 
-  **Service** (`services/postService.js`)
-  **Model** (`models/Post.js`)
-  **Auto-mounted** in your server (no config needed)

### How Auto-Discovery Works

1. **Run CLI Command**: `semantq make:resource Post`
2. **Files Generated**: Complete resource stack created
3. **Auto-Mounted**: Routes automatically discovered and mounted at `/post`
4. **Ready to Use**: API endpoints immediately available

## Route Security Levels

semantqQL provides multiple security levels through direct middleware composition:

## CORS Security Layer

All routes in semantqQL are protected by a universal CORS validation layer. Even your public routes undergo CORS checks to ensure they only accept requests from authorized domains.

## Configuration
The server validates origins against `server.config.js`:
```javascript
allowedOrigins: [
  'http://localhost:3000', // Vite dev server
  'https://example.com',   // Your production domain
]
```

## Important Notes
- **Update for production**: Modify `allowedOrigins` before deployment
- **Browser-only**: CORS only applies to web-based API calls (client-side JavaScript)
- **Does not affect**: Tools like Postman, curl, or server-to-server calls

## Multi-Layer Security
semantqQL implements comprehensive protection through:
1. **CORS** - Domain validation
2. **Authentication** - User identity  
3. **API Key** - Service authorization
4. **Authorization** - Role-based access

Plus strategic combinations of these layers for maximum security coverage.

### 🟢 Public Routes
**No authentication required**
```javascript
router.get('/posts', postController.getAllPosts);
router.get('/posts/:id', postController.getPostById);
```
**Use Case**: Public data, health checks, open APIs

### 🔵 API Key Routes  
**Service-to-service communication**
```javascript
router.get('/posts/stats', validateApiKey, postController.getPostStats);
```

**Important**: API key routes must be placed **before** parameterized routes to avoid conflicts

**Use Case**: Internal services, background jobs, system integration

### 🟡 Authenticated Routes
**User JWT authentication required**
```javascript
router.post('/posts', authenticateToken, postController.createPost);
router.put('/posts/:id', authenticateToken, postController.updatePost);
```
**Default Behavior**: All generated routes are pre-configured as authenticated routes

**Use Case**: User-specific actions, personal data

### 🟠 Authorized Routes
**User JWT + specific access level**
```javascript
router.patch('/posts/:id', authenticateToken, authorize(2), postController.patchPost);
router.delete('/posts/:id', authenticateToken, authorize(3), postController.deletePost);
```
**Access Levels**:
- `1` - Basic User (default)
- `2` - Editor/Moderator
- `3` - Admin

**Use Case**: Role-based access control, administrative functions

### 🔴 Fully Protected Routes
**API key + User JWT authentication**
```javascript
router.post('/posts/bulk', validateApiKey, authenticateToken, postController.bulkCreatePosts);
```
**Use Case**: High-security user actions, sensitive operations

### 🚨 Fully Authorized Routes
**API key + User JWT + specific role**
```javascript
router.post('/posts/system', validateApiKey, authenticateToken, authorize(3), postController.systemCreatePost);
```

**Note**: When making API calls to SemantqQL routes, you must prefix with the **singular lowercase version** of the resource name. This corresponds to the filename segment of your routes file.

For example, after generating a resource with:

```bash
semantq make:resource Post
```

SemantqQL creates `routes/postRoutes.js` - you'll prefix all routes from this file with `post`:

- Route in file: `GET /posts`
- API call: `GET /post/posts`

- Route in file: `GET /posts/:id`  
- API call: `GET /post/posts/123`

- Route in file: `POST /posts`
- API call: `POST /post/posts`

The server automatically handles this mapping, so don't worry about the apparent mismatch between your API call routes and the target routes defined in your route files.

This convention keeps URLs clean and follows RESTful best practices while maintaining clear file organization.


**Use Case**: Maximum security operations, system-level actions

## Complete Example: Post Resource

### Routes Control Levels Break Down 
```javascript
// routes/postRoutes.js
import express from 'express';
import postController from '../controllers/postController.js';
import { validateApiKey } from '../middleware/validateApiKey.js';
import { authenticateToken } from '@semantq/auth/lib/middleware/authMiddleware.js';
import { authorize } from '@semantq/auth/lib/middleware/authorize.js';

const router = express.Router();

// =========================================================================
// 🔵 API_KEY - Service-to-service communication - DIRECT MIDDLEWARE
// THIS MUST COME FIRST to ensure it is not blocked by /posts/:id
router.get('/posts/stats', validateApiKey, postController.getPostStats); 
// =========================================================================

// 🟢 PUBLIC - No authentication
router.get('/posts', postController.getAllPosts);
router.get('/posts/:id', postController.getPostById); // Now, only IDs (not 'stats') will reach this

// 🟡 AUTHENTICATED - Logged-in users only
router.post('/posts', authenticateToken, postController.createPost);
router.put('/posts/:id', authenticateToken, postController.updatePost);

// all your resource routes will be set up as AUTHENTICATED by default- this is best suited for most web apps where resource api calls are confined to logged in admins or end user dashboards - for public resources like blog posts or an event listing page on the public facing web page you can use the no authenticantion setp up like - router.get('/posts/:id', postController.getPostById); 


// 🟠 AUTHORIZED - Specific user roles
// router.patch('/posts/:id', authenticateToken, authorize(2), postController.patchPost);
// router.delete('/posts/:id', authenticateToken, authorize(3), postController.deletePost);

// 🔴 FULLY_PROTECTED - API key + user authentication
// router.post('/posts/bulk', validateApiKey, authenticateToken, postController.bulkCreatePosts);

// 🚨 FULLY_AUTHORIZED - API key + user authentication + specific role
// router.post('/posts/system', validateApiKey, authenticateToken, authorize(3), postController.systemCreatePost);

export default router;
```

# Route Security Defaults

## Default: Authenticated Routes

All your resource routes are configured as **AUTHENTICATED by default**. This security-first approach is ideal for most web applications where API calls should be confined to:

- **Admin dashboards** and control panels
- **User-specific data** and personal accounts  
- **Protected content** behind login walls
- **Transactional operations** requiring user identity

## Example: Default Generated Routes
```javascript
// 🟡 AUTHENTICATED - Default configuration
router.post('/posts', authenticateToken, postController.createPost);
router.put('/posts/:id', authenticateToken, postController.updatePost);
```

## Making Routes Public

For public-facing resources that don't require authentication, simply remove the `authenticateToken` middleware:

### Public Use Cases:
- **Blog posts** and articles
- **Event listings** and calendars  
- **Product catalogs** and displays
- **Public profiles** and portfolios

### Example: Public Route Configuration
```javascript
// 🟢 PUBLIC - No authentication required
router.get('/posts', postController.getAllPosts);
router.get('/posts/:id', postController.getPostById);
```

## Quick Security Adjustment

**To make a route public:**
```javascript
// Change from authenticated:
router.get('/posts', authenticateToken, postController.getAllPosts);

// To public (remove authenticateToken):
router.get('/posts', postController.getAllPosts);
```

This default setup ensures your API starts secure while giving you full flexibility to open up endpoints as needed for public access.

### Auto-Discovered Endpoints (Based on the routes set up above)
```
GET    /post/posts                   🟢 Public
GET    /post/posts/:id               🟢 Public
GET    /post/posts/stats             🔵 API Key
POST   /post/posts                   🟡 Authenticated  
PUT    /post/posts/:id               🟡 Authenticated
```

**Note**: Only authenticated routes are active by default. Other security levels are provided as commented examples for quick reference.

## Authentication Integration

### Built-in Auth System
semantqQL includes a complete authentication system with these auto-discovered endpoints:

```
POST   /auth/signup                  User registration
POST   /auth/confirm                 Email confirmation  
POST   /auth/login                   User login
POST   /auth/forgot-password         Password reset
POST   /auth/reset-password          Password reset completion
GET    /auth/validate-session        Session validation
GET    /auth/verify-token            Token verification  
GET    /auth/profile                 User profile
POST   /auth/logout                  User logout
GET    /auth/admin-dashboard         Admin dashboard (level 3)
```

### Using JWT Tokens
All authenticated routes use JWT tokens from the auth system:
```bash
# Get token
curl -X POST http://localhost:3003/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Use token in protected routes  
curl -X POST http://localhost:3003/post/posts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Post","body":"Content"}'
```

## API Key Usage

For API key protected routes:
```bash
curl -X GET http://localhost:3003/post/posts/stats \
  -H "x-api-key: YOUR_API_KEY"
```

For fully protected routes (API key + JWT):
```bash
curl -X POST http://localhost:3003/post/posts/bulk \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[{"title":"Post 1"},{"title":"Post 2"}]'
```

## Route Ordering Critical Note

**⚠️ IMPORTANT**: API key routes with specific paths MUST be placed **before** parameterized routes:

```javascript
//  CORRECT - API key route comes first
router.get('/posts/stats', validateApiKey, postController.getPostStats);
router.get('/posts/:id', postController.getPostById);

// ❌ INCORRECT - Parameterized route will block 'stats'
router.get('/posts/:id', postController.getPostById);
router.get('/posts/stats', validateApiKey, postController.getPostStats); // Never reached
```

# Getting Your App Key

## Generate Your Key
From your project root:
```bash
cd semantqQL
npm run init
```

Your App Key will be:
- Stored in `semantqQL/.env` 
- Displayed on screen after generation

## Regenerate Key
```bash
npm run init --force-key
```

## Security Warning
**Never expose your key in client-side code** - this creates serious security risks. Instead, route client requests through a proxy server that securely adds the API key.


## Best Practices

### 1. Default Security Level
- **All routes are generated as authenticated** by default
- **Public routes**: Remove `authenticateToken` middleware
- **Enhanced security**: Uncomment and customize the provided examples

### 2. Route Ordering
- Place specific routes before parameterized routes
- API key routes should always come before `/:id` routes
- Follow the generated template structure

### 3. Quick Customization
To change security levels, simply:
- **Remove** `authenticateToken` for public access
- **Add** `authorize(level)` for role-based access  
- **Add** `validateApiKey` for service-to-service
- **Combine** middleware for maximum security

### 4. Access Level Strategy
- **Level 1**: Regular users (default authenticated)
- **Level 2**: Content moderators, editors
- **Level 3**: System administrators

## Zero Configuration

The beauty of semantqQL is that once you create resources:
-  Routes auto-mounted with sensible defaults
-  All routes pre-configured as authenticated
-  Complete security examples provided
-  No server.js changes needed
-  Everything just works! 🚀

Simply create your resources and start building your API! The generated routes provide authenticated access by default with comprehensive examples for all other security levels when needed.