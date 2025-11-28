const supabase = require('./services/supabaseClient');

async function checkTransactions() {
    try {
        console.log('=== Checking All Transactions ===');
        
        // Get all transactions
        const { data: transactionsData, error: transactionsError } = await supabase
            .from('transactions')
            .select('*');
            
        if (transactionsError) {
            console.error('Transactions query error:', transactionsError);
            return;
        }
        
        console.log('All transactions:', transactionsData);
        
        // Group by type
        const transactionsByType = {};
        transactionsData.forEach(transaction => {
            if (!transactionsByType[transaction.type]) {
                transactionsByType[transaction.type] = [];
            }
            transactionsByType[transaction.type].push(transaction);
        });
        
        console.log('\n=== Transactions by Type ===');
        Object.keys(transactionsByType).forEach(type => {
            console.log(`${type}: ${transactionsByType[type].length} transactions`);
            transactionsByType[type].forEach(t => {
                console.log(`  - Amount: ${t.amount}, Note: ${t.note}`);
            });
        });
        
    } catch (error) {
        console.error('Test error:', error);
    }
}

checkTransactions();