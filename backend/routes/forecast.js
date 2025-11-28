const express = require('express');
const router = express.Router();
const supabase = require('../services/supabaseClient');

// Simple Moving Average Forecast
function calculateForecast(salesData, daysToPredict = 7) {
    salesData.sort((a, b) => new Date(a.date) - new Date(b.date));
    const predictions = [];
    const lastDate = new Date(salesData[salesData.length - 1]?.date || new Date());

    const totalQty = salesData.reduce((sum, day) => sum + day.total_qty, 0);
    const avgDailySales = totalQty / (salesData.length || 1);

    for (let i = 1; i <= daysToPredict; i++) {
        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + i);

        predictions.push({
            date: nextDate.toISOString().split('T')[0],
            predicted_qty: Math.round(avgDailySales)
        });
    }

    return predictions;
}

// Product-level demand analysis
function analyzeProductDemand(productSales) {
    const analysis = [];

    for (const [productId, salesData] of Object.entries(productSales)) {
        const totalSales = salesData.reduce((sum, s) => sum + s.qty_sold, 0);
        const avgDailySales = totalSales / (salesData.length || 1);
        const predicted7Days = Math.round(avgDailySales * 7);

        // Calculate trend (last 7 days vs previous 7 days)
        const sortedSales = salesData.sort((a, b) => new Date(b.date) - new Date(a.date));
        const recent7Days = sortedSales.slice(0, 7);
        const previous7Days = sortedSales.slice(7, 14);

        const recentAvg = recent7Days.reduce((sum, s) => sum + s.qty_sold, 0) / (recent7Days.length || 1);
        const previousAvg = previous7Days.reduce((sum, s) => sum + s.qty_sold, 0) / (previous7Days.length || 1);

        let trend = 'STABLE';
        let trendPercent = 0;

        if (previousAvg > 0) {
            trendPercent = ((recentAvg - previousAvg) / previousAvg) * 100;
            if (trendPercent > 20) trend = 'RISING';
            else if (trendPercent < -20) trend = 'FALLING';
        }

        // Categorize demand
        let demandLevel = 'LOW';
        let recommendation = 'MAINTAIN';

        if (avgDailySales >= 5) {
            demandLevel = 'HIGH';
            recommendation = 'BUY_MORE';
        } else if (avgDailySales >= 2) {
            demandLevel = 'MEDIUM';
            recommendation = 'MAINTAIN';
        } else {
            demandLevel = 'LOW';
            recommendation = 'REDUCE';
        }

        // Adjust recommendation based on trend
        if (trend === 'RISING' && demandLevel !== 'HIGH') {
            recommendation = 'BUY_MORE';
        } else if (trend === 'FALLING' && demandLevel === 'LOW') {
            recommendation = 'IGNORE';
        }

        analysis.push({
            product_id: productId,
            product_name: salesData[0].product_name,
            total_sales: totalSales,
            avg_daily_sales: parseFloat(avgDailySales.toFixed(2)),
            predicted_7days: predicted7Days,
            trend,
            trend_percent: parseFloat(trendPercent.toFixed(1)),
            demand_level: demandLevel,
            recommendation
        });
    }

    // Sort by total sales (descending)
    return analysis.sort((a, b) => b.total_sales - a.total_sales);
}

// Analyze product correlations (Frequently Bought Together)
function analyzeCorrelations(sales) {
    // Group sales by date (using date as a proxy for transaction since we don't have a transaction_id in sales table yet for all records)
    // In a real scenario, we would use transaction_id.
    const transactions = {};

    sales.forEach(s => {
        // Create a time window key (e.g., same hour) to group items bought together
        // For manual entry, date might be exact same timestamp
        const key = new Date(s.date).toISOString().slice(0, 13); // Group by hour
        if (!transactions[key]) transactions[key] = new Set();
        if (s.product_id) transactions[key].add(s.product_id);
    });

    const pairs = {};
    const productNames = {};

    // Build name map
    sales.forEach(s => {
        if (s.product_id && s.products?.name) {
            productNames[s.product_id] = s.products.name;
        }
    });

    // Count pairs
    Object.values(transactions).forEach(items => {
        const itemList = Array.from(items);
        if (itemList.length < 2) return;

        for (let i = 0; i < itemList.length; i++) {
            for (let j = i + 1; j < itemList.length; j++) {
                const p1 = itemList[i];
                const p2 = itemList[j];
                const key = [p1, p2].sort().join('|'); // Consistent key order

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
                score: count // Simple frequency score for now
            };
        })
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 4); // Top 4 pairs
}

router.get('/', async (req, res) => {
    try {
        console.log('=== FORECAST START ===');

        // Fetch sales data
        console.log('Fetching sales...');
        const { data: sales, error } = await supabase
            .from('sales')
            .select('date, qty_sold, product_id');

        console.log('Sales fetched. Error?', error);
        if (error) {
            console.error('Sales error details:', JSON.stringify(error));
            throw error;
        }
        console.log('Sales count:', sales?.length);

        // Fetch all products for name lookup
        const { data: allProductsForNames, error: prodError } = await supabase
            .from('products')
            .select('id, name');

        if (prodError) throw prodError;

        // Create a product name map
        const productNameMap = {};
        (allProductsForNames || []).forEach(p => {
            productNameMap[p.id] = p.name;
        });

        // Enrich sales with product names
        const enrichedSales = sales.map(s => ({
            ...s,
            products: { name: productNameMap[s.product_id] || 'Unknown Product' }
        }));

        // Overall daily sales for general forecast
        const dailySales = {};
        enrichedSales.forEach(s => {
            const date = s.date.split('T')[0];
            if (!dailySales[date]) dailySales[date] = 0;
            dailySales[date] += s.qty_sold;
        });

        const salesArray = Object.keys(dailySales).map(date => ({
            date,
            total_qty: dailySales[date]
        }));

        const predictions = salesArray.length > 0 ? calculateForecast(salesArray) : [];

        // Product-level analysis
        const productSales = {};
        enrichedSales.forEach(s => {
            if (!s.product_id) return;

            const productName = s.products?.name || 'Unknown Product';

            if (!productSales[s.product_id]) {
                productSales[s.product_id] = [];
            }

            productSales[s.product_id].push({
                date: s.date,
                qty_sold: s.qty_sold,
                product_name: productName
            });
        });

        const productAnalysis = analyzeProductDemand(productSales);

        // Fetch all products to identify products never sold
        const { data: allProducts, error: productsError } = await supabase
            .from('products')
            .select('id, name, sku_id, stock_levels(current_stock)')
            .eq('active', true);

        if (productsError) {
            console.error('Error fetching products:', productsError);
            throw productsError;
        }

        console.log('=== PRODUCTS NEVER SOLD DEBUG ===');
        console.log('Total active products:', allProducts?.length || 0);

        // Get all unique product IDs that have been sold at least once
        const { data: soldProducts, error: soldError } = await supabase
            .from('sales')
            .select('product_id');

        if (soldError) {
            console.error('Error fetching sales:', soldError);
            throw soldError;
        }

        // Create set of product IDs that have sales records
        const soldProductIds = new Set(
            (soldProducts || [])
                .map(s => s.product_id)
                .filter(id => id !== null && id !== undefined)
        );

        console.log('Total sales records:', soldProducts?.length || 0);
        console.log('Unique products with sales:', soldProductIds.size);

        // Identify products never sold
        const productsNeverSold = (allProducts || [])
            .filter(product => !soldProductIds.has(product.id))
            .map(product => ({
                product_id: product.id,
                product_name: product.name,
                sku_id: product.sku_id,
                current_stock: product.stock_levels?.[0]?.current_stock || 0
            }));

        console.log('Products never sold count:', productsNeverSold.length);
        console.log('Products never sold:', productsNeverSold.map(p => `${p.product_name} (${p.sku_id})`).join(', '));
        console.log('=== END DEBUG ===');

        let correlations = [];
        try {
            correlations = analyzeCorrelations(enrichedSales);
        } catch (corrError) {
            console.error('Correlation analysis error:', corrError);
            // Continue without correlations rather than failing entire request
        }

        res.json({
            predictions,
            product_analysis: productAnalysis,
            products_never_sold: productsNeverSold,
            correlations,
            summary: {
                high_demand_products: productAnalysis.filter(p => p.demand_level === 'HIGH').length,
                medium_demand_products: productAnalysis.filter(p => p.demand_level === 'MEDIUM').length,
                low_demand_products: productAnalysis.filter(p => p.demand_level === 'LOW').length,
                total_products_analyzed: productAnalysis.length,
                products_never_sold_count: productsNeverSold.length
            }
        });

    } catch (error) {
        console.error('Forecast Error:', error);
        console.error('Error Stack:', error.stack);
        res.status(500).json({ error: 'Forecast failed', details: error.message });
    }
});

module.exports = router;
