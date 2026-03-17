const db = require('../db');

async function createLocalDetailsTable() {
  try {
    console.log('🔧 CREATING LOCAL_DETAILS TABLE\n');
    
    // Create local_details table
    console.log('Step 1: Creating local_details table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS local_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        local_id INT UNSIGNED NOT NULL,
        section_key VARCHAR(100) NOT NULL,
        section_type ENUM('text', 'array', 'json', 'number') DEFAULT 'text',
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_local_section (local_id, section_key),
        INDEX idx_local_id (local_id),
        CONSTRAINT fk_local_details_locale 
          FOREIGN KEY (local_id) REFERENCES locales(id) 
          ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ local_details table created');
    
    // Verify table structure
    console.log('Step 2: Verifying table structure...');
    const [columns] = await db.query('DESCRIBE local_details');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null ? 'NULL' : 'NOT NULL'} ${col.Key ? '(' + col.Key + ')' : ''}`);
    });
    
    console.log('\n🎯 MIGRATION COMPLETE');
    console.log('local_details table is ready for extended locale information');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration Error:', error);
    process.exit(1);
  }
}

createLocalDetailsTable();
