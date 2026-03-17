const db = require('./db');

async function auditPublicFlow() {
  try {
    console.log('🔍 AUDITING CATEGORY / PUBLIC DATA FLOW\n');
    
    // Test category filtering
    console.log('=== CATEGORY FILTERING TEST ===');
    
    const categories = ['gastronomia', 'compras'];
    
    for (const category of categories) {
      console.log(`\n--- Category: ${category} ---`);
      
      // Test the actual query used in public endpoints
      const [categoryQuery] = await db.query(`
        SELECT 
          l.id,
          l.slug,
          l.display_name,
          l.category,
          l.short_description,
          l.hero_title,
          l.active,
          l.featured
        FROM locales l
        WHERE l.active = true AND l.category = ?
        ORDER BY l.display_name
      `, [category]);
      
      console.log(`Found ${categoryQuery.length} active ${category} locales`);
      
      categoryQuery.forEach(locale => {
        console.log(`  ${locale.display_name} (${locale.slug}) - featured: ${locale.featured}`);
      });
    }
    
    // Test if saved data is reaching public endpoints
    console.log('\n=== SAVED DATA vs PUBLIC DATA COMPARISON ===');
    
    // Get the local that has been modified (ID 2)
    const [savedData] = await db.query(`
      SELECT 
        id, slug, display_name, category, short_description, hero_title,
        hero_subtitle, address, phone, whatsapp, email, opening_hours,
        logo_url, cover_image_url, website_url, instagram_url,
        facebook_url, tiktok_url, active, featured
      FROM locales 
      WHERE id = 2
    `);
    
    if (savedData.length > 0) {
      const saved = savedData[0];
      console.log('SAVED DATA (from locales table):');
      console.log(`  display_name: ${saved.display_name}`);
      console.log(`  short_description: ${saved.short_description}`);
      console.log(`  hero_title: ${saved.hero_title}`);
      console.log(`  hero_subtitle: ${saved.hero_subtitle}`);
      console.log(`  address: ${saved.address}`);
      console.log(`  phone: ${saved.phone}`);
      console.log(`  whatsapp: ${saved.whatsapp}`);
      console.log(`  email: ${saved.email}`);
      console.log(`  logo_url: ${saved.logo_url}`);
      console.log(`  cover_image_url: ${saved.cover_image_url}`);
      console.log(`  active: ${saved.active}`);
      console.log(`  featured: ${saved.featured}`);
      
      // Test if this appears in public gastronomy list
      const [publicGastro] = await db.query(`
        SELECT 
          l.id,
          l.slug,
          l.display_name,
          l.short_description,
          l.hero_title,
          l.logo_url,
          l.cover_image_url
        FROM locales l
        WHERE l.active = true AND l.category = 'gastronomia'
        ORDER BY l.display_name
      `);
      
      const inPublicList = publicGastro.find(l => l.id === 2);
      console.log(`\nAPPEARS IN PUBLIC GASTRONOMY LIST: ${inPublicList ? '✅ YES' : '❌ NO'}`);
      
      if (inPublicList) {
        console.log('PUBLIC LIST DATA:');
        console.log(`  display_name: ${inPublicList.display_name}`);
        console.log(`  short_description: ${inPublicList.short_description}`);
        console.log(`  hero_title: ${inPublicList.hero_title}`);
        console.log(`  logo_url: ${inPublicList.logo_url}`);
        console.log(`  cover_image_url: ${inPublicList.cover_image_url}`);
        
        // Compare saved vs public
        console.log('\nDATA CONSISTENCY CHECK:');
        console.log(`display_name match: ${saved.display_name === inPublicList.display_name ? '✅' : '❌'}`);
        console.log(`short_description match: ${saved.short_description === inPublicList.short_description ? '✅' : '❌'}`);
        console.log(`hero_title match: ${saved.hero_title === inPublicList.hero_title ? '✅' : '❌'}`);
        console.log(`logo_url match: ${saved.logo_url === inPublicList.logo_url ? '✅' : '❌'}`);
        console.log(`cover_image_url match: ${saved.cover_image_url === inPublicList.cover_image_url ? '✅' : '❌'}`);
      }
      
      // Test public detail page
      const [publicDetail] = await db.query(`
        SELECT 
          l.id,
          l.slug,
          l.display_name,
          l.short_description,
          l.hero_title,
          l.hero_subtitle,
          l.address,
          l.phone,
          l.whatsapp,
          l.email,
          l.opening_hours,
          l.logo_url,
          l.cover_image_url,
          l.website_url,
          l.instagram_url,
          l.facebook_url,
          l.tiktok_url
        FROM locales l
        WHERE l.slug = ? AND l.active = true
      `, [saved.slug]);
      
      if (publicDetail.length > 0) {
        const detail = publicDetail[0];
        console.log(`\nPUBLIC DETAIL PAGE DATA (${saved.slug}):`);
        console.log(`  display_name: ${detail.display_name}`);
        console.log(`  short_description: ${detail.short_description}`);
        console.log(`  hero_title: ${detail.hero_title}`);
        console.log(`  hero_subtitle: ${detail.hero_subtitle}`);
        console.log(`  address: ${detail.address}`);
        console.log(`  phone: ${detail.phone}`);
        console.log(`  whatsapp: ${detail.whatsapp}`);
        console.log(`  email: ${detail.email}`);
        console.log(`  logo_url: ${detail.logo_url}`);
        console.log(`  cover_image_url: ${detail.cover_image_url}`);
        
        console.log('\nDETAIL PAGE CONSISTENCY:');
        console.log(`display_name match: ${saved.display_name === detail.display_name ? '✅' : '❌'}`);
        console.log(`short_description match: ${saved.short_description === detail.short_description ? '✅' : '❌'}`);
        console.log(`hero_title match: ${saved.hero_title === detail.hero_title ? '✅' : '❌'}`);
        console.log(`address match: ${saved.address === detail.address ? '✅' : '❌'}`);
        console.log(`phone match: ${saved.phone === detail.phone ? '✅' : '❌'}`);
      }
    }
    
    // Test details visibility in public endpoints
    console.log('\n=== DETAILS VISIBILITY IN PUBLIC ENDPOINTS ===');
    
    // Get details for local 2
    const [localDetails] = await db.query(`
      SELECT section_key, content, section_type
      FROM local_details 
      WHERE local_id = 2
      ORDER BY section_key
    `);
    
    console.log(`Local 2 has ${localDetails.length} detail rows in DB`);
    
    // Test if details appear in public endpoints (simulate the broken GROUP_CONCAT)
    console.log('\nTesting GROUP_CONCAT behavior:');
    
    const [groupConcatResult] = await db.query(`
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
    
    if (groupConcatResult.length > 0) {
      const result = groupConcatResult[0];
      console.log(`GROUP_CONCAT length: ${result.details ? result.details.length : 0}`);
      
      if (result.details) {
        // Try to parse it like the public endpoints do
        try {
          const parsed = JSON.parse(`[${result.details}]`);
          console.log(`✅ GROUP_CONCAT parsed: ${parsed.length} items`);
          parsed.forEach((item, i) => {
            console.log(`  Item ${i}: ${item.section_key} - content length: ${item.content ? item.content.length : 0}`);
          });
        } catch (e) {
          console.log(`❌ GROUP_CONCAT parse failed: ${e.message}`);
          console.log('This is why public endpoints show no details!');
          
          // Show the problematic content
          console.log('\nProblematic content sample:');
          const sample = result.details.substring(0, 500);
          console.log(sample);
        }
      }
    }
    
    // Test the separate query approach (what profile endpoints use)
    console.log('\nTesting separate query approach (profile method):');
    
    const [separateResult] = await db.query(`
      SELECT section_key, content, section_type
      FROM local_details 
      WHERE local_id = 2
      ORDER BY section_key
    `);
    
    console.log(`Separate query returned ${separateResult.length} rows`);
    separateResult.forEach((detail, i) => {
      console.log(`  ${i}: ${detail.section_key} - content length: ${detail.content ? detail.content.length : 0}`);
    });
    
    console.log('\n🎯 PUBLIC FLOW AUDIT COMPLETE');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Public Flow Audit Error:', error);
    process.exit(1);
  }
}

auditPublicFlow();
