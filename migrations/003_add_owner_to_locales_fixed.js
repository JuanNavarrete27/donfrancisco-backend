const db = require('../db');

async function addOwnerToLocalesFixed() {
  try {
    console.log('🔧 FIXING owner_user_id TO LOCALES TABLE\n');
    
    // Step 1: Drop existing column if it exists
    console.log('Step 1: Dropping existing owner_user_id column...');
    try {
      await db.query('ALTER TABLE locales DROP COLUMN owner_user_id');
      console.log('✅ Dropped existing owner_user_id column');
    } catch (e) {
      console.log('⚠️  Column did not exist, continuing...');
    }
    
    // Step 2: Add owner_user_id column with correct type
    console.log('Step 2: Adding owner_user_id column...');
    await db.query(`
      ALTER TABLE locales 
      ADD COLUMN owner_user_id INT NULL AFTER id,
      ADD INDEX idx_locales_owner_user_id (owner_user_id)
    `);
    console.log('✅ owner_user_id column added');
    
    // Step 3: Add foreign key constraint
    console.log('Step 3: Adding foreign key constraint...');
    await db.query(`
      ALTER TABLE locales 
      ADD CONSTRAINT fk_locales_owner_user 
      FOREIGN KEY (owner_user_id) REFERENCES usuarios(id) 
      ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log('✅ Foreign key constraint added');
    
    // Step 4: Backfill existing locales with owners
    console.log('Step 4: Backfilling existing ownership...');
    const [result] = await db.query(`
      UPDATE locales l 
      JOIN usuarios u ON u.local_id = l.id 
      SET l.owner_user_id = u.id 
      WHERE u.rol = 'local'
    `);
    console.log(`✅ Backfilled ${result.affectedRows} locales with owners`);
    
    // Step 5: Verify the migration
    console.log('Step 5: Verifying migration...');
    const [localesWithOwner] = await db.query(`
      SELECT l.id, l.slug, l.display_name, l.owner_user_id, u.nombre, u.email
      FROM locales l
      LEFT JOIN usuarios u ON u.id = l.owner_user_id
      WHERE l.owner_user_id IS NOT NULL
      ORDER BY l.display_name
    `);
    
    console.log(`Locales with owners: ${localesWithOwner.length}`);
    localesWithOwner.forEach(locale => {
      console.log(`  ${locale.display_name} (${locale.slug}) -> ${locale.nombre} (${locale.email})`);
    });
    
    console.log('\n🎯 MIGRATION COMPLETE');
    console.log('Next step: Update localesController to use owner_user_id instead of req.userLocalId');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration Error:', error);
    process.exit(1);
  }
}

addOwnerToLocalesFixed();
