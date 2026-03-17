const db = require('./db');

async function auditLocalesStructure() {
  try {
    console.log('=== LOCALES TABLE STRUCTURE ===\n');
    
    const [rows] = await db.query('DESCRIBE locales');
    rows.forEach(r => {
      console.log(`${r.Field}: ${r.Type} ${r.Null ? 'NULL' : 'NOT NULL'} ${r.Key ? '(' + r.Key + ')' : ''}`);
    });
    
    console.log('\n=== USUARIOS TABLE STRUCTURE ===\n');
    
    const [userRows] = await db.query('DESCRIBE usuarios');
    userRows.forEach(r => {
      console.log(`${r.Field}: ${r.Type} ${r.Null ? 'NULL' : 'NOT NULL'} ${r.Key ? '(' + r.Key + ')' : ''}`);
    });
    
    console.log('\n=== LOCAL_DETAILS TABLE STRUCTURE ===\n');
    
    try {
      const [detailRows] = await db.query('DESCRIBE local_details');
      detailRows.forEach(r => {
        console.log(`${r.Field}: ${r.Type} ${r.Null ? 'NULL' : 'NOT NULL'} ${r.Key ? '(' + r.Key + ')' : ''}`);
      });
    } catch (e) {
      console.log('local_details table does not exist');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

auditLocalesStructure();
