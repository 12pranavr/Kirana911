const https = require('https');

// Test image URL from our database
const testImageUrl = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=200&q=80';

console.log('Testing if image URL can be accessed...');

https.get(testImageUrl, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Content-Type: ${res.headers['content-type']}`);
  
  if (res.statusCode === 200) {
    console.log('✓ Image URL is accessible');
  } else {
    console.log('✗ Image URL is not accessible');
  }
  
  // Just read the headers, not the full image
  res.on('data', () => {
    // Do nothing, just consume the data
  });
  
  res.on('end', () => {
    console.log('Test completed');
  });
}).on('error', (err) => {
  console.error('Error accessing image URL:', err.message);
});