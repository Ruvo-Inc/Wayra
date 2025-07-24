# Database Initialization and Migration System

This document describes the database initialization and migration system for Wayra's backend. The system provides comprehensive database management including migrations, seeding, indexing, and backup/restore capabilities.

## Overview

The database system consists of several key components:

- **Migration Manager**: Handles schema migrations and version tracking
- **Seed Manager**: Manages development data seeding and test data generation
- **Index Manager**: Creates and optimizes database indexes for performance
- **Backup Manager**: Provides backup and restore capabilities for development
- **Database Initializer**: Orchestrates all database setup operations

## Quick Start

### Initial Setup

```bash
# Full database initialization (recommended for first-time setup)
npm run db:init

# Quick setup (connection, indexes, migrations only)
npm run db:init:quick

# Check database status
npm run db:status
```

### Development Workflow

```bash
# Reset database with fresh seed data
npm run db:reset

# Run pending migrations
npm run db:migrate

# Check migration status
npm run db:migrate:status

# Run maintenance operations
npm run db:maintenance
```

## Available Scripts

### Database Initialization

| Script | Description |
|--------|-------------|
| `npm run db:init` | Full database initialization with migrations, indexes, and seeds |
| `npm run db:init:quick` | Quick setup with essential operations only |
| `npm run db:reset` | Reset database (development only) |
| `npm run db:status` | Show comprehensive database status |
| `npm run db:maintenance` | Run maintenance operations |

### Migration Management

| Script | Description |
|--------|-------------|
| `npm run db:migrate` | Run pending migrations |
| `npm run db:migrate:status` | Show migration status |
| `npm run db:migrate:create` | Create new migration file |
| `npm run db:migrate:rollback` | Rollback migrations |

## System Components

### 1. Migration System

The migration system tracks database schema changes and provides version control for your database structure.

#### Creating Migrations

```bash
# Create a new migration
npm run db:migrate:create -- --name="add user roles"
```

This creates a new migration file in `migrations/` with the following structure:

```javascript
/**
 * Migration: Add User Roles
 * Version: 3
 * Created: 2025-01-23T00:00:00.000Z
 */

async function up(db) {
  console.log('Running migration: Add User Roles');
  
  // Add your migration logic here
  await db.collection('users').updateMany({}, {
    $set: { role: 'user' }
  });
}

async function down(db) {
  console.log('Rolling back migration: Add User Roles');
  
  // Add your rollback logic here
  await db.collection('users').updateMany({}, {
    $unset: { role: 1 }
  });
}

module.exports = { up, down };
```

#### Running Migrations

```bash
# Run all pending migrations
npm run db:migrate

# Check migration status
npm run db:migrate:status

# Rollback to specific version
npm run db:migrate:rollback -- --version=1
```

### 2. Seeding System

The seeding system provides development data for testing and development environments.

#### Seed Files

Seed files are located in `scripts/seeds/` and follow this structure:

```javascript
// Environments where this seed should run
const environments = ['development', 'test'];

// Whether this seed is required (will stop seeding if it fails)
const required = false;

// Description of what this seed does
const description = 'Creates sample data for development';

async function seed(db) {
  console.log('Running seed: Sample Data');
  
  // Your seeding logic here
  const users = [
    { name: 'John Doe', email: 'john@example.com' }
  ];
  
  await db.collection('users').insertMany(users);
}

module.exports = { seed, environments, required, description };
```

### 3. Index Management

The system automatically creates optimized indexes for all collections based on common query patterns.

#### Defined Indexes

**Users Collection:**
- `firebaseUid` (unique)
- `email` (unique)
- `createdAt` (descending)
- `lastLoginAt` (descending)
- `preferences.budgetRange.currency`

**Trips Collection:**
- `owner + createdAt` (compound)
- `collaborators.userId`
- `destination.name`
- `dates.start + dates.end` (compound)
- `status`
- `tags`

### 4. Backup and Restore

The backup system provides data protection and recovery capabilities for development.

#### Creating Backups

```javascript
const BackupManager = require('./src/utils/backupManager');
const backupManager = new BackupManager();

// Create full database backup
await backupManager.createBackup({
  name: 'pre_deployment_backup'
});

// Export specific collection
await backupManager.exportCollection('users', {
  query: { isActive: true },
  limit: 1000
});
```

#### Restoring Backups

```javascript
// Restore from backup
await backupManager.restoreBackup('backup_name', {
  dropExisting: true
});

// Import collection data
await backupManager.importCollection('./backups/users_export.json', {
  clearExisting: true
});
```

## Environment Configuration

The system respects different environments and adjusts behavior accordingly:

### Development Environment
- Full seeding with test data
- Backup and restore operations allowed
- Database reset operations allowed
- Comprehensive logging

### Test Environment
- Limited seeding with test-specific data
- Backup operations allowed
- Database clearing allowed
- Minimal logging

### Production Environment
- No seeding operations
- Backup operations require explicit permission
- No database reset operations
- Security-focused logging

## Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  firebaseUid: String, // Unique Firebase user ID
  email: String, // Unique email address
  profile: {
    displayName: String,
    firstName: String,
    lastName: String,
    photoURL: String,
    location: {
      country: String,
      city: String,
      timezone: String
    }
  },
  preferences: {
    budgetRange: {
      min: Number,
      max: Number,
      currency: String
    },
    travelStyle: [String],
    interests: [String]
  },
  settings: {
    notifications: Object,
    privacy: Object,
    ai: Object
  },
  stats: {
    tripsPlanned: Number,
    tripsCompleted: Number,
    totalBudgetSaved: Number
  },
  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date,
  isActive: Boolean
}
```

### Trips Collection

```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  destination: {
    name: String,
    country: String,
    coordinates: { lat: Number, lng: Number }
  },
  dates: {
    start: Date,
    end: Date,
    flexible: Boolean
  },
  budget: {
    total: Number,
    currency: String,
    breakdown: Object,
    spent: Number,
    remaining: Number
  },
  travelers: {
    adults: Number,
    children: Number,
    infants: Number
  },
  owner: ObjectId, // Reference to User
  collaborators: [{
    userId: ObjectId,
    role: String,
    permissions: [String]
  }],
  status: String, // 'planning', 'booked', 'completed', 'cancelled'
  visibility: String, // 'private', 'shared', 'public'
  aiGenerated: Object, // AI-generated content
  customizations: [Object], // User modifications
  activityLog: [Object], // Collaboration history
  bookings: [Object], // Booking information
  tags: [String],
  createdAt: Date,
  updatedAt: Date
}
```

## Monitoring and Maintenance

### Health Checks

The system provides comprehensive health monitoring:

```bash
# Check overall system status
npm run db:status
```

This shows:
- Database connection status
- Migration status
- Index statistics
- Available backups
- Collection statistics

### Maintenance Operations

```bash
# Run maintenance operations
npm run db:maintenance
```

Maintenance includes:
- Index usage analysis
- Backup cleanup (development)
- Database health checks
- Performance optimization suggestions

### Performance Monitoring

The system tracks:
- Query performance
- Index usage statistics
- Connection pool status
- Database operation metrics

## Troubleshooting

### Common Issues

1. **Connection Failures**
   - Check MongoDB URI in environment variables
   - Verify network connectivity
   - Check authentication credentials

2. **Migration Failures**
   - Review migration logs
   - Check database permissions
   - Verify migration file syntax

3. **Seeding Issues**
   - Ensure development environment
   - Check for existing data conflicts
   - Verify seed file permissions

4. **Index Creation Problems**
   - Check for duplicate data
   - Verify collection exists
   - Review index definitions

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV=development
DEBUG=wayra:database
```

### Recovery Procedures

1. **Database Corruption**
   ```bash
   # Restore from latest backup
   npm run db:init -- --reset
   ```

2. **Migration Issues**
   ```bash
   # Rollback to known good state
   npm run db:migrate:rollback -- --version=1
   ```

3. **Performance Issues**
   ```bash
   # Rebuild indexes
   npm run db:maintenance
   ```

## Best Practices

1. **Always backup before major changes**
2. **Test migrations in development first**
3. **Use descriptive migration names**
4. **Keep seed data realistic but minimal**
5. **Monitor index usage regularly**
6. **Run maintenance operations periodically**

## Security Considerations

- Production operations require explicit flags
- Sensitive data is excluded from backups
- Migration tracking prevents unauthorized changes
- Index creation is validated for security
- Backup files are stored securely

This system provides a robust foundation for database management in the Wayra application, ensuring data integrity, performance, and maintainability throughout the development lifecycle.