const supabase = require('./services/supabaseClient');

async function testStoreFinance() {
    try {
        console.log('=== Testing Store Finance Calculation ===');
        
        const storeId = 'ffc44e04-3b5f-4bfe-beb7-747d257ea32f'; // mega mart store
        console.log('Testing for store ID:', storeId);
        
        // Get sales data for specific store
        const { data: salesData, error: salesError } = await supabase
            .from('sales')
            .select('total_price, store_id')
            .eq('store_id', storeId);
            
        if (salesError) {
            console.error('Sales query error:', salesError);
            return;
        }
        
        console.log('Store Sales data:', salesData);
        
        // Calculate revenue
        const revenue = salesData.reduce((sum, sale) => sum + sale.total_price, 0);
        console.log('Store Revenue:', revenue);
        
        // Get expense transactions for specific store
        const { data: expensesData, error: expensesError } = await supabase
            .from('transactions')
            .select('amount, store_id, type')
            .eq('type', 'expense')
            .eq('store_id', storeId);
            
        if (expensesError) {
            console.error('Expenses query error:', expensesError);
            return;
        }
        
        console.log('Store Expenses data:', expensesData);
        
        // Calculate expenses
        const expenses = expensesData.reduce((sum, transaction) => sum + transaction.amount, 0);
        console.log('Store Expenses:', expenses);
        
        // Calculate net profit
        const netProfit = revenue - expenses;
        console.log('Store Net Profit:', netProfit);
        
        console.log('\n=== Store Summary ===');
        console.log('Revenue:', revenue);
        console.log('Expenses:', expenses);
        console.log('Net Profit:', netProfit);
        
    } catch (error) {
        console.error('Test error:', error);
    }
}

testStoreFinance();