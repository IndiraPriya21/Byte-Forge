require('dotenv').config();
const fs = require('fs');
const { Pool } = require('pg');

async function setupDatabase() {
  let pool;
  try {
    console.log('[DATABASE SETUP] Starting database schema creation...');
    
    // Parse Supabase URL to get connection details
    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL not set in .env');
    }
    
    // Extract database credentials from Supabase URL
    // Format: https://xxxxx.supabase.co
    const urlParts = supabaseUrl.split('//')[1].split('.');
    const projectId = urlParts[0];
    
    // Default Supabase connection uses anon key but we need service role
    // Connection details for direct PostgreSQL access
    const connectionString = `postgresql://postgres:${process.env.SUPABASE_PASSWORD}@db.${projectId}.supabase.co:5432/postgres`;
    
    pool = new Pool({ 
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
    
    // Read the SQL file
    const sql = fs.readFileSync('./database-setup.sql', 'utf-8');
    
    console.log('[DATABASE SETUP] Executing database schema...');
    const client = await pool.connect();
    
    try {
      // Execute the entire SQL file
      await client.query(sql);
      console.log('[DATABASE SETUP] ✅ Database schema created successfully!');
      console.log('[DATABASE SETUP] Tables created:');
      console.log('  - public.users');
      console.log('  - public.library');
      console.log('  - public.scans');
      console.log('  - public.analysis_results');
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('[DATABASE SETUP ERROR]', error.message);
    console.error('\n⚠️  Database setup failed. Manual setup required:');
    console.error('\n1. Go to Supabase Dashboard: https://app.supabase.com');
    console.error('2. Select your project');
    console.error('3. Go to SQL Editor');
    console.error('4. Click "New Query"');
    console.error('5. Copy entire contents of database-setup.sql');
    console.error('6. Paste into SQL editor and click "Run"');
    console.error('\nDatabase schema file: backend/database-setup.sql');
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

setupDatabase();
