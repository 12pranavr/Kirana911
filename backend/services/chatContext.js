const supabase = require('./supabaseClient');

async function buildChatContext() {
    try {
        // Fetch low stock items
        const { data: lowStock } = await supabase
            .from('products')
            .select('name, stock_levels(current_stock)')
            .lt('stock_levels.current_stock', 10)
            .limit(5);

        // Fetch recent sales (last 24 hours)
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setDate(twentyFourHoursAgo.getDate() - 1);
        
        const { data: recentSales } = await supabase
            .from('sales')
            .select('products(name, cost_price), qty_sold, total_price, date')
            .gte('date', twentyFourHoursAgo.toISOString())
            .order('date', { ascending: false })
            .limit(10);

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
        }

        // Fetch top products by sales volume (manual grouping)
        const { data: allRecentSales } = await supabase
            .from('sales')
            .select('products(name), qty_sold')
            .gte('date', twentyFourHoursAgo.toISOString())
            .order('date', { ascending: false });

        // Manually group and sum sales by product
        const productSalesMap = {};
        if (allRecentSales) {
            allRecentSales.forEach(sale => {
                const productName = sale.products?.name || 'Unknown Product';
                if (!productSalesMap[productName]) {
                    productSalesMap[productName] = 0;
                }
                productSalesMap[productName] += sale.qty_sold;
            });
        }

        // Convert to array and sort by quantity sold
        const topProducts = Object.entries(productSalesMap)
            .map(([name, total_qty]) => ({ name, total_qty }))
            .sort((a, b) => b.total_qty - a.total_qty)
            .slice(0, 5);

        // Fetch customers data with purchase history
        const { data: customersWithPurchases } = await supabase
            .from('customers')
            .select('name, email, role');

        // Fetch sales with customer information to identify top customers
        const { data: salesWithCustomers } = await supabase
            .from('sales')
            .select('customer_id, total_price, qty_sold, customers(name, email)')
            .order('date', { ascending: false })
            .limit(50);

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

        // Fetch products data
        const { data: products } = await supabase
            .from('products')
            .select('name, category, selling_price, stock_levels(current_stock)')
            .limit(20);

        // Fetch transactions data (last 10)
        const { data: recentTransactions } = await supabase
            .from('transactions')
            .select('type, amount, category, note, date')
            .order('date', { ascending: false })
            .limit(10);

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