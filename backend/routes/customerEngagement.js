const express = require('express');
const router = express.Router();
const supabase = require('../services/supabaseClient');

// Helper function to calculate date ranges
const getDateRanges = () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  return { thirtyDaysAgo, sevenDaysAgo, now };
};

// Helper function to group by date
const groupByDate = (data, dateField) => {
  const grouped = {};
  data.forEach(item => {
    const date = new Date(item[dateField]).toISOString().split('T')[0];
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(item);
  });
  return grouped;
};

// Helper function to calculate moving average
const calculateMovingAverage = (data, days = 7) => {
  const result = {};
  const dates = Object.keys(data).sort();
  
  for (let i = days - 1; i < dates.length; i++) {
    const currentDate = dates[i];
    let sum = 0;
    for (let j = 0; j < days; j++) {
      const date = dates[i - j];
      sum += data[date] || 0;
    }
    result[currentDate] = sum / days;
  }
  
  return result;
};

// Get customer engagement metrics
router.get('/engagement', async (req, res) => {
  try {
    const { thirtyDaysAgo, sevenDaysAgo, now } = getDateRanges();
    
    // 1. Get recent transactions with sales data
    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select(`
        id,
        date,
        amount,
        note
      `)
      .gte('date', thirtyDaysAgo.toISOString())
      .order('date', { ascending: true });

    if (transactionError) throw transactionError;

    // 2. Get sales data with customer_id
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select(`
        id,
        product_id,
        qty_sold,
        total_price,
        date,
        customer_id,
        products(name)
      `)
      .gte('date', thirtyDaysAgo.toISOString())
      .order('date', { ascending: true });

    if (salesError) throw salesError;

    // 3. Get customer data
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, name');

    // Group transactions by date for daily analysis
    const transactionsByDate = groupByDate(transactions, 'date');
    
    // Calculate Daily Active Buyers (DAB)
    const dailyActiveBuyers = {};
    Object.keys(transactionsByDate).forEach(date => {
      dailyActiveBuyers[date] = transactionsByDate[date].length;
    });
    
    // Calculate 7-day moving average for DAB
    const dabMovingAverage = calculateMovingAverage(dailyActiveBuyers, 7);
    
    // Customer Visit Frequency (last 7 days)
    const recentTransactions = transactions.filter(t => new Date(t.date) >= sevenDaysAgo);
    const dailyTransactionCount = recentTransactions.length / 7;
    
    // Weekly trend
    const weeklyTransactions = transactions.filter(t => new Date(t.date) >= sevenDaysAgo);
    const previousWeekTransactions = transactions.filter(t => 
      new Date(t.date) >= new Date(sevenDaysAgo.getTime() - 7 * 24 * 60 * 60 * 1000) &&
      new Date(t.date) < sevenDaysAgo
    );
    
    const currentWeekCount = weeklyTransactions.length;
    const previousWeekCount = previousWeekTransactions.length;
    const weeklyTrend = previousWeekCount > 0 
      ? ((currentWeekCount - previousWeekCount) / previousWeekCount) * 100 
      : 0;
    
    // Total transactions count
    const totalTransactions = transactions.length;
    
    // Repeat Purchase Rate - using actual customer_id data
    // Count how many customers have made more than one purchase
    const customerPurchaseCounts = {};
    sales.forEach(sale => {
      if (sale.customer_id) {
        if (!customerPurchaseCounts[sale.customer_id]) {
          customerPurchaseCounts[sale.customer_id] = 0;
        }
        customerPurchaseCounts[sale.customer_id]++;
      }
    });
    
    const repeatCustomers = Object.values(customerPurchaseCounts)
      .filter(count => count > 1)
      .length;
      
    const totalCustomersWithPurchases = Object.keys(customerPurchaseCounts).length;
    
    const repeatPurchaseRate = totalCustomersWithPurchases > 0 
      ? (repeatCustomers / totalCustomersWithPurchases) * 100 
      : 0;
    
    // Basket Size & Basket Value
    // Group sales by date to approximate transactions
    const salesByDate = groupByDate(sales, 'date');
    
    const transactionsWithSales = {};
    Object.keys(salesByDate).forEach(date => {
      const salesForDate = salesByDate[date];
      // For each date, we'll treat all sales as part of one transaction
      // This is an approximation since we don't have transaction_id
      transactionsWithSales[date] = {
        items: salesForDate.reduce((sum, sale) => sum + sale.qty_sold, 0),
        totalValue: salesForDate.reduce((sum, sale) => sum + sale.total_price, 0),
        itemsList: salesForDate.map(sale => ({
          product: sale.products?.name || 'Unknown',
          qty: sale.qty_sold
        }))
      };
    });
    
    // Calculate average basket size and value
    const basketSizes = Object.values(transactionsWithSales).map(t => t.items);
    const basketValues = Object.values(transactionsWithSales).map(t => t.totalValue);
    
    const avgBasketSize = basketSizes.length > 0 
      ? basketSizes.reduce((a, b) => a + b, 0) / basketSizes.length 
      : 0;
      
    const avgBasketValue = basketValues.length > 0 
      ? basketValues.reduce((a, b) => a + b, 0) / basketValues.length 
      : 0;
    
    // Trends over time (basket size/value by week)
    const weeklyBasketData = {};
    Object.keys(salesByDate).forEach(date => {
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Get Sunday of the week
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyBasketData[weekKey]) {
        weeklyBasketData[weekKey] = { totalItems: 0, totalValue: 0, transactionCount: 0 };
      }
      
      const salesForDate = salesByDate[date];
      weeklyBasketData[weekKey].totalItems += salesForDate.reduce((sum, sale) => sum + sale.qty_sold, 0);
      weeklyBasketData[weekKey].totalValue += salesForDate.reduce((sum, sale) => sum + sale.total_price, 0);
      weeklyBasketData[weekKey].transactionCount += 1;
    });
    
    const weeklyBasketTrends = {};
    Object.keys(weeklyBasketData).forEach(week => {
      const data = weeklyBasketData[week];
      weeklyBasketTrends[week] = {
        avgBasketSize: data.transactionCount > 0 ? data.totalItems / data.transactionCount : 0,
        avgBasketValue: data.transactionCount > 0 ? data.totalValue / data.transactionCount : 0
      };
    });
    
    // Product Affinity Analysis
    const productPairs = {};
    Object.values(transactionsWithSales).forEach(transaction => {
      const items = transaction.itemsList;
      // Create pairs of products in each transaction
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const product1 = items[i].product;
          const product2 = items[j].product;
          const pairKey = [product1, product2].sort().join(' & ');
          
          if (!productPairs[pairKey]) {
            productPairs[pairKey] = 0;
          }
          productPairs[pairKey]++;
        }
      }
    });
    
    // Get top 10 product combinations
    const sortedPairs = Object.entries(productPairs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    // Peak Hour / Peak Day Analysis - Enhanced with detailed analysis
    const hourlyData = {};
    const dailyData = {};
    const hourlyRevenue = {};
    const dailyRevenue = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const hour = date.getHours();
      const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Count transactions per hour/day
      if (!hourlyData[hour]) {
        hourlyData[hour] = 0;
        hourlyRevenue[hour] = 0;
      }
      if (!dailyData[day]) {
        dailyData[day] = 0;
        dailyRevenue[day] = 0;
      }
      
      hourlyData[hour]++;
      dailyData[day]++;
      hourlyRevenue[hour] += transaction.amount || 0;
      dailyRevenue[day] += transaction.amount || 0;
    });
    
    // Find peak hour and day with additional details
    const peakHourEntries = Object.entries(hourlyData)
      .sort((a, b) => b[1] - a[1]);
      
    // Sort peak days by revenue instead of transaction count
    const peakDayEntries = Object.entries(dailyRevenue)
      .sort((a, b) => b[1] - a[1])
      .map(([day, revenue]) => {
        const dayIndex = parseInt(day);
        const transactionCount = dailyData[dayIndex] || 0;
        return [day, transactionCount, revenue];
      });
      
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Get top 3 peak hours and days for detailed analysis
    const topPeakHours = peakHourEntries.slice(0, 3).map(([hour, count]) => ({
      hour: parseInt(hour),
      transactions: count,
      revenue: hourlyRevenue[hour] || 0,
      percentage: totalTransactions > 0 ? ((count / totalTransactions) * 100).toFixed(1) : 0
    }));
    
    // Update top peak days to be based on revenue
    const topPeakDays = peakDayEntries.slice(0, 3).map(([day, count, revenue]) => ({
      day: dayNames[parseInt(day)],
      dayIndex: parseInt(day),
      transactions: count,
      revenue: revenue || 0,
      percentage: totalTransactions > 0 ? ((count / totalTransactions) * 100).toFixed(1) : 0
    }));
    
    // Enhanced peak analysis with detailed metrics
    // Calculate hourly averages and patterns
    const hourlyPattern = [];
    for (let i = 0; i < 24; i++) {
      // Convert 24-hour format to 12-hour format with AM/PM
      const hour12 = i === 0 ? 12 : i > 12 ? i - 12 : i;
      const period = i < 12 ? 'AM' : 'PM';
      
      hourlyPattern.push({
        hour: i,
        hourDisplay: `${hour12}${period}`, // 12-hour format with AM/PM
        transactions: hourlyData[i] || 0,
        revenue: hourlyRevenue[i] || 0,
        avgTransactionValue: (hourlyData[i] || 0) > 0 ? (hourlyRevenue[i] || 0) / (hourlyData[i] || 0) : 0
      });
    }
    
    // Calculate daily averages and patterns
    const dailyPattern = [];
    for (let i = 0; i < 7; i++) {
      dailyPattern.push({
        day: dayNames[i],
        dayIndex: i,
        transactions: dailyData[i] || 0,
        revenue: dailyRevenue[i] || 0,
        avgTransactionValue: (dailyData[i] || 0) > 0 ? (dailyRevenue[i] || 0) / (dailyData[i] || 0) : 0
      });
    }
    
    // Identify quiet hours and days
    const quietHours = Object.entries(hourlyData)
      .filter(([_, count]) => count === 0)
      .map(([hour, _]) => parseInt(hour));
      
    const quietDays = Object.entries(dailyData)
      .filter(([_, count]) => count === 0)
      .map(([day, _]) => dayNames[parseInt(day)]);
    
    // Calculate peak intensity metrics
    const avgTransactionsPerHour = totalTransactions / 24;
    const avgTransactionsPerDay = totalTransactions / 7;
    const totalRevenue = Object.values(dailyRevenue).reduce((sum, rev) => sum + rev, 0);
    const avgRevenuePerDay = totalRevenue / 7;
    
    const peakHourIntensity = peakHourEntries[0] ? 
      ((peakHourEntries[0][1] / avgTransactionsPerHour) - 1) * 100 : 0;
      
    // Find peak day based on revenue
    const peakDayByRevenue = Object.entries(dailyRevenue)
      .sort((a, b) => b[1] - a[1])[0];
      
    const peakDayIntensity = peakDayByRevenue && avgRevenuePerDay > 0 ? 
      (((peakDayByRevenue[1] / avgRevenuePerDay) - 1) * 100) : 0;
    
    // Recency Score (using customer-level data when available)
    // If we have customer data, calculate recency per customer
    // Otherwise, use shop-level recency trend
    let customerRecencyData = null;
    if (totalCustomersWithPurchases > 0) {
      // Calculate days since last purchase for each customer
      const customerLastPurchase = {};
      sales.forEach(sale => {
        if (sale.customer_id) {
          const saleDate = new Date(sale.date);
          if (!customerLastPurchase[sale.customer_id] || 
              saleDate > customerLastPurchase[sale.customer_id]) {
            customerLastPurchase[sale.customer_id] = saleDate;
          }
        }
      });
      
      // Calculate days since last purchase for each customer
      const customerRecency = {};
      Object.keys(customerLastPurchase).forEach(customerId => {
        const daysSince = Math.floor((now - customerLastPurchase[customerId]) / (1000 * 60 * 60 * 24));
        customerRecency[customerId] = daysSince;
      });
      
      customerRecencyData = customerRecency;
    }
    
    // Shop-level recency (last transaction date)
    const lastTransactionDate = transactions.length > 0 
      ? new Date(Math.max(...transactions.map(t => new Date(t.date))))
      : null;
      
    const daysSinceLastPurchase = lastTransactionDate 
      ? Math.floor((now - lastTransactionDate) / (1000 * 60 * 60 * 24))
      : null;
    
    // Prepare response
    const engagementData = {
      summary: {
        totalTransactions: totalTransactions,
        dailyVisitFrequency: dailyTransactionCount.toFixed(1),
        weeklyTrend: {
          current: currentWeekCount,
          previous: previousWeekCount,
          change: weeklyTrend.toFixed(1)
        },
        repeatPurchaseRate: repeatPurchaseRate.toFixed(1) + '%',
        avgBasketSize: avgBasketSize.toFixed(1),
        avgBasketValue: avgBasketValue.toFixed(2)
      },
      trends: {
        dailyActiveBuyers: Object.entries(dabMovingAverage)
          .map(([date, value]) => ({ date, value: value.toFixed(1) }))
          .slice(-30),
        basketTrends: Object.entries(weeklyBasketTrends)
          .map(([week, data]) => ({
            week,
            avgBasketSize: parseFloat(data.avgBasketSize.toFixed(1)),
            avgBasketValue: parseFloat(data.avgBasketValue.toFixed(2))
          }))
      },
      productAffinity: sortedPairs.map(([pair, count]) => ({
        products: pair,
        frequency: count
      })),
      peakAnalysis: {
        topPeakHours: topPeakHours,
        topPeakDays: topPeakDays,
        peakHour: peakHourEntries[0] ? { 
          hour: parseInt(peakHourEntries[0][0]), 
          transactions: peakHourEntries[0][1],
          revenue: hourlyRevenue[peakHourEntries[0][0]] || 0
        } : null,
        peakDay: peakDayByRevenue ? { 
          day: dayNames[parseInt(peakDayByRevenue[0])], 
          dayIndex: parseInt(peakDayByRevenue[0]),
          transactions: dailyData[parseInt(peakDayByRevenue[0])] || 0,
          revenue: peakDayByRevenue[1] || 0
        } : null,
        // Enhanced peak analysis data
        hourlyPattern: hourlyPattern,
        dailyPattern: dailyPattern,
        quietHours: quietHours,
        quietDays: quietDays,
        peakMetrics: {
          peakHourIntensity: peakHourIntensity.toFixed(1),
          peakDayIntensity: peakDayIntensity.toFixed(1),
          avgTransactionsPerHour: avgTransactionsPerHour.toFixed(1),
          avgTransactionsPerDay: avgTransactionsPerDay.toFixed(1)
        }
      },
      recency: {
        daysSinceLastPurchase: daysSinceLastPurchase,
        lastTransactionDate: lastTransactionDate ? lastTransactionDate.toISOString().split('T')[0] : null,
        customerRecency: customerRecencyData
      },
      warnings: totalCustomersWithPurchases === 0 
        ? ['No customer data available - using transaction frequency as proxy for repeat purchase rate']
        : []
    };
    
    res.json(engagementData);
  } catch (error) {
    console.error('Customer engagement error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;