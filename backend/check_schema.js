const supabase = require('./services/supabaseClient');

async function checkSchema() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Error:', error);
        } else {
            console.log('Product keys:', Object.keys(data[0]));
            console.log('Product sample:', data[0]);
        }
    } catch (e) {
        console.error('Exception:', e);
    }
}

checkSchema();
