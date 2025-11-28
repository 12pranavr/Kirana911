import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, ShoppingBag, Users, Clock, AlertTriangle, Info, Calculator } from 'lucide-react';

const CustomerEngagement = () => {
  const [engagementData, setEngagementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showDetailedCalculation, setShowDetailedCalculation] = useState(false);

  useEffect(() => {
    fetchEngagementData();
  }, []);

  const fetchEngagementData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customer-engagement/engagement');
      setEngagementData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">Analyzing customer engagement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!engagementData) {
    return <div>No data available</div>;
  }

  const { summary, trends, productAffinity, peakAnalysis, recency } = engagementData;

  // Format data for charts
  const dabChartData = trends.dailyActiveBuyers.map(item => ({
    date: item.date,
    value: parseFloat(item.value)
  }));

  const basketTrendData = trends.basketTrends.map(item => ({
    week: item.week,
    basketSize: item.avgBasketSize,
    basketValue: item.avgBasketValue
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-800">Customer Engagement Analytics</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHowItWorks(true)}
            className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-md text-sm font-medium"
          >
            <Info className="w-4 h-4" />
            How it Works
          </button>
          <button
            onClick={() => setShowDetailedCalculation(true)}
            className="flex items-center gap-2 bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-md text-sm font-medium"
          >
            <Calculator className="w-4 h-4" />
            Detailed Calculation
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-blue-50 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Daily Visit Frequency</p>
              <p className="text-2xl font-bold text-blue-900">{summary.dailyVisitFrequency}</p>
              <p className="text-xs text-blue-600">transactions/day</p>
            </div>
            <Calendar className="w-10 h-10 text-blue-500 opacity-50" />
          </div>
        </div>

        <div className="card bg-green-50 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Avg Basket Size</p>
              <p className="text-2xl font-bold text-green-900">{summary.avgBasketSize}</p>
              <p className="text-xs text-green-600">items/bill</p>
            </div>
            <ShoppingBag className="w-10 h-10 text-green-500 opacity-50" />
          </div>
        </div>

        <div className="card bg-purple-50 border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Avg Basket Value</p>
              <p className="text-2xl font-bold text-purple-900">₹{summary.avgBasketValue}</p>
              <p className="text-xs text-purple-600">per transaction</p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-500 opacity-50" />
          </div>
        </div>

        <div className="card bg-orange-50 border-2 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">Weekly Trend</p>
              <p className="text-2xl font-bold text-orange-900">
                {summary.weeklyTrend.change > 0 ? '+' : ''}{summary.weeklyTrend.change}%
              </p>
              <p className="text-xs text-orange-600">
                {summary.weeklyTrend.change > 0 ? 'Increasing' : 'Decreasing'}
              </p>
            </div>
            <Clock className="w-10 h-10 text-orange-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Active Buyers */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Daily Active Buyers (7-day MA)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dabChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Basket Trends */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Basket Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={basketTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="basketSize" fill="#8884d8" name="Avg Items" />
                <Bar yAxisId="right" dataKey="basketValue" fill="#82ca9d" name="Avg Value (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Affinity */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Top Product Combinations</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productAffinity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="products" type="category" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="frequency" fill="#ffc658" name="Frequency" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Analysis - Enhanced */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Peak Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Peak Hours */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3">Top Peak Hours</h4>
              <div className="space-y-2">
                {peakAnalysis.topPeakHours && peakAnalysis.topPeakHours.map((hourData, index) => {
                  // Convert 24-hour format to 12-hour format with AM/PM
                  const hour12 = hourData.hour === 0 ? 12 : hourData.hour > 12 ? hourData.hour - 12 : hourData.hour;
                  const period = hourData.hour < 12 ? 'AM' : 'PM';
                  const nextHour12 = (hourData.hour + 1) === 0 ? 12 : (hourData.hour + 1) > 12 ? (hourData.hour + 1) - 12 : (hourData.hour + 1);
                  const nextPeriod = (hourData.hour + 1) < 12 ? 'AM' : 'PM';
                  
                  return (
                    <div key={hourData.hour} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700">
                          {hour12}{period} - {nextHour12}{nextPeriod}
                        </span>
                        {index === 0 && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Peak</span>}
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">{hourData.transactions}</div>
                        <div className="text-xs text-gray-500">₹{hourData.revenue.toFixed(0)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Peak Days */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3">Top Peak Days</h4>
              <div className="space-y-2">
                {peakAnalysis.topPeakDays && peakAnalysis.topPeakDays.map((dayData, index) => (
                  <div key={dayData.dayIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-700">{dayData.day}</span>
                      {index === 0 && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Peak</span>}
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{dayData.transactions}</div>
                      <div className="text-xs text-gray-500">₹{dayData.revenue.toFixed(0)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Summary of Peak Analysis */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-sm text-blue-700 font-medium">Busiest Hour</div>
                {peakAnalysis.peakHour ? (
                  <div className="font-bold text-blue-900">
                    {peakAnalysis.peakHour.hour}:00 ({peakAnalysis.peakHour.transactions} transactions)
                  </div>
                ) : (
                  <div className="text-gray-500">No data</div>
                )}
                {peakAnalysis.peakMetrics && (
                  <div className="text-xs text-blue-600 mt-1">
                    {peakAnalysis.peakMetrics.peakHourIntensity > 0 ? '+' : ''}{peakAnalysis.peakMetrics.peakHourIntensity}% above average
                  </div>
                )}
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-sm text-green-700 font-medium">Busiest Day</div>
                {peakAnalysis.peakDay ? (
                  <div className="font-bold text-green-900">
                    {peakAnalysis.peakDay.day} ({peakAnalysis.peakDay.transactions} transactions)
                  </div>
                ) : (
                  <div className="text-gray-500">No data</div>
                )}
                {peakAnalysis.peakMetrics && (
                  <div className="text-xs text-green-600 mt-1">
                    {peakAnalysis.peakMetrics.peakDayIntensity > 0 ? '+' : ''}{peakAnalysis.peakMetrics.peakDayIntensity}% above average
                  </div>
                )}
              </div>
            </div>
            
            {/* Quiet Hours and Days */}
            {peakAnalysis.quietHours && peakAnalysis.quietHours.length > 0 && (
              <div className="mt-3 p-3 bg-yellow-50 rounded">
                <div className="text-sm text-yellow-700 font-medium">Quiet Hours</div>
                <div className="text-xs text-yellow-600">
                  No transactions during: {peakAnalysis.quietHours.join(', ')}:00
                </div>
              </div>
            )}
            
            {peakAnalysis.quietDays && peakAnalysis.quietDays.length > 0 && (
              <div className="mt-3 p-3 bg-yellow-50 rounded">
                <div className="text-sm text-yellow-700 font-medium">Quiet Days</div>
                <div className="text-xs text-yellow-600">
                  No transactions on: {peakAnalysis.quietDays.join(', ')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Key Insights</h3>
        <div className="space-y-3">
          <div className="flex items-start">
            <TrendingUp className="w-5 h-5 text-green-500 mt-0.5 mr-2" />
            <p className="text-sm text-gray-700">
              <span className="font-medium">Visit Frequency:</span> Customers visit approximately {summary.dailyVisitFrequency} times per day
            </p>
          </div>
          <div className="flex items-start">
            <ShoppingBag className="w-5 h-5 text-blue-500 mt-0.5 mr-2" />
            <p className="text-sm text-gray-700">
              <span className="font-medium">Basket Metrics:</span> Average basket contains {summary.avgBasketSize} items worth ₹{summary.avgBasketValue}
            </p>
          </div>
          <div className="flex items-start">
            <Clock className="w-5 h-5 text-purple-500 mt-0.5 mr-2" />
            <p className="text-sm text-gray-700">
              <span className="font-medium">Recency:</span> Last transaction was {recency.daysSinceLastPurchase} days ago
            </p>
          </div>
          <div className="flex items-start">
            <Users className="w-5 h-5 text-orange-500 mt-0.5 mr-2" />
            <p className="text-sm text-gray-700">
              <span className="font-medium">Repeat Customers:</span> {summary.repeatPurchaseRate} of customers make repeat purchases
            </p>
          </div>
        </div>
      </div>

      {/* How it Works Modal */}
      {showHowItWorks && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">How Customer Engagement Analysis Works</h3>
              <button 
                onClick={() => setShowHowItWorks(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700">Data Sources</h4>
                <p className="text-sm text-gray-600 mt-1">
                  This analysis uses your sales transaction data from the past 30 days, including transaction dates, 
                  product information, quantities, and customer identifiers where available.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700">Key Metrics</h4>
                <ul className="text-sm text-gray-600 mt-1 list-disc list-inside space-y-1">
                  <li><span className="font-medium">Visit Frequency:</span> Average number of transactions per day</li>
                  <li><span className="font-medium">Repeat Purchase Rate:</span> Percentage of customers who make multiple purchases</li>
                  <li><span className="font-medium">Basket Size:</span> Average number of items per transaction</li>
                  <li><span className="font-medium">Basket Value:</span> Average monetary value per transaction</li>
                  <li><span className="font-medium">Product Affinity:</span> Items frequently purchased together</li>
                  <li><span className="font-medium">Peak Analysis:</span> Busiest hours and days for your store</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700">Benefits</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Understanding these metrics helps you optimize inventory, plan promotions, improve customer retention, 
                  and make data-driven decisions to grow your business.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Calculation Modal */}
      {showDetailedCalculation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Detailed Calculation Methods</h3>
              <button 
                onClick={() => setShowDetailedCalculation(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700">Visit Frequency Calculation</h4>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Formula:</span> Total transactions in the last 7 days ÷ 7 days
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Current Value:</span> {summary.dailyVisitFrequency} transactions per day
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700">Repeat Purchase Rate</h4>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Formula:</span> (Customers with 2+ purchases ÷ Total customers with purchases) × 100
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Current Value:</span> {summary.repeatPurchaseRate}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700">Basket Size & Value</h4>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Basket Size Formula:</span> Total items sold ÷ Total transactions
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Basket Value Formula:</span> Total revenue ÷ Total transactions
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Current Values:</span> {summary.avgBasketSize} items, ₹{summary.avgBasketValue} value
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700">Product Affinity Analysis</h4>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Method:</span> Co-occurrence analysis of products within the same transaction
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Top Combination:</span> {productAffinity[0]?.products} (Frequency: {productAffinity[0]?.frequency})
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700">Peak Analysis</h4>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Peak Hour:</span> Hour with the highest transaction count ({peakAnalysis.peakHour ? (() => {
                    const hour12 = peakAnalysis.peakHour.hour === 0 ? 12 : peakAnalysis.peakHour.hour > 12 ? peakAnalysis.peakHour.hour - 12 : peakAnalysis.peakHour.hour;
                    const period = peakAnalysis.peakHour.hour < 12 ? 'AM' : 'PM';
                    return `${hour12}${period}`;
                  })() : 'N/A'} with {peakAnalysis.peakHour?.transactions} transactions)
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Peak Day:</span> Day with the highest transaction count ({peakAnalysis.peakDay?.day} with {peakAnalysis.peakDay?.transactions} transactions)
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Revenue Analysis:</span> Peak hour generates ₹{peakAnalysis.peakHour?.revenue?.toFixed(0)} in revenue
                </p>
                {peakAnalysis.peakMetrics && (
                  <>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Peak Intensity:</span> Busiest hour is {peakAnalysis.peakMetrics.peakHourIntensity}% above average
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Average Transactions:</span> {peakAnalysis.peakMetrics.avgTransactionsPerHour} per hour, {peakAnalysis.peakMetrics.avgTransactionsPerDay} per day
                    </p>
                  </>
                )}
                {peakAnalysis.quietHours && peakAnalysis.quietHours.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Quiet Hours:</span> No transactions during {peakAnalysis.quietHours.map(hour => {
                      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                      const period = hour < 12 ? 'AM' : 'PM';
                      return `${hour12}${period}`;
                    }).join(', ')}
                  </p>
                )}
                {peakAnalysis.quietDays && peakAnalysis.quietDays.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Quiet Days:</span> No transactions on {peakAnalysis.quietDays.join(', ')}
                  </p>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-gray-700">Recency Analysis</h4>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Formula:</span> Days since the most recent transaction
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Current Value:</span> {recency.daysSinceLastPurchase} days since last transaction
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerEngagement;