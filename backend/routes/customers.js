const express = require('express');
const router = express.Router();
const supabase = require('../services/supabaseClient');
const getUserStore = require('../utils/getUserStore');

// Get all customers
router.get('/', async (req, res) => {
    try {
        // Get user's store information
        let customersQuery = supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });
            
        try {
            const userStore = await getUserStore(req);
            
            // If user is an owner, filter by their store
            if (userStore.role === 'owner' && userStore.store_id) {
                // For store owners, include customers who:
                // 1. Have purchases from this store, OR
                // 2. Are directly associated with this store (via store_id)
                const { data: storeSales, error: salesError } = await supabase
                    .from('sales')
                    .select('customer_id')
                    .eq('store_id', userStore.store_id);
                    
                if (salesError) throw salesError;
                
                // Get customer IDs from sales
                const customerIdsFromSales = [...new Set(storeSales.map(sale => sale.customer_id))];
                
                // Also get customers directly associated with this store
                const { data: directCustomers, error: directCustomersError } = await supabase
                    .from('customers')
                    .select('id')
                    .eq('store_id', userStore.store_id);
                    
                if (directCustomersError) throw directCustomersError;
                
                // Combine both lists of customer IDs
                const allCustomerIds = [...new Set([
                    ...customerIdsFromSales,
                    ...directCustomers.map(c => c.id)
                ])];
                
                if (allCustomerIds.length > 0) {
                    customersQuery = customersQuery.in('id', allCustomerIds);
                } else {
                    // No customers for this store
                    return res.json([]);
                }
            }
        } catch (authError) {
            // If no auth, continue without filtering (backward compatibility)
            console.log('No authentication provided, returning all customers');
        }

        const { data: customers, error: customersError } = await customersQuery;

        if (customersError) throw customersError;

        // For each customer, check if they have any sales (including online orders)
        const customersWithFlags = await Promise.all(customers.map(async (customer) => {
            // Check for sales associated with this customer
            const { data: customerSales, error: salesError } = await supabase
                .from('sales')
                .select('id')
                .eq('customer_id', customer.id)
                .limit(1);

            return {
                ...customer,
                has_online_orders: !salesError && customerSales && customerSales.length > 0
            };
        }));

        res.json(customersWithFlags);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get customer details with analytics
router.get('/:id/analytics', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get user's store information
        let salesQuery = supabase
            .from('sales')
            .select('*, products(name, category, cost_price)')
            .eq('customer_id', id)
            .order('date', { ascending: false });
            
        try {
            const userStore = await getUserStore(req);
            
            // If user is an owner, filter by their store
            if (userStore.role === 'owner' && userStore.store_id) {
                salesQuery = salesQuery.eq('store_id', userStore.store_id);
            }
        } catch (authError) {
            // If no auth, continue without filtering (backward compatibility)
            console.log('No authentication provided, returning all sales');
        }

        // 1. Fetch Customer Details
        const { data: customer, error: custError } = await supabase
            .from('customers')
            .select('*')
            .eq('id', id)
            .single();

        if (custError) return res.status(404).json({ error: 'Customer not found' });

        // 2. Fetch Sales History (direct customer sales)
        const { data: directSales, error: directSalesError } = await salesQuery;

        if (directSalesError) {
            console.warn('Direct sales query error:', directSalesError);
        }

        // Combine all sales data
        const allSales = [...(directSales || [])];
        
        // Remove duplicates by sale ID
        const uniqueSales = Array.from(new Map(allSales.map(sale => [sale.id, sale])).values());

        // 3. Calculate Analytics
        let totalSpent = 0;
        let totalProfit = 0;
        let purchaseCount = uniqueSales.length;
        const categoryCount = {};
        const timeOfDay = { morning: 0, afternoon: 0, evening: 0 };

        uniqueSales.forEach(sale => {
            totalSpent += sale.total_price || 0;

            // Profit Calc (Revenue - Cost * Qty)
            const cost = sale.products?.cost_price || 0;
            const profit = (sale.total_price || 0) - (cost * (sale.qty_sold || 0));
            totalProfit += profit;

            // Category Preference
            const cat = sale.products?.category || 'Other';
            categoryCount[cat] = (categoryCount[cat] || 0) + 1;

            // Time of Day Analysis
            const hour = new Date(sale.date).getHours();
            if (hour < 12) timeOfDay.morning++;
            else if (hour < 17) timeOfDay.afternoon++;
            else timeOfDay.evening++;
        });

        // Determine Best Time
        let bestTime = 'Varied';
        const maxTime = Math.max(timeOfDay.morning, timeOfDay.afternoon, timeOfDay.evening);
        if (maxTime > 0) {
            if (maxTime === timeOfDay.morning) bestTime = 'Morning';
            else if (maxTime === timeOfDay.afternoon) bestTime = 'Afternoon';
            else if (maxTime === timeOfDay.evening) bestTime = 'Evening';
        }

        // Determine Favorite Category
        const favoriteCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

        // Churn Prediction (Simple Rule-based)
        const lastPurchaseDate = uniqueSales.length > 0 ? new Date(uniqueSales[0].date) : null;
        const daysSinceLastPurchase = lastPurchaseDate
            ? Math.floor((new Date() - lastPurchaseDate) / (1000 * 60 * 60 * 24))
            : 0;

        let churnRisk = 'Low';
        if (purchaseCount > 0) {
            if (daysSinceLastPurchase > 60) churnRisk = 'High';
            else if (daysSinceLastPurchase > 30) churnRisk = 'Medium';
        }

        res.json({
            customer,
            analytics: {
                total_spent: parseFloat(totalSpent.toFixed(2)),
                total_profit: parseFloat(totalProfit.toFixed(2)),
                order_frequency: purchaseCount,
                average_order_value: purchaseCount > 0 ? parseFloat((totalSpent / purchaseCount).toFixed(2)) : 0,
                favorite_category: favoriteCategory,
                best_time_to_engage: bestTime,
                churn_risk: churnRisk,
                days_since_last_purchase: daysSinceLastPurchase
            },
            history: uniqueSales
        });

    } catch (error) {
        console.error('Customer analytics error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get product recommendations for a customer
router.get('/:id/recommendations', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get user's store information
        let baseSalesQuery = supabase.from('sales').select('product_id');
        let similarSalesQuery = supabase.from('sales').select('customer_id');
        let recommendedSalesQuery = supabase
            .from('sales')
            .select('product_id, products(name, selling_price, category)');
            
        try {
            const userStore = await getUserStore(req);
            
            // If user is an owner, filter by their store
            if (userStore.role === 'owner' && userStore.store_id) {
                baseSalesQuery = baseSalesQuery.eq('store_id', userStore.store_id);
                similarSalesQuery = similarSalesQuery.eq('store_id', userStore.store_id);
                recommendedSalesQuery = recommendedSalesQuery.eq('store_id', userStore.store_id);
            }
        } catch (authError) {
            // If no auth, continue without filtering (backward compatibility)
            console.log('No authentication provided, using all data');
        }

        // 1. Get products bought by this customer
        const { data: mySales, error: myError } = await baseSalesQuery.eq('customer_id', id);

        if (myError) throw myError;

        const myProductIds = [...new Set(mySales.map(s => s.product_id))];

        if (myProductIds.length === 0) {
            // New customer? Recommend top selling products
            const topQuery = supabase
                .from('sales')
                .select('product_id, products(name, selling_price, category)')
                .order('qty_sold', { ascending: false })
                .limit(5);
                
            // Apply store filter if needed
            try {
                const userStore = await getUserStore(req);
                if (userStore.role === 'owner' && userStore.store_id) {
                    topQuery.eq('store_id', userStore.store_id);
                }
            } catch (authError) {
                // Continue without filtering
            }
            
            const { data: topProducts } = await topQuery;

            // Deduplicate
            const uniqueTop = [];
            const seen = new Set();
            topProducts?.forEach(p => {
                if (!seen.has(p.product_id)) {
                    seen.add(p.product_id);
                    uniqueTop.push({
                        id: p.product_id,
                        name: p.products?.name,
                        price: p.products?.selling_price,
                        category: p.products?.category,
                        reason: 'Popular Item'
                    });
                }
            });
            return res.json(uniqueTop.slice(0, 3));
        }

        // 2. Find other customers who bought these products
        const { data: similarSales, error: simError } = await similarSalesQuery
            .in('product_id', myProductIds)
            .neq('customer_id', id) // Exclude self
            .limit(100); // Limit for performance

        if (simError) throw simError;

        const similarCustomerIds = [...new Set(similarSales.map(s => s.customer_id))];

        if (similarCustomerIds.length === 0) {
            // No similar customers, fallback to top products
            // (Reuse logic or just return empty for now)
            return res.json([]);
        }

        // 3. Find what ELSE they bought (Collaborative Filtering)
        const { data: recommendedSales, error: recError } = await recommendedSalesQuery
            .in('customer_id', similarCustomerIds)
            .not('product_id', 'in', `(${myProductIds.join(',')})`); // Exclude what I already bought

        if (recError) throw recError;

        // 4. Rank by frequency
        const frequency = {};
        const productDetails = {};

        recommendedSales.forEach(s => {
            const pid = s.product_id;
            frequency[pid] = (frequency[pid] || 0) + 1;
            productDetails[pid] = s.products;
        });

        const recommendations = Object.entries(frequency)
            .sort((a, b) => b[1] - a[1]) // Sort by count desc
            .slice(0, 5) // Top 5
            .map(([pid, count]) => ({
                id: pid,
                name: productDetails[pid]?.name,
                price: productDetails[pid]?.selling_price,
                category: productDetails[pid]?.category,
                reason: 'Bought by similar customers'
            }));

        res.json(recommendations);

    } catch (error) {
        console.error('Recommendation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add customer (Member)
router.post('/add', async (req, res) => {
    try {
        const { name, email, phone, address, role } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        
        // Get user's store information
        let userStore = null;
        try {
            userStore = await getUserStore(req);
            
            // Only owners can add customers, and they must have a store
            if (userStore.role !== 'owner' || !userStore.store_id) {
                return res.status(403).json({ error: 'Only store owners can add customers' });
            }
        } catch (authError) {
            // If no auth, allow for backward compatibility
            console.log('No authentication provided, allowing customer creation');
        }

        const { data: customer, error } = await supabase
            .from('customers')
            .insert([{
                name, 
                email, 
                phone, 
                address, 
                role: role || 'Member',
                // Only associate with store if we have store info
                ...(userStore && userStore.store_id ? { store_id: userStore.store_id } : {})
            }])
            .select()
            .single();

        if (error) {
            console.error('Customer insert error:', error);
            return res.status(500).json({ error: error.message });
        }

        // Audit log
        await supabase.from('audit_logs').insert([{
            action: 'add_member',
            table_name: 'customers',
            details: { customer_id: customer.id, name, role },
            timestamp: new Date()
        }]);

        res.json({ message: 'Member added successfully', customer });
    } catch (error) {
        if (error.message.includes('Authorization header')) {
            // For backward compatibility, allow customer creation without auth
            try {
                const { name, email, phone, address, role } = req.body;
                
                if (!name) {
                    return res.status(400).json({ error: 'Name is required' });
                }
                
                console.log('Creating customer (fallback):', { name, role });

                const { data: customer, error } = await supabase
                    .from('customers')
                    .insert([{
                        name, 
                        email, 
                        phone, 
                        address, 
                        role: role || 'Member'
                    }])
                    .select()
                    .single();

                if (error) {
                    console.error('Error in add member (fallback):', error);
                    return res.status(500).json({ error: error.message });
                }

                console.log('Customer created successfully (fallback):', customer);
                
                // Audit log
                await supabase.from('audit_logs').insert([{
                    action: 'add_member',
                    table_name: 'customers',
                    details: { customer_id: customer.id, name, role },
                    timestamp: new Date()
                }]);

                res.json({ message: 'Member added successfully', customer });
            } catch (fallbackError) {
                console.error('Error in add member (fallback):', fallbackError);
                res.status(500).json({ error: 'Internal server error: ' + fallbackError.message });
            }
        } else {
            console.error('Error in add member:', error);
            res.status(500).json({ error: 'Internal server error: ' + error.message });
        }
    }
});

// Update customer (Member)
router.post('/update', async (req, res) => {
    try {
        const { id, name, email, phone, address, role } = req.body;
        
        // Get user's store information
        let userStore = null;
        try {
            userStore = await getUserStore(req);
            
            // Only owners can update customers, and they must have a store
            if (userStore.role !== 'owner' || !userStore.store_id) {
                return res.status(403).json({ error: 'Only store owners can update customers' });
            }
            
            // Verify the customer has purchases from this store
            const { data: customerSales, error: salesError } = await supabase
                .from('sales')
                .select('id')
                .eq('customer_id', id)
                .eq('store_id', userStore.store_id)
                .limit(1);
                
            if (salesError) return res.status(500).json({ error: salesError.message });
            
            if (customerSales.length === 0) {
                return res.status(403).json({ error: 'You can only update customers who have purchased from your store' });
            }
        } catch (authError) {
            // If no auth, allow for backward compatibility
            console.log('No authentication provided, allowing customer update');
        }

        console.log('Updating customer:', { id, name, role });

        const { data, error } = await supabase
            .from('customers')
            .update({ name, email, phone, address, role })
            .eq('id', id)
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });

        console.log('Customer updated successfully:', data);
        res.json({ message: 'Customer updated successfully', customer: data });
    } catch (error) {
        if (error.message.includes('Authorization header')) {
            // For backward compatibility, allow customer update without auth
            try {
                const { id, name, email, phone, address, role } = req.body;

                console.log('Updating customer (fallback):', { id, name, role });

                const { data, error } = await supabase
                    .from('customers')
                    .update({ name, email, phone, address, role })
                    .eq('id', id)
                    .select()
                    .single();

                if (error) return res.status(500).json({ error: error.message });

                console.log('Customer updated successfully (fallback):', data);
                res.json({ message: 'Customer updated successfully', customer: data });
            } catch (fallbackError) {
                res.status(500).json({ error: error.message });
            }
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Delete customer
router.post('/remove', async (req, res) => {
    const { id } = req.body;
    
    try {
        // Get user's store information
        let userStore = null;
        try {
            userStore = await getUserStore(req);
            
            // Only owners can delete customers, and they must have a store
            if (userStore.role !== 'owner' || !userStore.store_id) {
                return res.status(403).json({ error: 'Only store owners can delete customers' });
            }
            
            // Verify the customer has purchases from this store
            const { data: customerSales, error: salesError } = await supabase
                .from('sales')
                .select('id')
                .eq('customer_id', id)
                .eq('store_id', userStore.store_id)
                .limit(1);
                
            if (salesError) return res.status(500).json({ error: salesError.message });
            
            if (customerSales.length === 0) {
                return res.status(403).json({ error: 'You can only delete customers who have purchased from your store' });
            }
        } catch (authError) {
            // If no auth, allow for backward compatibility
            console.log('No authentication provided, allowing customer deletion');
        }
        
        const { error } = await supabase.from('customers').delete().eq('id', id);
        if (error) return res.status(500).json({ error: error.message });
        res.json({ message: 'Customer removed' });
    } catch (error) {
        if (error.message.includes('Authorization header')) {
            // For backward compatibility, allow customer deletion without auth
            try {
                const { id } = req.body;
                const { error } = await supabase.from('customers').delete().eq('id', id);
                if (error) return res.status(500).json({ error: error.message });
                res.json({ message: 'Customer removed' });
            } catch (fallbackError) {
                res.status(500).json({ error: error.message });
            }
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

module.exports = router;