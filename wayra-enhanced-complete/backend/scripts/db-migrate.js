#!/usr/bin/env node

/**
 * Database Migration CLI Script
 * Usage: node scripts/db-migrate.js [command] [options]
 */

const path = require('path');
const mongoose = require('mongoose');

// Add src to require path
require('module').globalPaths.push(path.join(__dirname, '../src'));

const DatabaseUtils = require('../src/utils/database');
const MigrationManager = require('../src/utils/migrationManager');

// CLI argument parsing
const args = process.argv.slice(2);
const command = args[0];
const options = {
  version: args.find(arg => arg.startsWith('--version='))?.split('=')[1],
  name: args.find(arg => arg.startsWith('--name='))?.split('=')[1],
  help: args.includes('--help') || args.includes('-h')
};

// Help text
const helpText = `
Database Migration CLI

Usage: node scripts/db-migrate.js [command] [options]

Commands:
  status                  Show migration status
  up                      Run pending migrations
  down --version=N        Rollback to version N
  create --name=NAME      Create new migration file
  help                    Show this help message

Options:
  --version=N             Target version for rollback
  --name=NAME             Name for new migration
  --help, -h              Show this help message

Examples:
  node scripts/db-migrate.js status                           # Check migration status
  node scripts/db-migrate.js up                              # Run pending migrations
  node scripts/db-migrate.js down --version=1                # Rollback to version 1
  node scripts/db-migrate.js create --name="add user roles"  # Create new migration
`;

async function main() {
  try {
    // Show help
    if (options.help || !command || command === 'help') {
      console.log(helpText);
      process.exit(0);
    }

    console.log('🔄 Wayra Database Migration CLI');
    console.log('===============================');

    // Connect to database
    await DatabaseUtils.connect();
    const migrationManager = new MigrationManager();

    switch (command) {
      case 'status':
        await showStatus(migrationManager);
        break;
        
      case 'up':
        await runMigrations(migrationManager);
        break;
        
      case 'down':
        await rollbackMigrations(migrationManager, options.version);
        break;
        
      case 'create':
        await createMigration(migrationManager, options.name);
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('\nUse --help to see available commands');
        process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Migration operation failed:');
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

async function showStatus(migrationManager) {
  console.log('📊 Checking migration status...');
  
  const status = await migrationManager.getMigrationStatus();
  
  console.log('\n📋 Migration Status:');
  console.log(`   Current Version: ${status.currentVersion}`);
  console.log(`   Total Migrations: ${status.totalMigrations}`);
  console.log(`   Applied: ${status.appliedMigrations}`);
  console.log(`   Pending: ${status.pendingMigrations}`);
  
  if (status.appliedList.length > 0) {
    console.log('\n✅ Applied Migrations:');
    status.appliedList.forEach(migration => {
      console.log(`   ${migration.version}: ${migration.name} (${migration.appliedAt.toISOString()})`);
    });
  }
  
  if (status.pendingList.length > 0) {
    console.log('\n⏳ Pending Migrations:');
    status.pendingList.forEach(migration => {
      console.log(`   ${migration.version}: ${migration.name}`);
    });
  } else {
    console.log('\n✅ All migrations are up to date');
  }
}

async function runMigrations(migrationManager) {
  console.log('🔄 Running pending migrations...');
  
  const success = await migrationManager.runMigrations();
  
  if (success) {
    console.log('✅ All migrations completed successfully');
  } else {
    console.error('❌ Some migrations failed');
    process.exit(1);
  }
}

async function rollbackMigrations(migrationManager, targetVersion) {
  if (!targetVersion) {
    console.error('❌ Target version is required for rollback');
    console.log('Usage: node scripts/db-migrate.js down --version=N');
    process.exit(1);
  }
  
  const version = parseInt(targetVersion);
  if (isNaN(version)) {
    console.error('❌ Invalid version number');
    process.exit(1);
  }
  
  console.log(`🔄 Rolling back to version ${version}...`);
  
  const success = await migrationManager.rollbackToVersion(version);
  
  if (success) {
    console.log(`✅ Rollback to version ${version} completed successfully`);
  } else {
    console.error('❌ Rollback failed');
    process.exit(1);
  }
}

async function createMigration(migrationManager, name) {
  if (!name) {
    console.error('❌ Migration name is required');
    console.log('Usage: node scripts/db-migrate.js create --name="migration name"');
    process.exit(1);
  }
  
  console.log(`🔄 Creating new migration: ${name}...`);
  
  const migration = await migrationManager.createMigration(name);
  
  console.log('✅ Migration file created successfully');
  console.log(`   Version: ${migration.version}`);
  console.log(`   File: ${migration.filename}`);
  console.log(`   Path: ${migration.path}`);
  console.log('\nEdit the migration file to add your migration logic.');
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