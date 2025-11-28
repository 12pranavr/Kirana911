async function testForecast() {
    try {
        const response = await fetch('http://localhost:3000/api/forecast');
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testForecast();
