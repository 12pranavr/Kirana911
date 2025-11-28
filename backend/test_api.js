const http = require('http');

const data = JSON.stringify({
  product_id: 'bbd79c0d-3b13-48f4-b5e3-c32e1781d8cb'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/almi/predict',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);

  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();