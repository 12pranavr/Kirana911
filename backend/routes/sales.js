const express = require('express');
const router = express.Router();
const supabase = require('../services/supabaseClient');
const getUserStore = require('../utils/getUserStore');

// Get sales trend (last 30 days)
router.get('/trend', async (req, res) => {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        // Get user's store information
        let query = supabase
            .from('sales')
            .select(`
                date, 
                total_price, 
                qty_sold,
                store_id
            `)
            .gte('date', startDate.toISOString())
            .order('date', { ascending: true });
            
        try {
            const userStore = await getUserStore(req);
            
            // If user is an owner, filter by their store
            if (userStore.role === 'owner' && userStore.store_id) {
                query = query.eq('store_id', userStore.store_id);
            }
        } catch (authError) {
            // If no auth, continue without filtering (backward compatibility)
            console.log('No authentication provided, returning all sales');
        }

        const { data: sales, error } = await query;

        if (error) throw error;

        // Group by date
        const salesByDate = {};
        sales.forEach(sale => {
            const date = sale.date.split('T')[0]; // Get just the date part
            if (!salesByDate[date]) {
                salesByDate[date] = { date, revenue: 0, quantity: 0 };
            }
            salesByDate[date].revenue += sale.total_price;
            salesByDate[date].quantity += sale.qty_sold;
        });

        const trendData = Object.values(salesByDate);

        res.json(trendData);
    } catch (error) {
        console.error('Sales trend error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;