const express = require('express');
const app = express();
const port = 3001;

// Middleware to parse JSON
app.use(express.json());

app.post('/test', (req, res) => {
    console.log('Received body:', req.body);
    res.json({ received: req.body });
});

app.listen(port, () => {
    console.log(`Test server running on port ${port}`);
});