// middleware/security.js
import { authenticateToken } from '@semantq/auth/lib/middleware/authMiddleware.js';
import { authorize } from '@semantq/auth/lib/middleware/authorize.js';
import { validateApiKey } from './validateApiKey.js';

// Debug logging
const debug = process.env.NODE_ENV !== 'production';

/**
 * Security wrapper with comprehensive debugging and error handling
 */
function createSecurityWrapper(name, ...middlewares) {
  return (...handlers) => {
    if (debug) {
      console.log(`🛡️  ${name} - Creating security chain with ${middlewares.length} middleware(s) and ${handlers.length} handler(s)`);
    }
    
    // Validate that all handlers are functions
    const allHandlers = [...middlewares, ...handlers];
    const invalidHandlers = allHandlers.filter(handler => typeof handler !== 'function');
    
    if (invalidHandlers.length > 0) {
      console.error(`❌ SECURITY ERROR: ${name} - Invalid handlers detected:`, invalidHandlers);
      throw new Error(`Security wrapper '${name}' received non-function handlers`);
    }
    
    if (debug) {
      console.log(`✅ ${name} - Security chain created with ${allHandlers.length} total functions`);
    }
    
    return allHandlers;
  };
}

/**
 * Complete security wrappers with consistent naming and robust error handling
 */

// 🟢 PUBLIC - No authentication required
export const publicRoute = createSecurityWrapper(
  'PUBLIC_ROUTE'
  // No middleware - completely public
);

// 🔵 API_KEY - API key validation only (service-to-service)
export const apiKeyRoute = createSecurityWrapper(
  'API_KEY_ROUTE',
  validateApiKey
);

// 🟡 AUTHENTICATED - User JWT authentication only
export const authenticatedRoute = createSecurityWrapper(
  'AUTHENTICATED_ROUTE', 
  authenticateToken
);

// 🟠 AUTHORIZED - User JWT + specific access level
export const authorizedRoute = (requiredAccessLevel, ...handlers) => {
  if (debug) {
    console.log(`🛡️  AUTHORIZED_ROUTE - Required access level: ${requiredAccessLevel}`);
  }
  
  if (typeof requiredAccessLevel !== 'number') {
    throw new Error('authorizedRoute requires a numeric access level as first parameter');
  }
  
  const authMiddleware = (req, res, next) => {
    authorize(requiredAccessLevel)(req, res, next);
  };
  
  return createSecurityWrapper(
    `AUTHORIZED_ROUTE[level:${requiredAccessLevel}]`,
    authenticateToken,
    authMiddleware
  )(...handlers);
};

// 🔴 FULLY_PROTECTED - API key + User JWT authentication
export const fullyProtectedRoute = createSecurityWrapper(
  'FULLY_PROTECTED_ROUTE',
  validateApiKey,
  authenticateToken
);

// 🚨 FULLY_AUTHORIZED - API key + User JWT + specific access level (maximum security)
export const fullyAuthorizedRoute = (requiredAccessLevel, ...handlers) => {
  if (debug) {
    console.log(`🛡️  FULLY_AUTHORIZED_ROUTE - Required access level: ${requiredAccessLevel}`);
  }
  
  if (typeof requiredAccessLevel !== 'number') {
    throw new Error('fullyAuthorizedRoute requires a numeric access level as first parameter');
  }
  
  const authMiddleware = (req, res, next) => {
    authorize(requiredAccessLevel)(req, res, next);
  };
  
  return createSecurityWrapper(
    `FULLY_AUTHORIZED_ROUTE[level:${requiredAccessLevel}]`,
    validateApiKey,
    authenticateToken,
    authMiddleware
  )(...handlers);
};

// Export debug information
export const getSecurityDebugInfo = () => {
  return {
    publicRoute: 'No authentication',
    apiKeyRoute: 'API Key validation only',
    authenticatedRoute: 'JWT authentication only', 
    authorizedRoute: 'JWT + role authorization',
    fullyProtectedRoute: 'API Key + JWT authentication',
    fullyAuthorizedRoute: 'API Key + JWT + role authorization'
  };
};

// Log security setup on import
if (debug) {
  console.log('🔐 Security middleware loaded with wrappers:');
  console.log('   🟢 publicRoute - No authentication');
  console.log('   🔵 apiKeyRoute - API Key validation only');
  console.log('   🟡 authenticatedRoute - JWT authentication only');
  console.log('   🟠 authorizedRoute(level) - JWT + role authorization');
  console.log('   🔴 fullyProtectedRoute - API Key + JWT authentication');
  console.log('   🚨 fullyAuthorizedRoute(level) - API Key + JWT + role authorization');
}