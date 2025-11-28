const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function checkProductFields() {
  try {
    console.log('Checking available fields in products table...');
    
    // Get table schema information
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error querying products table:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Available fields in products table:');
      const product = data[0];
      Object.keys(product).forEach(key => {
        console.log(`- ${key}: ${typeof product[key]}`);
      });
      
      // Check if image_url exists
      if ('image_url' in product) {
        console.log('\n✓ image_url field exists');
      } else {
        console.log('\n✗ image_url field does not exist');
        console.log('\nTo fix this issue:');
        console.log('1. Run the add_image_url_columns.sql script in your Supabase SQL editor');
        console.log('2. Or manually add the image_url column to the products table');
      }
    } else {
      console.log('No products found in database');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkProductFields();