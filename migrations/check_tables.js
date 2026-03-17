const db = require('../db');

async function checkTables() {
  try {
    console.log('🔍 Checking existing tables...');
    const [tables] = await db.query('SHOW TABLES');
    console.log('Tables:', tables.map(t => Object.values(t)[0]));
    
    console.log('\n🔍 Checking usuarios table structure...');
    const [usuarios] = await db.query('DESCRIBE usuarios');
    console.log('Usuarios columns:', usuarios.map(col => col.Field));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTables();
