import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import storesService from '../services/stores';
import { ShoppingCart, Search, Package, Star, MapPin, Phone, Store as StoreIcon, X, Plus, Minus } from 'lucide-react';
import { supabase } from '../services/supabase'; // Import Supabase client
import api from '../services/api';

const StoreProducts = () => {
    const { storeId } = useParams();
    const [store, setStore] = useState(null);
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [customerDetails, setCustomerDetails] = useState({
        name: '',
        phone: '',
        address: '',
        landmark: ''
    });
    const [showCustomerForm, setShowCustomerForm] = useState(false);

    useEffect(() => {
        fetchStoreData();
    }, [storeId]);

    useEffect(() => {
        let result = products;
        
        // Apply search filter
        if (searchTerm) {
            result = result.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.sku_id.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Apply category filter
        if (selectedCategory !== 'all') {
            result = result.filter(p => p.category === selectedCategory);
        }
        
        setFilteredProducts(result);
    }, [searchTerm, selectedCategory, products]);

    const fetchStoreData = async () => {
        try {
            setLoading(true);
            setError(null); // Clear any previous errors
            
            // Check if storeId is valid
            if (!storeId) {
                setError('Invalid store ID');
                setLoading(false);
                return;
            }
            
            // First, let's check if the store exists by querying Supabase directly
            const { data: storeData, error: storeError } = await supabase
                .from('stores')
                .select('*')
                .eq('id', storeId)
                .single();

            if (storeError) {
                console.error('Supabase store error:', storeError);
                setError('Store not found. Please check the store ID and try again.');
                setLoading(false);
                return;
            }

            if (!storeData) {
                setError('Store not found. Please check the store ID and try again.');
                setLoading(false);
                return;
            }

            setStore(storeData);
            
            // Fetch store products
            const storeProducts = await storesService.getStoreProducts(storeId);
            setProducts(storeProducts);
        } catch (err) {
            console.error('Error fetching store data:', err);
            setError('Failed to load store data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product) => {
        const stock = product.stock_levels[0]?.current_stock || 0;
        if (stock === 0) return;
        
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                return [...prevCart, { ...product, quantity: 1 }];
            }
        });
    };

    const updateCartQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }
        
        setCart(prevCart => 
            prevCart.map(item => 
                item.id === productId 
                    ? { ...item, quantity: newQuantity } 
                    : item
            )
        );
    };

    const removeFromCart = (productId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
    };

    const handlePlaceOrder = async () => {
        // Show customer form if not already shown
        if (!showCustomerForm) {
            setShowCustomerForm(true);
            return;
        }
        
        if (!customerDetails.name || !customerDetails.phone || !customerDetails.address) {
            alert('Please fill in all required customer details');
            return;
        }

        // Prepare items for the API
        const items = cart.map(item => ({
            product_id: item.id,
            quantity: item.quantity
        }));

        // For store orders, we'll create them as "online" sales
        const saleData = {
            customer_id: null, // Anonymous customer
            items: items,
            payment_method: 'online',
            notes: `Online order from store page. Customer: ${customerDetails.name}, Phone: ${customerDetails.phone}, Address: ${customerDetails.address}, Landmark: ${customerDetails.landmark || 'N/A'}, Store: ${store.name}`,
            source: 'online', // Mark as online order
            customer_details: customerDetails // Include customer details
        };

        try {
            const response = await api.post('/transactions/create', saleData);
            console.log('Order response:', response.data);
            setCart([]);
            setShowCart(false);
            setShowCustomerForm(false);
            // Reset customer details
            setCustomerDetails({
                name: '',
                phone: '',
                address: '',
                landmark: ''
            });
            alert('Order placed successfully! Order ID: ' + response.data.transaction_id);
        } catch (error) {
            console.error('Error placing order:', error);
            alert('Failed to place order. Please try again.');
        }
    };

    const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];
    const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-4 text-gray-600">Loading store products...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                    <div className="text-red-500 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Error Loading Products</h3>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button
                        onClick={fetchStoreData}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Cart Sidebar */}
            {showCart && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowCart(false)}></div>
                    <div className="absolute inset-y-0 right-0 max-w-full flex">
                        <div className="relative w-screen max-w-md">
                            <div className="h-full flex flex-col bg-white shadow-xl">
                                <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-6">
                                    <div className="flex items-start justify-between">
                                        <h2 className="text-lg font-medium text-gray-900">Shopping Cart</h2>
                                        <button 
                                            onClick={() => setShowCart(false)}
                                            className="ml-3 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-500"
                                        >
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>

                                    <div className="mt-8">
                                        {cart.length === 0 ? (
                                            <div className="text-center py-12">
                                                <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                                                <h3 className="mt-2 text-sm font-medium text-gray-900">Your cart is empty</h3>
                                                <p className="mt-1 text-sm text-gray-500">Start adding some products to your cart</p>
                                            </div>
                                        ) : (
                                            <div className="flow-root">
                                                <ul className="-my-6 divide-y divide-gray-200">
                                                    {cart.map((item) => (
                                                        <li key={item.id} className="py-6 flex">
                                                            <div className="ml-4 flex-1 flex flex-col">
                                                                <div>
                                                                    <div className="flex justify-between text-base font-medium text-gray-900">
                                                                        <h3>{item.name}</h3>
                                                                        <p className="ml-4">₹{(item.selling_price * item.quantity).toFixed(2)}</p>
                                                                    </div>
                                                                    <p className="mt-1 text-sm text-gray-500">₹{item.selling_price} each</p>
                                                                </div>
                                                                <div className="flex-1 flex items-end justify-between text-sm">
                                                                    <div className="flex items-center border rounded-md">
                                                                        <button
                                                                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                                                            className="px-2 py-1 text-gray-600 hover:text-gray-800"
                                                                        >
                                                                            <Minus className="h-4 w-4" />
                                                                        </button>
                                                                        <span className="px-2">{item.quantity}</span>
                                                                        <button
                                                                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                                                            className="px-2 py-1 text-gray-600 hover:text-gray-800"
                                                                        >
                                                                            <Plus className="h-4 w-4" />
                                                                        </button>
                                                                    </div>

                                                                    <button
                                                                        onClick={() => removeFromCart(item.id)}
                                                                        type="button"
                                                                        className="font-medium text-red-600 hover:text-red-500"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {cart.length > 0 && (
                                    <div className="border-t border-gray-200 py-6 px-4 sm:px-6">
                                        <div className="flex justify-between text-base font-medium text-gray-900">
                                            <p>Subtotal</p>
                                            <p>₹{calculateTotal().toFixed(2)}</p>
                                        </div>
                                        <p className="mt-0.5 text-sm text-gray-500">Shipping and taxes calculated at checkout.</p>
                                        <div className="mt-6">
                                            <button
                                                onClick={handlePlaceOrder}
                                                className="w-full bg-blue-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                {showCustomerForm ? 'Confirm Order' : 'Proceed to Checkout'}
                                            </button>
                                        </div>
                                        <div className="mt-4 flex justify-center text-sm text-center text-gray-500">
                                            <button
                                                type="button"
                                                className="text-blue-600 font-medium hover:text-blue-500"
                                                onClick={() => setShowCart(false)}
                                            >
                                                Continue Shopping<span aria-hidden="true"> &rarr;</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Customer Form Modal */}
            {showCustomerForm && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCustomerForm(false)}></div>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">Customer Information</h3>
                                        <div className="mt-4 space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                                                <input
                                                    type="text"
                                                    value={customerDetails.name}
                                                    onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                                                <input
                                                    type="tel"
                                                    value={customerDetails.phone}
                                                    onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Delivery Address *</label>
                                                <textarea
                                                    value={customerDetails.address}
                                                    onChange={(e) => setCustomerDetails({...customerDetails, address: e.target.value})}
                                                    rows={3}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Landmark (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={customerDetails.landmark}
                                                    onChange={(e) => setCustomerDetails({...customerDetails, landmark: e.target.value})}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    onClick={handlePlaceOrder}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Place Order
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCustomerForm(false)}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <header className="bg-white shadow">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <StoreIcon className="w-6 h-6 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-800">
                            {store ? `🏪 ${store.name}` : '🏪 Kirana Store'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setShowCart(true)}
                            className="relative p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                        >
                            <ShoppingCart className="w-6 h-6" />
                            {cartItemCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {cartItemCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {store && (
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-8">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                                <StoreIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{store.name}</h2>
                                <div className="flex items-center mt-1">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    <span className="text-sm">{store.address || 'Address not provided'}, {store.pincode}</span>
                                </div>
                                {store.phone && (
                                    <div className="flex items-center mt-1">
                                        <Phone className="w-4 h-4 mr-1" />
                                        <span className="text-sm">{store.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {categories.map(category => (
                                <option key={category} value={category}>
                                    {category === 'all' ? 'All Categories' : category}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredProducts.map(product => {
                        const stock = product.stock_levels[0]?.current_stock || 0;
                        return (
                            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-gray-800">{product.name}</h3>
                                        {stock > 0 ? (
                                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                                In Stock
                                            </span>
                                        ) : (
                                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                                Out of Stock
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mb-2">SKU: {product.sku_id}</p>
                                    <p className="text-sm text-gray-600 mb-3">{product.category}</p>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-lg font-bold text-blue-600">₹{product.selling_price}</span>
                                        <div className="flex items-center">
                                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                            <span className="text-sm text-gray-600 ml-1">4.5</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => addToCart(product)}
                                        disabled={stock === 0}
                                        className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                                            stock === 0
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                    >
                                        {stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-12">
                        <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg">No products found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StoreProducts;