// const fetch = require('node-fetch'); // Using built-in fetch

async function testSale() {
    const payload = {
        customer_id: '64782005-1c7d-4025-bfc2-99c4240e3e27',
        items: [
            {
                product_id: 'bbd79c0d-3b13-48f4-b5e3-c32e1781d8cb',
                quantity: 1
            }
        ],
        payment_method: 'cash',
        notes: 'API Test Sale'
    };

    try {
        const response = await fetch('http://localhost:3000/api/transactions/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testSale();
