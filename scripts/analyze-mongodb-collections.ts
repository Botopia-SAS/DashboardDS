import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { connectToDB } from '@/lib/mongoDB';

interface CollectionAnalysis {
  existingCollections: string[];
  existingModels: string[];
  collectionsWithoutModels: string[];
  modelsWithoutCollections: string[];
  collectionToModelMapping: Record<string, string>;
  modelToCollectionMapping: Record<string, string>;
}

/**
 * Convert collection name to PascalCase model name
 */
function collectionToModelName(collectionName: string): string {
  // Handle special cases and common patterns
  const specialCases: Record<string, string> = {
    'authcodes': 'AuthCode',
    'authcookies': 'AuthCookie',
    'carts': 'Cart',
    'certificates': 'Certificate',
    'certificatetemplates': 'CertificateTemplate',
    'classtypes': 'ClassType',
    'contacts': 'Contact',
    'drivingclasses': 'DrivingClass',
    'faq': 'FAQ',
    'gmailtemplates': 'GmailTemplate',
    'instructors': 'Instructor',
    'locations': 'Location',
    'notes': 'Note',
    'onlinecourses': 'OnlineCourse',
    'orders': 'Order',
    'packages': 'Package',
    'passwordresetcodes': 'PasswordResetCode',
    'payments': 'Payment',
    'phones': 'Phone',
    'products': 'Product',
    'resumenseccions': 'ResumenSeccion',
    'scheduledemails': 'ScheduledEmail',
    'seos': 'SEO',
    'sessions': 'Session',
    'sessionchecklists': 'SessionChecklist',
    'settings': 'Settings',
    'ticketclasses': 'TicketClass',
    'transactions': 'Transaction',
    'users': 'User',
    'admin': 'Admin'
  };

  if (specialCases[collectionName.toLowerCase()]) {
    return specialCases[collectionName.toLowerCase()];
  }

  // Convert to PascalCase for any unmapped collections
  return collectionName
    .split(/[-_\s]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Get all existing model files from lib/models directory
 */
function getExistingModels(): string[] {
  const modelsDir = path.join(process.cwd(), 'lib', 'models');
  
  if (!fs.existsSync(modelsDir)) {
    return [];
  }

  const files = fs.readdirSync(modelsDir);
  return files
    .filter(file => file.endsWith('.ts') || file.endsWith('.tsx'))
    .map(file => path.basename(file, path.extname(file)));
}

/**
 * Analyze MongoDB collections and create mapping
 */
async function analyzeCollections(): Promise<CollectionAnalysis> {
  try {
    // Connect to MongoDB
    await connectToDB();
    
    // Get all collections from MongoDB
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const collections = await db.listCollections().toArray();
    const existingCollections = collections.map(col => col.name);
    
    console.log('📊 Found collections in MongoDB:', existingCollections);

    // Get existing model files
    const existingModels = getExistingModels();
    console.log('📁 Found existing models:', existingModels);

    // Create mappings
    const collectionToModelMapping: Record<string, string> = {};
    const modelToCollectionMapping: Record<string, string> = {};
    
    // Map collections to proposed model names
    existingCollections.forEach(collection => {
      const modelName = collectionToModelName(collection);
      collectionToModelMapping[collection] = modelName;
    });

    // Create reverse mapping for existing models
    existingModels.forEach(model => {
      // Try to find matching collection
      const matchingCollection = existingCollections.find(collection => {
        const proposedModelName = collectionToModelName(collection);
        return proposedModelName.toLowerCase() === model.toLowerCase() ||
               // Handle some special cases for existing models
               (model.toLowerCase() === 'cerificate' && collection === 'certificates') ||
               (model.toLowerCase() === 'locations' && collection === 'locations') ||
               (model.toLowerCase() === 'class' && collection === 'drivingclasses') ||
               (model.toLowerCase() === 'instructor' && collection === 'instructors') ||
               (model.toLowerCase() === 'order' && collection === 'orders') ||
               (model.toLowerCase() === 'package' && collection === 'packages') ||
               (model.toLowerCase() === 'phone' && collection === 'phones') ||
               (model.toLowerCase() === 'product' && collection === 'products') ||
               (model.toLowerCase() === 'classtype' && collection === 'classtypes') ||
               (model.toLowerCase() === 'emailtemplate' && collection === 'gmailtemplates') ||
               (model.toLowerCase() === 'certificatetemplate' && collection === 'certificatetemplates');
      });
      
      if (matchingCollection) {
        modelToCollectionMapping[model] = matchingCollection;
      }
    });

    // Identify collections without models
    const collectionsWithoutModels = existingCollections.filter(collection => {
      const proposedModelName = collectionToModelMapping[collection];
      return !existingModels.some(model => 
        model.toLowerCase() === proposedModelName.toLowerCase()
      );
    });

    // Identify models without collections
    const modelsWithoutCollections = existingModels.filter(model => {
      return !Object.values(modelToCollectionMapping).includes(model) &&
             !existingCollections.some(collection => {
               const proposedModelName = collectionToModelName(collection);
               return proposedModelName.toLowerCase() === model.toLowerCase();
             });
    });

    return {
      existingCollections,
      existingModels,
      collectionsWithoutModels,
      modelsWithoutCollections,
      collectionToModelMapping,
      modelToCollectionMapping
    };

  } catch (error) {
    console.error('❌ Error analyzing collections:', error);
    throw error;
  }
}

/**
 * Generate detailed analysis report
 */
function generateReport(analysis: CollectionAnalysis): string {
  const report = `# MongoDB Collections Analysis Report

## Summary
- **Total Collections**: ${analysis.existingCollections.length}
- **Total Models**: ${analysis.existingModels.length}
- **Collections Missing Models**: ${analysis.collectionsWithoutModels.length}
- **Models Without Collections**: ${analysis.modelsWithoutCollections.length}

## Existing Collections
${analysis.existingCollections.map(col => `- ${col}`).join('\n')}

## Existing Models
${analysis.existingModels.map(model => `- ${model}`).join('\n')}

## Collections Missing Models
${analysis.collectionsWithoutModels.length > 0 
  ? analysis.collectionsWithoutModels.map(col => 
      `- **${col}** → Should create: \`${analysis.collectionToModelMapping[col]}.ts\``
    ).join('\n')
  : '✅ All collections have corresponding models'
}

## Models Without Collections
${analysis.modelsWithoutCollections.length > 0
  ? analysis.modelsWithoutCollections.map(model => 
      `- **${model}** → No matching collection found (candidate for removal)`
    ).join('\n')
  : '✅ All models have corresponding collections'
}

## Complete Collection → Model Mapping
${Object.entries(analysis.collectionToModelMapping)
  .map(([collection, model]) => {
    const hasModel = analysis.existingModels.some(m => m.toLowerCase() === model.toLowerCase());
    const status = hasModel ? '✅' : '❌';
    return `- ${collection} → ${model} ${status}`;
  }).join('\n')}

## Model → Collection Mapping
${Object.entries(analysis.modelToCollectionMapping)
  .map(([model, collection]) => `- ${model} → ${collection} ✅`)
  .join('\n')}

## Recommendations

### Models to Create
${analysis.collectionsWithoutModels.map(col => 
  `- Create \`lib/models/${analysis.collectionToModelMapping[col]}.ts\` for collection \`${col}\``
).join('\n')}

### Models to Review for Removal
${analysis.modelsWithoutCollections.map(model => 
  `- Review \`lib/models/${model}.ts\` - no matching collection found`
).join('\n')}

---
Generated on: ${new Date().toISOString()}
`;

  return report;
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('🔍 Starting MongoDB collections analysis...');
    
    const analysis = await analyzeCollections();
    const report = generateReport(analysis);
    
    // Save report to file
    const reportPath = path.join(process.cwd(), 'mongodb-collections-analysis.md');
    fs.writeFileSync(reportPath, report);
    
    console.log('✅ Analysis complete!');
    console.log(`📄 Report saved to: ${reportPath}`);
    
    // Also save raw data as JSON for programmatic use
    const dataPath = path.join(process.cwd(), 'mongodb-collections-data.json');
    fs.writeFileSync(dataPath, JSON.stringify(analysis, null, 2));
    console.log(`📊 Raw data saved to: ${dataPath}`);
    
    // Print summary to console
    console.log('\n📋 SUMMARY:');
    console.log(`Collections: ${analysis.existingCollections.length}`);
    console.log(`Models: ${analysis.existingModels.length}`);
    console.log(`Missing Models: ${analysis.collectionsWithoutModels.length}`);
    console.log(`Orphaned Models: ${analysis.modelsWithoutCollections.length}`);
    
    if (analysis.collectionsWithoutModels.length > 0) {
      console.log('\n❌ Collections needing models:');
      analysis.collectionsWithoutModels.forEach(col => {
        console.log(`  - ${col} → ${analysis.collectionToModelMapping[col]}.ts`);
      });
    }
    
    if (analysis.modelsWithoutCollections.length > 0) {
      console.log('\n⚠️  Models without collections:');
      analysis.modelsWithoutCollections.forEach(model => {
        console.log(`  - ${model}.ts`);
      });
    }

  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the analysis
if (require.main === module) {
  main();
}

export { analyzeCollections };
export type { CollectionAnalysis };