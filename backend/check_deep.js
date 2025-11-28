const supabase = require('./services/supabaseClient');

async function checkDeep() {
    console.log('--- Checking Recent Sales ---');
    const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('*, customers(name)')
        .order('date', { ascending: false })
        .limit(5);

    if (salesError) console.error(salesError);
    else console.log(JSON.stringify(sales, null, 2));

    console.log('\n--- Checking Recent Transactions ---');
    const { data: trans, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .limit(5);

    if (transError) console.error(transError);
    else console.log(JSON.stringify(trans, null, 2));
}

checkDeep();
