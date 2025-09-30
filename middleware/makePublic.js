// middleware/public.js

/**
 * Middleware function that explicitly marks a request as public/unprotected.
 * This function will be applied to specific routes to exclude them from 
 * the global API key validation middleware.
 */


export const makePublic = (req, res, next) => {
    req.isPublic = true;
    next();
};