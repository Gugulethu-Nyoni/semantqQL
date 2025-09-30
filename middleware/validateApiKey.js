import chalk from 'chalk';

const errorRed = chalk.hex('#ff4d4d');
const yellow = chalk.hex('#f0e66e');
const green = chalk.hex('#6ef0b5');
const gray = chalk.hex('#aaaaaa');

const ERROR_ICON = errorRed('✗');
const WARNING_ICON = yellow('⚠');
const SUCCESS_ICON = green('✓');

export const validateApiKey = (req, res, next) => {
    const APP_KEY = process.env.APP_KEY;
    
    // 🟡 DEVELOPMENT MODE (No API key configured)
    if (!APP_KEY) {
        console.log(`${WARNING_ICON} ${yellow('Development mode - API key not required')}`);
        req.isAuthorized = true;
        return next();
    }
    
    // 🔒 PRODUCTION SECURITY
    const apiKeyFromRequest = req.header('x-api-key');

    if (!apiKeyFromRequest) {
        console.log(`${ERROR_ICON} ${errorRed('Missing API key')}`);
        return res.status(401).json({ 
            message: 'Authorization required: Missing x-api-key header.' 
        });
    }
    
    if (apiKeyFromRequest === APP_KEY) {
        req.isAuthorized = true; 
        return next();
    } 
    
    console.log(`${ERROR_ICON} ${errorRed('Invalid API key')}`);
    return res.status(401).json({ message: 'Invalid API Key.' });
};