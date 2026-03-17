const db = require('./db');

async function auditNormalization() {
  try {
    console.log('🔍 AUDITING NORMALIZATION AND CONTRACT SHAPES\n');
    
    // Test the normalizeLocalDetails function behavior
    console.log('=== NORMALIZATION LOGIC AUDIT ===');
    
    // Get raw details from DB
    const [rawDetails] = await db.query(`
      SELECT local_id, section_key, section_type, content
      FROM local_details 
      WHERE local_id = 2
      ORDER BY section_key
    `);
    
    console.log('Raw DB content for Local ID 2:');
    rawDetails.forEach(detail => {
      console.log(`\n${detail.section_key} (${detail.section_type}):`);
      console.log(`Raw content: ${detail.content}`);
      console.log(`Content type: ${typeof detail.content}`);
      
      // Test JSON parsing
      try {
        const parsed = JSON.parse(detail.content);
        console.log(`Parsed successfully: ${JSON.stringify(parsed)}`);
      } catch (e) {
        console.log(`❌ JSON parse failed: ${e.message}`);
        console.log(`Treating as string value: "${detail.content}"`);
      }
    });
    
    // Test opening_hours normalization
    console.log('\n=== OPENING_HOURS NORMALIZATION AUDIT ===');
    
    const [openingHoursSample] = await db.query(`
      SELECT id, slug, opening_hours FROM locales WHERE id = 2
    `);
    
    if (openingHoursSample.length > 0) {
      const sample = openingHoursSample[0];
      console.log(`Opening hours for ${sample.slug}:`);
      console.log(`Raw DB value: ${sample.opening_hours}`);
      console.log(`Type: ${typeof sample.opening_hours}`);
      
      // Test the normalizeOpeningHours logic
      function normalizeOpeningHours(value) {
        if (value === null || value === undefined) return null;
        
        if (typeof value === 'string') {
          try {
            JSON.parse(value);
            return value; // Already valid JSON, store as-is
          } catch {
            // Not valid JSON, wrap in { raw: "..." }
            return JSON.stringify({ raw: value });
          }
        }
        
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        
        return JSON.stringify(value);
      }
      
      // Test the read logic (unwrap)
      function unwrapOpeningHours(value) {
        if (!value) return value;
        try {
          const oh = JSON.parse(value);
          return oh.raw !== undefined ? oh.raw : oh;
        } catch {
          return value; // Not valid JSON, keep as-is
        }
      }
      
      console.log(`Normalized for storage: ${normalizeOpeningHours(sample.opening_hours)}`);
      console.log(`Unwrapped for response: ${unwrapOpeningHours(sample.opening_hours)}`);
    }
    
    // Test gallery_json normalization
    console.log('\n=== GALLERY_JSON NORMALIZATION AUDIT ===');
    
    const [gallerySample] = await db.query(`
      SELECT id, slug, gallery_json FROM locales WHERE id = 2
    `);
    
    if (gallerySample.length > 0) {
      const sample = gallerySample[0];
      console.log(`Gallery for ${sample.slug}:`);
      console.log(`Raw DB value: ${sample.gallery_json}`);
      console.log(`Type: ${typeof sample.gallery_json}`);
    }
    
    // Test GROUP_CONCAT issues in public endpoints
    console.log('\n=== GROUP_CONCAT ISSUES AUDIT ===');
    
    const [groupConcatTest] = await db.query(`
      SELECT 
        l.id,
        l.slug,
        GROUP_CONCAT(
          JSON_OBJECT(
            'section_key', ld.section_key,
            'section_type', ld.section_type,
            'content', ld.content
          )
        ) as details
      FROM locales l
      LEFT JOIN local_details ld ON l.id = ld.local_id
      WHERE l.id = 2
      GROUP BY l.id
    `);
    
    if (groupConcatTest.length > 0) {
      const result = groupConcatTest[0];
      console.log(`GROUP_CONCAT result for ${result.slug}:`);
      console.log(`Details length: ${result.details ? result.details.length : 0}`);
      
      if (result.details) {
        console.log(`First 200 chars: ${result.details.substring(0, 200)}...`);
        
        // Test parsing the GROUP_CONCAT result
        try {
          const parsed = JSON.parse(`[${result.details}]`);
          console.log(`✅ GROUP_CONCAT parsed successfully, ${parsed.length} items`);
          
          // Check each item
          parsed.forEach((item, index) => {
            console.log(`Item ${index}: section_key=${item.section_key}, has_content=${!!item.content}`);
            if (item.content === null) {
              console.log(`  ⚠️  Item ${index} has null content`);
            }
          });
        } catch (e) {
          console.log(`❌ GROUP_CONCAT parse failed: ${e.message}`);
          console.log(`This explains why public endpoints return empty details`);
        }
      }
    }
    
    // Test the difference between profile and public endpoint queries
    console.log('\n=== PROFILE vs PUBLIC QUERY DIFFERENCE ===');
    
    console.log('PROFILE QUERY (separate queries):');
    const [profileResult] = await db.query(`
      SELECT * FROM locales WHERE id = 2
    `);
    
    const [profileDetails] = await db.query(`
      SELECT section_key, section_type, content FROM local_details WHERE local_id = 2
    `);
    
    console.log(`Profile: ${profileResult.length} locale rows, ${profileDetails.length} detail rows`);
    
    console.log('PUBLIC QUERY (GROUP_CONCAT):');
    const [publicResult] = await db.query(`
      SELECT 
        l.*,
        GROUP_CONCAT(
          JSON_OBJECT(
            'section_key', ld.section_key,
            'section_type', ld.section_type,
            'content', ld.content
          )
        ) as details
      FROM locales l
      LEFT JOIN local_details ld ON l.id = ld.local_id
      WHERE l.id = 2
      GROUP BY l.id
    `);
    
    if (publicResult.length > 0) {
      const public = publicResult[0];
      console.log(`Public: ${publicResult.length} rows, details length: ${public.details ? public.details.length : 0}`);
    }
    
    // Test legacy section keys vs expected keys
    console.log('\n=== SECTION KEY MAPPING AUDIT ===');
    
    const [allSectionKeys] = await db.query(`
      SELECT DISTINCT section_key, COUNT(*) as count
      FROM local_details 
      GROUP BY section_key
      ORDER BY section_key
    `);
    
    console.log('All section_keys in DB:');
    allSectionKeys.forEach(key => {
      console.log(`  ${key.section_key}: ${key.count} occurrences`);
    });
    
    console.log('\nExpected keys by normalizeLocalDetails:');
    const expectedKeys = [
      'headline', 'subheadline', 'description', 'highlights', 'services',
      'cta_label', 'cta_url', 'map_url', 'promotion_text', 
      'featured_products', 'business_tags', 'gallery', 'featured_dishes'
    ];
    
    expectedKeys.forEach(key => {
      const found = allSectionKeys.find(k => k.section_key === key);
      console.log(`  ${key}: ${found ? `✅ ${found.count} rows` : '❌ NOT FOUND'}`);
    });
    
    console.log('\n🎯 NORMALIZATION AUDIT COMPLETE');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Normalization Audit Error:', error);
    process.exit(1);
  }
}

auditNormalization();
