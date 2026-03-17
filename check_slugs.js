const db = require('./db');

async function checkSlugs() {
  try {
    console.log('🔍 CHECKING ACTIVE SLUGS\n');
    
    const [locales] = await db.query(`
      SELECT id, slug, display_name, category 
      FROM locales 
      WHERE active = true 
      ORDER BY id
    `);
    
    console.log('ACTIVE LOCALES:');
    locales.forEach(locale => {
      console.log(`${locale.id}: ${locale.slug} -> ${locale.display_name} (${locale.category})`);
    });
    
    // Check specific Entre Brasas slug
    const [entrebrasas] = await db.query(`
      SELECT id, slug, display_name 
      FROM locales 
      WHERE display_name LIKE '%Entre Brasas%' OR slug LIKE '%entrebrasas%'
    `);
    
    console.log('\nENTRE BRASAS MATCHES:');
    entrebrasas.forEach(locale => {
      console.log(`${locale.id}: ${locale.slug} -> ${locale.display_name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSlugs();
