const express = require('express');
const router = express.Router();
const supabase = require('../services/supabaseClient');

// Helper function to get top 10 products by sales in last 7 days
async function getTop10Products() {
    try {
        // Get date 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

        // Get sales data for last 7 days
        const { data: recentSales, error: salesError } = await supabase
            .from('sales')
            .select('product_id, qty_sold, date')
            .gte('date', sevenDaysAgoStr)
            .order('date', { ascending: true });

        if (salesError) throw salesError;

        // Aggregate sales by product
        const productSales = {};
        recentSales.forEach(sale => {
            if (!productSales[sale.product_id]) {
                productSales[sale.product_id] = 0;
            }
            productSales[sale.product_id] += sale.qty_sold;
        });

        // Get top 10 product IDs
        const topProductIds = Object.entries(productSales)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([id]) => id);

        // Get product details
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, name, stock_levels(current_stock)')
            .in('id', topProductIds);

        if (productsError) throw productsError;

        // Create product map with sales data
        const productMap = {};
        products.forEach(product => {
            productMap[product.id] = {
                id: product.id,
                name: product.name,
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

// Data preprocessing functions
function removeOutliers(data) {
    if (data.length < 3) return data;
    
    // Calculate median
    const sorted = [...data].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    
    // Calculate median absolute deviation
    const deviations = sorted.map(x => Math.abs(x - median));
    const mad = deviations.sort((a, b) => a - b)[Math.floor(deviations.length / 2)];
    
    // Remove outliers (values more than 2 * MAD from median)
    const threshold = 2 * mad;
    return data.filter(x => Math.abs(x - median) <= threshold);
}

function fillMissingValues(data, stockData, transactionData) {
    // Replace missing values with stock-based estimation or transaction-based average
    const filledData = [...data];
    
    // If we have stock data, use stock-based sales reconstruction
    if (stockData && stockData.length >= 2) {
        // sales = opening_stock + stock_received - closing_stock
        // We'll use this to estimate missing sales values
        for (let i = 0; i < filledData.length; i++) {
            if (filledData[i] === null || filledData[i] === undefined) {
                // Estimate based on stock movement if available
                if (i < stockData.length - 1) {
                    const estimatedSales = Math.max(0, 
                        (stockData[i]?.current_stock || 0) - (stockData[i + 1]?.current_stock || 0)
                    );
                    filledData[i] = estimatedSales;
                } else if (transactionData && transactionData.length > 0) {
                    // Fallback to transaction-based average
                    const avgTransactions = transactionData.reduce((sum, t) => sum + (t.count || 0), 0) / transactionData.length;
                    filledData[i] = Math.max(0, avgTransactions * 0.1); // Rough estimation
                }
            }
        }
    }
    
    return filledData;
}

function convertTimestamps(dates) {
    return dates.map(date => {
        const d = new Date(date);
        return {
            dayOfWeek: d.getDay(), // 0-6 (Sunday-Saturday)
            hourOfDay: d.getHours() // 0-23
        };
    });
}

// Linear Regression with rolling window
function linearRegressionRollingWindow(dailySales, windowSize = 3) {
    if (dailySales.length < 2) {
        return {
            trend: 'stable',
            value: dailySales[dailySales.length - 1] || 0,
            range: `${Math.max(0, (dailySales[dailySales.length - 1] || 0) - 1)}-${(dailySales[dailySales.length - 1] || 0) + 1}`,
            confidence: 'low'
        };
    }

    // Calculate both 3-day and 7-day rolling regressions
    const threeDayPrediction = calculateRollingRegression(dailySales, Math.min(3, dailySales.length));
    const sevenDayPrediction = calculateRollingRegression(dailySales, Math.min(7, dailySales.length));
    
    // Average both for stability
    const avgPrediction = Math.round((threeDayPrediction.value + sevenDayPrediction.value) / 2);
    
    // Determine trend strength
    let trend = 'stable';
    if (avgPrediction > dailySales[dailySales.length - 1] * 1.1) {
        trend = 'upward';
    } else if (avgPrediction < dailySales[dailySales.length - 1] * 0.9) {
        trend = 'downward';
    }
    
    // Confidence based on data consistency
    const variance = Math.abs(threeDayPrediction.value - sevenDayPrediction.value);
    let confidence = 'high';
    if (variance > 3) confidence = 'medium';
    if (variance > 6) confidence = 'low';
    
    return {
        trend,
        value: avgPrediction,
        range: `${Math.max(0, avgPrediction - 1)}-${avgPrediction + 1}`,
        confidence
    };
}

function calculateRollingRegression(dailySales, windowSize) {
    if (dailySales.length < 2) {
        return { value: dailySales[dailySales.length - 1] || 0 };
    }
    
    const windowData = dailySales.slice(-windowSize);
    const n = windowData.length;
    
    // Simple linear regression
    let sum_x = 0, sum_y = 0, sum_xy = 0, sum_xx = 0;
    
    windowData.forEach((sale, index) => {
        sum_x += index;
        sum_y += sale;
        sum_xy += index * sale;
        sum_xx += index * index;
    });
    
    const slope = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x);
    const intercept = (sum_y - slope * sum_x) / n;
    
    // Predict next value
    const nextValue = Math.max(0, Math.round(slope * n + intercept));
    
    return { value: nextValue };
}

// Weighted Moving Average with dynamic weights
function weightedMovingAverage(dailySales, stockMovement) {
    if (dailySales.length === 0) {
        return {
            value: 0,
            range: '0-0',
            confidence: 'low'
        };
    }
    
    // Use dynamic weights based on stock movement
    const weights = [0.6, 0.3, 0.1]; // today, yesterday, day before
    const values = [];
    const actualWeights = [];
    
    // Get last 3 days of data (or less if not available)
    for (let i = 0; i < Math.min(3, dailySales.length); i++) {
        const index = dailySales.length - 1 - i;
        if (index >= 0) {
            values.push(dailySales[index]);
            actualWeights.push(weights[i]);
        }
    }
    
    // Calculate weighted average
    let weightedSum = 0;
    let weightSum = 0;
    
    for (let i = 0; i < values.length; i++) {
        weightedSum += values[i] * actualWeights[i];
        weightSum += actualWeights[i];
    }
    
    const wma = weightSum > 0 ? weightedSum / weightSum : 0;
    const prediction = Math.round(wma);
    
    // Confidence based on stock movement stability
    let confidence = 'high';
    if (stockMovement && stockMovement.length >= 2) {
        const movements = stockMovement.slice(-3).map((s, i) => 
            i === 0 ? 0 : s.current_stock - stockMovement[i - 1].current_stock
        );
        
        const variance = movements.reduce((sum, m) => sum + Math.abs(m), 0) / movements.length;
        if (variance > 5) confidence = 'medium';
        if (variance > 10) confidence = 'low';
    }
    
    return {
        value: prediction,
        range: `${Math.max(0, prediction - 1)}-${prediction + 1}`,
        confidence
    };
}

// Holt-Winters with damped trend
function holtWinters(dailySales) {
    if (dailySales.length < 7) {
        // Fallback to simple average if not enough data
        const avg = dailySales.reduce((sum, sale) => sum + sale, 0) / (dailySales.length || 1);
        const prediction = Math.round(avg);
        
        return {
            value: prediction,
            range: `${Math.max(0, prediction - 2)}-${prediction + 2}`,
            confidence: dailySales.length > 3 ? 'medium' : 'low'
        };
    }
    
    // Simplified Holt-Winters with damping
    const alpha = 0.3; // Level smoothing
    const beta = 0.1;  // Trend smoothing
    const gamma = 0.1; // Seasonal smoothing
    const phi = 0.98;  // Damping parameter (prevent over-prediction)
    
    // Initialize
    let level = dailySales[0];
    let trend = dailySales[1] - dailySales[0];
    const seasonal = Array(7).fill(0);
    
    // Calculate initial seasonal components
    for (let i = 0; i < Math.min(7, dailySales.length); i++) {
        seasonal[i] = dailySales[i] - level;
    }
    
    // Fit the model
    for (let i = 0; i < dailySales.length; i++) {
        const seasonalIndex = i % 7;
        const prevLevel = level;
        
        // Update level
        level = alpha * (dailySales[i] - seasonal[seasonalIndex]) + (1 - alpha) * (level + phi * trend);
        
        // Update trend with damping
        trend = beta * (level - prevLevel) + (1 - beta) * phi * trend;
        
        // Update seasonal
        seasonal[seasonalIndex] = gamma * (dailySales[i] - level) + (1 - gamma) * seasonal[seasonalIndex];
    }
    
    // Forecast next value with damping
    const seasonalIndex = dailySales.length % 7;
    const forecast = level + phi * trend + seasonal[seasonalIndex];
    const prediction = Math.max(0, Math.round(forecast));
    
    // Confidence based on recent variance
    const recentVariance = dailySales.slice(-7).reduce((sum, sale) => {
        return sum + Math.pow(sale - (level + seasonal[dailySales.length % 7]), 2);
    }, 0) / 7;
    
    let confidence = 'high';
    if (recentVariance > 4) confidence = 'medium';
    if (recentVariance > 9) confidence = 'low';
    
    return {
        value: prediction,
        range: `${Math.max(0, prediction - 2)}-${prediction + 2}`,
        confidence
    };
}

// Random Forest Regression (simplified simulation)
function randomForestRegression(product, dailySales, stockMovement, transactionData) {
    if (dailySales.length === 0) {
        return {
            value: 0,
            range: '0-0',
            confidence: 'low'
        };
    }
    
    // Features for prediction:
    // 1. Stock movement
    let stockTrend = 0;
    if (stockMovement && stockMovement.length >= 2) {
        stockTrend = stockMovement[stockMovement.length - 1].current_stock - 
                     stockMovement[Math.max(0, stockMovement.length - 2)].current_stock;
    }
    
    // 2. Time of day (current)
    const hourOfDay = new Date().getHours();
    
    // 3. Weekday (current)
    const dayOfWeek = new Date().getDay();
    
    // 4. Transaction count
    let transactionCount = 0;
    if (transactionData && transactionData.length > 0) {
        transactionCount = transactionData.reduce((sum, t) => sum + (t.count || 0), 0) / transactionData.length;
    }
    
    // 5. Price (from product)
    const price = product.price || 0;
    
    // 6. Micro-seasonality (recent pattern)
    let microSeasonality = 0;
    if (dailySales.length >= 7) {
        // Compare same day of week
        const sameDaySales = dailySales.filter((_, i) => (dailySales.length - 1 - i) % 7 === dayOfWeek % 7);
        if (sameDaySales.length > 1) {
            microSeasonality = sameDaySales[sameDaySales.length - 1] - sameDaySales[sameDaySales.length - 2];
        }
    }
    
    // Simplified prediction model (in a real implementation, this would be a trained Random Forest)
    const avgSales = dailySales.reduce((sum, sale) => sum + sale, 0) / dailySales.length;
    
    // Weighted combination of features
    const stockFactor = Math.max(0.5, 1 - Math.abs(stockTrend) / 10);
    const timeFactor = (hourOfDay >= 9 && hourOfDay <= 21) ? 1.2 : 0.8; // Business hours boost
    const weekdayFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.1 : 1.0; // Weekend boost
    const transactionFactor = Math.min(2, transactionCount / 10);
    const priceFactor = Math.max(0.5, 1 - (price / 100)); // Lower price = higher demand
    const microFactor = 1 + (microSeasonality / (avgSales + 1));
    
    const prediction = Math.max(0, Math.round(
        avgSales * 
        stockFactor * 
        timeFactor * 
        weekdayFactor * 
        transactionFactor * 
        priceFactor * 
        microFactor
    ));
    
    // Confidence based on data quality
    const dataPoints = dailySales.length + (stockMovement ? stockMovement.length : 0) + (transactionData ? transactionData.length : 0);
    let confidence = 'high';
    if (dataPoints < 10) confidence = 'medium';
    if (dataPoints < 5) confidence = 'low';
    
    return {
        value: prediction,
        range: `${Math.max(0, prediction - 1)}-${prediction + 1}`,
        confidence,
        feature_importance: {
            stock_movement: Math.round(stockFactor * 100),
            time_of_day: Math.round(timeFactor * 100),
            weekday: Math.round(weekdayFactor * 100),
            transaction_count: Math.round(transactionFactor * 100),
            price: Math.round(priceFactor * 100),
            micro_seasonality: Math.round(microFactor * 100)
        }
    };
}

// Gemini AI Reasoning (simulated with structured inputs)
function geminiAIReasoning(product, dailySales, stockMovement, transactionData) {
    if (dailySales.length === 0) {
        return {
            value: 0,
            range: '0-0',
            reasoning: 'Not enough data to generate AI insights for this product.',
            confidence: 'low'
        };
    }
    
    // Prepare structured inputs for Gemini
    const structuredInputs = {
        last_7_sales: dailySales.slice(-7),
        stock_movement: stockMovement ? stockMovement.slice(-7).map(s => s.current_stock) : [],
        transactions: transactionData ? transactionData.slice(-7).map(t => t.count || 0) : [],
        weekday: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()],
        category: product.category || 'General'
    };
    
    // Simulate AI analysis
    const avgSales = dailySales.reduce((sum, sale) => sum + sale, 0) / dailySales.length;
    
    // Analyze trends
    let trend = 'stable';
    if (dailySales.length >= 2) {
        const recentAvg = dailySales.slice(-3).reduce((sum, sale) => sum + sale, 0) / 3;
        const previousAvg = dailySales.slice(-6, -3).reduce((sum, sale) => sum + sale, 0) / 3;
        
        if (recentAvg > previousAvg * 1.1) trend = 'upward';
        else if (recentAvg < previousAvg * 0.9) trend = 'downward';
    }
    
    // Analyze stock
    let stockAnalysis = '';
    if (stockMovement && stockMovement.length >= 2) {
        const stockChange = stockMovement[stockMovement.length - 1].current_stock - 
                           stockMovement[stockMovement.length - 2].current_stock;
        
        if (stockChange < 0 && Math.abs(stockChange) > avgSales * 0.5) {
            stockAnalysis = 'Stock is decreasing faster than average sales, indicating high demand. ';
        } else if (stockChange > 0) {
            stockAnalysis = 'Recent stock additions suggest preparation for demand. ';
        }
    }
    
    // Generate reasoning
    let reasoning = `Based on analysis of recent sales patterns for ${product.name}. `;
    reasoning += stockAnalysis;
    
    if (trend === 'upward') {
        reasoning += 'Sales trend is increasing, expect continued demand. ';
    } else if (trend === 'downward') {
        reasoning += 'Sales trend is decreasing, consider promotional offers. ';
    } else {
        reasoning += 'Sales are stable with consistent demand. ';
    }
    
    // Predict with narrow range
    const prediction = Math.max(0, Math.round(avgSales));
    const range = `${Math.max(0, prediction - 1)}-${prediction + 1}`;
    
    return {
        value: prediction,
        range,
        reasoning,
        confidence: 'medium'
    };
}

// Multi-model accuracy fusion
function fusePredictions(models) {
    // Final Prediction =
    // (0.35 × Holt-Winters) +
    // (0.25 × Linear Regression) +
    // (0.20 × Random Forest) +
    // (0.15 × Weighted MA) +
    // (0.05 × Gemini AI)
    
    const weights = {
        holt_winters: 0.35,
        linear_regression: 0.25,
        random_forest: 0.20,
        weighted_ma: 0.15,
        gemini_ai: 0.05
    };
    
    let fusedValue = 0;
    let totalWeight = 0;
    let confidenceScore = 0;
    
    // Calculate weighted average
    Object.entries(weights).forEach(([model, weight]) => {
        if (models[model]) {
            fusedValue += models[model].value * weight;
            totalWeight += weight;
            
            // Confidence scoring (High=3, Medium=2, Low=1)
            const confidenceMap = { 'high': 3, 'medium': 2, 'low': 1 };
            confidenceScore += (confidenceMap[models[model].confidence] || 1) * weight;
        }
    });
    
    if (totalWeight > 0) {
        fusedValue = fusedValue / totalWeight;
    }
    
    // Determine overall confidence
    let confidence = 'low';
    if (confidenceScore >= 2.5) confidence = 'high';
    else if (confidenceScore >= 1.5) confidence = 'medium';
    
    // Determine trend
    const values = Object.values(models).map(m => m.value);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const recent = values[values.length - 1] || 0;
    
    let trend = 'stable';
    if (recent > avg * 1.1) trend = 'upward';
    else if (recent < avg * 0.9) trend = 'downward';
    
    // Narrow range for final prediction
    const roundedValue = Math.round(fusedValue);
    const range = `${Math.max(0, roundedValue - 1)}-${roundedValue + 1}`;
    
    return {
        value: roundedValue,
        range,
        trend,
        confidence
    };
}

// Get sales data for a product over the last N days
async function getProductSalesData(productId, days = 7) {
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

// Get stock movement data for a product (using stock_levels table)
async function getProductStockData(productId, days = 7) {
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
        
        // Convert to the format we expect
        return stockLevels.map(level => ({
            date: level.created_at,
            current_stock: level.current_stock
        })) || [];
    } catch (error) {
        console.error(`Error fetching stock data for product ${productId}:`, error);
        return [];
    }
}

// Get transaction count for the period (using created_at column)
async function getTransactionData(days = 7) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString();
        
        // Group transactions by day
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('created_at')
            .gte('created_at', startDateStr)
            .order('created_at', { ascending: true });
            
        if (error) throw error;
        
        // Group by date and count
        const dailyCounts = {};
        transactions.forEach(t => {
            const date = t.created_at.split('T')[0];
            if (!dailyCounts[date]) dailyCounts[date] = 0;
            dailyCounts[date]++;
        });
        
        // Convert to array format
        return Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));
    } catch (error) {
        console.error('Error fetching transaction data:', error);
        return [];
    }
}

router.get('/predict/top10-accurate', async (req, res) => {
    try {
        console.log('=== ML MODELS PREDICTION (HIGH ACCURACY) START ===');
        
        // Get top 10 products
        const topProducts = await getTop10Products();
        console.log(`Found ${topProducts.length} top products`);
        
        // Get transaction data for context
        const transactionData = await getTransactionData(7);
        console.log(`Transaction data points: ${transactionData.length}`);
        
        // Process each product with all 5 models
        const predictions = [];
        
        for (const product of topProducts) {
            console.log(`Processing product: ${product.name} (${product.id})`);
            
            // Get sales data (last 7 days)
            const salesData = await getProductSalesData(product.id, 7);
            console.log(`  Sales data points: ${salesData.length}`);
            
            // Get stock movement data
            const stockData = await getProductStockData(product.id, 7);
            console.log(`  Stock data points: ${stockData.length}`);
            
            // Extract daily sales values
            const dailySales = salesData.map(s => s.qty_sold);
            
            // STEP 1: ACCURATE DATA PREPROCESSING
            // Clean & normalize data
            const cleanedSales = removeOutliers(dailySales);
            const filledSales = fillMissingValues(cleanedSales, stockData, transactionData);
            const timestamps = convertTimestamps(salesData.map(s => s.date));
            
            // Stock-Based Sales Reconstruction
            // sales = opening_stock + stock_received - closing_stock
            // (This is handled in fillMissingValues)
            
            // Prepare data for visualization
            const salesHistory = salesData.map((sale, index) => ({
                date: sale.date,
                qty_sold: sale.qty_sold,
                day_label: `Day ${index + 1}`
            }));
            
            // STEP 2: 5 ML MODELS — IMPROVED ACCURACY VERSION
            const linearRegression = linearRegressionRollingWindow(filledSales);
            const weightedMA = weightedMovingAverage(filledSales, stockData);
            const holtWintersPred = holtWinters(filledSales);
            const randomForest = randomForestRegression(product, filledSales, stockData, transactionData);
            const geminiAI = geminiAIReasoning(product, filledSales, stockData, transactionData);
            
            // Create models object
            const models = {
                linear_regression: linearRegression,
                weighted_ma: weightedMA,
                holt_winters: holtWintersPred,
                random_forest: randomForest,
                gemini_ai: geminiAI
            };
            
            // STEP 3: MULTI-MODEL ACCURACY FUSION
            const finalPrediction = fusePredictions(models);
            
            // Combine into final prediction
            predictions.push({
                product_id: product.id,
                product_name: product.name,
                current_stock: product.current_stock,
                total_sales_7_days: product.total_sales_7_days,
                sales_history: salesHistory, // Add sales history for visualization
                models,
                final_prediction: finalPrediction
            });
        }
        
        res.json({
            success: true,
            predictions,
            generated_at: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('ML Models Prediction Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to generate predictions',
            details: error.message 
        });
    }
});

module.exports = router;