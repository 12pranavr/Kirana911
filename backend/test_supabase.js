const supabase = require('./services/supabaseClient');

async function testSupabase() {
    // Test 1: Check if customer_id column exists
    console.log('=== Test 1: Check if customer_id column exists ===');
    try {
        // Try to select customer_id column
        const { data, error } = await supabase
            .from('sales')
            .select('customer_id')
            .limit(1);
        
        if (error && error.message.includes('column')) {
            console.log('customer_id column does not exist');
        } else {
            console.log('customer_id column exists');
        }
    } catch (error) {
        console.error('Column check error:', error);
    }

    // Test 2: Check if transaction_id column exists
    console.log('\n=== Test 2: Check if transaction_id column exists ===');
    try {
        // Try to select transaction_id column
        const { data, error } = await supabase
            .from('sales')
            .select('transaction_id')
            .limit(1);
        
        if (error && error.message.includes('column')) {
            console.log('transaction_id column does not exist');
        } else {
            console.log('transaction_id column exists');
        }
    } catch (error) {
        console.error('Column check error:', error);
    }

    // Test 3: Can we query sales at all?
    console.log('\n=== Test 3: Query sales ===');
    const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .limit(5);

    if (salesError) {
        console.error('Sales query error:', salesError);
    } else {
        console.log('Sales query success! Count:', salesData?.length);
        console.log('Sales data structure:', JSON.stringify(salesData[0], null, 2));
    }

    // Test 4: Can we query products?
    console.log('\n=== Test 4: Query products ===');
    const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .limit(5);

    if (productsError) {
        console.error('Products query error:', productsError);
    } else {
        console.log('Products query success! Count:', productsData?.length);
    }
    
    // Test 5: Can we query transactions?
    console.log('\n=== Test 5: Query transactions ===');
    const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .limit(5);

    if (transactionsError) {
        console.error('Transactions query error:', transactionsError);
    } else {
        console.log('Transactions query success! Count:', transactionsData?.length);
    }
    
    // Test 6: Try to add customer_id column manually
    console.log('\n=== Test 6: Attempt to add customer_id column ===');
    try {
        // This won't work through Supabase client, but let's see what happens
        console.log('Cannot add columns through Supabase client - need to use SQL directly');
    } catch (error) {
        console.error('Migration attempt error:', error);
    }
}

testSupabase();