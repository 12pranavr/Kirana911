const supabase = require('./services/supabaseClient');

async function testBasicConnection() {
    console.log('=== Testing Basic Supabase Connection ===');

    // Test 1: Can we query products?
    console.log('\n1. Testing products query...');
    const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, name')
        .limit(5);

    if (prodError) {
        console.error('❌ Products error:', prodError);
    } else {
        console.log('✅ Products success! Count:', products?.length);
        console.log('Sample:', products?.[0]);
    }

    // Test 2: Can we query customers?
    console.log('\n2. Testing customers query...');
    const { data: customers, error: custError } = await supabase
        .from('customers')
        .select('id, name')
        .limit(5);

    if (custError) {
        console.error('❌ Customers error:', custError);
    } else {
        console.log('✅ Customers success! Count:', customers?.length);
        console.log('Sample:', customers?.[0]);
    }

    // Test 3: Can we query sales?
    console.log('\n3. Testing sales query...');
    const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('id, date')
        .limit(5);

    if (salesError) {
        console.error('❌ Sales error:', salesError);
    } else {
        console.log('✅ Sales success! Count:', sales?.length);
    }
}

testBasicConnection().then(() => {
    console.log('\n=== Test Complete ===');
    process.exit(0);
}).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
