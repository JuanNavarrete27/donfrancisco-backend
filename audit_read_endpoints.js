const db = require('./db');

async function auditReadEndpoints() {
  try {
    console.log('🔍 AUDITING READ ENDPOINTS RESPONSE SHAPES\n');
    
    // Simulate getMyLocal response
    console.log('=== GET /api/me/local RESPONSE SHAPE ===');
    const localId = 2; // Use local ID 2 (entrebrasas)
    
    // Query 1: Get locale base record
    const [locales] = await db.query(
      'SELECT * FROM locales WHERE id = ?',
      [localId]
    );
    
    if (locales.length > 0) {
      const locale = locales[0];
      
      // Process JSON columns as the controller does
      if (locale.opening_hours) {
        try {
          const oh = JSON.parse(locale.opening_hours);
          locale.opening_hours = oh.raw !== undefined ? oh.raw : oh;
        } catch {
          // Not valid JSON, keep as-is (legacy data)
        }
      }
      
      if (locale.gallery_json) {
        try {
          locale.gallery_json = JSON.parse(locale.gallery_json);
        } catch {
          // Keep as-is if not valid JSON
        }
      }
      
      // Query 2: Get details rows separately
      const [detailsRows] = await db.query(
        'SELECT section_key, section_type, content FROM local_details WHERE local_id = ?',
        [localId]
      );
      
      // Simulate normalizeLocalDetails function
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
            // If content is not valid JSON, treat as string
            parsedContent = detail.content;
          }

          result[detail.section_key] = parsedContent;
        }

        return result;
      }
      
      locale.details = normalizeLocalDetails(detailsRows);
      
      console.log('Response structure:');
      console.log(JSON.stringify(locale, null, 2));
    }
    
    // Simulate getMyLocalDetails response
    console.log('\n=== GET /api/me/local/details RESPONSE SHAPE ===');
    const [details] = await db.query(`
      SELECT section_key, section_type, content
      FROM local_details
      WHERE local_id = ?
      ORDER BY section_key
    `, [localId]);
    
    const normalizedDetails = normalizeLocalDetails(details);
    console.log(JSON.stringify(normalizedDetails, null, 2));
    
    // Simulate getPublicLocales response
    console.log('\n=== GET /api/public/locales RESPONSE SHAPE ===');
    const [publicLocales] = await db.query(`
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
      WHERE l.active = true AND l.category = 'gastronomia'
      GROUP BY l.id
      ORDER BY l.display_name
      LIMIT 3
    `);
    
    const formattedPublicLocales = publicLocales.map(locale => {
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
    
    console.log('Public locales (gastronomia):');
    formattedPublicLocales.forEach(locale => {
      console.log(`\n--- ${locale.display_name} ---`);
      console.log(`slug: ${locale.slug}`);
      console.log(`short_description: ${locale.short_description}`);
      console.log(`hero_title: ${locale.hero_title}`);
      console.log(`opening_hours: ${locale.opening_hours}`);
      console.log(`details count: ${locale.details.length}`);
      if (locale.details.length > 0) {
        console.log(`first detail: ${JSON.stringify(locale.details[0])}`);
      }
    });
    
    // Simulate getPublicLocaleBySlug response
    console.log('\n=== GET /api/public/locales/:slug RESPONSE SHAPE ===');
    const slug = 'entre-brasas-parrilla-oriental';
    
    const [slugLocales] = await db.query(`
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
    
    if (slugLocales.length > 0) {
      const slugLocale = slugLocales[0];
      let details = [];
      if (slugLocale.details) {
        try {
          details = JSON.parse(`[${slugLocale.details}]`);
        } catch (e) {
          console.log(`Error parsing details for slug ${slug}:`, e.message);
        }
      }
      
      const formattedSlugLocale = {
        ...slugLocale,
        details
      };
      
      console.log(`Slug detail for ${slug}:`);
      console.log(JSON.stringify(formattedSlugLocale, null, 2));
    }
    
    // Simulate getPublicLocalesByCategory response
    console.log('\n=== GET /api/public/locales/category/:category RESPONSE SHAPE ===');
    const category = 'compras';
    
    const [categoryLocales] = await db.query(`
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
    `, [category]);
    
    const formattedCategoryLocales = categoryLocales.map(locale => {
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
    
    console.log(`Category locales (${category}):`);
    formattedCategoryLocales.forEach(locale => {
      console.log(`\n--- ${locale.display_name} ---`);
      console.log(`slug: ${locale.slug}`);
      console.log(`short_description: ${locale.short_description}`);
      console.log(`hero_title: ${locale.hero_title}`);
      console.log(`details count: ${locale.details.length}`);
    });
    
    console.log('\n🎯 READ ENDPOINTS AUDIT COMPLETE');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Read Endpoints Audit Error:', error);
    process.exit(1);
  }
}

auditReadEndpoints();
