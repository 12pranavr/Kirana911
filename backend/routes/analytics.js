const express = require('express');
const router = express.Router();
const supabase = require('../services/supabaseClient');
const getUserStore = require('../utils/getUserStore');

// Get dashboard analytics
router.get('/analytics', async (req, res) => {
    try {
        // Get user's store information
        let productsQuery = supabase.from('products').select('category, store_id');
        let customersQuery = supabase.from('customers').select('*', { count: 'exact', head: true });
        let transactionsQuery = supabase.from('transactions').select('amount, store_id').eq('type', 'sale');
        let salesQuery = supabase
            .from('sales')
            .select(`
                product_id, 
                qty_sold,
                store_id,
                products(name)
            `)
            .order('qty_sold', { ascending: false })
            .limit(5);
            
        try {
            const userStore = await getUserStore(req);
            
            // If user is an owner, filter by their store
            if (userStore.role === 'owner' && userStore.store_id) {
                productsQuery = productsQuery.eq('store_id', userStore.store_id);
                transactionsQuery = transactionsQuery.eq('store_id', userStore.store_id);
                salesQuery = salesQuery.eq('store_id', userStore.store_id);
            }
        } catch (authError) {
            // If no auth, continue without filtering (backward compatibility)
            console.log('No authentication provided, returning all data');
        }

        // Get total products count
        const productsResult = await productsQuery;
        const productsCount = productsResult.count || productsResult.data?.length || 0;
        const productsError = productsResult.error;

        // Get total customers count (customers are not store-specific in this implementation)
        const { count: customersCount, error: customersError } = await customersQuery;

        // Get average order value (from transactions, not individual items)
        const { data: saleTransactions, error: salesError } = await transactionsQuery;

        const avgOrderValue = saleTransactions && saleTransactions.length > 0
            ? saleTransactions.reduce((sum, t) => sum + t.amount, 0) / saleTransactions.length
            : 0;

        // Get category distribution
        const { data: products, error: categoryError } = await productsQuery;

        const categoryDistribution = {};
        if (products) {
            products.forEach(p => {
                const cat = p.category || 'Uncategorized';
                categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;
            });
        }

        const categoryData = Object.entries(categoryDistribution).map(([name, value]) => ({
            name,
            value
        }));

        // Get top selling products
        const { data: topProducts, error: topProductsError } = await salesQuery;

        // Aggregate top products
        const productSales = {};
        if (topProducts) {
            topProducts.forEach(sale => {
                const productName = sale.products?.name || 'Unknown';
                productSales[productName] = (productSales[productName] || 0) + sale.qty_sold;
            });
        }

        const topProductsData = Object.entries(productSales)
            .map(([name, quantity]) => ({ name, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        res.json({
            totalProducts: productsCount || 0,
            totalCustomers: customersCount || 0,
            avgOrderValue: avgOrderValue,
            categoryDistribution: categoryData,
            topProducts: topProductsData
        });

    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;