const express = require('express');
const router = express.Router();
const supabase = require('../services/supabaseClient');
const getUserStore = require('../utils/getUserStore');

// Get all products
router.get('/products', async (req, res) => {
    try {
        // Get user's store information
        const userStore = await getUserStore(req);
        
        let query = supabase
            .from('products')
            .select('*, stock_levels(current_stock)');
            
        // If user is an owner, filter by their store
        if (userStore.role === 'owner' && userStore.store_id) {
            query = query.eq('store_id', userStore.store_id);
        }
        
        const { data, error } = await query;

        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (error) {
        if (error.message.includes('Authorization header')) {
            // If no auth header, return all products (for backward compatibility)
            const { data, error: dbError } = await supabase
                .from('products')
                .select('*, stock_levels(current_stock)');
                
            if (dbError) return res.status(500).json({ error: dbError.message });
            res.json(data);
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Get detailed product report
router.get('/product/:id/report', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get user's store information
        const userStore = await getUserStore(req);
        
        // Get product details
        let productQuery = supabase
            .from('products')
            .select('*, stock_levels(current_stock)')
            .eq('id', id);
            
        // If user is an owner, ensure they can only access their own products
        if (userStore.role === 'owner' && userStore.store_id) {
            productQuery = productQuery.eq('store_id', userStore.store_id);
        }
        
        const { data: product, error: productError } = await productQuery.single();

        if (productError) return res.status(500).json({ error: productError.message });

        // Get sales data for this product (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: sales, error: salesError } = await supabase
            .from('sales')
            .select('date, qty_sold, unit_price, total_price')
            .eq('product_id', id)
            .gte('date', thirtyDaysAgo.toISOString())
            .order('date', { ascending: true });

        if (salesError) return res.status(500).json({ error: salesError.message });

        // Calculate statistics
        const totalSold = sales.reduce((sum, sale) => sum + sale.qty_sold, 0);
        const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_price, 0);
        const totalCost = sales.reduce((sum, sale) => sum + (sale.qty_sold * product.cost_price), 0);
        const totalProfit = totalRevenue - totalCost;
        
        // Group sales by date for chart
        const salesByDate = {};
        sales.forEach(sale => {
            const date = sale.date.split('T')[0];
            if (!salesByDate[date]) {
                salesByDate[date] = { date, quantity: 0, revenue: 0 };
            }
            salesByDate[date].quantity += sale.qty_sold;
            salesByDate[date].revenue += sale.total_price;
        });

        const salesTrend = Object.values(salesByDate);

        res.json({
            product,
            sales_summary: {
                total_sold: totalSold,
                total_revenue: parseFloat(totalRevenue.toFixed(2)),
                total_cost: parseFloat(totalCost.toFixed(2)),
                total_profit: parseFloat(totalProfit.toFixed(2)),
                average_daily_sales: sales.length > 0 ? parseFloat((totalSold / sales.length).toFixed(2)) : 0
            },
            sales_trend: salesTrend
        });
    } catch (error) {
        if (error.message.includes('Authorization header')) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        console.error('Product report error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add product
router.post('/add', async (req, res) => {
    try {
        const { name, sku_id, cost_price, selling_price, category, initial_stock, image_url } = req.body;

        // Validate required fields
        if (!name || !sku_id || !cost_price || !selling_price) {
            return res.status(400).json({ error: 'Missing required fields: name, sku_id, cost_price, selling_price' });
        }
        
        // Get user's store information
        const userStore = await getUserStore(req);
        
        // Only owners can add products, and they must have a store
        if (userStore.role !== 'owner' || !userStore.store_id) {
            return res.status(403).json({ error: 'Only store owners can add products' });
        }

        // Convert prices to numbers
        const costPriceNum = parseFloat(cost_price);
        const sellingPriceNum = parseFloat(selling_price);
        const initialStockNum = parseInt(initial_stock) || 0;

        const { data: product, error: prodError } = await supabase
            .from('products')
            .insert([{
                name,
                sku_id,
                cost_price: costPriceNum,
                selling_price: sellingPriceNum,
                category: category || 'General',
                image_url: image_url || null,
                active: true,
                store_id: userStore.store_id // Associate product with the owner's store
            }])
            .select()
            .single();

        if (prodError) {
            console.error('Product insert error:', prodError);
            return res.status(500).json({ error: prodError.message });
        }

        const { error: stockError } = await supabase
            .from('stock_levels')
            .insert([{ product_id: product.id, current_stock: initialStockNum }]);

        if (stockError) {
            console.error('Stock insert error:', stockError);
            // Try to rollback product insert
            await supabase.from('products').delete().eq('id', product.id);
            return res.status(500).json({
                error: 'Failed to create stock level. RLS Policy might be missing. Details: ' + stockError.message,
                details: stockError
            });
        }

        // Log audit
        await supabase.from('audit_logs').insert([{
            action: 'add_product',
            table_name: 'products',
            details: { product_id: product.id, name },
            timestamp: new Date()
        }]);

        res.json({ message: 'Product added successfully', product });
    } catch (error) {
        if (error.message.includes('Authorization header')) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        console.error('Error in add product:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// Update stock
router.post('/update_stock', async (req, res) => {
    const { product_id, change_qty, reason } = req.body;
    
    try {
        // Get user's store information
        const userStore = await getUserStore(req);
        
        // Only owners can update stock, and they must have a store
        if (userStore.role !== 'owner' || !userStore.store_id) {
            return res.status(403).json({ error: 'Only store owners can update stock' });
        }
        
        // Verify the product belongs to this store
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('store_id')
            .eq('id', product_id)
            .single();
            
        if (productError) return res.status(500).json({ error: productError.message });
        
        if (product.store_id !== userStore.store_id) {
            return res.status(403).json({ error: 'You can only update stock for your own products' });
        }

        // Get current stock
        const { data: stockData, error: fetchError } = await supabase
            .from('stock_levels')
            .select('current_stock')
            .eq('product_id', product_id)
            .single();

        if (fetchError) return res.status(500).json({ error: fetchError.message });

        const newStock = (stockData.current_stock || 0) + change_qty;

        const { error: updateError } = await supabase
            .from('stock_levels')
            .update({ current_stock: newStock, updated_at: new Date() })
            .eq('product_id', product_id);

        if (updateError) return res.status(500).json({ error: updateError.message });

        // Log audit
        await supabase.from('audit_logs').insert([{
            action: 'update_stock',
            table_name: 'stock_levels',
            details: { product_id, change: change_qty, reason },
            timestamp: new Date()
        }]);

        res.json({ message: 'Stock updated', new_stock: newStock });
    } catch (error) {
        if (error.message.includes('Authorization header')) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        res.status(500).json({ error: error.message });
    }
});

// Edit product
router.post('/edit', async (req, res) => {
    const { id, name, sku_id, cost_price, selling_price, category, image_url } = req.body;
    
    try {
        // Get user's store information
        const userStore = await getUserStore(req);
        
        // Only owners can edit products, and they must have a store
        if (userStore.role !== 'owner' || !userStore.store_id) {
            return res.status(403).json({ error: 'Only store owners can edit products' });
        }
        
        // Verify the product belongs to this store
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('store_id')
            .eq('id', id)
            .single();
            
        if (productError) return res.status(500).json({ error: productError.message });
        
        if (product.store_id !== userStore.store_id) {
            return res.status(403).json({ error: 'You can only edit your own products' });
        }
        
        // Convert prices to numbers
        const costPriceNum = parseFloat(cost_price);
        const sellingPriceNum = parseFloat(selling_price);
        
        const { data, error } = await supabase
            .from('products')
            .update({
                name,
                sku_id,
                cost_price: costPriceNum,
                selling_price: sellingPriceNum,
                category: category || 'General',
                image_url: image_url || null
            })
            .eq('id', id)
            .select()
            .single();
            
        if (error) return res.status(500).json({ error: error.message });
        res.json({ message: 'Product updated successfully', product: data });
    } catch (error) {
        if (error.message.includes('Authorization header')) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        res.status(500).json({ error: error.message });
    }
});

// Remove product
router.post('/remove', async (req, res) => {
    const { id } = req.body;
    
    try {
        // Get user's store information
        const userStore = await getUserStore(req);
        
        // Only owners can remove products, and they must have a store
        if (userStore.role !== 'owner' || !userStore.store_id) {
            return res.status(403).json({ error: 'Only store owners can remove products' });
        }
        
        // Verify the product belongs to this store
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('store_id')
            .eq('id', id)
            .single();
            
        if (productError) return res.status(500).json({ error: productError.message });
        
        if (product.store_id !== userStore.store_id) {
            return res.status(403).json({ error: 'You can only remove your own products' });
        }
        
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) return res.status(500).json({ error: error.message });
        res.json({ message: 'Product removed' });
    } catch (error) {
        if (error.message.includes('Authorization header')) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;