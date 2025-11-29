const supabase = require('./supabaseClient');

async function buildChatContext(storeId = null) {
    try {
        // Fetch low stock items (filtered by store)
        let lowStock = [];
        try {
            let lowStockQuery = supabase
                .from('products')
                .select('name, stock_levels(current_stock)')
                .lt('stock_levels.current_stock', 10)
                .limit(5);
            
            if (storeId) {
                lowStockQuery = lowStockQuery.eq('store_id', storeId);
            }
            
            const lowStockResult = await lowStockQuery;
            lowStock = lowStockResult.data || [];
            
            // Debug: Log low stock items
            console.log('Low stock items count:', lowStock.length);
            if (lowStock.length > 0) {
                console.log('Sample low stock items:', lowStock.slice(0, 3));
            }
        } catch (error) {
            console.error('Error fetching low stock items:', error);
        }

        // Fetch recent sales (last 24 hours) (filtered by store)
        let recentSales = [];
        try {
            const now = new Date();
            const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // Exactly 24 hours ago
            
            let recentSalesQuery = supabase
                .from('sales')
                .select('products(name, cost_price), qty_sold, total_price, date')
                .gte('date', twentyFourHoursAgo.toISOString())
                .order('date', { ascending: false })
                .limit(10);
                
            if (storeId) {
                recentSalesQuery = recentSalesQuery.eq('store_id', storeId);
            }
            
            const recentSalesResult = await recentSalesQuery;
            recentSales = recentSalesResult.data || [];
            
            // Debug: Log the date range being used
            console.log('Sales date range:', twentyFourHoursAgo.toISOString(), 'to now');
            console.log('Recent sales count:', recentSales.length);
            if (recentSales.length > 0) {
                console.log('First sale date:', recentSales[0].date);
                console.log('Last sale date:', recentSales[recentSales.length - 1].date);
            }
            
            // Also fetch all sales for broader context
            let allSalesQuery = supabase
                .from('sales')
                .select('products(name, cost_price), qty_sold, total_price, date')
                .order('date', { ascending: false })
                .limit(50);
                
            if (storeId) {
                allSalesQuery = allSalesQuery.eq('store_id', storeId);
            }
            
            const allSalesResult = await allSalesQuery;
            const allSales = allSalesResult.data || [];
            console.log('All sales count (unfiltered by date):', allSales.length);
        } catch (error) {
            console.error('Error fetching recent sales:', error);
        }

        // Calculate today's total sales and profit
        let todaySales = 0;
        let todayProfit = 0;
        if (recentSales) {
            todaySales = recentSales.reduce((sum, sale) => sum + sale.total_price, 0);
            
            // Calculate profit based on cost price and selling price
            for (const sale of recentSales) {
                if (sale.products && sale.products.cost_price) {
                    const cost = sale.products.cost_price * sale.qty_sold;
                    const revenue = sale.total_price;
                    todayProfit += (revenue - cost);
                }
            }
            
            // Debug: Show profit calculation details
            console.log('Profit calculation:');
            console.log('- Total sales revenue:', todaySales);
            console.log('- Total profit:', todayProfit);
            if (recentSales.length > 0) {
                console.log('- Sample sale:', recentSales[0]);
            }
        }

        // Fetch top products by sales volume (manual grouping) (filtered by store)
        let allRecentSales = [];
        try {
            let allRecentSalesQuery = supabase
                .from('sales')
                .select('products(name), qty_sold')
                .gte('date', twentyFourHoursAgo.toISOString())
                .order('date', { ascending: false });
                
            if (storeId) {
                allRecentSalesQuery = allRecentSalesQuery.eq('store_id', storeId);
            }
            
            const allRecentSalesResult = await allRecentSalesQuery;
            allRecentSales = allRecentSalesResult.data || [];
            
            // Debug: Log the all recent sales count
            console.log('All recent sales count:', allRecentSales.length);
            
            // Also fetch all sales for top products calculation (broader timeframe)
            let broaderSalesQuery = supabase
                .from('sales')
                .select('products(name), qty_sold')
                .order('date', { ascending: false })
                .limit(200); // Larger sample for better top products analysis
                
            if (storeId) {
                broaderSalesQuery = broaderSalesQuery.eq('store_id', storeId);
            }
            
            const broaderSalesResult = await broaderSalesQuery;
            const broaderSales = broaderSalesResult.data || [];
            console.log('Broader sales count (for top products):', broaderSales.length);
        } catch (error) {
            console.error('Error fetching all recent sales:', error);
        }

        // Manually group and sum sales by product
        const productSalesMap = {};
        if (broaderSales && broaderSales.length > 0) {
            // Use broader sales data for more accurate top products
            broaderSales.forEach(sale => {
                const productName = sale.products?.name || 'Unknown Product';
                if (!productSalesMap[productName]) {
                    productSalesMap[productName] = 0;
                }
                productSalesMap[productName] += sale.qty_sold;
            });
            console.log('Using broader sales data for top products calculation');
        } else if (allRecentSales) {
            // Fallback to recent sales if broader data is not available
            allRecentSales.forEach(sale => {
                const productName = sale.products?.name || 'Unknown Product';
                if (!productSalesMap[productName]) {
                    productSalesMap[productName] = 0;
                }
                productSalesMap[productName] += sale.qty_sold;
            });
            console.log('Using recent sales data for top products calculation');
        }

        // Convert to array and sort by quantity sold
        const topProducts = Object.entries(productSalesMap)
            .map(([name, total_qty]) => ({ name, total_qty }))
            .sort((a, b) => b.total_qty - a.total_qty)
            .slice(0, 5);
            
        console.log('Top products calculated:', topProducts);

        // Fetch customers data with purchase history (filtered by store)
        let customersWithPurchases = [];
        try {
            let customersQuery = supabase
                .from('customers')
                .select('name, email, role');
                
            if (storeId) {
                customersQuery = customersQuery.eq('store_id', storeId);
            }
            
            const customersResult = await customersQuery;
            customersWithPurchases = customersResult.data || [];
            
            // Debug: Log the customers count
            console.log('Customers with purchases count:', customersWithPurchases.length);
            if (customersWithPurchases.length > 0) {
                console.log('Sample customers:', customersWithPurchases.slice(0, 3));
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        }

        // Fetch sales with customer information to identify top customers (filtered by store)
        let salesWithCustomers = [];
        try {
            let salesWithCustomersQuery = supabase
                .from('sales')
                .select('customer_id, total_price, qty_sold, customers(name, email)')
                .order('date', { ascending: false })
                .limit(50);
                
            if (storeId) {
                salesWithCustomersQuery = salesWithCustomersQuery.eq('store_id', storeId);
            }
            
            const salesWithCustomersResult = await salesWithCustomersQuery;
            salesWithCustomers = salesWithCustomersResult.data || [];
            
            // Debug: Log the sales with customers count
            console.log('Sales with customers count:', salesWithCustomers.length);
        } catch (error) {
            console.error('Error fetching sales with customers:', error);
        }

        // Identify top customers by total spending
        const customerSpendingMap = {};
        if (salesWithCustomers) {
            salesWithCustomers.forEach(sale => {
                // Only consider sales with customer information
                if (sale.customer_id && sale.customers) {
                    const customerId = sale.customer_id;
                    const customerName = sale.customers.name || 'Unknown Customer';
                    const customerEmail = sale.customers.email || 'No Email';
                    
                    if (!customerSpendingMap[customerId]) {
                        customerSpendingMap[customerId] = {
                            name: customerName,
                            email: customerEmail,
                            total_spent: 0,
                            purchase_count: 0
                        };
                    }
                    
                    customerSpendingMap[customerId].total_spent += sale.total_price;
                    customerSpendingMap[customerId].purchase_count += 1;
                }
            });
        }

        // Convert to array and sort by total spending
        let topCustomers = Object.values(customerSpendingMap)
            .sort((a, b) => b.total_spent - a.total_spent)
            .slice(0, 5);
        
        // If we don't have any sales with customer data, show general customer info
        if (topCustomers.length === 0 && customersWithPurchases && customersWithPurchases.length > 0) {
            // Create a simplified list of customers
            topCustomers = customersWithPurchases.slice(0, 5).map(customer => ({
                name: customer.name,
                email: customer.email || 'No Email',
                role: customer.role || 'Customer',
                total_spent: 0,
                purchase_count: 0
            }));
        }

        // Fetch products data (filtered by store)
        let products = [];
        try {
            let productsQuery = supabase
                .from('products')
                .select('name, category, selling_price, stock_levels(current_stock)')
                .limit(20);
                
            if (storeId) {
                productsQuery = productsQuery.eq('store_id', storeId);
            }
            
            const productsResult = await productsQuery;
            products = productsResult.data || [];
        } catch (error) {
            console.error('Error fetching products:', error);
        }

        // Fetch transactions data (last 10) (filtered by store)
        let recentTransactions = [];
        try {
            let transactionsQuery = supabase
                .from('transactions')
                .select('type, amount, category, note, date')
                .order('date', { ascending: false })
                .limit(10);
                
            if (storeId) {
                transactionsQuery = transactionsQuery.eq('store_id', storeId);
            }
            
            const transactionsResult = await transactionsQuery;
            recentTransactions = transactionsResult.data || [];
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }

        // Debug: Log context data
        console.log('=== Chat Context Data ===');
        console.log('Store ID:', storeId);
        console.log('Today Sales:', todaySales);
        console.log('Today Profit:', todayProfit);
        console.log('Recent Sales Count:', recentSales ? recentSales.length : 0);
        console.log('Top Products Count:', topProducts ? topProducts.length : 0);
        console.log('Top Customers Count:', topCustomers ? topCustomers.length : 0);
        console.log('Products Count:', products ? products.length : 0);
        console.log('Transactions Count:', recentTransactions ? recentTransactions.length : 0);
        
        // Log sample data that will be sent to AI
        console.log('=== Sample Data Sent to AI ===');
        if (recentSales && recentSales.length > 0) {
            console.log('Sample recent sales (first 2):', recentSales.slice(0, 2));
        }
        if (topProducts && topProducts.length > 0) {
            console.log('Top products:', topProducts);
        }
        if (topCustomers && topCustomers.length > 0) {
            console.log('Top customers:', topCustomers.slice(0, 2));
        }
        if (products && products.length > 0) {
            console.log('Sample products (first 2):', products.slice(0, 2));
        }
        if (recentTransactions && recentTransactions.length > 0) {
            console.log('Sample transactions (first 2):', recentTransactions.slice(0, 2));
        }
        
        const context = `
You are KIRANA911 Assistant, a helpful shop manager AI with access to comprehensive shop data.

Current Context:
- Today's Date: ${new Date().toLocaleDateString()}
- Today's Total Sales: ₹${todaySales.toFixed(2)}
- Today's Total Profit: ₹${todayProfit.toFixed(2)}
- Number of Sales Today: ${recentSales ? recentSales.length : 0}
- Low Stock Items (below 10 units): ${JSON.stringify(lowStock || [])}
- Recent Sales (last 24 hours): ${JSON.stringify(recentSales || [])}
- Top Selling Products: ${JSON.stringify(topProducts || [])}
- Customer Information: ${JSON.stringify(topCustomers || [])}
- Products Catalog: ${JSON.stringify(products || []).substring(0, 500)}${(JSON.stringify(products || []).length > 500) ? '...' : ''}
- Recent Transactions: ${JSON.stringify(recentTransactions || [])}

If the user asks to perform an action (like "Add stock", "Update budget"), 
reply with a JSON object ONLY in this format:
{ "action": "ACTION_NAME", "params": { ... } }

Supported Actions:
- update_stock (params: product_name, qty)
- set_budget (params: amount)

If it's a general question, just answer normally in plain text.
Keep responses friendly, concise, and helpful.
Use the provided data to give specific, accurate answers.
When mentioning sales figures, always include the currency symbol (₹).
When mentioning dates, use a clear format.
When mentioning customer names, use their actual names.
When mentioning top customers, include their spending amount if available.
        `;

        return context;
    } catch (error) {
        console.error('Error building chat context:', error);
        return "You are KIRANA911 Assistant, a helpful shop manager AI.";
    }
}

module.exports = { buildChatContext };