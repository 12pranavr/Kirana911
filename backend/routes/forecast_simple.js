const express = require('express');
const router = express.Router();
const supabase = require('../services/supabaseClient');

// Analyze product correlations (Frequently Bought Together)
function analyzeCorrelations(sales, productNames) {
    // Group sales by date+time (using hour as proxy for transaction)
    const transactions = {};

    sales.forEach(s => {
        const key = new Date(s.date).toISOString().slice(0, 13); // Group by hour
        if (!transactions[key]) transactions[key] = new Set();
        if (s.product_id) transactions[key].add(s.product_id);
    });

    const pairs = {};

    // Count pairs
    Object.values(transactions).forEach(items => {
        const itemList = Array.from(items);
        if (itemList.length < 2) return;

        for (let i = 0; i < itemList.length; i++) {
            for (let j = i + 1; j < itemList.length; j++) {
                const p1 = itemList[i];
                const p2 = itemList[j];
                const key = [p1, p2].sort().join('|');

                if (!pairs[key]) pairs[key] = 0;
                pairs[key]++;
            }
        }
    });

    // Format results
    return Object.entries(pairs)
        .map(([key, count]) => {
            const [p1, p2] = key.split('|');
            return {
                product1: { id: p1, name: productNames[p1] || 'Unknown' },
                product2: { id: p2, name: productNames[p2] || 'Unknown' },
                frequency: count,
                score: count
            };
        })
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 4);
}

// REAL DATA VERSION - Calculates correlations from actual sales
router.get('/', async (req, res) => {
    try {
        console.log('=== Forecast: Fetching real sales data ===');

        // Get user's store information
        let userStore = null;
        try {
            const getUserStore = require('../utils/getUserStore');
            userStore = await getUserStore(req);
            console.log('User store info:', userStore);
        } catch (authError) {
            console.error('Authentication error:', authError);
            return res.status(401).json({ error: 'Authentication required' });
        }

        let correlations = [];

        try {
            // Fetch real sales data for the user's store only
            let salesQuery = supabase
                .from('sales')
                .select('date, product_id')
                .order('date', { ascending: false })
                .limit(1000);

            // Apply store filter
            if (userStore.store_id) {
                salesQuery = salesQuery.eq('store_id', userStore.store_id);
            }

            const { data: salesData, error: salesError } = await salesQuery;

            if (salesError) {
                console.error('Sales fetch error:', salesError);
                throw salesError;
            }

            // Fetch products for name lookup (filtered by store)
            let productsQuery = supabase
                .from('products')
                .select('id, name');

            // Apply store filter
            if (userStore.store_id) {
                productsQuery = productsQuery.eq('store_id', userStore.store_id);
            }

            const { data: productsData, error: productsError } = await productsQuery;

            if (productsError) {
                console.error('Products fetch error:', productsError);
                throw productsError;
            }

            // Create product name map
            const productNames = {};
            (productsData || []).forEach(p => {
                productNames[p.id] = p.name;
            });

            // Calculate correlations from real data
            if (salesData && salesData.length > 0) {
                correlations = analyzeCorrelations(salesData, productNames);
                console.log(`✅ Calculated ${correlations.length} correlations from ${salesData.length} sales`);
            } else {
                console.log('⚠️ No sales data available for correlation analysis');
            }

        } catch (dataError) {
            console.error('Error fetching data:', dataError);
            // Continue with empty correlations rather than failing
        }

        // Calculate product-level analysis
        let productAnalysis = [];
        let productsNeverSold = [];

        try {
            // Fetch all products for the user's store
            let allProductsQuery = supabase
                .from('products')
                .select('id, name, sku_id');

            // Apply store filter
            if (userStore.store_id) {
                allProductsQuery = allProductsQuery.eq('store_id', userStore.store_id);
            }

            const { data: allProducts } = await allProductsQuery;

            // Fetch stock levels for the user's store
            let stockLevelsQuery = supabase
                .from('stock_levels')
                .select('product_id, current_stock');

            // Apply store filter
            if (userStore.store_id) {
                stockLevelsQuery = stockLevelsQuery.eq('store_id', userStore.store_id);
            }

            const { data: stockLevels } = await stockLevelsQuery;

            // Create stock levels map
            const stockMap = {};
            if (stockLevels) {
                stockLevels.forEach(stock => {
                    stockMap[stock.product_id] = stock.current_stock;
                });
            }

            // Fetch sales with product info for the user's store
            let salesWithProductsQuery = supabase
                .from('sales')
                .select('qty_sold, product_id, date, products(name)');

            // Apply store filter
            if (userStore.store_id) {
                salesWithProductsQuery = salesWithProductsQuery.eq('store_id', userStore.store_id);
            }

            const { data: salesWithProducts } = await salesWithProductsQuery;

            if (allProducts && salesWithProducts) {
                // Group sales by product
                const productSales = {};
                salesWithProducts.forEach(s => {
                    if (!s.product_id) return;
                    const productName = s.products?.name || 'Unknown';
                    if (!productSales[s.product_id]) {
                        productSales[s.product_id] = {
                            product_id: s.product_id,
                            product_name: productName,
                            total_sales: 0,
                            sales_count: 0,
                            last7days: 0,
                            prev7days: 0
                        };
                    }
                    productSales[s.product_id].total_sales += s.qty_sold;
                    productSales[s.product_id].sales_count++;

                    // Calculate trend (last 7 days vs previous 7 days)
                    const daysSince = Math.floor((Date.now() - new Date(s.date).getTime()) / (1000 * 60 * 60 * 24));
                    if (daysSince <= 7) {
                        productSales[s.product_id].last7days += s.qty_sold;
                    } else if (daysSince <= 14) {
                        productSales[s.product_id].prev7days += s.qty_sold;
                    }
                });

                // Analyze each product
                productAnalysis = Object.values(productSales).map(p => {
                    const avgDaily = p.last7days / 7;
                    const prevAvgDaily = p.prev7days / 7;

                    let trend = 'STABLE';
                    let trendPercent = 0;
                    if (prevAvgDaily > 0) {
                        trendPercent = ((avgDaily - prevAvgDaily) / prevAvgDaily) * 100;
                        if (trendPercent > 20) trend = 'RISING';
                        else if (trendPercent < -20) trend = 'FALLING';
                    } else if (avgDaily > 0 && prevAvgDaily === 0) {
                        trendPercent = 100; // Went from 0 to something
                        trend = 'RISING';
                    }

                    let demand_level = 'LOW';
                    if (avgDaily > 5) demand_level = 'HIGH';
                    else if (avgDaily > 2) demand_level = 'MEDIUM';

                    // Add actionable recommendations
                    let recommendation = 'MAINTAIN';
                    if (demand_level === 'HIGH' || trend === 'RISING') {
                        recommendation = 'BUY_MORE';
                    } else if (demand_level === 'LOW' && trend === 'FALLING') {
                        recommendation = 'REDUCE';
                    } else if (demand_level === 'LOW') {
                        recommendation = 'IGNORE';
                    }

                    return {
                        ...p,
                        current_stock: stockMap[p.product_id] || 0,
                        avg_daily_sales: parseFloat(avgDaily.toFixed(2)), // Round to 2 decimal places
                        predicted_7days: Math.round(avgDaily * 7),
                        trend,
                        trend_percent: parseFloat(trendPercent.toFixed(1)),
                        demand_level,
                        recommendation
                    };
                });

                // Find products never sold and include stock information
                const soldProductIds = new Set(Object.keys(productSales));
                productsNeverSold = allProducts
                    .filter(p => !soldProductIds.has(p.id))
                    .map(p => ({
                        product_id: p.id,
                        product_name: p.name,
                        sku_id: p.sku_id,
                        current_stock: stockMap[p.id] || 0
                    }));
            }
        } catch (analysisError) {
            console.error('Error in product analysis:', analysisError);
        }

        // Return complete response
        res.json({
            correlations,
            product_analysis: productAnalysis,
            products_never_sold: productsNeverSold,
            predictions: [],
            summary: {
                high_demand_products: productAnalysis.filter(p => p.demand_level === 'HIGH').length,
                medium_demand_products: productAnalysis.filter(p => p.demand_level === 'MEDIUM').length,
                low_demand_products: productAnalysis.filter(p => p.demand_level === 'LOW').length,
                total_products_analyzed: productAnalysis.length,
                products_never_sold_count: productsNeverSold.length
            }
        });

    } catch (error) {
        console.error('Forecast Exception:', error);
        res.status(500).json({ error: 'Forecast failed', details: error.message });
    }
});

module.exports = router;