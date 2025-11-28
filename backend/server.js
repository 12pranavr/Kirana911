const express = require('express');
const cors = require('cors');
const supabase = require('./services/supabaseClient');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/ocr', require('./routes/ocr'));
app.use('/api/excel', require('./routes/excel'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/audio', require('./routes/audio'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/forecast', require('./routes/forecast_simple'));
app.use('/api/predictions', require('./routes/predictions'));
app.use('/api/ml-models', require('./routes/ml_models'));

// Add customer engagement route
app.use('/api/customer-engagement', require('./routes/customerEngagement'));

// Add stores route
app.use('/api/stores', require('./routes/stores'));

app.get('/', (req, res) => {
    res.send('KIRANA911 Backend is running');
});

// Initialize database
async function initializeDatabase() {
    try {
        // Test Supabase connection
        const { data, error } = await supabase
            .from('products')
            .select('count')
            .limit(1);

        if (error) throw error;
        console.log('✅ Supabase connection established');
    } catch (error) {
        console.error('❌ Supabase connection failed:', error.message);
    }
}

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await initializeDatabase();
    console.log('✅ Server started successfully');
});