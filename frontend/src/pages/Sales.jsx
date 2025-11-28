import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Trash2, ShoppingCart, User, DollarSign, Search, Zap, Scan, Calendar } from 'lucide-react';
import BarcodeScanner from '../components/BarcodeScanner';
import { playScanSound, playCashSound } from '../utils/sound';

const Sales = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [cart, setCart] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [quickEntry, setQuickEntry] = useState('');
    const [saleDate, setSaleDate] = useState('');

    // Customer autocomplete states
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');

    // Barcode states
    const [showScanner, setShowScanner] = useState(false);
    const demoProductSku = "SKU001";

    useEffect(() => {
        fetchProducts();
        fetchCustomers();
    }, []);

    useEffect(() => {
        if (searchTerm) {
            setFilteredProducts(products.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.sku_id.toLowerCase().includes(searchTerm.toLowerCase())
            ));
        } else {
            setFilteredProducts(products);
        }
    }, [searchTerm, products]);

    // Filter customers as user types
    useEffect(() => {
        if (customerSearch) {
            const filtered = customers.filter(c =>
                c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                (c.phone && c.phone.includes(customerSearch))
            );
            setFilteredCustomers(filtered);
            setShowCustomerSuggestions(filtered.length > 0);
        } else {
            setFilteredCustomers([]);
            setShowCustomerSuggestions(false);
        }
    }, [customerSearch, customers]);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/inventory/products');
            setProducts(res.data);
            setFilteredProducts(res.data);
        } catch (error) {
            console.error("Error fetching products", error);
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await api.get('/customers');
            setCustomers(res.data);
        } catch (error) {
            console.error("Error fetching customers", error);
        }
    };

    const addToCart = (product) => {
        const existing = cart.find(item => item.product_id === product.id);
        if (existing) {
            setCart(cart.map(item =>
                item.product_id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart([...cart, {
                product_id: product.id,
                name: product.name,
                price: product.selling_price,
                quantity: 1,
                stock: product.stock_levels[0]?.current_stock || 0
            }]);
        }
    };

    // Quick entry format: "SKU:QTY SKU:QTY" or "ProductName:QTY"
    const handleQuickEntry = () => {
        if (!quickEntry.trim()) return;

        const entries = quickEntry.trim().split(/\s+/);

        entries.forEach(entry => {
            const [identifier, qty] = entry.split(':');
            const quantity = parseInt(qty) || 1;

            const product = products.find(p =>
                p.sku_id.toLowerCase() === identifier.toLowerCase() ||
                p.name.toLowerCase().includes(identifier.toLowerCase())
            );

            if (product && (product.stock_levels[0]?.current_stock || 0) >= quantity) {
                const existing = cart.find(item => item.product_id === product.id);
                if (existing) {
                    setCart(cart.map(item =>
                        item.product_id === product.id
                            ? { ...item, quantity: item.quantity + quantity }
                            : item
                    ));
                } else {
                    setCart([...cart, {
                        product_id: product.id,
                        name: product.name,
                        price: product.selling_price,
                        quantity: quantity,
                        stock: product.stock_levels[0]?.current_stock || 0
                    }]);
                }
            }
        });

        setQuickEntry('');
    };

    const handleScan = (scannedSku) => {
        // setShowScanner(false); // Keep scanner open for continuous scanning
        const product = products.find(p => p.sku_id === scannedSku);

        if (product) {
            playScanSound();
            addToCart(product);
        } else {
            if (scannedSku === demoProductSku) {
                alert("Demo product scanned! But '5kg Rice' is not in the database yet. Please add it to inventory first.");
            } else {
                alert(`Product with SKU ${scannedSku} not found.`);
            }
        }
    };

    const updateQuantity = (productId, newQty) => {
        if (newQty <= 0) {
            removeFromCart(productId);
            return;
        }
        setCart(cart.map(item =>
            item.product_id === productId ? { ...item, quantity: newQty } : item
        ));
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.product_id !== productId));
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const handleCheckout = async () => {
        if (cart.length === 0) {
            alert('Cart is empty!');
            return;
        }

        if (!selectedCustomer) {
            alert('Please select a customer to complete the sale.');
            return;
        }

        setSubmitting(true);
        try {
            const saleData = {
                customer_id: selectedCustomer || null,
                items: cart.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity
                })),
                payment_method: paymentMethod,
                notes: notes,
                date: saleDate || null // Send the selected date or null for current date
            };

            const res = await api.post('/transactions/create', saleData);

            // Play cash register sound
            playCashSound();

            alert(`✅ Sale completed! Total: ₹${res.data.total_amount}\n${res.data.items_sold} items sold`);

            // Reset form
            setCart([]);
            setSelectedCustomer('');
            setPaymentMethod('cash');
            setNotes('');
            setSaleDate('');
        } catch (error) {
            console.error("Error creating sale:", error);
            alert(`❌ Failed to complete sale: ${error.response?.data?.error || error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ShoppingCart className="w-8 h-8 text-green-600" />
                    <h2 className="text-2xl font-bold text-gray-800">Quick Sale Transaction</h2>
                </div>
                <div className="text-sm bg-green-50 border border-green-200 px-3 py-2 rounded-md text-green-700">
                    <Zap className="w-4 h-4 inline mr-1" />
                    Fast Entry Enabled
                </div>
            </div>

            {/* Quick Entry Section */}
            <div className="card bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-green-600" />
                    ⚡ Quick Multi-Product Entry
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                    Enter multiple products at once! Format: <code className="bg-white px-2 py-1 rounded text-xs font-mono">SKU:QTY SKU:QTY</code>
                    <br />
                    Example: <code className="bg-white px-2 py-1 rounded text-xs font-mono">RICE001:2 OIL001:1 MILK001:3</code>
                </p>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={quickEntry}
                        onChange={(e) => setQuickEntry(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleQuickEntry()}
                        placeholder="Type: RICE001:2 OIL001:1 (SKU:Quantity, space-separated)"
                        className="flex-1 border-2 border-green-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                        onClick={handleQuickEntry}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add All
                    </button>
                </div>

                <div className="flex gap-4 mt-4 pt-4 border-t border-green-200">
                    <button
                        onClick={() => setShowScanner(true)}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold flex items-center justify-center gap-2"
                    >
                        <Scan className="w-5 h-5" />
                        Scan Barcode (Camera)
                    </button>
                </div>
            </div>

            {showScanner && (
                <BarcodeScanner
                    onScan={handleScan}
                    onClose={() => setShowScanner(false)}
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Products Selection */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="card">
                        <div className="flex items-center gap-2 mb-4">
                            <Search className="w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search products by name or SKU..."
                                className="flex-1 border rounded-md p-2 text-sm"
                            />
                        </div>
                        <h3 className="text-lg font-semibold mb-3 text-gray-700">Browse Products (Click to Add)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                            {filteredProducts.map(product => {
                                const stock = product.stock_levels[0]?.current_stock || 0;
                                return (
                                    <button
                                        key={product.id}
                                        onClick={() => stock > 0 && addToCart(product)}
                                        disabled={stock === 0}
                                        className={`p-4 rounded-lg border-2 text-left transition-all ${stock > 0
                                            ? 'border-gray-200 hover:border-green-500 hover:bg-green-50 cursor-pointer'
                                            : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900">{product.name}</h4>
                                                <p className="text-xs text-gray-500 font-mono">{product.sku_id}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-bold text-green-600">₹{product.selling_price}</span>
                                            <span className={`text-xs px-2 py-1 rounded-full ${stock > 10 ? 'bg-green-100 text-green-700' : stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                Stock: {stock}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Cart & Checkout */}
                <div className="space-y-4">
                    {/* Customer Selection with Autocomplete */}
                    <div className="card">
                        <h3 className="text-lg font-semibold mb-3 text-gray-700 flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Customer (Required)
                        </h3>

                        {/* Search/Autocomplete */}
                        <div className="relative mb-3">
                            <input
                                type="text"
                                value={customerSearch}
                                onChange={(e) => setCustomerSearch(e.target.value)}
                                onFocus={() => customerSearch && setShowCustomerSuggestions(true)}
                                placeholder="Search or type customer name..."
                                className="w-full border-2 border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />

                            {/* Autocomplete Suggestions */}
                            {showCustomerSuggestions && filteredCustomers.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border-2 border-blue-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                    {filteredCustomers.map(customer => (
                                        <div
                                            key={customer.id}
                                            onClick={() => {
                                                setSelectedCustomer(customer.id);
                                                setCustomerSearch(customer.name);
                                                setShowCustomerSuggestions(false);
                                                setNewCustomerName('');
                                                setNewCustomerPhone('');
                                            }}
                                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                                        >
                                            <div className="font-medium text-gray-800">{customer.name}</div>
                                            {customer.phone && <div className="text-xs text-gray-500">{customer.phone}</div>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Add New Customer Form */}
                        {customerSearch && filteredCustomers.length === 0 && (
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-md p-3 space-y-2">
                                <p className="text-sm font-semibold text-blue-800">➕ Add New Customer</p>
                                <input
                                    type="text"
                                    value={newCustomerName || customerSearch}
                                    onChange={(e) => setNewCustomerName(e.target.value)}
                                    placeholder="Customer Name"
                                    className="w-full border rounded-md p-2 text-sm"
                                />
                                <input
                                    type="tel"
                                    value={newCustomerPhone}
                                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                                    placeholder="Phone Number (Optional)"
                                    className="w-full border rounded-md p-2 text-sm"
                                />
                                <button
                                    onClick={async () => {
                                        const name = newCustomerName || customerSearch;
                                        if (!name) {
                                            alert('Please enter customer name');
                                            return;
                                        }
                                        try {
                                            const res = await api.post('/customers/add', {
                                                name,
                                                phone: newCustomerPhone || '',
                                                role: 'Customer'
                                            });
                                            await fetchCustomers();
                                            setSelectedCustomer(res.data.id);
                                            setCustomerSearch(name);
                                            setNewCustomerName('');
                                            setNewCustomerPhone('');
                                            alert('✅ Customer added!');
                                        } catch (error) {
                                            alert('❌ Failed to add customer');
                                        }
                                    }}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium text-sm transition-colors"
                                >
                                    Add Customer
                                </button>
                            </div>
                        )}

                        {/* Selected Customer Display */}
                        {selectedCustomer && (
                            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-2">
                                ✓ Selected: <span className="font-semibold">{customerSearch || 'Unknown'}</span>
                                <button
                                    onClick={() => {
                                        setSelectedCustomer('');
                                        setCustomerSearch('');
                                    }}
                                    className="ml-2 text-red-600 hover:text-red-800 underline"
                                >
                                    Clear
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Cart */}
                    <div className="card">
                        <h3 className="text-lg font-semibold mb-3 text-gray-700">Cart ({cart.length} items)</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                            {cart.length > 0 ? cart.map(item => (
                                <div key={item.product_id} className="bg-gray-50 p-3 rounded-md">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-sm text-gray-900">{item.name}</h4>
                                            <p className="text-xs text-gray-500">₹{item.price} each</p>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.product_id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                            className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300 text-sm font-bold"
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value) || 0)}
                                            className="w-16 text-center border rounded p-1 text-sm"
                                            min="1"
                                            max={item.stock}
                                        />
                                        <button
                                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                            disabled={item.quantity >= item.stock}
                                            className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300 text-sm font-bold disabled:opacity-50"
                                        >
                                            +
                                        </button>
                                        <span className="ml-auto font-semibold text-sm">₹{item.price * item.quantity}</span>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-gray-400 text-sm text-center py-4">Cart is empty</p>
                            )}
                        </div>

                        {/* Total */}
                        <div className="border-t pt-3">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-lg font-bold text-gray-700">Total</span>
                                <span className="text-2xl font-bold text-green-600">₹{calculateTotal()}</span>
                            </div>

                            {/* Sale Date */}
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Sale Date (Optional)
                                </label>
                                <input
                                    type="date"
                                    value={saleDate}
                                    onChange={(e) => setSaleDate(e.target.value)}
                                    className="w-full border rounded-md p-2 text-sm"
                                    max={new Date().toISOString().split('T')[0]} // Prevent future dates
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Leave blank for current date/time
                                </p>
                            </div>

                            {/* Payment Method */}
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full border rounded-md p-2 text-sm"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="upi">UPI</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {/* Notes */}
                            <div className="mb-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full border rounded-md p-2 text-sm"
                                    rows="2"
                                    placeholder="Add any notes..."
                                />
                            </div>

                            {/* Checkout Button */}
                            <button
                                onClick={handleCheckout}
                                disabled={cart.length === 0 || submitting}
                                className="w-full btn btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <DollarSign className="w-5 h-5" />
                                {submitting ? 'Processing...' : 'Complete Sale'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sales;
