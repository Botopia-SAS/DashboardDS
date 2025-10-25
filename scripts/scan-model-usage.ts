import fs from 'fs';
import path from 'path';

interface ModelUsage {
  modelName: string;
  modelPath: string;
  usedInFiles: string[];
  importPatterns: string[];
  isDynamicallyImported: boolean;
  isCronRelated: boolean;
}

interface UsageAnalysisResult {
  modelUsageMap: Map<string, ModelUsage>;
  unusedModels: string[];
  potentiallyUnusedModels: string[];
  totalFilesScanned: number;
  modelsFound: number;
}

class ModelUsageScanner {
  private modelsDir = 'lib/models';
  private excludePatterns = [
    'node_modules',
    '.next',
    '.git',
    'dist',
    'build',
    '.kiro'
  ];
  
  private cronRelatedPatterns = [
    'cron',
    'scheduled',
    'background',
    'job',
    'task',
    'script'
  ];

  async scanModelUsage(): Promise<UsageAnalysisResult> {
    console.log('🔍 Starting model usage analysis...\n');
    
    // Get all model files
    const modelFiles = await this.getModelFiles();
    console.log(`📁 Found ${modelFiles.length} model files:`);
    modelFiles.forEach(file => console.log(`   - ${file}`));
    console.log();
    
    // Initialize usage map
    const modelUsageMap = new Map<string, ModelUsage>();
    
    // Initialize each model in the usage map
    for (const modelFile of modelFiles) {
      const modelName = this.extractModelName(modelFile);
      modelUsageMap.set(modelName, {
        modelName,
        modelPath: modelFile,
        usedInFiles: [],
        importPatterns: [],
        isDynamicallyImported: false,
        isCronRelated: false
      });
    }
    
    // Scan all TypeScript/JavaScript files
    const allFiles = await this.getAllTSJSFiles();
    console.log(`📄 Scanning ${allFiles.length} TypeScript/JavaScript files for model usage...\n`);
    
    let filesScanned = 0;
    
    for (const filePath of allFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        this.analyzeFileForModelUsage(filePath, content, modelUsageMap);
        filesScanned++;
        
        if (filesScanned % 50 === 0) {
          console.log(`   Scanned ${filesScanned}/${allFiles.length} files...`);
        }
      } catch (error) {
        console.warn(`⚠️  Could not read file: ${filePath}`);
      }
    }
    
    console.log(`✅ Completed scanning ${filesScanned} files\n`);
    
    // Analyze results
    const unusedModels: string[] = [];
    const potentiallyUnusedModels: string[] = [];
    
    for (const [modelName, usage] of modelUsageMap) {
      if (usage.usedInFiles.length === 0) {
        if (usage.isCronRelated) {
          potentiallyUnusedModels.push(modelName);
        } else {
          unusedModels.push(modelName);
        }
      }
    }
    
    return {
      modelUsageMap,
      unusedModels,
      potentiallyUnusedModels,
      totalFilesScanned: filesScanned,
      modelsFound: modelFiles.length
    };
  }

  private async getModelFiles(): Promise<string[]> {
    const modelFiles: string[] = [];
    
    if (!fs.existsSync(this.modelsDir)) {
      return modelFiles;
    }
    
    const files = fs.readdirSync(this.modelsDir);
    
    for (const file of files) {
      const filePath = path.join(this.modelsDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
        modelFiles.push(filePath);
      }
    }
    
    return modelFiles;
  }

  private async getAllTSJSFiles(): Promise<string[]> {
    const files: string[] = [];
    
    const scanDirectory = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        
        // Skip excluded directories
        if (this.excludePatterns.some(pattern => fullPath.includes(pattern))) {
          continue;
        }
        
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };
    
    // Scan main directories
    const dirsToScan = [
      'app',
      'components', 
      'lib',
      'hooks',
      'contexts',
      'scripts',
      'types'
    ];
    
    for (const dir of dirsToScan) {
      if (fs.existsSync(dir)) {
        scanDirectory(dir);
      }
    }
    
    return files;
  }

  private extractModelName(filePath: string): string {
    const fileName = path.basename(filePath);
    return fileName.replace(/\.(ts|tsx)$/, '');
  }

  private analyzeFileForModelUsage(
    filePath: string, 
    content: string, 
    modelUsageMap: Map<string, ModelUsage>
  ): void {
    const isCronFile = this.isCronRelatedFile(filePath);
    
    for (const [modelName, usage] of modelUsageMap) {
      // Check for various import patterns
      const importPatterns = [
        // Standard imports
        new RegExp(`import\\s+${modelName}\\s+from\\s+['"](.*?models/${modelName}.*?)['"]`, 'g'),
        new RegExp(`import\\s+\\{[^}]*${modelName}[^}]*\\}\\s+from\\s+['"](.*?models.*?)['"]`, 'g'),
        // Dynamic imports
        new RegExp(`import\\s*\\(\\s*['"](.*?models/${modelName}.*?)['"]\\s*\\)`, 'g'),
        // Require statements
        new RegExp(`require\\s*\\(\\s*['"](.*?models/${modelName}.*?)['"]\\s*\\)`, 'g'),
        // Direct usage (for cases where model might be used without explicit import)
        new RegExp(`\\b${modelName}\\b`, 'g')
      ];
      
      let foundUsage = false;
      const foundPatterns: string[] = [];
      
      for (const pattern of importPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          foundUsage = true;
          foundPatterns.push(...matches);
          
          // Check if it's a dynamic import
          if (pattern.source.includes('import\\s*\\(')) {
            usage.isDynamicallyImported = true;
          }
        }
      }
      
      if (foundUsage) {
        usage.usedInFiles.push(filePath);
        usage.importPatterns.push(...foundPatterns);
        
        if (isCronFile) {
          usage.isCronRelated = true;
        }
      }
    }
  }

  private isCronRelatedFile(filePath: string): boolean {
    const lowerPath = filePath.toLowerCase();
    return this.cronRelatedPatterns.some(pattern => 
      lowerPath.includes(pattern) || 
      lowerPath.includes('scripts/') ||
      lowerPath.includes('background') ||
      lowerPath.includes('scheduled')
    );
  }

  generateReport(result: UsageAnalysisResult): string {
    let report = '# Model Usage Analysis Report\n\n';
    
    report += `## Summary\n`;
    report += `- **Total models found**: ${result.modelsFound}\n`;
    report += `- **Total files scanned**: ${result.totalFilesScanned}\n`;
    report += `- **Unused models**: ${result.unusedModels.length}\n`;
    report += `- **Potentially unused models** (cron-related): ${result.potentiallyUnusedModels.length}\n\n`;
    
    // Detailed usage for each model
    report += `## Detailed Model Usage\n\n`;
    
    const sortedModels = Array.from(result.modelUsageMap.entries())
      .sort(([a], [b]) => a.localeCompare(b));
    
    for (const [modelName, usage] of sortedModels) {
      report += `### ${modelName}\n`;
      report += `- **File**: \`${usage.modelPath}\`\n`;
      report += `- **Used in ${usage.usedInFiles.length} files**\n`;
      
      if (usage.isDynamicallyImported) {
        report += `- **⚡ Dynamically imported**\n`;
      }
      
      if (usage.isCronRelated) {
        report += `- **🕒 Used in cron/scheduled tasks**\n`;
      }
      
      if (usage.usedInFiles.length > 0) {
        report += `- **Usage locations**:\n`;
        usage.usedInFiles.forEach(file => {
          report += `  - \`${file}\`\n`;
        });
      } else {
        report += `- **❌ No usage found**\n`;
      }
      
      report += '\n';
    }
    
    // Unused models section
    if (result.unusedModels.length > 0) {
      report += `## ❌ Unused Models (Safe to Remove)\n\n`;
      result.unusedModels.forEach(model => {
        const usage = result.modelUsageMap.get(model);
        report += `- **${model}** (\`${usage?.modelPath}\`)\n`;
      });
      report += '\n';
    }
    
    // Potentially unused models section
    if (result.potentiallyUnusedModels.length > 0) {
      report += `## ⚠️ Potentially Unused Models (Review Required)\n\n`;
      report += `These models appear unused but may be related to cron jobs or background processes:\n\n`;
      result.potentiallyUnusedModels.forEach(model => {
        const usage = result.modelUsageMap.get(model);
        report += `- **${model}** (\`${usage?.modelPath}\`) - Cron-related: ${usage?.isCronRelated}\n`;
      });
      report += '\n';
    }
    
    return report;
  }
}

// Main execution
async function main() {
  try {
    const scanner = new ModelUsageScanner();
    const result = await scanner.scanModelUsage();
    
    // Generate and save report
    const report = scanner.generateReport(result);
    
    // Save to file
    const reportPath = 'model-usage-analysis.md';
    fs.writeFileSync(reportPath, report);
    
    console.log('📊 Analysis Results:');
    console.log(`   - Models found: ${result.modelsFound}`);
    console.log(`   - Files scanned: ${result.totalFilesScanned}`);
    console.log(`   - Unused models: ${result.unusedModels.length}`);
    console.log(`   - Potentially unused: ${result.potentiallyUnusedModels.length}`);
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Print unused models for quick reference
    if (result.unusedModels.length > 0) {
      console.log('\n❌ Unused Models:');
      result.unusedModels.forEach(model => console.log(`   - ${model}`));
    }
    
    if (result.potentiallyUnusedModels.length > 0) {
      console.log('\n⚠️ Potentially Unused Models (Review Required):');
      result.potentiallyUnusedModels.forEach(model => console.log(`   - ${model}`));
    }
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { ModelUsageScanner, type ModelUsage, type UsageAnalysisResult };