const supabase = require('./services/supabaseClient');

async function testAdd() {
    console.log('Testing Add Customer...');
    const { data: customer, error: custError } = await supabase
        .from('customers')
        .insert([{ name: 'Test Script Customer', email: 'test@script.com', phone: '0000000000', role: 'Customer' }])
        .select()
        .single();

    if (custError) {
        console.error('Add Customer Failed:', custError);
    } else {
        console.log('Add Customer Success:', customer);
    }

    console.log('Testing Add Product...');
    const { data: product, error: prodError } = await supabase
        .from('products')
        .insert([{
            name: 'Test Script Product',
            sku_id: 'TEST001',
            cost_price: 10,
            selling_price: 20,
            category: 'Test',
            active: true
        }])
        .select()
        .single();

    if (prodError) {
        console.error('Add Product Failed:', prodError);
    } else {
        console.log('Add Product Success:', product);

        console.log('Testing Add Stock...');
        const { error: stockError } = await supabase
            .from('stock_levels')
            .insert([{ product_id: product.id, current_stock: 100 }]);

        if (stockError) {
            console.error('Add Stock Failed:', stockError);
        } else {
            console.log('Add Stock Success');
        }
    }
}

testAdd();
