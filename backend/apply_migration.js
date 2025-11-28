const { createClient } = require('@supabase/supabase-js');

// Get credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_KEY environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
    console.log('Applying migration to update sales source constraint...');
    
    try {
        // Drop the existing constraint
        console.log('Dropping existing constraint...');
        const { error: dropError } = await supabase.rpc('execute_sql', {
            sql: 'ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_source_check;'
        });
        
        if (dropError) {
            console.warn('Warning when dropping constraint:', dropError);
        }
        
        // Add the new constraint with 'online' included
        console.log('Adding new constraint with online option...');
        const { error: addError } = await supabase.rpc('execute_sql', {
            sql: `ALTER TABLE sales ADD CONSTRAINT sales_source_check 
                  CHECK (source IN ('ocr', 'manual', 'online'));`
        });
        
        if (addError) {
            console.error('Error adding new constraint:', addError);
            return;
        }
        
        console.log('Migration applied successfully!');
        console.log('The sales table now accepts \'online\' as a valid source value.');
        
    } catch (error) {
        console.error('Error applying migration:', error);
    }
}

applyMigration();