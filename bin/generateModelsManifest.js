import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define the relative path for the output file
// Assumes running from 'bin' and outputting to 'lib'
const OUTPUT_FILE_PATH = join(__dirname, '..', 'lib', 'models_manifest.js');

/**
 * Parses the Prisma schema to extract model names.
 * @param {string[]} excludedModels - List of models to exclude from the final output.
 * @returns {object} The full manifest object with total, excluded, and included lists.
 */
export function createModelManifest(excludedModels = []) {
    // Corrected path: navigate up one level (..) from /bin/
    const schemaPath = join(__dirname, '..', 'prisma', 'schema.prisma');
    const schema = readFileSync(schemaPath, 'utf8');
    
    // Regex to find 'model ModelName {'
    const modelRegex = /model\s+(\w+)\s*{/g;
    const models = [];
    let match;
    
    while ((match = modelRegex.exec(schema)) !== null) {
        models.push(match[1]);
    }
    
    const includedModels = models.filter(model => !excludedModels.includes(model));
    
    return {
        timestamp: new Date().toISOString(),
        totalModels: models.length,
        excludedModels,
        includedModels,
        models: includedModels.reduce((acc, model) => {
            acc[model] = { included: true };
            return acc;
        }, {})
    };
}


// --- Execution and File Writing ---

// List of models to exclude from the final API output
const excluded = [
    'AuthLog', 
    'Session', 
    'Feature', 
    'PricingPackage', 
    'PricingPackageFeature', 
    'Metering', 
    'User'
];

const manifest = createModelManifest(excluded);

try {
    // 1. Create the final, simplified model object structure:
    //    { ModelName: { id: N, name: 'ModelName' }, ... }
    const finalModelObject = manifest.includedModels.reduce((acc, model, index) => {
        // Use index + 1 for a simple sequential ID starting at 1
        acc[model] = {
            id: index + 1,
            name: model
        };
        return acc;
    }, {});

    // 2. Format the content as an ES Module default export
    const fileContent = `export default ${JSON.stringify(finalModelObject, null, 2)};\n`;

    // 3. Write the file to the output path
    writeFileSync(OUTPUT_FILE_PATH, fileContent, 'utf8');

    console.log(`Model manifest successfully generated at: ${OUTPUT_FILE_PATH}`);
    
    // Log the FINAL generated output for easy confirmation
    console.log(JSON.stringify(finalModelObject, null, 2));

} catch (error) {
    console.error(`Error writing manifest file to ${OUTPUT_FILE_PATH}:`, error.message);
}