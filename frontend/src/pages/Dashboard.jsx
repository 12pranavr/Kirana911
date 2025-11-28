import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { TrendingUp, AlertTriangle, DollarSign, ShoppingCart, Users, Package } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="card flex items-center justify-between">
        <div>
            <p className="text-gray-500 text-sm">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        revenue: 0,
        profit: 0,
        lowStockCount: 0,
        todaySales: 0
    });
    const [analytics, setAnalytics] = useState({
        totalProducts: 0,
        totalCustomers: 0,
        avgOrderValue: 0,
        categoryDistribution: [],
        topProducts: []
    });
    const [salesTrend, setSalesTrend] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
        fetchSalesTrend();
        fetchAnalytics();
    }, []);

    const fetchStats = async () => {
        try {
            const [pnlRes, productsRes] = await Promise.all([
                api.get('/finance/pnl'),
                api.get('/inventory/products')
            ]);

            const lowStock = productsRes.data.filter(p => p.stock_levels[0]?.current_stock < p.reorder_point).length;

            setStats({
                revenue: pnlRes.data.revenue,
                profit: pnlRes.data.net_profit,
                lowStockCount: lowStock,
                todaySales: 0
            });
        } catch (error) {
            console.error("Failed to fetch dashboard stats", error);
        }
    };

    const fetchSalesTrend = async () => {
        try {
            const res = await api.get('/sales/trend?days=14');
            setSalesTrend(res.data);
        } catch (error) {
            console.error("Failed to fetch sales trend", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const res = await api.get('/analytics/analytics');
            setAnalytics(res.data);
        } catch (error) {
            console.error("Failed to fetch analytics", error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={`₹${stats.revenue.toLocaleString()}`}
                    icon={DollarSign}
                    color="bg-green-500"
                />
                <StatCard
                    title="Net Profit"
                    value={`₹${stats.profit.toLocaleString()}`}
                    icon={TrendingUp}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Low Stock Items"
                    value={stats.lowStockCount}
                    icon={AlertTriangle}
                    color="bg-red-500"
                />
                <StatCard
                    title="Total Products"
                    value={analytics.totalProducts}
                    icon={Package}
                    color="bg-purple-500"
                />
            </div>

            {/* Sales Trend Chart */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">📈 Sales Trend (Last 14 Days)</h3>
                {loading ? (
                    <div className="h-64 flex items-center justify-center text-gray-400">
                        Loading chart...
                    </div>
                ) : salesTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={salesTrend}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis
                                dataKey="date"
                                stroke="#6B7280"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis
                                stroke="#6B7280"
                                style={{ fontSize: '12px' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                }}
                                formatter={(value, name) => {
                                    if (name === 'revenue') return [`₹${value.toFixed(2)}`, 'Revenue'];
                                    return [value, 'Quantity'];
                                }}
                            />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#4F46E5"
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                                name="Revenue"
                            />
                            <Line
                                type="monotone"
                                dataKey="quantity"
                                stroke="#10B981"
                                strokeWidth={2}
                                name="Quantity Sold"
                                dot={{ fill: '#10B981', r: 4 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-64 flex items-center justify-center text-gray-400">
                        No sales data available yet. Start selling to see the trend!
                    </div>
                )}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Distribution Pie Chart */}
                <div className="card">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">🥧 Product Categories</h3>
                    {analytics.categoryDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={analytics.categoryDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {analytics.categoryDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-400">
                            No category data available
                        </div>
                    )}
                </div>

                {/* Top Products Bar Chart */}
                <div className="card">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">🏆 Top Selling Products</h3>
                    {analytics.topProducts.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analytics.topProducts}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px' }} />
                                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar dataKey="quantity" fill="#4F46E5" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-400">
                            No sales data available
                        </div>
                    )}
                </div>
            </div>

            {/* Additional Info Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">📊 Quick Insights</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-md">
                            <span className="text-sm text-gray-700">Total Products</span>
                            <span className="font-bold text-blue-600">{analytics.totalProducts}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-md">
                            <span className="text-sm text-gray-700">Total Customers</span>
                            <span className="font-bold text-green-600">{analytics.totalCustomers}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-orange-50 rounded-md">
                            <span className="text-sm text-gray-700">Avg Order Value</span>
                            <span className="font-bold text-orange-600">₹{analytics.avgOrderValue.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">💡 Quick Actions</h3>
                    <div className="space-y-2">
                        <a href="/inventory" className="block p-3 bg-indigo-50 hover:bg-indigo-100 rounded-md text-indigo-700 font-medium transition-colors">
                            → Add New Product
                        </a>
                        <a href="/customers" className="block p-3 bg-green-50 hover:bg-green-100 rounded-md text-green-700 font-medium transition-colors">
                            → Add New Customer
                        </a>
                        <a href="/finance" className="block p-3 bg-blue-50 hover:bg-blue-100 rounded-md text-blue-700 font-medium transition-colors">
                            → View Finance Reports
                        </a>
                        <a href="/forecast" className="block p-3 bg-purple-50 hover:bg-purple-100 rounded-md text-purple-700 font-medium transition-colors">
                            → View Demand Forecast
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
