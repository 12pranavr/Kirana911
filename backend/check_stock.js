const supabase = require('./services/supabaseClient');

async function checkStock() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('id, name, stock')
            .limit(5);

        if (error) {
            console.error('Error:', error);
        } else {
            console.log('Products sample:', data);
        }
    } catch (e) {
        console.error('Exception:', e);
    }
}

checkStock();
