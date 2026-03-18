const db = require('./db');

async function auditLocaleDetailRouting() {
  console.log('=== LOCALE DETAIL ROUTING AUDIT ===\n');
  
  try {
    // Test 1: Check what category endpoints return for navigation
    console.log('1. Testing category endpoint data structure...');
    const [categoryLocales] = await db.query(`
      SELECT l.id, l.slug, l.display_name, l.category
      FROM locales l
      WHERE l.active = true AND l.category = ?
      ORDER BY l.display_name
      LIMIT 3
    `, ['gastronomia']);
    
    console.log('   ✓ Category endpoints return:');
    categoryLocales.forEach(locale => {
      console.log(`     - id: ${locale.id}, slug: ${locale.slug}, name: ${locale.display_name}`);
    });
    
    // Test 2: Test slug-based detail lookup
    console.log('\n2. Testing slug-based detail lookup...');
    if (categoryLocales.length > 0) {
      const testSlug = categoryLocales[0].slug;
      const [slugResult] = await db.query(
        'SELECT * FROM locales WHERE slug = ? AND active = true',
        [testSlug]
      );
      
      console.log(`   ✓ Slug "${testSlug}" lookup: ${slugResult.length} results`);
      if (slugResult.length > 0) {
        console.log(`     Found: ${slugResult[0].display_name} (id: ${slugResult[0].id})`);
      }
    }
    
    // Test 3: Test ID-based detail lookup
    console.log('\n3. Testing ID-based detail lookup...');
    if (categoryLocales.length > 0) {
      const testId = categoryLocales[0].id;
      const [idResult] = await db.query(
        'SELECT * FROM locales WHERE id = ? AND active = true',
        [testId]
      );
      
      console.log(`   ✓ ID ${testId} lookup: ${idResult.length} results`);
      if (idResult.length > 0) {
        console.log(`     Found: ${idResult[0].display_name} (slug: ${idResult[0].slug})`);
      }
    }
    
    // Test 4: Check slug uniqueness
    console.log('\n4. Testing slug uniqueness...');
    const [slugCheck] = await db.query(`
      SELECT slug, COUNT(*) as count 
      FROM locales 
      WHERE active = true 
      GROUP BY slug
      HAVING count > 1
    `);
    
    if (slugCheck.length > 0) {
      console.log('   ✗ Duplicate slugs found:');
      slugCheck.forEach(row => {
        console.log(`     - ${row.slug}: ${row.count} occurrences`);
      });
    } else {
      console.log('   ✓ All slugs are unique for active locales');
    }
    
    // Test 5: Check usuarios.local_id linkage
    console.log('\n5. Testing usuarios.local_id linkage...');
    const [userLocalLink] = await db.query(`
      SELECT u.id, u.nombre, u.rol, u.local_id, l.display_name, l.slug
      FROM usuarios u
      LEFT JOIN locales l ON u.local_id = l.id
      WHERE u.rol = 'local' AND u.local_id IS NOT NULL
      LIMIT 3
    `);
    
    console.log('   ✓ Local user assignments:');
    userLocalLink.forEach(user => {
      console.log(`     - User ${user.nombre} (id: ${user.id}) → local_id: ${user.local_id}`);
      if (user.display_name) {
        console.log(`       → Locale: ${user.display_name} (slug: ${user.slug})`);
      }
    });
    
    // Test 6: Check if locales.id matches usuarios.local_id exactly
    console.log('\n6. Testing ID matching consistency...');
    const [mismatchCheck] = await db.query(`
      SELECT u.local_id, COUNT(l.id) as locale_exists
      FROM usuarios u
      LEFT JOIN locales l ON u.local_id = l.id
      WHERE u.rol = 'local' AND u.local_id IS NOT NULL
      GROUP BY u.local_id
      HAVING locale_exists = 0
    `);
    
    if (mismatchCheck.length > 0) {
      console.log('   ✗ Found usuarios.local_id that dont match any locales.id:');
      mismatchCheck.forEach(row => {
        console.log(`     - local_id ${row.local_id}: no matching locale`);
      });
    } else {
      console.log('   ✓ All usuarios.local_id match existing locales.id');
    }
    
    // Test 7: Simulate exact route matching
    console.log('\n7. Testing route pattern matching...');
    
    // Simulate Express route matching for both patterns
    const testPaths = [
      '/api/public/locales/castagnet-vinoteca',  // slug-based
      '/api/public/locales/id/123',              // id-based
    ];
    
    console.log('   Route patterns in locales.js:');
    console.log('     - GET /api/public/locales/:slug → getPublicLocaleBySlug');
    console.log('     - GET /api/public/locales/id/:id → getPublicLocaleById');
    
    testPaths.forEach(path => {
      if (path.includes('/id/')) {
        const id = path.split('/id/')[1];
        console.log(`   ✓ Path "${path}" matches ID pattern (id: ${id})`);
      } else {
        const slug = path.split('/').pop();
        console.log(`   ✓ Path "${path}" matches slug pattern (slug: ${slug})`);
      }
    });
    
    console.log('\n=== AUDIT COMPLETE ===');
    
  } catch (error) {
    console.error('Audit error:', error);
  }
}

if (require.main === module) {
  auditLocaleDetailRouting().then(() => process.exit(0));
}

module.exports = { auditLocaleDetailRouting };
