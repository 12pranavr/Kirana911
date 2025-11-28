const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function addTestImages() {
  try {
    console.log('Adding test images to products and stores...');
    
    // Add test image to a product
    const testProductImageUrl = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=200&q=80';
    
    // Get a sample product
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, name')
      .limit(1);
    
    if (productError) {
      console.error('Error fetching products:', productError);
      return;
    }
    
    if (products && products.length > 0) {
      const product = products[0];
      console.log(`Adding test image to product: ${product.name}`);
      
      const { data: updatedProduct, error: updateError } = await supabase
        .from('products')
        .update({ image_url: testProductImageUrl })
        .eq('id', product.id)
        .select('id, name, image_url');
      
      if (updateError) {
        console.error('Error updating product:', updateError);
      } else {
        console.log('Successfully added test image to product:', updatedProduct[0]);
      }
    }
    
    // Add test image to a store
    const testStoreImageUrl = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=200&q=80';
    
    // Get a sample store
    const { data: stores, error: storeError } = await supabase
      .from('stores')
      .select('id, name')
      .limit(1);
    
    if (storeError) {
      console.error('Error fetching stores:', storeError);
      return;
    }
    
    if (stores && stores.length > 0) {
      const store = stores[0];
      console.log(`Adding test image to store: ${store.name}`);
      
      const { data: updatedStore, error: updateStoreError } = await supabase
        .from('stores')
        .update({ image_url: testStoreImageUrl })
        .eq('id', store.id)
        .select('id, name, image_url');
      
      if (updateStoreError) {
        console.error('Error updating store:', updateStoreError);
      } else {
        console.log('Successfully added test image to store:', updatedStore[0]);
      }
    }
    
    console.log('\nTest images added successfully!');
    console.log('You can now check the frontend to see if images are displayed.');
  } catch (error) {
    console.error('Error:', error);
  }
}

addTestImages();