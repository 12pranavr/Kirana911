import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { User, Phone, Mail, MapPin, Trash2, Edit, X, TrendingUp, Clock, AlertTriangle, DollarSign, ShoppingBag } from 'lucide-react';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    // Form states
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', role: 'Customer' });
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await api.get('/customers');
            setCustomers(res.data);
        } catch (error) {
            console.error("Error fetching customers", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomerAnalytics = async (id) => {
        setLoadingAnalytics(true);
        try {
            const [analyticsRes, recommendationsRes] = await Promise.all([
                api.get(`/customers/${id}/analytics`),
                api.get(`/customers/${id}/recommendations`)
            ]);
            setAnalyticsData({
                ...analyticsRes.data,
                recommendations: recommendationsRes.data
            });
        } catch (error) {
            console.error("Error fetching analytics", error);
            alert("Failed to load customer insights.");
        } finally {
            setLoadingAnalytics(false);
        }
    };

    const handleCustomerClick = (customer) => {
        setSelectedCustomer(customer);
        fetchCustomerAnalytics(customer.id);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.post('/customers/update', formData);
                alert('Customer updated successfully');
            } else {
                await api.post('/customers/add', formData);
                alert('Customer added successfully');
            }
            setShowForm(false);
            setFormData({ name: '', email: '', phone: '', address: '', role: 'Customer' });
            setIsEditing(false);
            fetchCustomers();
        } catch (error) {
            alert('Operation failed: ' + error.message);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this customer?')) {
            try {
                await api.post('/customers/remove', { id });
                fetchCustomers();
                if (selectedCustomer?.id === id) setSelectedCustomer(null);
            } catch (error) {
                alert('Failed to delete customer');
            }
        }
    };

    const handleEdit = (customer, e) => {
        e.stopPropagation();
        setFormData(customer);
        setIsEditing(true);
        setShowForm(true);
    };

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6">
            {/* Left Panel: Customer List */}
            <div className={`flex-1 flex flex-col ${selectedCustomer ? 'hidden md:flex' : 'flex'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <User className="w-6 h-6 text-blue-600" />
                        Customers
                    </h2>
                    <button
                        onClick={() => {
                            setFormData({ name: '', email: '', phone: '', address: '', role: 'Customer' });
                            setIsEditing(false);
                            setShowForm(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <User className="w-4 h-4" />
                        Add New
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading customers...</div>
                    ) : customers.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No customers found. Add one to get started!</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {customers.map((customer) => (
                                <div
                                    key={customer.id}
                                    onClick={() => handleCustomerClick(customer)}
                                    className={`p-4 hover:bg-blue-50 cursor-pointer transition-colors ${selectedCustomer?.id === customer.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                                {customer.phone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="w-3 h-3" /> {customer.phone}
                                                    </span>
                                                )}
                                                <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                                                    {customer.role || 'Customer'}
                                                </span>
                                                {/* Show indicator for customers with online orders */}
                                                {customer.has_online_orders && (
                                                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1">
                                                        <ShoppingBag className="w-3 h-3" /> Online
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => handleEdit(customer, e)}
                                                className="p-1 text-gray-400 hover:text-blue-600"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(customer.id, e)}
                                                className="p-1 text-gray-400 hover:text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Customer Profile & Analytics */}
            {selectedCustomer && (
                <div className="flex-[2] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h2>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                                {selectedCustomer.email && (
                                    <span className="flex items-center gap-1">
                                        <Mail className="w-4 h-4" /> {selectedCustomer.email}
                                    </span>
                                )}
                                {selectedCustomer.phone && (
                                    <span className="flex items-center gap-1">
                                        <Phone className="w-4 h-4" /> {selectedCustomer.phone}
                                    </span>
                                )}
                                {selectedCustomer.address && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" /> {selectedCustomer.address}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedCustomer(null)}
                            className="md:hidden text-gray-500"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {loadingAnalytics ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : analyticsData ? (
                            <div className="space-y-8">
                                {/* Key Metrics */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                                        <div className="flex items-center gap-2 text-blue-700 mb-1">
                                            <DollarSign className="w-4 h-4" />
                                            <span className="text-sm font-semibold">Total Spent</span>
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            ₹{(analyticsData.analytics?.total_spent || 0).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                                        <div className="flex items-center gap-2 text-green-700 mb-1">
                                            <TrendingUp className="w-4 h-4" />
                                            <span className="text-sm font-semibold">Total Profit</span>
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            ₹{(analyticsData.analytics?.total_profit || 0).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                                        <div className="flex items-center gap-2 text-purple-700 mb-1">
                                            <ShoppingBag className="w-4 h-4" />
                                            <span className="text-sm font-semibold">Orders</span>
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {analyticsData.analytics?.order_frequency || 0}
                                        </div>
                                    </div>
                                </div>

                                {/* AI Insights */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <span className="text-xl">✨</span> AI Insights
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2 text-orange-600">
                                                <Clock className="w-5 h-5" />
                                                <span className="font-semibold">Best Time to Engage</span>
                                            </div>
                                            <p className="text-gray-600">
                                                This customer prefers shopping in the <span className="font-bold text-gray-900">{analyticsData.analytics?.best_time_to_engage || 'Varied'}</span>.
                                            </p>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                            <div className="flex items-center gap-2 mb-2 text-red-600">
                                                <AlertTriangle className="w-5 h-5" />
                                                <span className="font-semibold">Churn Risk</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                    (analyticsData.analytics?.churn_risk || 'Low') === 'High' ? 'bg-red-100 text-red-700' :
                                                    (analyticsData.analytics?.churn_risk || 'Low') === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-green-100 text-green-700'
                                                }`}>
                                                    {analyticsData.analytics?.churn_risk || 'Low'}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    ({analyticsData.analytics?.days_since_last_purchase || 0} days since last order)
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Product Recommendations */}
                                {analyticsData.recommendations && analyticsData.recommendations.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <span className="text-xl">🎁</span> Recommended for {selectedCustomer?.name?.split(' ')[0] || 'Customer'}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {analyticsData.recommendations.map((item) => (
                                                <div key={item.id} className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-100 flex justify-between items-center">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900 text-sm">{item.name || 'Unknown Product'}</h4>
                                                        <p className="text-xs text-purple-600">{item.reason || 'Recommended'}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block font-bold text-gray-900 text-sm">₹{item.price || 0}</span>
                                                        <button
                                                            className="text-xs bg-white border border-purple-200 text-purple-700 px-2 py-1 rounded hover:bg-purple-100 mt-1"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                alert(`Suggestion: Ask if they want ${item.name || 'this item'}!`);
                                                            }}
                                                        >
                                                            Suggest
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Purchase History */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">Purchase History</h3>
                                    {analyticsData.history && analyticsData.history.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left text-gray-500">
                                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3">Date</th>
                                                        <th className="px-4 py-3">Product</th>
                                                        <th className="px-4 py-3">Category</th>
                                                        <th className="px-4 py-3 text-right">Qty</th>
                                                        <th className="px-4 py-3 text-right">Total</th>
                                                        <th className="px-4 py-3">Source</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {analyticsData.history.map((sale) => (
                                                        <tr key={sale.id} className="bg-white border-b hover:bg-gray-50">
                                                            <td className="px-4 py-3">
                                                                {sale.date ? new Date(sale.date).toLocaleDateString() : 'Unknown Date'}
                                                                <div className="text-xs text-gray-400">
                                                                    {sale.date ? new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 font-medium text-gray-900">
                                                                {sale.products?.name || 'Unknown Product'}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                                                                    {sale.products?.category || 'General'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-right">{sale.qty_sold || 0}</td>
                                                            <td className="px-4 py-3 text-right font-semibold text-gray-900">
                                                                ₹{sale.total_price || 0}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                    sale.source === 'online' 
                                                                        ? 'bg-green-100 text-green-800' 
                                                                        : sale.source === 'ocr' 
                                                                            ? 'bg-blue-100 text-blue-800' 
                                                                            : 'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                    {sale.source === 'online' ? 'Online' : sale.source === 'ocr' ? 'OCR' : 'Manual'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            No purchase history found for this customer.
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-12">
                                Select a customer to view their profile and insights.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">
                                {isEditing ? 'Edit Customer' : 'Add New Customer'}
                            </h3>
                            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows="3"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                            >
                                {isEditing ? 'Update Customer' : 'Add Customer'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;
