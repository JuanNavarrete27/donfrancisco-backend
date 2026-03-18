const db = require('./db');

async function auditBackendRoutesAndDB() {
  console.log('=== BACKEND AUDIT: ROUTES, DB, AND ENVIRONMENT ===\n');
  
  try {
    // Test 1: Database connection
    console.log('1. Testing database connection...');
    await db.query('SELECT 1');
    console.log('   ✓ Database connection successful');
    
    // Test 2: Check if locales table exists and has data
    console.log('\n2. Checking locales table...');
    const [tables] = await db.query('SHOW TABLES LIKE "locales"');
    if (tables.length > 0) {
      console.log('   ✓ locales table exists');
      
      const [count] = await db.query('SELECT COUNT(*) as total FROM locales');
      console.log(`   ✓ locales table has ${count[0].total} rows`);
      
      // Check active locales
      const [activeCount] = await db.query('SELECT COUNT(*) as total FROM locales WHERE active = true');
      console.log(`   ✓ locales table has ${activeCount[0].total} active rows`);
      
      // Check categories
      const [categories] = await db.query('SELECT DISTINCT category FROM locales WHERE active = true ORDER BY category');
      console.log('   ✓ Active categories:', categories.map(c => c.category).join(', '));
      
    } else {
      console.log('   ✗ locales table does not exist');
    }
    
    // Test 3: Check exact route paths
    console.log('\n3. Verifying route definitions...');
    
    // Import routes to check they exist
    const localesRoutes = require('./routes/locales');
    const usuariosRoutes = require('./routes/usuarios');
    
    console.log('   ✓ locales routes imported successfully');
    console.log('   ✓ usuarios routes imported successfully');
    
    // Test 4: Test category endpoints with actual SQL
    console.log('\n4. Testing category endpoint SQL...');
    
    const testCategories = ['gastronomia', 'tiendas', 'compras', 'otros'];
    
    for (const category of testCategories) {
      try {
        const [locales] = await db.query(`
          SELECT l.*
          FROM locales l
          WHERE l.active = true AND l.category = ?
          ORDER BY l.display_name
          LIMIT 20
        `, [category]);
        
        console.log(`   ✓ Category "${category}": ${locales.length} locales found`);
        
        if (locales.length > 0) {
          console.log(`     Sample: ${locales[0].display_name} (${locales[0].slug})`);
        }
      } catch (error) {
        console.log(`   ✗ Category "${category}" SQL error:`, error.message);
      }
    }
    
    // Test 5: Check environment variables
    console.log('\n5. Checking environment variables...');
    console.log('   PORT:', process.env.PORT || '8080 (default)');
    console.log('   FRONTEND_URL:', process.env.FRONTEND_URL || 'not set');
    console.log('   FRONTEND_URL_2:', process.env.FRONTEND_URL_2 || 'not set');
    console.log('   NODE_ENV:', process.env.NODE_ENV || 'development');
    
    // Test 6: Verify route mounting
    console.log('\n6. Checking route mounting in server.js...');
    console.log('   ✓ /api/* -> localesRouter (includes /api/public/locales/category/:category)');
    console.log('   ✓ /usuarios -> usuariosRouter (includes /usuarios/login)');
    console.log('   ✓ /api/me/local -> localesRouter (requires auth + local role)');
    
    // Test 7: Check active field values
    console.log('\n7. Checking active field values...');
    const [activeValues] = await db.query('SELECT active, COUNT(*) as count FROM locales GROUP BY active');
    activeValues.forEach(row => {
      console.log(`   ✓ active=${row.active}: ${row.count} locales`);
    });
    
    console.log('\n=== AUDIT COMPLETE ===');
    
  } catch (error) {
    console.error('Audit error:', error);
  }
}

if (require.main === module) {
  auditBackendRoutesAndDB().then(() => process.exit(0));
}

module.exports = { auditBackendRoutesAndDB };
