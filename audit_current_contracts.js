const db = require('./db');

async function auditCurrentContracts() {
  try {
    console.log('🔍 AUDITING CURRENT LOCALE CONTRACTS\n');
    
    // Test each target endpoint's current response shape
    const endpoints = [
      { name: 'GET /api/me/local', path: 'profile', localId: 2 },
      { name: 'GET /api/me/local/details', path: 'profile-details', localId: 2 },
      { name: 'GET /api/public/locales', path: 'public-list', category: null },
      { name: 'GET /api/public/locales/category/gastronomia', path: 'public-category', category: 'gastronomia' },
      { name: 'GET /api/public/locales/entre-brasas-parrilla-oriental', path: 'public-slug', slug: 'entre-brasas-parrilla-oriental' },
      { name: 'GET /api/admin/locales', path: 'admin-list' }
    ];
    
    for (const endpoint of endpoints) {
      console.log(`\n=== ${endpoint.name} ===`);
      
      let response;
      
      switch (endpoint.path) {
        case 'profile':
          response = await simulateGetMyLocal(endpoint.localId);
          break;
        case 'profile-details':
          response = await simulateGetMyLocalDetails(endpoint.localId);
          break;
        case 'public-list':
          response = await simulateGetPublicLocales();
          break;
        case 'public-category':
          response = await simulateGetPublicLocalesByCategory(endpoint.category);
          break;
        case 'public-slug':
          response = await simulateGetPublicLocaleBySlug(endpoint.slug);
          break;
        case 'admin-list':
          response = await simulateGetAdminLocales();
          break;
      }
      
      if (response) {
        analyzeContractShape(endpoint.name, response);
      }
    }
    
    console.log('\n🎯 CURRENT CONTRACTS AUDIT COMPLETE');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Contract Audit Error:', error);
    process.exit(1);
  }
}

async function simulateGetMyLocal(localId) {
  // Simulate current controller logic
  const [locales] = await db.query('SELECT * FROM locales WHERE id = ?', [localId]);
  if (locales.length === 0) return null;
  
  const locale = locales[0];
  
  // Process JSON columns as current controller does
  if (locale.opening_hours) {
    try {
      const oh = JSON.parse(locale.opening_hours);
      locale.opening_hours = oh.raw !== undefined ? oh.raw : oh;
    } catch {
      // Not valid JSON, keep as-is
    }
  }
  
  if (locale.gallery_json) {
    try {
      locale.gallery_json = JSON.parse(locale.gallery_json);
    } catch {
      // Keep as-is if not valid JSON
    }
  }
  
  // Get details rows separately
  const [detailsRows] = await db.query(
    'SELECT section_key, section_type, content FROM local_details WHERE local_id = ?',
    [localId]
  );
  
  // Current normalizeLocalDetails function
  locale.details = normalizeLocalDetails(detailsRows);
  
  return { ok: true, data: locale };
}

async function simulateGetMyLocalDetails(localId) {
  const [details] = await db.query(`
    SELECT section_key, section_type, content FROM local_details
    WHERE local_id = ? ORDER BY section_key
  `, [localId]);
  
  const normalizedDetails = normalizeLocalDetails(details);
  return { ok: true, data: normalizedDetails };
}

async function simulateGetPublicLocales() {
  // Current broken GROUP_CONCAT approach
  const [locales] = await db.query(`
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
    WHERE l.active = true
    GROUP BY l.id
    ORDER BY l.display_name
    LIMIT 3
  `);
  
  const formattedLocales = locales.map(locale => {
    let details = [];
    if (locale.details) {
      try {
        details = JSON.parse(`[${locale.details}]`);
      } catch (e) {
        console.log(`Error parsing details for locale ${locale.id}:`, e.message);
      }
    }
    return {
      ...locale,
      details
    };
  });
  
  return { ok: true, data: formattedLocales };
}

async function simulateGetPublicLocalesByCategory(category) {
  const [locales] = await db.query(`
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
    WHERE l.active = true AND l.category = ?
    GROUP BY l.id
    ORDER BY l.display_name
    LIMIT 3
  `, [category]);
  
  const formattedLocales = locales.map(locale => {
    let details = [];
    if (locale.details) {
      try {
        details = JSON.parse(`[${locale.details}]`);
      } catch (e) {
        console.log(`Error parsing details for category locale ${locale.id}:`, e.message);
      }
    }
    return {
      ...locale,
      details
    };
  });
  
  return { ok: true, data: formattedLocales };
}

async function simulateGetPublicLocaleBySlug(slug) {
  const [locales] = await db.query(`
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
    WHERE l.slug = ? AND l.active = true
    GROUP BY l.id
  `, [slug]);
  
  if (locales.length === 0) return null;
  
  const locale = locales[0];
  let details = [];
  if (locale.details) {
    try {
      details = JSON.parse(`[${locale.details}]`);
    } catch (e) {
      console.log(`Error parsing details for slug ${slug}:`, e.message);
    }
  }
  
  return {
    ok: true,
    data: {
      ...locale,
      details
    }
  };
}

async function simulateGetAdminLocales() {
  const [locales] = await db.query(`
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
    GROUP BY l.id
    ORDER BY l.display_name
    LIMIT 3
  `);
  
  const formattedLocales = locales.map(locale => {
    let details = [];
    if (locale.details) {
      try {
        details = JSON.parse(`[${locale.details}]`);
      } catch (e) {
        console.log(`Error parsing details for admin locale ${locale.id}:`, e.message);
      }
    }
    return {
      ...locale,
      details
    };
  });
  
  return { ok: true, data: formattedLocales };
}

function normalizeLocalDetails(detailsArray) {
  if (!Array.isArray(detailsArray) || detailsArray.length === 0) {
    return {
      headline: null,
      subheadline: null,
      description: null,
      highlights: [],
      services: [],
      cta_label: null,
      cta_url: null,
      map_url: null,
      promotion_text: null,
      featured_products: [],
      business_tags: [],
      gallery: []
    };
  }

  const result = {
    headline: null,
    subheadline: null,
    description: null,
    highlights: [],
    services: [],
    cta_label: null,
    cta_url: null,
    map_url: null,
    promotion_text: null,
    featured_products: [],
    business_tags: [],
    gallery: []
  };

  for (const detail of detailsArray) {
    if (!detail || !detail.section_key) continue;
    
    let parsedContent;
    try {
      parsedContent = JSON.parse(detail.content);
    } catch (e) {
      parsedContent = detail.content;
    }

    result[detail.section_key] = parsedContent;
  }

  return result;
}

function analyzeContractShape(endpointName, response) {
  console.log(`Response structure for ${endpointName}:`);
  
  if (!response || !response.data) {
    console.log('  ❌ No response data');
    return;
  }
  
  const data = Array.isArray(response.data) ? response.data[0] : response.data;
  
  if (!data) {
    console.log('  ❌ Empty data array');
    return;
  }
  
  // Check required fields
  const requiredFields = [
    'id', 'slug', 'display_name', 'category', 'short_description',
    'long_description', 'hero_title', 'hero_subtitle', 'address',
    'phone', 'whatsapp', 'email', 'opening_hours', 'website_url',
    'instagram_url', 'facebook_url', 'tiktok_url', 'logo_url',
    'cover_image_url', 'gallery_json', 'menu_pdf_url', 'featured',
    'active', 'details'
  ];
  
  const missingFields = [];
  const presentFields = [];
  
  requiredFields.forEach(field => {
    if (data.hasOwnProperty(field)) {
      presentFields.push(field);
    } else {
      missingFields.push(field);
    }
  });
  
  console.log(`  ✅ Present: ${presentFields.length}/${requiredFields.length} fields`);
  console.log(`  ❌ Missing: ${missingFields.join(', ')}`);
  
  // Check details structure
  if (data.details) {
    const expectedDetailKeys = [
      'headline', 'subheadline', 'description', 'highlights', 'services',
      'cta_label', 'cta_url', 'map_url', 'promotion_text',
      'featured_products', 'business_tags', 'gallery'
    ];
    
    const missingDetailKeys = [];
    const presentDetailKeys = [];
    
    expectedDetailKeys.forEach(key => {
      if (data.details.hasOwnProperty(key)) {
        presentDetailKeys.push(key);
      } else {
        missingDetailKeys.push(key);
      }
    });
    
    console.log(`  Details ✅ Present: ${presentDetailKeys.length}/${expectedDetailKeys.length} keys`);
    console.log(`  Details ❌ Missing: ${missingDetailKeys.join(', ')}`);
    
    // Check array fields
    const arrayFields = ['highlights', 'services', 'featured_products', 'business_tags', 'gallery'];
    arrayFields.forEach(field => {
      const value = data.details[field];
      if (Array.isArray(value)) {
        console.log(`  ✅ ${field}: Array(${value.length})`);
      } else if (value === null || value === undefined) {
        console.log(`  ⚠️  ${field}: null/undefined`);
      } else {
        console.log(`  ❌ ${field}: ${typeof value} (should be array)`);
      }
    });
  } else {
    console.log('  ❌ No details object');
  }
  
  // Check opening_hours format
  if (data.opening_hours !== undefined) {
    if (typeof data.opening_hours === 'string') {
      console.log(`  ✅ opening_hours: string ("${data.opening_hours.substring(0, 50)}...")`);
    } else if (typeof data.opening_hours === 'object') {
      console.log(`  ❌ opening_hours: object (should be string)`);
    } else {
      console.log(`  ⚠️  opening_hours: ${typeof data.opening_hours}`);
    }
  }
}

auditCurrentContracts();
