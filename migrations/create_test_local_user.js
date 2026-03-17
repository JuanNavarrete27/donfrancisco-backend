const db = require('../db');
const bcrypt = require('bcryptjs');

async function createTestLocalUser() {
  try {
    console.log('👤 Creating test local user...');
    
    // Create test user with 'local' role
    const hash = bcrypt.hashSync('test123', 10);
    
    const [userResult] = await db.query(`
      INSERT INTO usuarios (nombre, apellido, email, password, rol, telefono)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'Local',
      'Test',
      'local@test.com',
      hash,
      'local',
      '+598 9999 9999'
    ]);
    
    console.log(`✅ Created test local user (ID: ${userResult.insertId})`);
    
    // Assign user to Sakai Sushi & Ramen (ID: 1)
    await db.query(
      'UPDATE usuarios SET local_id = ? WHERE id = ?',
      [1, userResult.insertId]
    );
    
    console.log('✅ Assigned user to Sakai Sushi & Ramen');
    
    // Create another test user for a different local
    const hash2 = bcrypt.hashSync('test123', 10);
    
    const [userResult2] = await db.query(`
      INSERT INTO usuarios (nombre, apellido, email, password, rol, telefono)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'Comercio',
      'Test',
      'comercio@test.com',
      hash2,
      'local',
      '+598 8888 8888'
    ]);
    
    console.log(`✅ Created test comercio user (ID: ${userResult2.insertId})`);
    
    // Assign user to La Familia Autoservice (ID: 10)
    await db.query(
      'UPDATE usuarios SET local_id = ? WHERE id = ?',
      [10, userResult2.insertId]
    );
    
    console.log('✅ Assigned user to La Familia Autoservice');
    
    console.log('🎉 Test users created successfully!');
    console.log('');
    console.log('Test credentials:');
    console.log('Local User 1: local@test.com / test123 (Sakai Sushi & Ramen)');
    console.log('Local User 2: comercio@test.com / test123 (La Familia Autoservice)');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestLocalUser();
