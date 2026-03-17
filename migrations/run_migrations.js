const fs = require('fs');
const db = require('../db');

async function runMigrations() {
  try {
    console.log('🚀 Running migrations...');
    
    // Read and execute schema migration
    const schemaSQL = fs.readFileSync('./migrations/001_add_locales_schema.sql', 'utf8');
    console.log('📋 Executing schema migration...');
    
    // Split SQL statements by semicolon and filter empty ones
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('🔧 Executing:', statement.substring(0, 50) + '...');
        await db.query(statement);
      }
    }
    
    console.log('✅ Schema migration completed');
    
    // Read and execute seed migration
    const seedSQL = fs.readFileSync('./migrations/002_seed_initial_locales.sql', 'utf8');
    console.log('📋 Executing seed migration...');
    
    // Split seed statements
    const seedStatements = seedSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));
    
    for (const statement of seedStatements) {
      if (statement.trim()) {
        console.log('🔧 Executing seed:', statement.substring(0, 50) + '...');
        await db.query(statement);
      }
    }
    
    console.log('✅ Seed migration completed');
    console.log('🎉 All migrations completed successfully!');
    
    // Verify the data
    const [locales] = await db.query('SELECT COUNT(*) as count FROM locales');
    const [details] = await db.query('SELECT COUNT(*) as count FROM local_details');
    
    console.log(`📊 Result: ${locales[0].count} locales created`);
    console.log(`📊 Result: ${details[0].count} detail records created`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

runMigrations();
