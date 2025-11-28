const express = require('express');
const router = express.Router();
const supabase = require('../services/supabaseClient');
const getUserStore = require('../utils/getUserStore');

// Get Profit & Loss statement
router.get('/pnl', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        // Get user's store information
        let salesQuery = supabase
            .from('sales')
            .select(`
                total_price, 
                date, 
                source,
                products(store_id)
            `);

        let expenseQuery = supabase
            .from('transactions')
            .select(`
                amount, 
                date,
                store_id
            `)
            .eq('type', 'expense');
            
        try {
            const userStore = await getUserStore(req);
            
            // If user is an owner, filter by their store
            if (userStore.role === 'owner' && userStore.store_id) {
                salesQuery = salesQuery.eq('products.store_id', userStore.store_id);
                expenseQuery = expenseQuery.eq('store_id', userStore.store_id);
            }
        } catch (authError) {
            // If no auth, continue without filtering (backward compatibility)
            console.log('No authentication provided, returning all data');
        }

        // Apply date filters if provided
        if (start_date) {
            salesQuery = salesQuery.gte('date', start_date);
            expenseQuery = expenseQuery.gte('date', start_date);
        }
        if (end_date) {
            // For end date, we want to include the entire day
            const endDateObj = new Date(end_date);
            endDateObj.setDate(endDateObj.getDate() + 1);
            const nextDay = endDateObj.toISOString().split('T')[0];
            salesQuery = salesQuery.lt('date', nextDay);
            expenseQuery = expenseQuery.lt('date', nextDay);
        }

        // Execute both queries
        const [salesRes, expensesRes] = await Promise.all([
            salesQuery,
            expenseQuery
        ]);

        if (salesRes.error) throw salesRes.error;
        if (expensesRes.error) throw expensesRes.error;

        // Calculate revenue from sales
        const revenue = salesRes.data.reduce((sum, sale) => sum + sale.total_price, 0);
        
        // Calculate expenses
        const expenses = expensesRes.data.reduce((sum, transaction) => sum + transaction.amount, 0);
        
        // Calculate net profit
        const netProfit = revenue - expenses;
        
        // Separate online and offline sales
        const onlineSales = salesRes.data.filter(sale => sale.source === 'online');
        const offlineSales = salesRes.data.filter(sale => sale.source !== 'online');
        
        const onlineRevenue = onlineSales.reduce((sum, sale) => sum + sale.total_price, 0);
        const offlineRevenue = offlineSales.reduce((sum, sale) => sum + sale.total_price, 0);
        
        const onlineOrders = onlineSales.length;
        const offlineOrders = offlineSales.length;

        res.json({
            revenue: parseFloat(revenue.toFixed(2)),
            expenses: parseFloat(expenses.toFixed(2)),
            net_profit: parseFloat(netProfit.toFixed(2)),
            online_revenue: parseFloat(onlineRevenue.toFixed(2)),
            offline_revenue: parseFloat(offlineRevenue.toFixed(2)),
            online_orders: onlineOrders,
            offline_orders: offlineOrders
        });
    } catch (error) {
        console.error('P&L error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get budget status for current month
router.get('/budget_status', async (req, res) => {
    try {
        const currentDate = new Date();
        const currentMonth = currentDate.toISOString().slice(0, 7); // YYYY-MM format
        
        // Get user's store information
        let budgetQuery = supabase
            .from('budget')
            .select('expense_limit, store_id')
            .eq('month', currentMonth);
            
        let expensesQuery = supabase
            .from('transactions')
            .select(`
                amount,
                store_id
            `)
            .eq('type', 'expense');
            
        try {
            const userStore = await getUserStore(req);
            
            // If user is an owner, filter by their store
            if (userStore.role === 'owner' && userStore.store_id) {
                budgetQuery = budgetQuery.eq('store_id', userStore.store_id);
                expensesQuery = expensesQuery.eq('store_id', userStore.store_id);
            }
        } catch (authError) {
            // If no auth, continue without filtering (backward compatibility)
            console.log('No authentication provided, returning all data');
        }

        // Get budget limit for current month
        const { data: budgetData, error: budgetError } = await budgetQuery.maybeSingle();

        if (budgetError && budgetError.code !== 'PGRST116') { // PGRST116 means no rows found
            throw budgetError;
        }

        const budgetLimit = budgetData?.expense_limit || 0;

        // Get actual expenses for current month
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();
        
        expensesQuery = expensesQuery
            .gte('date', startOfMonth)
            .lte('date', endOfMonth);

        const { data: expensesData, error: expensesError } = await expensesQuery;

        if (expensesError) throw expensesError;

        const actualExpenses = expensesData.reduce((sum, transaction) => sum + transaction.amount, 0);
        const isOverBudget = actualExpenses > budgetLimit;

        res.json({
            month: currentMonth,
            budget_limit: parseFloat(budgetLimit.toFixed(2)),
            actual_expenses: parseFloat(actualExpenses.toFixed(2)),
            is_over_budget: isOverBudget
        });
    } catch (error) {
        console.error('Budget status error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Set or update budget for a month
router.post('/budget', async (req, res) => {
    try {
        const { month, expense_limit } = req.body;
        
        // Get user's store information
        const userStore = await getUserStore(req);
        
        // Only owners can set budgets, and they must have a store
        if (userStore.role !== 'owner' || !userStore.store_id) {
            return res.status(403).json({ error: 'Only store owners can set budgets' });
        }

        if (!month || expense_limit === undefined) {
            return res.status(400).json({ error: 'Month and expense_limit are required' });
        }

        // Check if budget already exists for this month and store
        const { data: existingBudget, error: fetchError } = await supabase
            .from('budget')
            .select('id')
            .eq('month', month)
            .eq('store_id', userStore.store_id)
            .maybeSingle();

        if (fetchError) throw fetchError;

        let result;
        if (existingBudget) {
            // Update existing budget
            const { data, error } = await supabase
                .from('budget')
                .update({ expense_limit: parseFloat(expense_limit) })
                .eq('id', existingBudget.id)
                .select()
                .single();
            
            if (error) throw error;
            result = data;
        } else {
            // Insert new budget with store_id
            const { data, error } = await supabase
                .from('budget')
                .insert([{
                    month, 
                    expense_limit: parseFloat(expense_limit),
                    store_id: userStore.store_id
                }])
                .select()
                .single();
            
            if (error) throw error;
            result = data;
        }

        res.json({ message: 'Budget updated successfully', budget: result });
    } catch (error) {
        if (error.message.includes('Authorization header')) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        console.error('Budget update error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;