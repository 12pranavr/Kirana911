import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Trash2, Upload, FileSpreadsheet, Download, CheckCircle, AlertCircle, Edit, PackagePlus, PackageMinus, QrCode, BarChart2, X, Filter } from 'lucide-react';
import DemoBarcode from '../components/DemoBarcode';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showExcelUpload, setShowExcelUpload] = useState(false);
    const [showStockAdjust, setShowStockAdjust] = useState(null);
    const [stockAdjustment, setStockAdjustment] = useState({ qty: '', reason: '' });
    const [newProduct, setNewProduct] = useState({
        name: '', sku_id: '', cost_price: '', selling_price: '', category: '', initial_stock: ''
    });
    const [uploadResult, setUploadResult] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [loadingReport, setLoadingReport] = useState(false);

    // QR Modal State
    const [showQrModal, setShowQrModal] = useState(false);
    const [selectedQrProduct, setSelectedQrProduct] = useState(null);

    // Product Report Modal State
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productReport, setProductReport] = useState(null);

    // Filter State
    const [filters, setFilters] = useState({
        category: '',
        minStock: '',
        maxStock: '',
        search: ''
    });

    // Category suggestions
    const [categorySuggestions, setCategorySuggestions] = useState([]);
    const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/inventory/products');
            setProducts(res.data);
            
            // Extract unique categories for suggestions
            const uniqueCategories = [...new Set(res.data.map(p => p.category).filter(Boolean))];
            setCategorySuggestions(uniqueCategories);
        } catch (error) {
            console.error("Error fetching products", error);
        }
    };

    const fetchProductReport = async (product) => {
        try {
            setLoadingReport(true);
            setSelectedProduct(product);
            const res = await api.get(`/inventory/product/${product.id}/report`);
            setProductReport(res.data);
            setShowReportModal(true);
        } catch (error) {
            console.error("Error fetching product report", error);
            alert('Failed to load product report: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoadingReport(false);
        }
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            await api.post('/inventory/add', newProduct);
            setShowAddForm(false);
            setNewProduct({ name: '', sku_id: '', cost_price: '', selling_price: '', category: '', initial_stock: '' });
            fetchProducts();
            alert('Product added successfully!');
        } catch (error) {
            alert('Failed to add product: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await api.post('/inventory/remove', { id });
            fetchProducts();
            alert('Product deleted successfully!');
        } catch (error) {
            alert('Failed to delete');
        }
    };

    const handleStockAdjust = async (productId, action) => {
        if (!stockAdjustment.qty) {
            alert('Please enter quantity');
            return;
        }

        const changeQty = action === 'add' ? parseInt(stockAdjustment.qty) : -parseInt(stockAdjustment.qty);

        try {
            await api.post('/inventory/update_stock', {
                product_id: productId,
                change_qty: changeQty,
                reason: stockAdjustment.reason || `Stock ${action === 'add' ? 'added' : 'removed'} manually`
            });

            setShowStockAdjust(null);
            setStockAdjustment({ qty: '', reason: '' });
            fetchProducts();
            alert(`Stock ${action === 'add' ? 'added' : 'removed'} successfully!`);
        } catch (error) {
            alert('Failed to adjust stock: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleExcelUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setUploadResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/excel/upload_excel', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUploadResult({ success: true, data: res.data });
            fetchProducts();
            setTimeout(() => {
                setUploadResult(null);
            }, 5000);
        } catch (error) {
            setUploadResult({ success: false, error: error.response?.data?.error || error.message });
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = () => {
        const csvContent = `name,sku_id,category,cost_price,selling_price,initial_stock
Rice 5kg,SKU001,Grains,180,220,50
Wheat Flour 10kg,SKU002,Grains,350,420,40
Sugar 1kg,SKU003,Essentials,40,50,60`;

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'product_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleViewQr = (product) => {
        setSelectedQrProduct(product);
        setShowQrModal(true);
    };

    const handleViewReport = (product) => {
        fetchProductReport(product);
    };

    // Handle category input change with suggestions
    const handleCategoryChange = (value) => {
        setNewProduct({ ...newProduct, category: value });
        setShowCategorySuggestions(true);
    };

    // Select a category from suggestions
    const selectCategory = (category) => {
        setNewProduct({ ...newProduct, category });
        setShowCategorySuggestions(false);
    };

    // Filter products based on filter criteria
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(filters.search.toLowerCase()) || 
                             product.sku_id.toLowerCase().includes(filters.search.toLowerCase());
        const matchesCategory = !filters.category || product.category === filters.category;
        const stockLevel = product.stock_levels[0]?.current_stock || 0;
        const matchesMinStock = !filters.minStock || stockLevel >= parseInt(filters.minStock);
        const matchesMaxStock = !filters.maxStock || stockLevel <= parseInt(filters.maxStock);
        
        return matchesSearch && matchesCategory && matchesMinStock && matchesMaxStock;
    });

    // Get unique categories for filter dropdown
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

    // Filter category suggestions based on current input
    const filteredCategorySuggestions = categorySuggestions.filter(cat => 
        cat.toLowerCase().includes(newProduct.category.toLowerCase()) && 
        cat !== newProduct.category
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => { setShowExcelUpload(!showExcelUpload); setShowAddForm(false); }}
                        className="btn bg-green-600 text-white hover:bg-green-700 flex items-center"
                    >
                        <FileSpreadsheet className="w-4 h-4 mr-2" /> Upload Excel/CSV
                    </button>
                    <button
                        onClick={() => { setShowAddForm(!showAddForm); setShowExcelUpload(false); }}
                        className="btn btn-primary flex items-center"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add Product
                    </button>
                </div>
            </div>

            {/* QR Code Modal */}
            {showQrModal && selectedQrProduct && (
                <DemoBarcode
                    sku={selectedQrProduct.sku_id}
                    name={selectedQrProduct.name}
                    onClose={() => setShowQrModal(false)}
                />
            )}

            {/* Product Report Modal */}
            {showReportModal && productReport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowReportModal(false)}>
                    <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">Product Sales Report</h2>
                            <button onClick={() => setShowReportModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Product Info */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg border border-blue-200">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{productReport.product.name}</h3>
                                        <p className="text-gray-600">SKU: {productReport.product.sku_id}</p>
                                        <p className="text-gray-600">Category: {productReport.product.category || 'N/A'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-semibold">₹{productReport.product.selling_price} <span className="text-sm text-gray-500">(Sell)</span></p>
                                        <p className="text-gray-600">₹{productReport.product.cost_price} <span className="text-sm">(Cost)</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Sales Summary */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white border rounded-lg p-4 shadow-sm">
                                    <p className="text-sm text-gray-600">Total Sold</p>
                                    <p className="text-2xl font-bold text-blue-600">{productReport.sales_summary.total_sold}</p>
                                    <p className="text-xs text-gray-500">units</p>
                                </div>
                                <div className="bg-white border rounded-lg p-4 shadow-sm">
                                    <p className="text-sm text-gray-600">Revenue</p>
                                    <p className="text-2xl font-bold text-green-600">₹{productReport.sales_summary.total_revenue}</p>
                                    <p className="text-xs text-gray-500">total</p>
                                </div>
                                <div className="bg-white border rounded-lg p-4 shadow-sm">
                                    <p className="text-sm text-gray-600">Profit</p>
                                    <p className="text-2xl font-bold text-purple-600">₹{productReport.sales_summary.total_profit}</p>
                                    <p className="text-xs text-gray-500">total</p>
                                </div>
                                <div className="bg-white border rounded-lg p-4 shadow-sm">
                                    <p className="text-sm text-gray-600">Current Stock</p>
                                    <p className="text-2xl font-bold text-orange-600">{productReport.product.stock_levels[0]?.current_stock || 0}</p>
                                    <p className="text-xs text-gray-500">units</p>
                                </div>
                            </div>

                            {/* Sales Trend Chart */}
                            <div className="bg-white border rounded-lg p-5 shadow-sm">
                                <h3 className="text-lg font-semibold mb-4 text-gray-900">Sales Trend (Last 30 Days)</h3>
                                {productReport.sales_trend.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={productReport.sales_trend}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis 
                                                dataKey="date" 
                                                tick={{ fontSize: 12 }}
                                                tickFormatter={(value) => {
                                                    const date = new Date(value);
                                                    return `${date.getDate()}/${date.getMonth() + 1}`;
                                                }}
                                            />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <Tooltip 
                                                formatter={(value, name) => {
                                                    if (name === 'quantity') return [value, 'Units Sold'];
                                                    if (name === 'revenue') return [`₹${value}`, 'Revenue'];
                                                    return [value, name];
                                                }}
                                                labelFormatter={(value) => `Date: ${value}`}
                                            />
                                            <Legend />
                                            <Line 
                                                type="monotone" 
                                                dataKey="quantity" 
                                                name="Units Sold" 
                                                stroke="#3b82f6" 
                                                strokeWidth={2}
                                                dot={{ r: 4 }}
                                                activeDot={{ r: 6 }}
                                            />
                                            <Line 
                                                type="monotone" 
                                                dataKey="revenue" 
                                                name="Revenue (₹)" 
                                                stroke="#10b981" 
                                                strokeWidth={2}
                                                dot={{ r: 4 }}
                                                activeDot={{ r: 6 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="text-center py-10 text-gray-500">
                                        No sales data available for this product in the last 30 days
                                    </div>
                                )}
                            </div>

                            {/* Additional Stats */}
                            <div className="bg-gray-50 rounded-lg p-5">
                                <h3 className="text-lg font-semibold mb-3 text-gray-900">Additional Insights</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white p-3 rounded border">
                                        <p className="text-sm text-gray-600">Avg. Daily Sales</p>
                                        <p className="text-lg font-semibold">{productReport.sales_summary.average_daily_sales} units</p>
                                    </div>
                                    <div className="bg-white p-3 rounded border">
                                        <p className="text-sm text-gray-600">Profit Margin</p>
                                        <p className="text-lg font-semibold">
                                            {productReport.product.selling_price > 0 
                                                ? `${(((productReport.product.selling_price - productReport.product.cost_price) / productReport.product.selling_price) * 100).toFixed(1)}%`
                                                : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="bg-white p-3 rounded border">
                                        <p className="text-sm text-gray-600">Stock Turnover</p>
                                        <p className="text-lg font-semibold">
                                            {productReport.sales_summary.average_daily_sales > 0 
                                                ? `${(productReport.product.stock_levels[0]?.current_stock / productReport.sales_summary.average_daily_sales).toFixed(1)} days`
                                                : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Excel Upload Section */}
            {showExcelUpload && (
                <div className="card bg-green-50 border-2 border-green-200">
                    <h3 className="text-lg font-semibold mb-4 text-green-800">📊 Upload Products via Excel/CSV</h3>
                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-md mb-4">
                            <p className="text-sm text-blue-800 mb-2">
                                <strong>Required Columns:</strong> name, sku_id, category, cost_price, selling_price, initial_stock
                            </p>
                            <button
                                onClick={downloadTemplate}
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                            >
                                <Download className="w-4 h-4 mr-1" /> Download Sample Template
                            </button>
                        </div>

                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleExcelUpload}
                            disabled={uploading}
                            className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-green-600 file:text-white
                hover:file:bg-green-700
                disabled:opacity-50"
                        />
                        {uploading && <p className="text-sm text-gray-600">⏳ Processing Excel file...</p>}
                        {uploadResult && (
                            <div className={`p-4 rounded-md flex items-start gap-2 ${uploadResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {uploadResult.success ? <CheckCircle className="w-5 h-5 mt-0.5" /> : <AlertCircle className="w-5 h-5 mt-0.5" />}
                                <div className="flex-1">
                                    {uploadResult.success ? (
                                        <>
                                            <p className="font-semibold">✅ {uploadResult.data?.message}</p>
                                            <p className="text-sm mt-1">
                                                Added: {uploadResult.data?.details?.added || 0} |
                                                Updated: {uploadResult.data?.details?.updated || 0} |
                                                Errors: {uploadResult.data?.errors || 0}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="font-semibold">❌ Error: {uploadResult.error}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Add Product Form */}
            {showAddForm && (
                <div className="card mb-6 bg-blue-50 border-2 border-blue-200">
                    <h3 className="text-lg font-semibold mb-4 text-blue-800">Add New Product</h3>
                    <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <input placeholder="Product Name *" className="border p-2 rounded" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} required />
                        <input placeholder="SKU ID *" className="border p-2 rounded" value={newProduct.sku_id} onChange={e => setNewProduct({ ...newProduct, sku_id: e.target.value })} required />
                        
                        {/* Category with suggestions */}
                        <div className="relative">
                            <input 
                                placeholder="Category" 
                                className="border p-2 rounded w-full" 
                                value={newProduct.category} 
                                onChange={e => handleCategoryChange(e.target.value)}
                                onFocus={() => setShowCategorySuggestions(true)}
                                onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 200)}
                            />
                            {showCategorySuggestions && filteredCategorySuggestions.length > 0 && (
                                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                    {filteredCategorySuggestions.map((category, index) => (
                                        <div
                                            key={index}
                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                            onMouseDown={() => selectCategory(category)} // Using onMouseDown to prevent blur
                                        >
                                            {category}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <input type="number" step="0.01" placeholder="Cost Price *" className="border p-2 rounded" value={newProduct.cost_price} onChange={e => setNewProduct({ ...newProduct, cost_price: e.target.value })} required />
                        <input type="number" step="0.01" placeholder="Selling Price *" className="border p-2 rounded" value={newProduct.selling_price} onChange={e => setNewProduct({ ...newProduct, selling_price: e.target.value })} required />
                        <input type="number" placeholder="Initial Stock" className="border p-2 rounded" value={newProduct.initial_stock} onChange={e => setNewProduct({ ...newProduct, initial_stock: e.target.value })} />
                        <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-2">
                            <button type="button" onClick={() => setShowAddForm(false)} className="btn bg-gray-300 hover:bg-gray-400">Cancel</button>
                            <button type="submit" className="btn btn-primary">Save Product</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Filters:</span>
                    </div>
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="border rounded px-3 py-1 text-sm"
                        value={filters.search}
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                    />
                    <select
                        className="border rounded px-3 py-1 text-sm"
                        value={filters.category}
                        onChange={(e) => setFilters({...filters, category: e.target.value})}
                    >
                        <option value="">All Categories</option>
                        {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                    <input
                        type="number"
                        placeholder="Min Stock"
                        className="border rounded px-3 py-1 text-sm w-24"
                        value={filters.minStock}
                        onChange={(e) => setFilters({...filters, minStock: e.target.value})}
                    />
                    <input
                        type="number"
                        placeholder="Max Stock"
                        className="border rounded px-3 py-1 text-sm w-24"
                        value={filters.maxStock}
                        onChange={(e) => setFilters({...filters, maxStock: e.target.value})}
                    />
                    <button
                        onClick={() => setFilters({category: '', minStock: '', maxStock: '', search: ''})}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (Sell/Cost)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                            <React.Fragment key={product.id}>
                                <tr className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                        <div className="text-sm text-gray-500">{product.sku_id}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        ₹{product.selling_price} / <span className="text-xs">₹{product.cost_price}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${(product.stock_levels[0]?.current_stock || 0) < product.reorder_point ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                            {product.stock_levels[0]?.current_stock || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => handleViewReport(product)}
                                                className="text-blue-600 hover:text-blue-900 flex items-center"
                                                title="View Report"
                                                disabled={loadingReport}
                                            >
                                                {loadingReport && selectedProduct?.id === product.id ? (
                                                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <BarChart2 className="w-5 h-5" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleViewQr(product)}
                                                className="text-purple-600 hover:text-purple-900 flex items-center"
                                                title="View QR Code"
                                            >
                                                <QrCode className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => setShowStockAdjust(showStockAdjust === product.id ? null : product.id)}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="Adjust Stock"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900" title="Delete">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                {showStockAdjust === product.id && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 bg-yellow-50">
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 grid grid-cols-3 gap-2">
                                                    <input
                                                        type="number"
                                                        placeholder="Quantity"
                                                        className="border p-2 rounded"
                                                        value={stockAdjustment.qty}
                                                        onChange={(e) => setStockAdjustment({ ...stockAdjustment, qty: e.target.value })}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Reason (optional)"
                                                        className="border p-2 rounded col-span-2"
                                                        value={stockAdjustment.reason}
                                                        onChange={(e) => setStockAdjustment({ ...stockAdjustment, reason: e.target.value })}
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleStockAdjust(product.id, 'add')}
                                                        className="btn bg-green-600 text-white hover:bg-green-700 flex items-center text-sm"
                                                    >
                                                        <PackagePlus className="w-4 h-4 mr-1" /> Add
                                                    </button>
                                                    <button
                                                        onClick={() => handleStockAdjust(product.id, 'remove')}
                                                        className="btn bg-orange-600 text-white hover:bg-orange-700 flex items-center text-sm"
                                                    >
                                                        <PackageMinus className="w-4 h-4 mr-1" /> Remove
                                                    </button>
                                                    <button
                                                        onClick={() => setShowStockAdjust(null)}
                                                        className="btn bg-gray-300 hover:bg-gray-400 text-sm"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        )) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                    No products found. Add your first product or upload an Excel file!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Inventory;