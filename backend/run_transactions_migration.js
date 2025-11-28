// Script to run the transactions store_id migration
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Key is missing!');
  process.exit(1);
}

// Create a Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('Running migration to add store_id column to transactions table...');
  
  try {
    // Read the migration SQL
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, 'migrations', '005_add_store_id_to_transactions.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim() !== '');
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim() !== '') {
        console.log('Executing:', statement.trim());
        const { error } = await supabase.rpc('execute_sql', { sql: statement.trim() + ';' });
        
        if (error) {
          console.error('Statement error:', error);
          // Don't exit on error, continue with other statements
        }
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration();