const express = require('express');
const router = express.Router();
const supabase = require('../services/supabaseClient');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getTop10Products() {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

        const { data: recentSales, error: salesError } = await supabase
            .from('sales')
            .select('product_id, qty_sold, date')
            .gte('date', sevenDaysAgoStr)
            .order('date', { ascending: true });

        if (salesError) throw salesError;

        const productSales = {};
        recentSales.forEach(sale => {
            if (!productSales[sale.product_id]) {
                productSales[sale.product_id] = 0;
            }
            productSales[sale.product_id] += sale.qty_sold;
        });

        const topProductIds = Object.entries(productSales)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([id]) => id);

        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, name, price, stock_levels(current_stock)')
            .in('id', topProductIds);

        if (productsError) throw productsError;

        const productMap = {};
        products.forEach(product => {
            productMap[product.id] = {
                id: product.id,
                name: product.name,
                price: product.price || 0,
                current_stock: product.stock_levels?.[0]?.current_stock || 0,
                total_sales_7_days: productSales[product.id] || 0
            };
        });

        return Object.values(productMap);
    } catch (error) {
        console.error('Error getting top 10 products:', error);
        throw error;
    }
}

async function getProductSalesData(productId, days = 30) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString().split('T')[0];

        const { data: sales, error } = await supabase
            .from('sales')
            .select('date, qty_sold')
            .eq('product_id', productId)
            .gte('date', startDateStr)
            .order('date', { ascending: true });

        if (error) throw error;

        return sales || [];
    } catch (error) {
        console.error(`Error fetching sales data for product ${productId}:`, error);
        return [];
    }
}

async function getProductStockData(productId, days = 30) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString().split('T')[0];

        const { data: stockLevels, error } = await supabase
            .from('stock_levels')
            .select('created_at, current_stock')
            .eq('product_id', productId)
            .gte('created_at', startDateStr)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return stockLevels.map(level => ({
            date: level.created_at,
            current_stock: level.current_stock
        })) || [];
    } catch (error) {
        console.error(`Error fetching stock data for product ${productId}:`, error);
        return [];
    }
}

// ============================================================================
// IMPROVED PREDICTION ALGORITHMS WITH 7-DAY FORECASTING
// ============================================================================

// Exponential Smoothing with Triple Exponential (Holt-Winters) for 7-day forecast
function exponentialSmoothing7Day(dailySales) {
    if (dailySales.length < 7) {
        const avg = dailySales.length > 0
            ? dailySales.reduce((sum, s) => sum + s, 0) / dailySales.length
            : 0;
        return Array(7).fill(Math.max(0, Math.round(avg)));
    }

    const alpha = 0.3;  // Level smoothing
    const beta = 0.1;   // Trend smoothing
    const gamma = 0.2;  // Seasonality smoothing
    const phi = 0.95;   // Damping factor for realistic predictions

    let level = dailySales[0];
    let trend = dailySales.length > 1 ? dailySales[1] - dailySales[0] : 0;
    const seasonal = Array(7).fill(0);

    // Initialize seasonal components
    for (let i = 0; i < Math.min(7, dailySales.length); i++) {
        seasonal[i] = dailySales[i] - level;
    }

    // Fit the model
    for (let i = 0; i < dailySales.length; i++) {
        const seasonalIndex = i % 7;
        const prevLevel = level;

        level = alpha * (dailySales[i] - seasonal[seasonalIndex]) + (1 - alpha) * (level + phi * trend);
        trend = beta * (level - prevLevel) + (1 - beta) * phi * trend;
        seasonal[seasonalIndex] = gamma * (dailySales[i] - level) + (1 - gamma) * seasonal[seasonalIndex];
    }

    // Generate 7-day forecast
    const forecast = [];
    for (let h = 1; h <= 7; h++) {
        const seasonalIndex = (dailySales.length + h - 1) % 7;
        const prediction = Math.max(0, Math.round(level + (phi ** h) * h * trend + seasonal[seasonalIndex]));
        forecast.push(prediction);
    }

    return forecast;
}

// Weighted Moving Average with day-of-week adjustments
function weightedMovingAverage7Day(dailySales) {
    if (dailySales.length === 0) return Array(7).fill(0);

    const weights = [0.5, 0.3, 0.15, 0.05]; // Last 4 days
    const baseAvg = [];

    for (let i = 0; i < Math.min(4, dailySales.length); i++) {
        const index = dailySales.length - 1 - i;
        if (index >= 0) {
            baseAvg.push(dailySales[index] * weights[i]);
        }
    }

    const basePrediction = baseAvg.reduce((a, b) => a + b, 0) / (baseAvg.length > 0 ? 1 : 1);

    // Day-of-week multipliers (0=Sun, 6=Sat)
    const dayMultipliers = [1.1, 0.9, 0.95, 1.0, 1.05, 1.15, 1.2]; // Weekend boost
    const today = new Date().getDay();

    const forecast = [];
    for (let i = 0; i < 7; i++) {
        const dayOfWeek = (today + i + 1) % 7;
        const prediction = Math.max(0, Math.round(basePrediction * dayMultipliers[dayOfWeek]));
        forecast.push(prediction);
    }

    return forecast;
}

// Linear Regression with trend projection for 7 days
function linearRegression7Day(dailySales) {
    if (dailySales.length < 2) {
        const avg = dailySales.length > 0 ? dailySales[0] : 0;
        return Array(7).fill(Math.max(0, Math.round(avg)));
    }

    const n = dailySales.length;
    let sum_x = 0, sum_y = 0, sum_xy = 0, sum_xx = 0;

    dailySales.forEach((sale, index) => {
        sum_x += index;
        sum_y += sale;
        sum_xy += index * sale;
        sum_xx += index * index;
    });

    const slope = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
    const intercept = (sum_y - slope * sum_x) / n;

    // Project 7 days with slight damping to prevent unrealistic extrapolation
    const forecast = [];
    for (let i = 1; i <= 7; i++) {
        const damping = 1 - (i * 0.05); // Reduce prediction confidence over time
        const prediction = Math.max(0, Math.round((slope * (n + i) + intercept) * damping));
        forecast.push(prediction);
    }

    return forecast;
}

// ARIMA-like approach with auto-regressive components
function arimaLike7Day(dailySales) {
    if (dailySales.length < 3) {
        const avg = dailySales.length > 0
            ? dailySales.reduce((sum, s) => sum + s, 0) / dailySales.length
            : 0;
        return Array(7).fill(Math.max(0, Math.round(avg)));
    }

    // Auto-regressive order 3 (AR(3))
    const p = 3;
    const coefficients = [0.5, 0.3, 0.2]; // Weights for last 3 days

    const forecast = [];
    let history = [...dailySales];

    for (let i = 0; i < 7; i++) {
        let prediction = 0;
        for (let j = 0; j < p && j < history.length; j++) {
            prediction += history[history.length - 1 - j] * coefficients[j];
        }

        // Add slight random walk component for realism
        const noise = (Math.random() - 0.5) * 0.1 * prediction;
        prediction = Math.max(0, Math.round(prediction + noise));

        forecast.push(prediction);
        history.push(prediction);
    }

    return forecast;
}

// Multi-model ensemble for 7-day forecast
function ensembleForecast7Day(dailySales) {
    const es = exponentialSmoothing7Day(dailySales);
    const wma = weightedMovingAverage7Day(dailySales);
    const lr = linearRegression7Day(dailySales);
    const arima = arimaLike7Day(dailySales);

    // Weights: ES=40%, WMA=30%, LR=20%, ARIMA=10%
    const weights = [0.4, 0.3, 0.2, 0.1];
    const forecast = [];

    for (let i = 0; i < 7; i++) {
        const combined = (
            es[i] * weights[0] +
            wma[i] * weights[1] +
            lr[i] * weights[2] +
            arima[i] * weights[3]
        );
        forecast.push(Math.max(0, Math.round(combined)));
    }

    return forecast;
}

// Calculate prediction confidence based on data quality
function calculateConfidence(dailySales, forecast) {
    if (dailySales.length < 3) return 'low';

    // Calculate variance in historical data
    const mean = dailySales.reduce((sum, s) => sum + s, 0) / dailySales.length;
    const variance = dailySales.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / dailySales.length;
    const stdDev = Math.sqrt(variance);

    // Calculate coefficient of variation
    const cv = mean > 0 ? (stdDev / mean) : 1;

    // Confidence based on data stability
    if (cv < 0.3 && dailySales.length >= 7) return 'high';
    if (cv < 0.6 && dailySales.length >= 5) return 'medium';
    return 'low';
}

// Generate descriptive insights for the product
function generateProductInsights(product, salesData, forecast, currentStock) {
    const insights = [];
    const avgSales = salesData.length > 0
        ? salesData.reduce((sum, s) => sum + s, 0) / salesData.length
        : 0;
    const weekTotal = forecast.reduce((sum, f) => sum + f, 0);

    // Trend analysis
    const recentAvg = salesData.slice(-3).reduce((sum, s) => sum + s, 0) / Math.min(3, salesData.length);
    const olderAvg = salesData.slice(-7, -3).reduce((sum, s) => sum + s, 0) / Math.max(1, Math.min(4, salesData.length - 3));

    let trendDirection = 'stable';
    let trendDescription = '';

    if (recentAvg > olderAvg * 1.15) {
        trendDirection = 'upward';
        trendDescription = `📈 **Rising Demand**: Sales are increasing by ${Math.round(((recentAvg - olderAvg) / olderAvg) * 100)}%. Consider stocking more units.`;
    } else if (recentAvg < olderAvg * 0.85) {
        trendDirection = 'downward';
        trendDescription = `📉 **Declining Demand**: Sales are decreasing by ${Math.round(((olderAvg - recentAvg) / olderAvg) * 100)}%. Monitor closely to avoid overstocking.`;
    } else {
        trendDescription = `➡️ **Stable Demand**: Sales are consistent around ${Math.round(avgSales)} units/day.`;
    }

    insights.push(trendDescription);

    // Stock duration analysis
    if (currentStock > 0 && weekTotal > 0) {
        const daysRemaining = Math.floor(currentStock / (weekTotal / 7));
        if (daysRemaining < 3) {
            insights.push(`⚠️ **Urgent Restock Needed**: Current stock will only last ~${daysRemaining} days at predicted sales rate.`);
        } else if (daysRemaining < 7) {
            insights.push(`📦 **Restock Soon**: Current stock will last ~${daysRemaining} days. Plan to reorder this week.`);
        } else {
            insights.push(`✅ **Stock Healthy**: Current stock should last ~${daysRemaining} days at current sales pace.`);
        }
    } else if (currentStock === 0) {
        insights.push(`🚨 **Out of Stock**: Product needs immediate restocking. Expected weekly demand: ${weekTotal} units.`);
    }

    // Weekly pattern insights
    const maxDay = forecast.indexOf(Math.max(...forecast));
    const dayNames = ['tomorrow', 'in 2 days', 'in 3 days', 'in 4 days', 'in 5 days', 'in 6 days', 'in 7 days'];
    insights.push(`📊 **Peak Day**: Highest sales expected ${dayNames[maxDay]} (${forecast[maxDay]} units).`);

    // Price-based insights
    if (product.price && weekTotal > 0) {
        const weeklyRevenue = weekTotal * product.price;
        insights.push(`💰 **Revenue Forecast**: Expected ~₹${weeklyRevenue.toFixed(2)} in sales over next 7 days.`);
    }

    return {
        description: insights.join(' '),
        trend: trendDirection,
        urgency: currentStock === 0 ? 'critical' : (currentStock / (weekTotal / 7) < 3 ? 'high' : 'normal')
    };
}

// ============================================================================
// API ENDPOINT
// ============================================================================

router.get('/predict/enhanced-7day', async (req, res) => {
    try {
        console.log('=== ENHANCED 7-DAY PREDICTION START ===');

        const topProducts = await getTop10Products();
        console.log(`Found ${topProducts.length} top products`);

        const predictions = [];

        for (const product of topProducts) {
            console.log(`Processing: ${product.name}`);

            // Get 30 days of sales history for better accuracy
            const salesData = await getProductSalesData(product.id, 30);
            const dailySales = salesData.map(s => s.qty_sold);

            // Get stock data
            const stockData = await getProductStockData(product.id, 30);

            // Generate 7-day forecast using ensemble method
            const forecast7Day = ensembleForecast7Day(dailySales);

            // Calculate confidence
            const confidence = calculateConfidence(dailySales, forecast7Day);

            // Generate insights
            const insights = generateProductInsights(
                product,
                dailySales,
                forecast7Day,
                product.current_stock
            );

            // Create detailed daily predictions
            const today = new Date();
            const dailyPredictions = forecast7Day.map((qty, index) => {
                const predDate = new Date(today);
                predDate.setDate(today.getDate() + index + 1);
                return {
                    date: predDate.toISOString().split('T')[0],
                    day_name: predDate.toLocaleDateString('en-US', { weekday: 'short' }),
                    predicted_qty: qty,
                    confidence: confidence
                };
            });

            // Prepare sales history for visualization
            const salesHistory = salesData.slice(-14).map((sale) => ({
                date: sale.date,
                qty_sold: sale.qty_sold,
                day_name: new Date(sale.date).toLocaleDateString('en-US', { weekday: 'short' })
            }));

            predictions.push({
                product_id: product.id,
                product_name: product.name,
                current_stock: product.current_stock,
                total_sales_7_days: product.total_sales_7_days,
                avg_daily_sales: dailySales.length > 0
                    ? parseFloat((dailySales.reduce((sum, s) => sum + s, 0) / dailySales.length).toFixed(2))
                    : 0,
                sales_history: salesHistory,
                forecast_7day: dailyPredictions,
                week_total: forecast7Day.reduce((sum, f) => sum + f, 0),
                confidence: confidence,
                insights: insights,
                generated_at: new Date().toISOString()
            });
        }

        res.json({
            success: true,
            predictions,
            summary: {
                total_products: predictions.length,
                average_confidence: predictions.filter(p => p.confidence === 'high').length / predictions.length,
                total_forecasted_units: predictions.reduce((sum, p) => sum + p.week_total, 0)
            },
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Enhanced Prediction Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate predictions',
            details: error.message
        });
    }
});

module.exports = router;
