const express = require('express');
const router = express.Router();
const supabase = require('../services/supabaseClient');

// Enhanced Moving Average with Day-of-Week Variation using correct formulas
function predictSalesMA(historicalData, daysToPredict = 7, windowSize = 7) {
    if (historicalData.length < windowSize) {
        const avg = historicalData.reduce((sum, d) => sum + d.total_qty, 0) / historicalData.length;

        // Add day-of-week variation even for limited data
        // Fix: Normalize day-of-week multipliers
        const dayMultipliers = [1.15, 0.85, 0.9, 0.95, 1.0, 1.1, 1.2]; // Sun-Sat
        const weeklyAvg = dayMultipliers.reduce((a, b) => a + b, 0) / 7; // 1.0214
        const normalizedMultipliers = dayMultipliers.map(m => m / weeklyAvg);

        const predictions = [];
        const today = new Date();

        for (let i = 1; i <= daysToPredict; i++) {
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + i);
            const dayOfWeek = futureDate.getDay();
            const predicted = Math.max(0, Math.round(avg * normalizedMultipliers[dayOfWeek]));
            predictions.push(predicted);
        }
        return predictions;
    }

    // Step 2 — 7-Day Moving Average
    const recentData = historicalData.slice(-windowSize);
    const recentMA = recentData.reduce((sum, d) => sum + d.total_qty, 0) / windowSize;

    // Historical_MA = (Previous 7 days sales) / 7
    let historicalMA = 0;
    if (historicalData.length >= windowSize * 2) {
        const olderData = historicalData.slice(-windowSize * 2, -windowSize);
        historicalMA = olderData.reduce((sum, d) => sum + d.total_qty, 0) / windowSize;
    }

    // Step 3 — Safe Trend Analysis
    let trendMultiplier = 1;
    if (historicalMA > 0) {
        // Trend % = (Recent_MA - Historical_MA) / Historical_MA
        let trendPercent = (recentMA - historicalMA) / historicalMA;
        // Fix: Limit trend to max +50% and min -50%
        trendPercent = Math.max(-0.5, Math.min(0.5, trendPercent));
        trendMultiplier = 1 + trendPercent;
    }
    // If Historical_MA = 0: Trend_Multiplier = 1 (already set)

    // Step 4 — Normalize Day-of-Week Multipliers
    const dayMultipliers = [1.15, 0.85, 0.9, 0.95, 1.0, 1.1, 1.2]; // Sun-Sat
    const weeklyAvg = dayMultipliers.reduce((a, b) => a + b, 0) / 7; // 1.0214
    const normalizedMultipliers = dayMultipliers.map(m => m / weeklyAvg);

    // Calculate daily predictions
    const dailyPredictions = [];
    const today = new Date();

    for (let i = 1; i <= daysToPredict; i++) {
        // Get the day of week for this prediction
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + i);
        const dayOfWeek = futureDate.getDay();

        // Adjusted_Avg = Recent_MA × Trend_Multiplier
        const adjustedAvg = recentMA * trendMultiplier;

        // Day_Pred = Adjusted_Avg × Normalized_Day_Multiplier
        const dayPrediction = adjustedAvg * normalizedMultipliers[dayOfWeek];
        dailyPredictions.push(dayPrediction);
    }

    // Weekly_Total = Sum(Day_Pred for 7 days)
    const weeklyTotal = dailyPredictions.reduce((a, b) => a + b, 0);

    // Scale individual predictions to match weekly total
    const scaleFactor = weeklyTotal > 0 ? weeklyTotal / weeklyTotal : 1;
    const scaledPredictions = dailyPredictions.map(pred => pred / scaleFactor);

    // Step 5 — Final Prediction (Corrected)
    // Final_Prediction = Weekly_Total × (1 ± 0.05)
    // Apply random ±5% only once at the end
    const randomFactor = 1 + (Math.random() * 0.1 - 0.05); // ±5%
    const finalWeeklyTotal = Math.max(0, Math.round(weeklyTotal * randomFactor));

    // Distribute the final total back to daily predictions
    const finalPredictions = scaledPredictions.map(pred => {
        const proportion = weeklyTotal > 0 ? pred / weeklyTotal : (1 / daysToPredict);
        return Math.max(0, Math.round(finalWeeklyTotal * proportion));
    });

    return finalPredictions;
}

// Enhanced Product-Level Predictions using correct formulas
function predictProductSales(productSalesMap, daysToPredict = 7) {
    const predictions = [];

    for (const [productId, salesData] of Object.entries(productSalesMap)) {
        if (!salesData || salesData.length === 0) continue;

        const productName = salesData[0]?.product_name || 'Unknown Product';

        // Calculate recent average (last 7 days) and historical average (8-30 days ago)
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        let recentSum = 0;
        let recentCount = 0;
        let historicalSum = 0;
        let historicalCount = 0;

        salesData.forEach(s => {
            const saleDate = new Date(s.date);
            if (saleDate >= sevenDaysAgo) {
                recentSum += (s.qty || 0);
                recentCount++;
            } else if (saleDate >= thirtyDaysAgo) {
                historicalSum += (s.qty || 0);
                historicalCount++;
            }
        });

        const recentAvg = recentCount > 0 ? recentSum / recentCount : 0;
        const historicalAvg = historicalCount > 0 ? historicalSum / historicalCount : 0;

        // If Historical Average = 0, then:
        let trendPercent = 0;
        let trendStatus = 'STABLE';
        let trendMultiplier = 1;
        
        if (historicalAvg === 0) {
            // Trend % = NOT APPLICABLE
            trendPercent = 0;
            // Trend Multiplier = 1
            trendMultiplier = 1;
            // Trend Status = NOT_ENOUGH_DATA
            trendStatus = 'NOT_ENOUGH_DATA';
        } else if (historicalAvg > 0) {
            // Calculate trend normally
            trendPercent = ((recentAvg - historicalAvg) / historicalAvg) * 100;
            if (trendPercent > 5) trendStatus = 'RISING';
            else if (trendPercent < -5) trendStatus = 'FALLING';
            else trendStatus = 'STABLE';
            trendMultiplier = 1 + (trendPercent / 100);
        } else {
            trendStatus = 'NOT_ENOUGH_DATA';
        }

        // Calculate confidence score
        let confidenceScore = 0;
        if (historicalAvg > 0 && salesData.length > 1) {
            // Calculate standard deviation
            const deviations = salesData.map(s => Math.pow((s.qty || 0) - historicalAvg, 2));
            const variance = deviations.reduce((sum, d) => sum + d, 0) / salesData.length;
            const stdDeviation = Math.sqrt(variance);
            
            // Confidence Score = 1 – (Std_Deviation / Historical_Avg)
            confidenceScore = 1 - (stdDeviation / historicalAvg);
            // Ensure confidence is between 0 and 1
            confidenceScore = Math.max(0, Math.min(1, confidenceScore));
            
            // Do NOT mark it High unless historical data is stable
            // If std deviation is high relative to average, reduce confidence
            if (stdDeviation / historicalAvg > 0.5) {
                confidenceScore = Math.min(confidenceScore, 0.6); // Cap at medium
            }
        } else {
            // Confidence cannot be HIGH when Historical Average = 0
            // Set Confidence = LOW
            // Reason: Not enough historical data
            confidenceScore = 0.3; // Low confidence
        }

        // Predict with day-of-week variation using correct formulas
        const dailyPredictions = [];
        const dayMultipliers = [1.15, 0.85, 0.9, 0.95, 1.0, 1.1, 1.2];

        for (let i = 1; i <= daysToPredict; i++) {
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + i);
            const dayOfWeek = futureDate.getDay();

            let finalPrediction = 0;
            
            // If Historical Average = 0, recalculate the prediction using:
            if (historicalAvg === 0) {
                // Adjusted Avg = Recent Avg × 1
                const adjustedAvg = recentAvg * 1; // trendMultiplier is 1
                // Day Prediction = Adjusted Avg × Day Multiplier
                const dayPrediction = adjustedAvg * dayMultipliers[dayOfWeek];
                // Final Prediction = Day Prediction × (1 ± 0.05)
                const randomFactor = 1 + (Math.random() * 0.1 - 0.05); // ±5%
                finalPrediction = Math.max(0, Math.round(dayPrediction * randomFactor));
            } else {
                // Recalculate Adjusted Average correctly:
                // Adjusted Avg = Recent Avg × Trend Multiplier
                const adjustedAvg = recentAvg * trendMultiplier;
                // Recalculate 7-day prediction properly using:
                // Adjusted Avg × Day Multipliers
                const dayPrediction = adjustedAvg * dayMultipliers[dayOfWeek];
                // Apply ±5% noise correctly (optional)
                const randomFactor = 1 + (Math.random() * 0.1 - 0.05); // ±5%
                finalPrediction = Math.max(0, Math.round(dayPrediction * randomFactor));
            }

            dailyPredictions.push(finalPrediction);
        }

        // Calculate stock sufficiency using correct formula
        // Remaining_Stock = Current_Stock – Total_7_Day_Prediction
        const totalPredicted = dailyPredictions.reduce((a, b) => a + b, 0);

        predictions.push({
            product_id: productId,
            product_name: productName,
            historical_avg: parseFloat(historicalAvg.toFixed(2)),
            recent_avg: parseFloat(recentAvg.toFixed(2)),
            trend: trendStatus,
            trend_percent: parseFloat(trendPercent.toFixed(1)),
            predictions: dailyPredictions,
            total_predicted: totalPredicted,
            confidence_score: parseFloat(confidenceScore.toFixed(2)),
            daily_average: parseFloat((totalPredicted / daysToPredict).toFixed(2))
        });
    }

    return predictions.sort((a, b) => b.total_predicted - a.total_predicted);
}

router.get('/', async (req, res) => {
    try {
        const daysToPredict = parseInt(req.query.days) || 7;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Fetch sales data
        const { data: sales, error: salesError } = await supabase
            .from('sales')
            .select('date, qty_sold, product_id, products(name)')
            .gte('date', thirtyDaysAgo.toISOString())
            .order('date', { ascending: true });

        if (salesError) {
            console.error('Sales fetch error:', salesError);
            throw salesError;
        }

        // Fetch stock levels via products relation
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, stock_levels(current_stock)');

        if (productsError) {
            console.error('Products fetch error:', productsError);
            throw productsError;
        }

        // Create stock levels map
        const stockLevels = {};
        products.forEach(p => {
            let stock = 0;
            if (p.stock_levels) {
                if (Array.isArray(p.stock_levels)) {
                    stock = p.stock_levels[0]?.current_stock || 0;
                } else {
                    stock = p.stock_levels.current_stock || 0;
                }
            }
            stockLevels[p.id] = stock;
        });

        const dailySales = {};
        const productSales = {};

        sales.forEach(s => {
            const dateKey = s.date.split('T')[0];

            if (!dailySales[dateKey]) {
                dailySales[dateKey] = { date: dateKey, total_qty: 0 };
            }
            dailySales[dateKey].total_qty += s.qty_sold;

            if (s.product_id) {
                if (!productSales[s.product_id]) {
                    productSales[s.product_id] = [];
                }
                productSales[s.product_id].push({
                    date: s.date,
                    qty: s.qty_sold,
                    product_name: s.products?.name || 'Unknown'
                });
            }
        });

        const historicalData = Object.values(dailySales);
        const overallPredictions = predictSalesMA(historicalData, daysToPredict);
        const productPredictions = predictProductSales(productSales, daysToPredict);

        // Add stock levels to product predictions
        productPredictions.forEach(product => {
            product.current_stock = stockLevels[product.product_id] || 0;
            
            // Calculate stock sufficiency using correct formula
            // Remaining_Stock = Current_Stock – Total_7_Day_Prediction
            product.remaining_stock = product.current_stock - product.total_predicted;
        });

        const futureDates = [];
        const today = new Date();
        for (let i = 1; i <= daysToPredict; i++) {
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + i);
            futureDates.push(futureDate.toISOString().split('T')[0]);
        }

        res.json({
            historical: historicalData.slice(-14),
            predictions: overallPredictions.map((qty, idx) => ({
                date: futureDates[idx],
                predicted_qty: qty
            })),
            product_predictions: productPredictions,
            summary: {
                total_products_analyzed: productPredictions.length,
                avg_daily_historical: historicalData.length > 0
                    ? parseFloat((historicalData.reduce((sum, d) => sum + d.total_qty, 0) / historicalData.length).toFixed(2))
                    : 0,
                avg_daily_predicted: parseFloat((overallPredictions.reduce((a, b) => a + b, 0) / overallPredictions.length).toFixed(2)),
                total_predicted: overallPredictions.reduce((a, b) => a + b, 0)
            }
        });

    } catch (error) {
        console.error('Prediction error:', error);
        res.status(500).json({ error: 'Prediction failed', details: error.message });
    }
});

module.exports = router;