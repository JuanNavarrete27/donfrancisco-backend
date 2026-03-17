const db = require('./db');

async function auditDbState() {
  try {
    console.log('🔍 AUDITING DB STATE FOR LOCALES PERSISTENCE\n');
    
    // 1. Check actual DB structure
    console.log('=== TABLE STRUCTURE ===');
    const [localesColumns] = await db.query('DESCRIBE locales');
    const [detailsColumns] = await db.query('DESCRIBE local_details');
    const [usuariosColumns] = await db.query('DESCRIBE usuarios');
    
    console.log('LOCALES COLUMNS:');
    localesColumns.forEach(col => console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${col.Key ? `(${col.Key})` : ''}`));
    
    console.log('\nLOCAL_DETAILS COLUMNS:');
    detailsColumns.forEach(col => console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${col.Key ? `(${col.Key})` : ''}`));
    
    console.log('\nUSUARIOS COLUMNS (relevant):');
    usuariosColumns.filter(col => col.Field.includes('local') || col.Field === 'rol').forEach(col => 
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${col.Key ? `(${col.Key})` : ''}`)
    );
    
    // 2. Check actual data in locales table
    console.log('\n=== LOCALES DATA SAMPLE ===');
    const [sampleLocales] = await db.query(`
      SELECT id, slug, display_name, category, active, 
             short_description, hero_title, opening_hours,
             logo_url, cover_image_url, gallery_json
      FROM locales 
      WHERE id IN (1, 10) 
      ORDER BY id
    `);
    
    sampleLocales.forEach(locale => {
      console.log(`\n--- LOCAL ID: ${locale.id} (${locale.slug}) ---`);
      console.log(`display_name: ${locale.display_name}`);
      console.log(`category: ${locale.category}`);
      console.log(`short_description: ${locale.short_description || 'NULL'}`);
      console.log(`hero_title: ${locale.hero_title || 'NULL'}`);
      console.log(`opening_hours: ${locale.opening_hours || 'NULL'}`);
      console.log(`logo_url: ${locale.logo_url || 'NULL'}`);
      console.log(`cover_image_url: ${locale.cover_image_url || 'NULL'}`);
      console.log(`gallery_json: ${locale.gallery_json || 'NULL'}`);
    });
    
    // 3. Check local_details data
    console.log('\n=== LOCAL_DETAILS DATA ===');
    const [allDetails] = await db.query(`
      SELECT local_id, section_key, section_type, content
      FROM local_details 
      ORDER BY local_id, section_key
    `);
    
    allDetails.forEach(detail => {
      console.log(`\n--- DETAIL: Local ${detail.local_id}, Section: ${detail.section_key} ---`);
      console.log(`section_type: ${detail.section_type}`);
      console.log(`content: ${detail.content}`);
      
      // Try to parse JSON content
      try {
        const parsed = JSON.parse(detail.content);
        console.log(`parsed: ${JSON.stringify(parsed, null, 2)}`);
      } catch (e) {
        console.log(`content is NOT valid JSON`);
      }
    });
    
    // 4. Check user assignments
    console.log('\n=== USER LOCAL ASSIGNMENTS ===');
    const [userAssignments] = await db.query(`
      SELECT u.id, u.email, u.rol, u.local_id, l.slug, l.display_name
      FROM usuarios u
      LEFT JOIN locales l ON u.local_id = l.id
      WHERE u.rol = 'local' OR u.local_id IS NOT NULL
      ORDER BY u.id
    `);
    
    userAssignments.forEach(user => {
      console.log(`User ${user.id}: ${user.email} (${user.rol}) -> Local ${user.local_id} (${user.slug || 'UNASSIGNED'})`);
    });
    
    // 5. Test specific fields that might be problematic
    console.log('\n=== PROBLEMATIC FIELDS ANALYSIS ===');
    
    // Check opening_hours format
    const [openingHoursSamples] = await db.query(`
      SELECT id, slug, opening_hours FROM locales WHERE opening_hours IS NOT NULL LIMIT 3
    `);
    
    openingHoursSamples.forEach(sample => {
      console.log(`\nOpening Hours for ${sample.slug}:`);
      console.log(`Raw: ${sample.opening_hours}`);
      try {
        const parsed = JSON.parse(sample.opening_hours);
        console.log(`Parsed: ${JSON.stringify(parsed, null, 2)}`);
        if (parsed.raw !== undefined) {
          console.log(`⚠️  Detected {raw: "..."} wrapper format`);
        }
      } catch (e) {
        console.log(`❌ Invalid JSON format`);
      }
    });
    
    // Check gallery_json format
    const [gallerySamples] = await db.query(`
      SELECT id, slug, gallery_json FROM locales WHERE gallery_json IS NOT NULL LIMIT 3
    `);
    
    gallerySamples.forEach(sample => {
      console.log(`\nGallery for ${sample.slug}:`);
      console.log(`Raw: ${sample.gallery_json}`);
      try {
        const parsed = JSON.parse(sample.gallery_json);
        console.log(`Parsed: ${JSON.stringify(parsed, null, 2)}`);
      } catch (e) {
        console.log(`❌ Invalid JSON format`);
      }
    });
    
    console.log('\n🎯 DB AUDIT COMPLETE');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ DB Audit Error:', error);
    process.exit(1);
  }
}

auditDbState();
