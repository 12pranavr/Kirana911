const supabase = require('./services/supabaseClient');

async function check() {
    console.log('Checking customers...');
    const { data, error } = await supabase
        .from('customers')
        .select('*');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Customers found:', data.length);
        console.log(data);
    }
}

check();
