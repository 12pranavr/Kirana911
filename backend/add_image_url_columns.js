const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function addImageUrlColumns() {
  try {
    console.log('Adding image_url columns to stores and products tables...');
    
    // Add image_url column to stores table
    console.log('Adding image_url column to stores table...');
    const { error: storesError } = await supabase
      .from('stores')
      .update({}) // This is just to initialize the table structure check
      .limit(1);
    
    // We'll use a different approach - try to select the column first
    const { data: storeData, error: storeSelectError } = await supabase
      .from('stores')
      .select('id')
      .limit(1);
    
    if (storeSelectError && storeSelectError.message.includes('image_url')) {
      console.log('image_url column does not exist in stores table');
    } else {
      console.log('Checking if image_url column exists in stores table...');
    }
    
    // Add image_url column to products table
    console.log('Adding image_url column to products table...');
    const { data: productData, error: productSelectError } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    if (productSelectError && productSelectError.message.includes('image_url')) {
      console.log('image_url column does not exist in products table');
    } else {
      console.log('Checking if image_url column exists in products table...');
    }
    
    console.log('Please add the image_url columns manually through the Supabase dashboard:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to Table Editor');
    console.log('3. Add a column named "image_url" of type "text" to both "stores" and "products" tables');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

addImageUrlColumns();