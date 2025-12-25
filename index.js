#!/usr/bin/env node

const articleOptimizer = require('./articleOptimizer');

/**
 * Main entry point for the application
 */
async function main() {
  try {
    // Check command line arguments
    const args = process.argv.slice(2);
    const command = args[0];

    // Handle different commands
    switch (command) {
      case 'test':
        // Test all services
        await articleOptimizer.testServices();
        break;

      case 'optimize':
        // Optimize a specific article or latest
        const articleId = args[1] ? parseInt(args[1]) : null;
        
        if (articleId) {
          console.log(`Mode: Optimize Specific Article (ID: ${articleId})`);
        } else {
          console.log('Mode: Optimize Latest Article');
        }
        
        await articleOptimizer.optimize(articleId);
        break;

      case 'batch':
        // Batch optimize articles
        const articleIds = args.slice(1).map(id => parseInt(id)).filter(id => !isNaN(id));
        
        if (articleIds.length > 0) {
          console.log(`Mode: Batch Optimize (${articleIds.length} articles)`);
          await articleOptimizer.optimizeMultiple(articleIds);
        } else {
          console.log('Mode: Batch Optimize All Articles');
          await articleOptimizer.optimizeMultiple();
        }
        break;

      case 'help':
      case '-h':
      case '--help':
        break;

      default:
        // Default: optimize latest article
        if (!command) {
          console.log('Mode: Optimize Latest Article (Default)');
          await articleOptimizer.optimize();
        } else {
          console.error(`Unknown command: ${command}`);
          console.log('\nUse "node index.js help" to see available commands\n');
          process.exit(1);
        }
    }

    console.log('\nProcess completed successfully!\n');
    process.exit(0);

  } catch (error) {
    console.error('\nFATAL ERROR:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    console.log('\n');
    process.exit(1);
  }
}

// Run the main function
main();