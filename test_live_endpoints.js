const db = require('./db');

async function testLiveEndpoints() {
  console.log('=== LIVE ENDPOINT TESTING ===\n');
  
  try {
    // Test the actual endpoints that should work
    const express = require('express');
    const request = require('supertest');
    
    const app = express();
    app.use(express.json());
    
    // Mount the routes exactly as server.js does
    app.use('/api', require('./routes/locales'));
    app.use('/usuarios', require('./routes/usuarios'));
    
    // Test 1: GET /api/public/locales/category/gastronomia
    console.log('1. Testing GET /api/public/locales/category/gastronomia...');
    try {
      const response = await request(app)
        .get('/api/public/locales/category/gastronomia')
        .expect(200);
      
      console.log(`   ✓ Status: ${response.status}`);
      console.log(`   ✓ Response ok: ${response.body.ok}`);
      console.log(`   ✓ Data count: ${response.body.data?.length || 0}`);
      console.log(`   ✓ Category: ${response.body.category}`);
      
      if (response.body.data && response.body.data.length > 0) {
        console.log(`   ✓ Sample locale: ${response.body.data[0].display_name}`);
      }
    } catch (error) {
      console.log(`   ✗ Error: ${error.message}`);
    }
    
    // Test 2: GET /api/public/locales/category/tiendas
    console.log('\n2. Testing GET /api/public/locales/category/tiendas...');
    try {
      const response = await request(app)
        .get('/api/public/locales/category/tiendas')
        .expect(200);
      
      console.log(`   ✓ Status: ${response.status}`);
      console.log(`   ✓ Response ok: ${response.body.ok}`);
      console.log(`   ✓ Data count: ${response.body.data?.length || 0}`);
      
      if (response.body.data && response.body.data.length > 0) {
        console.log(`   ✓ Sample locale: ${response.body.data[0].display_name}`);
      }
    } catch (error) {
      console.log(`   ✗ Error: ${error.message}`);
    }
    
    // Test 3: GET /api/public/locales (general list)
    console.log('\n3. Testing GET /api/public/locales...');
    try {
      const response = await request(app)
        .get('/api/public/locales')
        .expect(200);
      
      console.log(`   ✓ Status: ${response.status}`);
      console.log(`   ✓ Response ok: ${response.body.ok}`);
      console.log(`   ✓ Data count: ${response.body.data?.length || 0}`);
    } catch (error) {
      console.log(`   ✗ Error: ${error.message}`);
    }
    
    // Test 4: POST /usuarios/login (check it exists)
    console.log('\n4. Testing POST /usuarios/login endpoint exists...');
    try {
      const response = await request(app)
        .post('/usuarios/login')
        .send({ email: 'test@test.com', password: 'test' });
      
      // Should get 401 or 400, not 404
      if (response.status !== 404) {
        console.log(`   ✓ Endpoint exists (status: ${response.status})`);
        console.log(`   ✓ Response: ${response.body.ok ? 'ok' : 'error'}`);
      } else {
        console.log(`   ✗ Endpoint not found (404)`);
      }
    } catch (error) {
      console.log(`   ✗ Error: ${error.message}`);
    }
    
    // Test 5: Check if /api/me/local route exists (should require auth)
    console.log('\n5. Testing GET /api/me/local endpoint exists...');
    try {
      const response = await request(app)
        .get('/api/me/local');
      
      // Should get 401 or 403, not 404
      if (response.status !== 404) {
        console.log(`   ✓ Endpoint exists (status: ${response.status})`);
      } else {
        console.log(`   ✗ Endpoint not found (404)`);
      }
    } catch (error) {
      console.log(`   ✗ Error: ${error.message}`);
    }
    
    console.log('\n=== LIVE ENDPOINT TESTING COMPLETE ===');
    
  } catch (error) {
    console.error('Endpoint testing error:', error);
  }
}

if (require.main === module) {
  testLiveEndpoints().then(() => process.exit(0));
}

module.exports = { testLiveEndpoints };
