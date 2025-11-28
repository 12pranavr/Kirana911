const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function testFrontendData() {
  try {
    console.log('Testing frontend data retrieval...');
    
    // Test getting products with image_url
    const { data, error } = await supabase
      .from('products')
      .select('id, name, image_url, selling_price, stock_levels(current_stock)')
      .limit(3);
    
    if (error) {
      console.error('Error querying products:', error);
      return;
    }
    
    console.log('Products data for frontend:');
    data.forEach(product => {
      console.log(`- ${product.name}: ${product.image_url || 'No image'}`);
    });
    
    // Test getting a specific store with products
    const { data: stores, error: storeError } = await supabase
      .from('stores')
      .select('id, name, image_url')
      .limit(1);
    
    if (storeError) {
      console.error('Error querying stores:', storeError);
      return;
    }
    
    if (stores && stores.length > 0) {
      console.log('\nStore data:');
      const store = stores[0];
      console.log(`- ${store.name}: ${store.image_url || 'No image'}`);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testFrontendData();