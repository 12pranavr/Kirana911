const supabase = require('./services/supabaseClient');

async function checkTransactions() {
    const { count, error } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error checking transactions:', error);
    } else {
        console.log('Total Transactions:', count);
    }

    const { data, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .limit(5);

    console.log('Recent Transactions:', data);
}

checkTransactions();
