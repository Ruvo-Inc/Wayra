#!/usr/bin/env node

/**
 * Test Database System Components
 * Tests the database initialization system without requiring database connection
 */

const path = require('path');

// Add src to require path
require('module').globalPaths.push(path.join(__dirname, '../src'));

async function testSystemComponents() {
  console.log('🧪 Testing Database System Components');
  console.log('====================================');

  const results = {
    migrationManager: false,
    seedManager: false,
    indexManager: false,
    backupManager: false,
    databaseInitializer: false
  };

  try {
    // Test MigrationManager
    console.log('🔄 Testing MigrationManager...');
    const MigrationManager = require('../src/utils/migrationManager');
    const migrationManager = new MigrationManager();
    
    // Test basic functionality without database
    const availableMigrations = await migrationManager.getAvailableMigrations();
    console.log(`   Found ${availableMigrations.length} migration files`);
    results.migrationManager = true;
    console.log('✅ MigrationManager test passed');

  } catch (error) {
    console.error('❌ MigrationManager test failed:', error.message);
  }

  try {
    // Test SeedManager
    console.log('🔄 Testing SeedManager...');
    const SeedManager = require('../src/utils/seedManager');
    const seedManager = new SeedManager();
    
    await seedManager.initialize();
    const seedFiles = await seedManager.getSeedFiles('development');
    console.log(`   Found ${seedFiles.length} seed files`);
    results.seedManager = true;
    console.log('✅ SeedManager test passed');

  } catch (error) {
    console.error('❌ SeedManager test failed:', error.message);
  }

  try {
    // Test IndexManager
    console.log('🔄 Testing IndexManager...');
    const IndexManager = require('../src/utils/indexManager');
    const indexManager = new IndexManager();
    
    // Test index definitions loading
    console.log(`   Loaded index definitions for ${indexManager.indexes.size} collections`);
    results.indexManager = true;
    console.log('✅ IndexManager test passed');

  } catch (error) {
    console.error('❌ IndexManager test failed:', error.message);
  }

  try {
    // Test BackupManager
    console.log('🔄 Testing BackupManager...');
    const BackupManager = require('../src/utils/backupManager');
    const backupManager = new BackupManager();
    
    await backupManager.initialize();
    console.log('   BackupManager initialized successfully');
    results.backupManager = true;
    console.log('✅ BackupManager test passed');

  } catch (error) {
    console.error('❌ BackupManager test failed:', error.message);
  }

  try {
    // Test DatabaseInitializer
    console.log('🔄 Testing DatabaseInitializer...');
    const DatabaseInitializer = require('../src/utils/databaseInitializer');
    const initializer = new DatabaseInitializer();
    
    console.log(`   Environment: ${initializer.environment}`);
    console.log('   DatabaseInitializer created successfully');
    results.databaseInitializer = true;
    console.log('✅ DatabaseInitializer test passed');

  } catch (error) {
    console.error('❌ DatabaseInitializer test failed:', error.message);
  }

  // Summary
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log('\n📋 Test Summary:');
  console.log(`   Passed: ${passedTests}/${totalTests}`);
  
  Object.entries(results).forEach(([component, passed]) => {
    console.log(`   ${component}: ${passed ? '✅' : '❌'}`);
  });

  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Database system is ready.');
    return true;
  } else {
    console.log('\n⚠️ Some tests failed. Please check the errors above.');
    return false;
  }
}

// Run tests
testSystemComponents()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  });