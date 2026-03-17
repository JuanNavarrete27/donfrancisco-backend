const db = require('../db');

async function setupFixedLocalSlots() {
  try {
    console.log('🔧 SETTING UP FIXED LOCAL_ID SLOTS\n');
    
    // Step 1: Ensure we have locales for slots 1-11
    console.log('Step 1: Creating fixed slot locales...');
    
    const fixedSlots = [
      { id: 1, slug: 'local-001', display_name: 'Local 001', category: 'gastronomia' },
      { id: 2, slug: 'local-002', display_name: 'Local 002', category: 'gastronomia' },
      { id: 3, slug: 'local-003', display_name: 'Local 003', category: 'gastronomia' },
      { id: 4, slug: 'local-004', display_name: 'Local 004', category: 'gastronomia' },
      { id: 5, slug: 'local-005', display_name: 'Local 005', category: 'gastronomia' },
      { id: 6, slug: 'local-006', display_name: 'Local 006', category: 'gastronomia' },
      { id: 7, slug: 'local-007', display_name: 'Local 007', category: 'tiendas' },
      { id: 8, slug: 'local-008', display_name: 'Local 008', category: 'tiendas' },
      { id: 9, slug: 'local-009', display_name: 'Local 009', category: 'tiendas' },
      { id: 10, slug: 'local-010', display_name: 'Local 010', category: 'tiendas' },
      { id: 11, slug: 'local-011', display_name: 'Local 011', category: 'tiendas' }
    ];
    
    for (const slot of fixedSlots) {
      const [existing] = await db.query('SELECT id FROM locales WHERE id = ?', [slot.id]);
      
      if (existing.length === 0) {
        console.log(`  Creating locale slot ${slot.id} (${slot.category})`);
        await db.query(`
          INSERT INTO locales (
            id, slug, display_name, category, active, featured, 
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, 1, 0, NOW(), NOW())
        `, [slot.id, slot.slug, slot.display_name, slot.category]);
      } else {
        console.log(`  Locale slot ${slot.id} already exists, updating category...`);
        await db.query(`
          UPDATE locales SET category = ? WHERE id = ?
        `, [slot.category, slot.id]);
      }
    }
    
    // Step 2: Update category enum to include 'tiendas'
    console.log('Step 2: Updating category enum...');
    try {
      await db.query(`
        ALTER TABLE locales 
        MODIFY COLUMN category ENUM('gastronomia', 'tiendas', 'compras', 'otros') 
        DEFAULT 'gastronomia'
      `);
      console.log('✅ Category enum updated to include tiendas');
    } catch (e) {
      console.log('⚠️  Category enum already includes tiendas or failed to update');
    }
    
    // Step 3: Verify the setup
    console.log('Step 3: Verifying fixed slots...');
    const [slots] = await db.query(`
      SELECT id, slug, display_name, category, active 
      FROM locales 
      WHERE id BETWEEN 1 AND 11 
      ORDER BY id
    `);
    
    console.log(`Fixed slots configured: ${slots.length}`);
    slots.forEach(slot => {
      console.log(`  ${slot.id}: ${slot.display_name} -> ${slot.category} (${slot.active ? 'active' : 'inactive'})`);
    });
    
    // Step 4: Clean up any owner_user_id references
    console.log('Step 4: Cleaning up owner_user_id references...');
    const [cleanup] = await db.query(`
      UPDATE locales SET owner_user_id = NULL WHERE owner_user_id IS NOT NULL
    `);
    console.log(`✅ Cleared owner_user_id from ${cleanup.affectedRows} locales`);
    
    console.log('\n🎯 FIXED SLOTS SETUP COMPLETE');
    console.log('- Slots 1-6: gastronomia');
    console.log('- Slots 7-11: tiendas');
    console.log('- usuarios.local_id is now the authoritative binding');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration Error:', error);
    process.exit(1);
  }
}

setupFixedLocalSlots();
