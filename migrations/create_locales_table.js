const db = require('../db');

async function createLocalesTable() {
  try {
    console.log('🔧 Creating locales table...');
    
    // Add local_id to usuarios table first
    await db.query(`
      ALTER TABLE usuarios 
      ADD COLUMN local_id INT UNSIGNED NULL AFTER rol,
      ADD INDEX idx_usuarios_local_id (local_id)
    `);
    console.log('✅ Added local_id to usuarios table');
    
    // Create locales table
    await db.query(`
      CREATE TABLE locales (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(100) NOT NULL UNIQUE,
        display_name VARCHAR(200) NOT NULL,
        category ENUM('gastronomia', 'compras', 'otros') NOT NULL DEFAULT 'gastronomia',
        short_description TEXT NULL,
        long_description TEXT NULL,
        hero_title VARCHAR(255) NULL,
        hero_subtitle VARCHAR(255) NULL,
        address VARCHAR(300) NULL,
        phone VARCHAR(50) NULL,
        whatsapp VARCHAR(50) NULL,
        email VARCHAR(180) NULL,
        opening_hours JSON NULL,
        website_url VARCHAR(500) NULL,
        instagram_url VARCHAR(300) NULL,
        facebook_url VARCHAR(300) NULL,
        tiktok_url VARCHAR(300) NULL,
        logo_url VARCHAR(500) NULL,
        cover_image_url VARCHAR(500) NULL,
        gallery_json JSON NULL,
        menu_pdf_url VARCHAR(500) NULL,
        featured BOOLEAN NOT NULL DEFAULT FALSE,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_locales_slug (slug),
        INDEX idx_locales_category (category),
        INDEX idx_locales_active (active),
        INDEX idx_locales_featured (featured),
        INDEX idx_locales_category_active (category, active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created locales table');
    
    // Create local_details table
    await db.query(`
      CREATE TABLE local_details (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        local_id INT UNSIGNED NOT NULL,
        section_key VARCHAR(100) NOT NULL,
        section_type ENUM('text', 'json', 'array') NOT NULL DEFAULT 'json',
        content JSON NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (local_id) REFERENCES locales(id) ON DELETE CASCADE ON UPDATE CASCADE,
        UNIQUE KEY uq_local_section (local_id, section_key),
        INDEX idx_local_details_key (section_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created local_details table');
    
    // Add foreign key constraint
    await db.query(`
      ALTER TABLE usuarios 
      ADD CONSTRAINT fk_usuarios_local_id 
      FOREIGN KEY (local_id) REFERENCES locales(id) 
      ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log('✅ Added foreign key constraint');
    
    console.log('🎉 All tables created successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createLocalesTable();
