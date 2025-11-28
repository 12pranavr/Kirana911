import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { DollarSign, TrendingUp, TrendingDown, PieChart as PieIcon, Calendar, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#10B981', '#EF4444', '#3B82F6', '#F59E0B'];

const Finance = () => {
    const [pnl, setPnl] = useState(null);
    const [budgetStatus, setBudgetStatus] = useState(null);
    const [budgetLimit, setBudgetLimit] = useState('');
    const [loading, setLoading] = useState(true);
    const [monthlyData, setMonthlyData] = useState([]);

    // Date filter state
    const [dateFilter, setDateFilter] = useState('current_month');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    // Transaction form state
    const [transactionType, setTransactionType] = useState('expense');
    const [transactionCategory, setTransactionCategory] = useState('');
    const [transactionAmount, setTransactionAmount] = useState('');
    const [transactionNote, setTransactionNote] = useState('');
    const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
    const [submitting, setSubmitting] = useState(false);

    // Category options
    const expenseCategories = ['Rent', 'Utilities', 'Supplies', 'Salaries', 'Marketing', 'Transportation', 'Maintenance', 'Other'];
    const incomeCategories = ['Services', 'Interest', 'Commission', 'Rental Income', 'Other'];

    useEffect(() => {
        fetchData();
    }, [dateFilter, customStartDate, customEndDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Build query parameters based on date filter
            let queryParams = {};
            
            if (dateFilter === 'current_month') {
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
                queryParams = { start_date: startOfMonth, end_date: endOfMonth };
            } else if (dateFilter === 'last_year') {
                const now = new Date();
                const startOfYear = new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
                const endOfYear = new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
                queryParams = { start_date: startOfYear, end_date: endOfYear };
            } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
                queryParams = { start_date: customStartDate, end_date: customEndDate };
            }

            const [pnlRes, budgetRes, transRes] = await Promise.all([
                api.get('/finance/pnl', { params: queryParams }),
                api.get('/finance/budget_status'),
                api.get('/transactions', { params: queryParams })
            ]);

            setPnl(pnlRes.data);
            setBudgetStatus(budgetRes.data);
            setBudgetLimit(budgetRes.data.budget_limit);

            // Process transactions for monthly chart
            const transactions = transRes.data;
            
            // For the chart, we'll show daily data for the selected period
            let chartData = [];
            
            if (dateFilter === 'current_month') {
                // Get daily data for current month
                const now = new Date();
                const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                
                chartData = Array.from({ length: daysInMonth }, (_, i) => {
                    const date = new Date(startOfMonth);
                    date.setDate(startOfMonth.getDate() + i);
                    // Use local date string instead of UTC
                    const dateStr = date.getFullYear() + '-' + 
                                   String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                                   String(date.getDate()).padStart(2, '0');
                    return { date: dateStr, displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
                });
            } else if (dateFilter === 'last_year') {
                // Show monthly data for last year
                const now = new Date();
                chartData = Array.from({ length: 12 }, (_, i) => {
                    const date = new Date(now.getFullYear() - 1, i, 1);
                    // Use local date string instead of UTC
                    const dateStr = date.getFullYear() + '-' + 
                                   String(date.getMonth() + 1).padStart(2, '0');
                    return { 
                        date: dateStr, 
                        displayDate: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) 
                    };
                });
            } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
                // For custom range, show daily data
                const start = new Date(customStartDate);
                const end = new Date(customEndDate);
                const timeDiff = end.getTime() - start.getTime();
                const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
                
                chartData = Array.from({ length: Math.min(daysDiff, 31) }, (_, i) => {
                    const date = new Date(start);
                    date.setDate(start.getDate() + i);
                    // Use local date string instead of UTC
                    const dateStr = date.getFullYear() + '-' + 
                                   String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                                   String(date.getDate()).padStart(2, '0');
                    return { date: dateStr, displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
                });
            } else {
                // Overall - show last 30 days
                const now = new Date();
                chartData = Array.from({ length: 30 }, (_, i) => {
                    const date = new Date(now);
                    date.setDate(now.getDate() - (29 - i));
                    // Use local date string instead of UTC
                    const dateStr = date.getFullYear() + '-' + 
                                   String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                                   String(date.getDate()).padStart(2, '0');
                    return { date: dateStr, displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
                });
            }

            // Process transactions for chart data
            const processedData = chartData.map(day => {
                const dayTransactions = transactions.filter(t => {
                    // Extract date part from transaction date (YYYY-MM-DD)
                    // Handle timezone properly by creating date objects
                    const transactionDate = new Date(t.date);
                    const transactionDateString = transactionDate.toISOString().split('T')[0];
                    
                    if (dateFilter === 'last_year' && day.date.length === 7) {
                        // For monthly data, match year-month
                        return transactionDateString.startsWith(day.date);
                    } else {
                        // For daily data, match full date
                        return transactionDateString === day.date;
                    }
                });
                
                const revenue = dayTransactions
                    .filter(t => t.type === 'sale' || t.type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0);
                    
                const expenses = dayTransactions
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0);

                return {
                    date: day.displayDate,
                    revenue: parseFloat(revenue.toFixed(2)),
                    expenses: parseFloat(expenses.toFixed(2)),
                    profit: parseFloat((revenue - expenses).toFixed(2))
                };
            });

            setMonthlyData(processedData);
        } catch (error) {
            console.error("Error fetching finance data", error);
        } finally {
            setLoading(false);
        }
    };

    const getLastNMonths = (n) => {
        const months = [];
        const now = new Date();
        for (let i = n - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push(d.toISOString().slice(0, 7));
        }
        return months;
    };

    const handleUpdateBudget = async () => {
        try {
            const month = new Date().toISOString().slice(0, 7);
            await api.post('/finance/budget', { month, expense_limit: parseFloat(budgetLimit) });
            fetchData();
            alert('✅ Budget updated successfully!');
        } catch (error) {
            alert('❌ Failed to update budget');
        }
    };

    const handleAddTransaction = async (e) => {
        e.preventDefault();

        // Validation
        if (!transactionCategory || !transactionAmount) {
            alert('❌ Please fill in category and amount');
            return;
        }

        if (parseFloat(transactionAmount) <= 0) {
            alert('❌ Amount must be greater than 0');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/transactions/add', {
                type: transactionType,
                category: transactionCategory,
                amount: parseFloat(transactionAmount),
                note: transactionNote,
                date: transactionDate
            });

            alert(`✅ ${transactionType === 'expense' ? 'Expense' : 'Income'} added successfully!`);

            // Reset form
            setTransactionCategory('');
            setTransactionAmount('');
            setTransactionNote('');
            setTransactionDate(new Date().toISOString().split('T')[0]);

            // Refresh data
            fetchData();
        } catch (error) {
            console.error('Error adding transaction:', error);
            alert('❌ Failed to add transaction: ' + (error.response?.data?.error || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    const financialData = pnl ? [
        { name: 'Revenue', value: pnl.revenue, color: COLORS[0] },
        { name: 'Expenses', value: pnl.expenses, color: COLORS[1] },
    ] : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-green-600" />
                    <h2 className="text-2xl font-bold text-gray-800">Finance & Budget Management</h2>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Loading financial data...</p>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="card bg-green-50 border-2 border-green-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-green-700 font-medium">Total Revenue</p>
                                    <p className="text-3xl font-bold text-green-900">₹{pnl?.revenue.toFixed(2) || 0}</p>
                                </div>
                                <TrendingUp className="w-12 h-12 text-green-500 opacity-50" />
                            </div>
                        </div>

                        <div className="card bg-red-50 border-2 border-red-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-red-700 font-medium">Total Expenses</p>
                                    <p className="text-3xl font-bold text-red-900">₹{pnl?.expenses.toFixed(2) || 0}</p>
                                </div>
                                <TrendingDown className="w-12 h-12 text-red-500 opacity-50" />
                            </div>
                        </div>

                        <div className={`card border-2 ${pnl?.net_profit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-sm font-medium ${pnl?.net_profit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Net Profit</p>
                                    <p className={`text-3xl font-bold ${pnl?.net_profit >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                                        ₹{pnl?.net_profit.toFixed(2) || 0}
                                    </p>
                                </div>
                                <DollarSign className={`w-12 h-12 opacity-50 ${pnl?.net_profit >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
                            </div>
                        </div>
                    </div>

                    {/* Online vs Offline Orders Comparison */}
                    <div className="card bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200">
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
                            <PieIcon className="w-5 h-5" />
                            Online vs Offline Orders Comparison
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-4 rounded-lg shadow">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-gray-700">Online Orders</h4>
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                </div>
                                <p className="text-2xl font-bold text-green-600">₹{(pnl?.online_revenue || 0).toFixed(2)}</p>
                                <p className="text-sm text-gray-500">{pnl?.online_orders || 0} orders</p>
                            </div>
                            
                            <div className="bg-white p-4 rounded-lg shadow">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-gray-700">Offline Orders</h4>
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                </div>
                                <p className="text-2xl font-bold text-blue-600">₹{(pnl?.offline_revenue || 0).toFixed(2)}</p>
                                <p className="text-sm text-gray-500">{pnl?.offline_orders || 0} orders</p>
                            </div>
                            
                            <div className="bg-white p-4 rounded-lg shadow">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-gray-700">Total Orders</h4>
                                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                </div>
                                <p className="text-2xl font-bold text-purple-600">₹{(pnl?.revenue || 0).toFixed(2)}</p>
                                <p className="text-sm text-gray-500">{(pnl?.online_orders || 0) + (pnl?.offline_orders || 0)} orders</p>
                            </div>
                        </div>
                        
                        {/* Chart for comparison */}
                        {pnl && (
                            <div className="mt-6 h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={[
                                            { name: 'Online', revenue: pnl.online_revenue || 0, orders: pnl.online_orders || 0 },
                                            { name: 'Offline', revenue: pnl.offline_revenue || 0, orders: pnl.offline_orders || 0 }
                                        ]}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                        <Tooltip 
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-white p-4 border border-gray-200 rounded shadow">
                                                            <p className="font-bold">{label}</p>
                                                            {payload.map((entry, index) => (
                                                                <p key={index} style={{ color: entry.color }}>
                                                                    {entry.dataKey === 'revenue' 
                                                                        ? `Revenue: ₹${entry.value.toFixed(2)}` 
                                                                        : `Orders: ${entry.value}`}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="revenue" name="Revenue (₹)" fill="#10B981" />
                                        <Bar yAxisId="right" dataKey="orders" name="Orders (#)" fill="#3B82F6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Date Filter */}
                    <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-600" />
                                <label className="text-sm font-semibold text-gray-700">Filter Period:</label>
                            </div>
                            <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="border-2 border-blue-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                            >
                                <option value="overall">📊 Overall</option>
                                <option value="last_year">📅 Last Year</option>
                                <option value="current_month">📆 Current Month</option>
                                <option value="custom">🔧 Custom Date Range</option>
                            </select>

                            {dateFilter === 'custom' && (
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="date"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        className="border-2 border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Start Date"
                                    />
                                    <span className="text-gray-600 font-medium">to</span>
                                    <input
                                        type="date"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        className="border-2 border-blue-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="End Date"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Monthly Trend */}
                        <div className="card">
                            <h3 className="text-lg font-semibold mb-4 text-gray-700">📊 Financial Trend ({dateFilter === 'current_month' ? 'Current Month' : dateFilter === 'last_year' ? 'Last Year' : dateFilter === 'custom' ? 'Custom Range' : 'Last 30 Days'})</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#6B7280"
                                        style={{ fontSize: '12px' }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '1px solid #E5E7EB',
                                            borderRadius: '8px'
                                        }}
                                        formatter={(value) => [`₹${value.toFixed(2)}`, '']}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} name="Revenue" />
                                    <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} name="Expenses" />
                                    <Line type="monotone" dataKey="profit" stroke="#3B82F6" strokeWidth={2} name="Profit" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Revenue vs Expenses Pie Chart */}
                        <div className="card">
                            <h3 className="text-lg font-semibold mb-4 text-gray-700">🥧 Revenue vs Expenses</h3>
                            {financialData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={financialData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value }) => `${name}: ₹${value.toFixed(2)}`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {financialData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-gray-400">
                                    No financial data available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Transaction Entry Form */}
                    <div className="card bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
                            💰 Add Transaction
                        </h3>
                        <form onSubmit={handleAddTransaction} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Transaction Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Transaction Type <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTransactionType('expense');
                                                setTransactionCategory('');
                                            }}
                                            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${transactionType === 'expense'
                                                ? 'bg-red-500 text-white'
                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            💸 Expense
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTransactionType('income');
                                                setTransactionCategory('');
                                            }}
                                            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${transactionType === 'income'
                                                ? 'bg-green-500 text-white'
                                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            💵 Income
                                        </button>
                                    </div>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={transactionCategory}
                                        onChange={(e) => setTransactionCategory(e.target.value)}
                                        className="w-full border-2 border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {(transactionType === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Amount */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Amount (₹) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={transactionAmount}
                                        onChange={(e) => setTransactionAmount(e.target.value)}
                                        className="w-full border-2 border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0.01"
                                        required
                                    />
                                </div>

                                {/* Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        value={transactionDate}
                                        onChange={(e) => setTransactionDate(e.target.value)}
                                        className="w-full border-2 border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Note */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Note (Optional)
                                </label>
                                <textarea
                                    value={transactionNote}
                                    onChange={(e) => setTransactionNote(e.target.value)}
                                    className="w-full border-2 border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Add any additional details..."
                                    rows="2"
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={submitting}
                                className={`w-full py-3 rounded-md font-semibold text-white transition-colors ${submitting
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : transactionType === 'expense'
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-green-600 hover:bg-green-700'
                                    }`}
                            >
                                {submitting ? 'Adding...' : `Add ${transactionType === 'expense' ? 'Expense' : 'Income'}`}
                            </button>
                        </form>
                    </div>

                    {/* Budget Management */}
                    <div className="card">
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Monthly Budget Management
                        </h3>
                        {budgetStatus ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700">Current Month</span>
                                    <span className="font-mono bg-gray-100 px-3 py-1 rounded font-semibold">
                                        {new Date(budgetStatus.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </span>
                                </div>

                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-600">Spent: <span className="font-bold text-red-600">₹{budgetStatus.actual_expenses.toFixed(2)}</span></span>
                                        <span className="text-gray-600">Budget Limit: <span className="font-bold text-blue-600">₹{budgetStatus.budget_limit.toFixed(2)}</span></span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-4">
                                        <div
                                            className={`h-4 rounded-full transition-all ${budgetStatus.is_over_budget
                                                ? 'bg-gradient-to-r from-red-500 to-red-600'
                                                : budgetStatus.actual_expenses / budgetStatus.budget_limit > 0.8
                                                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                                    : 'bg-gradient-to-r from-green-500 to-green-600'
                                                }`}
                                            style={{ width: `${Math.min((budgetStatus.actual_expenses / (budgetStatus.budget_limit || 1)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-xs mt-1 text-gray-500">
                                        <span>0%</span>
                                        <span>{((budgetStatus.actual_expenses / (budgetStatus.budget_limit || 1)) * 100).toFixed(1)}%</span>
                                        <span>100%</span>
                                    </div>
                                    {budgetStatus.is_over_budget && (
                                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-semibold text-red-800">⚠️ Budget Exceeded!</p>
                                                <p className="text-xs text-red-600 mt-1">
                                                    You've exceeded your monthly budget by ₹{(budgetStatus.actual_expenses - budgetStatus.budget_limit).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <input
                                        type="number"
                                        value={budgetLimit}
                                        onChange={(e) => setBudgetLimit(e.target.value)}
                                        className="border-2 border-gray-300 rounded-md px-4 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Set Monthly Budget Limit"
                                    />
                                    <button
                                        onClick={handleUpdateBudget}
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition-colors"
                                    >
                                        Update Budget
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-400">No budget data available</p>
                        )}
                    </div>

                    {/* Profit & Loss Statement */}
                    <div className="card">
                        <h3 className="text-lg font-semibold mb-4 text-gray-700">📋 Detailed P&L Statement</h3>
                        {pnl && (
                            <div className="space-y-2">
                                <div className="flex justify-between p-3 bg-green-50 rounded-md">
                                    <span className="font-medium text-gray-700">Total Revenue (Sales)</span>
                                    <span className="font-bold text-green-600">+ ₹{pnl.revenue.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between p-3 bg-red-50 rounded-md">
                                    <span className="font-medium text-gray-700">Total Expenses</span>
                                    <span className="font-bold text-red-600">- ₹{pnl.expenses.toFixed(2)}</span>
                                </div>
                                <div className="h-px bg-gray-300 my-2"></div>
                                <div className={`flex justify-between p-4 rounded-md ${pnl.net_profit >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                                    <span className="font-bold text-lg text-gray-800">Net Profit/Loss</span>
                                    <span className={`font-bold text-xl ${pnl.net_profit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                                        {pnl.net_profit >= 0 ? '+' : ''} ₹{pnl.net_profit.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default Finance;
