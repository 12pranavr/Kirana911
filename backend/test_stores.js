const supabase = require('./services/supabaseClient');

async function testStores() {
    try {
        console.log('Testing stores database...');
        
        // Check if stores table exists and has data
        const { data: stores, error } = await supabase
            .from('stores')
            .select('*')
            .limit(5);
            
        if (error) {
            console.error('Error fetching stores:', error);
            return;
        }
        
        console.log('Found stores:', stores.length);
        if (stores.length > 0) {
            console.log('Sample store:', stores[0]);
            
            // Test pincode search if stores exist
            if (stores[0].pincode) {
                console.log('\nTesting pincode search for:', stores[0].pincode);
                const { data: pincodeStores, error: pincodeError } = await supabase
                    .from('stores')
                    .select('*')
                    .eq('pincode', stores[0].pincode)
                    .eq('is_active', true);
                    
                if (pincodeError) {
                    console.error('Pincode search error:', pincodeError);
                } else {
                    console.log('Pincode search results:', pincodeStores.length);
                    if (pincodeStores.length > 0) {
                        console.log('Sample result:', pincodeStores[0]);
                    }
                }
            }
        } else {
            console.log('No stores found in database');
        }
    } catch (error) {
        console.error('Test error:', error);
    }
}

testStores();