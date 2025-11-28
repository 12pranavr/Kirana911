const express = require('express');
const router = express.Router();
const supabase = require('../services/supabaseClient');
const getUserStore = require('../utils/getUserStore');

// Create a new sale transaction
router.post('/create', async (req, res) => {
    try {
        const { customer_id, items, payment_method, notes, date, source, customer_details } = req.body;

        console.log('=== Create Sale Transaction ===');
        console.log('Customer ID:', customer_id || 'Walk-in');
        console.log('Items:', items);
        console.log('Date:', date || 'Current date');
        console.log('Source:', source || 'manual');
        console.log('Customer Details:', customer_details);

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'No items provided' });
        }

        // Get user's store information
        let userStore = null;
        try {
            userStore = await getUserStore(req);
            console.log('User store info:', userStore);
        } catch (authError) {
            console.error('Authentication error:', authError);
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Only owners can create sales, and they must have a store
        if (userStore.role !== 'owner' || !userStore.store_id) {
            return res.status(403).json({ error: 'Only store owners can create sales' });
        }

        // Use provided date or current date
        const transactionDate = date ? new Date(date) : new Date();

        // Check if this is an online order with customer details
        let actualCustomerId = customer_id;
        if (source === 'online' && customer_details) {
            // Check if a customer with the same name and phone already exists
            const { data: existingCustomer, error: customerError } = await supabase
                .from('customers')
                .select('id')
                .eq('name', customer_details.name)
                .eq('phone', customer_details.phone)
                .maybeSingle();

            if (customerError) {
                console.warn('Error checking for existing customer:', customerError);
            } else if (existingCustomer) {
                // Link to existing customer
                actualCustomerId = existingCustomer.id;
                console.log('Linking order to existing customer:', actualCustomerId);
            } else {
                // Create new customer record
                const { data: newCustomer, error: createError } = await supabase
                    .from('customers')
                    .insert([{
                        name: customer_details.name,
                        phone: customer_details.phone,
                        address: customer_details.address,
                        role: 'Customer'
                    }])
                    .select()
                    .single();

                if (createError) {
                    console.warn('Error creating new customer:', createError);
                } else {
                    actualCustomerId = newCustomer.id;
                    console.log('Created new customer:', actualCustomerId);
                }
            }
        }

        // Record transaction first
        const { data: transaction, error: transError } = await supabase
            .from('transactions')
            .insert([{
                date: transactionDate,
                type: 'sale',
                category: 'Product Sale',
                amount: 0, // Will be updated after calculating total
                note: notes || `Sale of 0 items${actualCustomerId ? ' to customer' : ' (Walk-in)'}`,
                added_by: null,
                store_id: userStore.store_id // Associate transaction with user's store
            }])
            .select()
            .single();

        if (transError) {
            console.error('Transaction error:', transError);
            throw new Error('Failed to create transaction');
        }

        let totalAmount = 0;
        const salesRecords = [];
        let processedItemCount = 0; // Track how many items we actually process

        // Process each item
        for (const item of items) {
            const { product_id, quantity } = item;

            console.log(`Processing item: product_id=${product_id}, quantity=${quantity}`);

            if (!product_id || !quantity || quantity <= 0) {
                console.log('Skipping invalid item:', item);
                continue;
            }

            // Get product details and verify it belongs to the user's store
            const { data: product, error: productError } = await supabase
                .from('products')
                .select('*, stock_levels(current_stock)')
                .eq('id', product_id)
                .eq('store_id', userStore.store_id) // Ensure product belongs to user's store
                .single();

            if (productError || !product) {
                console.error('Product not found or doesn\'t belong to store:', product_id, productError);
                // Instead of continuing, let's add an error to the response but continue processing other items
                salesRecords.push({
                    product_name: 'Unknown Product',
                    quantity,
                    unit_price: 0,
                    total: 0,
                    error: `Product not found or doesn't belong to your store: ${product_id}`
                });
                continue;
            }

            // Check stock availability
            const currentStock = product.stock_levels[0]?.current_stock || 0;
            if (currentStock < quantity) {
                // Log warning but continue processing other items
                console.warn(`Insufficient stock for ${product.name}. Available: ${currentStock}, Requested: ${quantity}`);
                salesRecords.push({
                    product_name: product.name,
                    quantity,
                    unit_price: product.selling_price,
                    total: quantity * product.selling_price,
                    warning: `Insufficient stock. Available: ${currentStock}`
                });
                // Still add to total amount but don't update stock
            } else {
                const unitPrice = product.selling_price;
                const total = quantity * unitPrice;
                totalAmount += total;
                processedItemCount++;

                // Create sale record with store_id
                const saleSource = source && ['ocr', 'manual', 'online'].includes(source) ? source : 'manual';
                
                const { data: sale, error: saleError } = await supabase
                    .from('sales')
                    .insert([{
                        product_id,
                        customer_id: actualCustomerId || null,
                        date: transactionDate,
                        qty_sold: quantity,
                        unit_price: unitPrice,
                        total_price: total,
                        source: saleSource,
                        store_id: userStore.store_id // Associate sale with user's store
                    }])
                    .select()
                    .single();

                if (saleError) {
                    console.error('Sale insert error:', saleError);
                    // TEMPORARY FIX: Try again with 'manual' source if constraint fails
                    const { data: fallbackSale, error: fallbackError } = await supabase
                        .from('sales')
                        .insert([{
                            product_id,
                            customer_id: actualCustomerId || null,
                            date: transactionDate,
                            qty_sold: quantity,
                            unit_price: unitPrice,
                            total_price: total,
                            source: 'manual',
                            store_id: userStore.store_id // Associate sale with user's store
                        }])
                        .select()
                        .single();
                    
                    if (fallbackError) {
                        // Log error but continue with other items
                        console.error(`Failed to record sale for ${product.name}:`, fallbackError);
                        salesRecords.push({
                            product_name: product.name,
                            quantity,
                            unit_price: unitPrice,
                            total,
                            error: `Failed to record sale: ${fallbackError.message}`
                        });
                    } else {
                        salesRecords.push({
                            product_name: product.name,
                            quantity,
                            unit_price: unitPrice,
                            total,
                            sale_id: fallbackSale.id
                        });
                    }
                } else {
                    salesRecords.push({
                        product_name: product.name,
                        quantity,
                        unit_price: unitPrice,
                        total,
                        sale_id: sale.id
                    });
                }

                // Update stock only if we have sufficient stock
                const newStock = currentStock - quantity;
                const { error: stockError } = await supabase
                    .from('stock_levels')
                    .update({ current_stock: newStock, updated_at: new Date() })
                    .eq('product_id', product_id);

                if (stockError) {
                    console.error('Stock update error:', stockError);
                }
            }
        }

        // Update transaction with final amount and note
        const { error: updateError } = await supabase
            .from('transactions')
            .update({
                amount: totalAmount,
                note: notes || `Sale of ${processedItemCount} items${actualCustomerId ? ' to customer' : ' (Walk-in)'}`,
                store_id: userStore.store_id // Ensure store_id is set
            })
            .eq('id', transaction.id);

        if (updateError) {
            console.error('Transaction update error:', updateError);
        }

        // Audit log
        await supabase.from('audit_logs').insert([{
            action: 'create_sale',
            table_name: 'sales',
            details: {
                customer_id: actualCustomerId,
                items_count: processedItemCount,
                total_amount: totalAmount,
                payment_method: payment_method,
                transaction_id: transaction.id,
                source: source || 'manual',
                store_id: userStore.store_id
            },
            timestamp: new Date()
        }]);

        console.log('=== Sale Created Successfully ===');
        console.log('Total Amount:', totalAmount);
        console.log('Processed Items:', processedItemCount);
        console.log('Sales Records:', salesRecords);

        res.json({
            message: 'Sale recorded successfully',
            transaction_id: transaction.id,
            total_amount: totalAmount,
            items_sold: processedItemCount,
            sales: salesRecords
        });

    } catch (error) {
        console.error('=== Sale Creation Error ===');
        console.error('Error:', error.message);
        res.status(500).json({
            error: error.message || 'Failed to create sale',
            details: error
        });
    }
});

// Get all transactions with details
router.get('/', async (req, res) => {
    try {
        const { start_date, end_date, type } = req.query;

        // Get user's store information
        let userStore = null;
        try {
            userStore = await getUserStore(req);
        } catch (authError) {
            // If no auth, continue without filtering (backward compatibility)
            console.log('No authentication provided, using all data');
        }

        // First, get transactions with basic info
        let query = supabase
            .from('transactions')
            .select('*')
            .order('date', { ascending: false });

        // Apply store filter if user is an owner
        if (userStore && userStore.role === 'owner' && userStore.store_id) {
            query = query.eq('store_id', userStore.store_id);
        }

        // Apply date filters
        if (start_date) {
            query = query.gte('date', start_date);
        }
        if (end_date) {
            // For end date, we want to include the entire day
            const endDateObj = new Date(end_date);
            endDateObj.setDate(endDateObj.getDate() + 1);
            const nextDay = endDateObj.toISOString().split('T')[0];
            query = query.lt('date', nextDay);
        }

        // Apply type filter
        if (type) {
            query = query.eq('type', type);
        }

        const { data: transactions, error: transactionError } = await query;

        if (transactionError) throw transactionError;

        // Get all sales with product and customer details, filtered by store if needed
        let salesQuery = supabase
            .from('sales')
            .select(`
                *,
                products(name, sku_id, category),
                customers(name)
            `)
            .order('date', { ascending: false });

        // Apply store filter to sales if user is an owner
        if (userStore && userStore.role === 'owner' && userStore.store_id) {
            salesQuery = salesQuery.eq('store_id', userStore.store_id);
        }

        const { data: allSales, error: salesError } = await salesQuery;

        if (salesError) {
            console.warn('Error fetching sales:', salesError);
            // Return transactions without sales data
            const transactionsWithDefaults = transactions.map(transaction => ({
                ...transaction,
                items: [],
                items_count: 0
            }));
            return res.json(transactionsWithDefaults);
        }

        // Group sales by approximate date matching
        const salesByTransaction = {};
        allSales.forEach(sale => {
            // Find transactions that are close in time to this sale
            const saleDate = new Date(sale.date);
            const matchingTransaction = transactions.find(transaction => {
                const transactionDate = new Date(transaction.date);
                // Check if dates are within 1 hour of each other
                const timeDiff = Math.abs(transactionDate - saleDate);
                return timeDiff < 3600000; // 1 hour in milliseconds
            });
            
            if (matchingTransaction) {
                if (!salesByTransaction[matchingTransaction.id]) {
                    salesByTransaction[matchingTransaction.id] = [];
                }
                salesByTransaction[matchingTransaction.id].push(sale);
            }
        });

        // Match transactions with sales
        const transactionsWithDetails = transactions.map(transaction => {
            const matchingSales = salesByTransaction[transaction.id] || [];
            
            return {
                ...transaction,
                items: matchingSales,
                items_count: matchingSales.length
            };
        });

        res.json(transactionsWithDetails);
    } catch (error) {
        console.error('Transactions fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;