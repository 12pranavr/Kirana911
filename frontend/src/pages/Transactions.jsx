import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Receipt, Calendar, DollarSign, ShoppingBag, Filter, Eye, Download } from 'lucide-react';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('all');
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    useEffect(() => {
        fetchTransactions();
    }, [filterType]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filterType !== 'all') {
                params.type = filterType;
            }

            const res = await api.get('/transactions', { params });
            setTransactions(res.data);
        } catch (error) {
            console.error("Error fetching transactions", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'sale': return 'bg-green-100 text-green-800 border-green-300';
            case 'expense': return 'bg-red-100 text-red-800 border-red-300';
            case 'income': return 'bg-blue-100 text-blue-800 border-blue-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    // Export to CSV function with product details
    const exportToCSV = () => {
        if (transactions.length === 0) return;

        // Define CSV header
        const header = [
            'Date', 
            'Type', 
            'Category', 
            'Amount', 
            'Items Count', 
            'Note',
            'Products Sold (Name:Qty:Price:Total)'
        ];
        
        // Map transactions to CSV rows
        const csvRows = transactions.map(transaction => {
            // Create a string of products sold with their details
            let productsSold = '';
            if (transaction.items && transaction.items.length > 0) {
                productsSold = transaction.items
                    .map(item => {
                        const productName = item.products?.name || 'Unknown Product';
                        const qty = item.qty_sold || 0;
                        const price = item.unit_price || 0;
                        const total = item.total_price || 0;
                        return `${productName}:${qty}:${price}:${total}`;
                    })
                    .join('; ');
            }

            return [
                `"${formatDate(transaction.date)}"`,
                `"${transaction.type}"`,
                `"${transaction.category}"`,
                `"${transaction.amount}"`,
                `"${transaction.items_count || 0}"`,
                `"${transaction.note || ''}"`,
                `"${productsSold}"`
            ];
        });

        // Combine header and rows
        const csvContent = [
            header.join(','),
            ...csvRows.map(row => row.join(','))
        ].join('\n');

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const totalRevenue = transactions
        .filter(t => t.type === 'sale')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Receipt className="w-8 h-8 text-purple-600" />
                    <h2 className="text-2xl font-bold text-gray-800">All Transactions</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={exportToCSV}
                        disabled={loading || transactions.length === 0}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="border rounded-md p-2 text-sm"
                    >
                        <option value="all">All Types</option>
                        <option value="sale">Sales Only</option>
                        <option value="expense">Expenses Only</option>
                        <option value="income">Income Only</option>
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card bg-green-50 border-2 border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-700 font-medium">Total Sales</p>
                            <p className="text-3xl font-bold text-green-900">₹{totalRevenue.toFixed(2)}</p>
                        </div>
                        <ShoppingBag className="w-12 h-12 text-green-500 opacity-50" />
                    </div>
                </div>

                <div className="card bg-red-50 border-2 border-red-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-700 font-medium">Total Expenses</p>
                            <p className="text-3xl font-bold text-red-900">₹{totalExpenses.toFixed(2)}</p>
                        </div>
                        <DollarSign className="w-12 h-12 text-red-500 opacity-50" />
                    </div>
                </div>

                <div className="card bg-blue-50 border-2 border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-700 font-medium">Total Transactions</p>
                            <p className="text-3xl font-bold text-blue-900">{transactions.length}</p>
                        </div>
                        <Receipt className="w-12 h-12 text-blue-500 opacity-50" />
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">Transaction History</h3>

                {loading ? (
                    <div className="text-center py-8 text-gray-400">Loading transactions...</div>
                ) : transactions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {transactions.map((transaction) => (
                                    <tr key={transaction.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-gray-900">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                {formatDate(transaction.date)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getTypeColor(transaction.type)}`}>
                                                {transaction.type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {transaction.category}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-sm font-bold ${transaction.type === 'sale' || transaction.type === 'income'
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                                }`}>
                                                {transaction.type === 'sale' || transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {transaction.items_count > 0 ? (
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                                    {transaction.items_count} items
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                            {transaction.note || '-'}
                                            {transaction.items?.[0]?.customers?.name && (
                                                <div className="text-xs text-blue-600 font-semibold mt-1">
                                                    Customer: {transaction.items[0].customers.name}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => setSelectedTransaction(transaction)}
                                                className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-sm font-medium"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        <Receipt className="w-16 h-16 mx-auto opacity-50 mb-4" />
                        <p className="text-lg font-medium">No transactions yet</p>
                        <p className="text-sm mt-2">Start making sales to see transaction history</p>
                    </div>
                )}
            </div>

            {/* Transaction Detail Modal */}
            {selectedTransaction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedTransaction(null)}>
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4 text-gray-800">Transaction Details</h3>

                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Transaction ID</p>
                                    <p className="font-mono text-sm font-semibold">{selectedTransaction.id.substring(0, 8)}...</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Date & Time</p>
                                    <p className="font-semibold">{formatDate(selectedTransaction.date)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Type</p>
                                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getTypeColor(selectedTransaction.type)}`}>
                                        {selectedTransaction.type.toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Amount</p>
                                    <p className="text-lg font-bold text-green-600">₹{selectedTransaction.amount.toFixed(2)}</p>
                                </div>
                            </div>

                            {selectedTransaction.items && selectedTransaction.items.length > 0 && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Items Sold</p>
                                    <div className="bg-gray-50 rounded-md p-3 space-y-2">
                                        {selectedTransaction.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm">
                                                <span className="font-medium">{item.products?.name || 'Unknown Product'}</span>
                                                <span className="text-gray-600">{item.qty_sold}x ₹{item.unit_price} = ₹{item.total_price}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedTransaction.note && (
                                <div>
                                    <p className="text-sm text-gray-500">Note</p>
                                    <p className="text-sm bg-gray-50 p-2 rounded">{selectedTransaction.note}</p>
                                    {selectedTransaction.items?.[0]?.customers?.name && (
                                        <p className="text-sm text-blue-600 mt-1 font-semibold">
                                            Customer: {selectedTransaction.items[0].customers.name}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setSelectedTransaction(null)}
                            className="mt-6 w-full btn btn-secondary"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Transactions;