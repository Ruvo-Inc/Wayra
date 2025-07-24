#!/usr/bin/env node

/**
 * Database Initialization CLI Script
 * Usage: node scripts/db-init.js [options]
 */

const path = require('path');
const mongoose = require('mongoose');

// Add src to require path
require('module').globalPaths.push(path.join(__dirname, '../src'));

const DatabaseInitializer = require('../src/utils/databaseInitializer');

// CLI argument parsing
const args = process.argv.slice(2);
const options = {
  continueOnError: args.includes('--continue-on-error'),
  runSeeds: !args.includes('--no-seeds'),
  reset: args.includes('--reset'),
  quick: args.includes('--quick'),
  status: args.includes('--status'),
  maintenance: args.includes('--maintenance'),
  help: args.includes('--help') || args.includes('-h')
};

// Help text
const helpText = `
Database Initialization CLI

Usage: node scripts/db-init.js [options]

Options:
  --help, -h              Show this help message
  --quick                 Run quick setup (connection, indexes, migrations only)
  --reset                 Reset database (development only)
  --status                Show database status
  --maintenance           Run maintenance operations
  --continue-on-error     Continue initialization even if some steps fail
  --no-seeds              Skip running database seeds

Examples:
  node scripts/db-init.js                    # Full initialization
  node scripts/db-init.js --quick            # Quick setup
  node scripts/db-init.js --reset            # Reset database
  node scripts/db-init.js --status           # Check status
  node scripts/db-init.js --maintenance      # Run maintenance
`;

async function main() {
  try {
    // Show help
    if (options.help) {
      console.log(helpText);
      process.exit(0);
    }

    console.log('🚀 Wayra Database Initialization CLI');
    console.log('=====================================');

    const initializer = new DatabaseInitializer();

    // Status check
    if (options.status) {
      console.log('📊 Checking database status...');
      const status = await initializer.getStatus();
      
      console.log('\n📋 Database Status:');
      console.log(`   Environment: ${status.environment}`);
      console.log(`   Connected: ${status.database.connected ? '✅' : '❌'}`);
      console.log(`   Current Migration: ${status.migrations.current}`);
      console.log(`   Pending Migrations: ${status.migrations.pending}`);
      console.log(`   Collections with Indexes: ${Object.keys(status.indexes).length}`);
      console.log(`   Available Backups: ${Array.isArray(status.backups) ? status.backups.length : 'Error'}`);
      
      if (status.database.health) {
        console.log(`   Database: ${status.database.health.database}`);
        console.log(`   Collections: ${status.database.health.collections}`);
      }
      
      process.exit(0);
    }

    // Maintenance
    if (options.maintenance) {
      console.log('🔧 Running database maintenance...');
      const results = await initializer.runMaintenance();
      
      console.log('\n📋 Maintenance Results:');
      console.log(`   Index Optimization: ${results.indexOptimization ? '✅' : '❌'}`);
      console.log(`   Backup Cleanup: ${results.backupCleanup ? '✅' : '❌'}`);
      console.log(`   Health Check: ${results.healthCheck ? '✅' : '❌'}`);
      
      process.exit(0);
    }

    // Database reset
    if (options.reset) {
      console.log('⚠️  Database Reset Mode');
      console.log('This will delete all data in the database!');
      
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ Database reset is not allowed in production');
        process.exit(1);
      }

      // Simple confirmation (in a real CLI, you might want better confirmation)
      console.log('🔄 Proceeding with database reset...');
      
      await initializer.resetDatabase({
        createBackup: true,
        reseed: options.runSeeds
      });
      
      console.log('✅ Database reset completed');
      process.exit(0);
    }

    // Quick setup
    if (options.quick) {
      console.log('⚡ Quick Setup Mode');
      await initializer.quickSetup();
      console.log('✅ Quick setup completed');
      process.exit(0);
    }

    // Full initialization
    console.log('🔄 Running full database initialization...');
    const results = await initializer.initialize(options);
    
    console.log('\n📋 Initialization Summary:');
    console.log(`   Connection: ${results.connection ? '✅' : '❌'}`);
    console.log(`   Migrations: ${results.migrations ? '✅' : '❌'}`);
    console.log(`   Indexes: ${results.indexes ? '✅' : '❌'}`);
    console.log(`   Seeds: ${results.seeds ? '✅' : '❌'}`);
    console.log(`   Backup System: ${results.backup ? '✅' : '❌'}`);
    
    if (results.errors.length > 0) {
      console.log(`\n⚠️  Errors (${results.errors.length}):`);
      results.errors.forEach(error => {
        console.log(`   - ${error.step}: ${error.error}`);
      });
    }

    console.log('\n🎉 Database initialization completed!');
    
  } catch (error) {
    console.error('\n❌ Database initialization failed:');
    console.error(error.message);
    
    if (process.env.NODE_ENV === 'development') {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    
    process.exit(1);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down...');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Shutting down...');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  process.exit(0);
});

// Run the script
main().catch(error => {
  console.error('❌ Unexpected error:', error.message);
  process.exit(1);
});