# SemantqQL Auto-Routing System

## Overview

SemantqQL provides a powerful auto-routing system where resources are automatically discovered and mounted without any server configuration. Developers simply create resources using the CLI, and everything works out of the box.

## Quick Start

### Creating Resources

From your project root, generate a complete resource stack:

```bash
semantq make:resource Post
```

This single command creates:
- ✅ **Routes** (`routes/postRoutes.js`)
- ✅ **Controller** (`controllers/postController.js`) 
- ✅ **Service** (`services/postService.js`)
- ✅ **Model** (`models/Post.js`)
- ✅ **Auto-mounted** in your server (no config needed)

### How Auto-Discovery Works

1. **Run CLI Command**: `semantq make:resource Post`
2. **Files Generated**: Complete resource stack created
3. **Auto-Mounted**: Routes automatically discovered and mounted at `/post`
4. **Ready to Use**: API endpoints immediately available

## Route Security Levels

SemantqQL provides multiple security levels through simple, consistent wrappers:

### 🟢 Public Routes
**No authentication required**
```javascript
router.get('/posts', ...publicRoute(postController.getAllPosts));
router.get('/posts/:id', ...publicRoute(postController.getPostById));
```
**Use Case**: Public data, health checks, open APIs

### 🔵 API Key Routes  
**Service-to-service communication**
```javascript
router.get('/posts/stats', ...apiKeyRoute(postController.getPostStats));
```
**Use Case**: Internal services, background jobs, system integration

### 🟡 Authenticated Routes
**User JWT authentication required**
```javascript
router.post('/posts', ...authenticatedRoute(postController.createPost));
router.put('/posts/:id', ...authenticatedRoute(postController.updatePost));
```
**Use Case**: User-specific actions, personal data

### 🟠 Authorized Routes
**User JWT + specific access level**
```javascript
router.patch('/posts/:id', ...authorizedRoute(2, postController.patchPost)); // Editor
router.delete('/posts/:id', ...authorizedRoute(3, postController.deletePost)); // Admin
```
**Access Levels**:
- `1` - Basic User (default)
- `2` - Editor/Moderator
- `3` - Admin

**Use Case**: Role-based access control, administrative functions

### 🔴 Fully Protected Routes
**API key + User JWT authentication**
```javascript
router.post('/posts/bulk', ...fullyProtectedRoute(postController.bulkCreatePosts));
```
**Use Case**: High-security user actions, sensitive operations

### 🚨 Fully Authorized Routes
**API key + User JWT + specific role**
```javascript
router.post('/posts/system', ...fullyAuthorizedRoute(3, postController.systemCreatePost));
```
**Use Case**: Maximum security operations, system-level actions

## Complete Example: Post Resource

### Generated Route File
```javascript
// routes/postRoutes.js
import express from 'express';
import postController from '../controllers/postController.js';
import { 
  publicRoute, 
  apiKeyRoute,
  authenticatedRoute,
  authorizedRoute,
  fullyProtectedRoute,
  fullyAuthorizedRoute 
} from '../middleware/security.js';

const router = express.Router();

// 🟢 PUBLIC
router.get('/posts', ...publicRoute(postController.getAllPosts));
router.get('/posts/:id', ...publicRoute(postController.getPostById));

// 🔵 API_KEY  
router.get('/posts/stats', ...apiKeyRoute(postController.getPostStats));

// 🟡 AUTHENTICATED
router.post('/posts', ...authenticatedRoute(postController.createPost));
router.put('/posts/:id', ...authenticatedRoute(postController.updatePost));

// 🟠 AUTHORIZED
router.patch('/posts/:id', ...authorizedRoute(2, postController.patchPost));
router.delete('/posts/:id', ...authorizedRoute(3, postController.deletePost));

// 🔴 FULLY_PROTECTED
router.post('/posts/bulk', ...fullyProtectedRoute(postController.bulkCreatePosts));

// 🚨 FULLY_AUTHORIZED
router.post('/posts/system', ...fullyAuthorizedRoute(3, postController.systemCreatePost));

export default router;
```

### Auto-Discovered Endpoints
```
GET    /post/posts                    🟢 Public
GET    /post/posts/:id               🟢 Public
GET    /post/posts/stats             🔵 API Key
POST   /post/posts                   🟡 Authenticated  
PUT    /post/posts/:id               🟡 Authenticated
PATCH  /post/posts/:id               🟠 Authorized (Editor)
DELETE /post/posts/:id               🟠 Authorized (Admin)
POST   /post/posts/bulk              🔴 Fully Protected
POST   /post/posts/system            🚨 Fully Authorized
```

## Authentication Integration

### Built-in Auth System
SemantqQL includes a complete authentication system with these auto-discovered endpoints:

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
POST   /auth/create-article          Editor functions (level 2)
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

## Best Practices

### 1. Choose Appropriate Security Levels
- **Public**: Read-only, non-sensitive data
- **API Key**: Internal services, system functions
- **Authenticated**: User-owned data
- **Authorized**: Role-specific operations
- **Fully Protected**: High-value transactions
- **Fully Authorized**: Critical system operations

### 2. Resource Naming
- Use singular PascalCase for resource names: `Post`, `User`, `Product`
- Routes auto-mount at plural lowercase: `/post`, `/user`, `/product`

### 3. Access Level Strategy
- **Level 1**: Regular users
- **Level 2**: Content moderators, editors
- **Level 3**: System administrators

## Zero Configuration

The beauty of SemantqQL is that once you create resources:
- ✅ Routes auto-mounted
- ✅ Security middleware available  
- ✅ Authentication integrated
- ✅ No server.js changes needed
- ✅ Everything just works! 🚀

Simply create your resources and start building your API!