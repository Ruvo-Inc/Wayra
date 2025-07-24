const express = require('express');
require('dotenv').config();

const app = express();
const PORT = 8081;

app.use(express.json());

console.log('Testing route imports individually...');

// Test each route file one by one
try {
  console.log('1. Testing travel routes...');
  const travelRouter = require('./routes/travel');
  app.use('/api/travel', travelRouter);
  console.log('✅ Travel routes loaded successfully');
} catch (error) {
  console.error('❌ Travel routes failed:', error.message);
}

try {
  console.log('2. Testing trips routes...');
  const tripsRouter = require('./routes/trips');
  app.use('/api/trips', tripsRouter);
  console.log('✅ Trips routes loaded successfully');
} catch (error) {
  console.error('❌ Trips routes failed:', error.message);
}

try {
  console.log('3. Testing users routes...');
  const usersRouter = require('./routes/users');
  app.use('/api/users', usersRouter);
  console.log('✅ Users routes loaded successfully');
} catch (error) {
  console.error('❌ Users routes failed:', error.message);
}

try {
  console.log('4. Testing collaboration routes...');
  const collaborationRouter = require('./routes/collaboration');
  app.use('/api/collaboration', collaborationRouter);
  console.log('✅ Collaboration routes loaded successfully');
} catch (error) {
  console.error('❌ Collaboration routes failed:', error.message);
}

try {
  console.log('5. Testing adventures routes...');
  const adventuresRouter = require('./routes/adventures');
  app.use('/api/adventures', adventuresRouter);
  console.log('✅ Adventures routes loaded successfully');
} catch (error) {
  console.error('❌ Adventures routes failed:', error.message);
}

try {
  console.log('6. Testing collections routes...');
  const collectionsRouter = require('./routes/collections');
  app.use('/api/collections', collectionsRouter);
  console.log('✅ Collections routes loaded successfully');
} catch (error) {
  console.error('❌ Collections routes failed:', error.message);
}

try {
  console.log('7. Testing geography routes...');
  const geographyRouter = require('./routes/geography');
  app.use('/api/geography', geographyRouter);
  console.log('✅ Geography routes loaded successfully');
} catch (error) {
  console.error('❌ Geography routes failed:', error.message);
}

app.get('/', (req, res) => {
  res.json({ message: 'Route debugging server', status: 'running' });
});

app.listen(PORT, () => {
  console.log(`🔍 Debug server running on port ${PORT}`);
  console.log('All route tests completed!');
});
