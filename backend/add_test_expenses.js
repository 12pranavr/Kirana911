const supabase = require('./services/supabaseClient');

async function addTestExpenses() {
    try {
        console.log('=== Adding Test Expense Transactions ===');
        
        // Add some expense transactions for testing
        const testExpenses = [
            {
                date: new Date().toISOString(),
                type: 'expense',
                category: 'Utilities',
                amount: 50.00,
                note: 'Electricity bill',
                store_id: 'ffc44e04-3b5f-4bfe-beb7-747d257ea32f' // mega mart store
            },
            {
                date: new Date().toISOString(),
                type: 'expense',
                category: 'Inventory',
                amount: 200.00,
                note: 'Monthly stock purchase',
                store_id: 'ffc44e04-3b5f-4bfe-beb7-747d257ea32f' // mega mart store
            }
        ];
        
        const { data, error } = await supabase
            .from('transactions')
            .insert(testExpenses)
            .select();
            
        if (error) {
            console.error('Error inserting test expenses:', error);
            return;
        }
        
        console.log('Successfully added test expenses:', data);
        
    } catch (error) {
        console.error('Test error:', error);
    }
}

addTestExpenses();