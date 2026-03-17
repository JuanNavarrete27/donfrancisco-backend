const db = require('../db');
const bcrypt = require('bcryptjs');

async function createTestLocalUsers() {
  try {
    console.log('🔧 CREATING TEST LOCAL USERS\n');
    
    // Test users for different slots
    const testUsers = [
      { 
        nombre: 'Local', 
        apellido: 'Uno', 
        email: 'local1@test.com', 
        password: 'test123',
        rol: 'local', 
        local_id: 1 
      },
      { 
        nombre: 'Local', 
        apellido: 'Siete', 
        email: 'local7@test.com', 
        password: 'test123',
        rol: 'local', 
        local_id: 7 
      }
    ];
    
    for (const user of testUsers) {
      console.log(`Creating test user: ${user.email} (local_id: ${user.local_id})`);
      
      // Check if user exists
      const [existing] = await db.query('SELECT id FROM usuarios WHERE email = ?', [user.email]);
      
      if (existing.length === 0) {
        // Hash password
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        // Create user
        const [result] = await db.query(`
          INSERT INTO usuarios (nombre, apellido, email, password, rol, local_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, NOW())
        `, [user.nombre, user.apellido, user.email, hashedPassword, user.rol, user.local_id]);
        
        console.log(`✅ Created user ID: ${result.insertId}`);
      } else {
        console.log(`⚠️  User ${user.email} already exists, updating local_id...`);
        await db.query('UPDATE usuarios SET local_id = ?, rol = ? WHERE email = ?', [user.local_id, user.rol, user.email]);
      }
    }
    
    // Verify users
    console.log('\nStep 2: Verifying test users...');
    const [users] = await db.query(`
      SELECT id, nombre, apellido, email, rol, local_id 
      FROM usuarios 
      WHERE rol = 'local' 
      ORDER BY local_id
    `);
    
    console.log(`Local users found: ${users.length}`);
    users.forEach(user => {
      console.log(`  ${user.id}: ${user.nombre} ${user.apellido} (${user.email}) -> local_id: ${user.local_id}`);
    });
    
    console.log('\n🎯 TEST USERS READY');
    console.log('Use these credentials to test /api/me/local endpoints:');
    console.log('- local1@test.com (local_id 1 - gastronomia)');
    console.log('- local7@test.com (local_id 7 - tiendas)');
    console.log('Password: test123');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration Error:', error);
    process.exit(1);
  }
}

createTestLocalUsers();
