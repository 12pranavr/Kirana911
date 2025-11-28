const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function testImageSave() {
  try {
    console.log('Testing image URL save and retrieval...');
    
    // First, let's try to add an image_url column if it doesn't exist
    // Note: This might not work depending on Supabase permissions
    
    // Try to update a product with an image URL
    const testImageUrl = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=200&q=80';
    
    // Get a sample product ID
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    if (fetchError) {
      console.error('Error fetching products:', fetchError);
      return;
    }
    
    if (products && products.length > 0) {
      const productId = products[0].id;
      console.log('Testing with product ID:', productId);
      
      // Try to update the product with an image URL
      const { data, error } = await supabase
        .from('products')
        .update({ image_url: testImageUrl })
        .eq('id', productId)
        .select('id, name, image_url');
      
      if (error) {
        console.error('Error updating product with image URL:', error);
        console.log('This likely means the image_url column does not exist in the products table.');
        console.log('Please run the add_image_url_columns.sql script in your Supabase SQL editor.');
      } else {
        console.log('Successfully updated product with image URL:', data[0]);
      }
    } else {
      console.log('No products found in database');
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testImageSave();