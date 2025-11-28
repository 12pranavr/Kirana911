import React, { useState, useEffect } from 'react';
import { Search, MapPin, Phone, Star, Clock, Store, Package, TrendingUp, ShoppingCart, Plus, Minus, User, Filter, X, Check } from 'lucide-react';
import storesService from '../services/stores';
import { useNavigate } from 'react-router-dom';
import PremiumProductCard from '../components/PremiumProductCard';
import CartPreview from '../components/CartPreview';
import api from '../services/api';

const StoreFinder = () => {
    const [pincode, setPincode] = useState('');
    const [stores, setStores] = useState([]);
    const [allProducts, setAllProducts] = useState([]); // Combined products from all stores
    const [filteredProducts, setFilteredProducts] = useState([]); // Filtered products based on search
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [cart, setCart] = useState([]); // Single cart for all products
    const [expandedStore, setExpandedStore] = useState(null); // Track which store details are expanded
    const [searchTerm, setSearchTerm] = useState(''); // Search term for products
    const [selectedCategory, setSelectedCategory] = useState('all'); // Category filter
    const [showCart, setShowCart] = useState(false); // Show cart sidebar
    const [customerDetails, setCustomerDetails] = useState({
        name: '',
        phone: '',
        address: '',
        landmark: ''
    });
    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const [orderStatus, setOrderStatus] = useState({}); // Track order status for each store
    const [isPlacingOrders, setIsPlacingOrders] = useState(false); // Track if orders are being placed
    const [showOrderProgress, setShowOrderProgress] = useState(false); // Show progress modal
    const [currentOrderIndex, setCurrentOrderIndex] = useState(0); // Track current order being processed
    const [completedOrders, setCompletedOrders] = useState([]); // Track completed orders
    const [failedOrders, setFailedOrders] = useState([]); // Track failed orders
    const navigate = useNavigate();

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!pincode.trim()) {
            setError('Please enter a pincode');
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const nearbyStores = await storesService.getNearbyStores(pincode);
            setStores(nearbyStores);
            
            // Fetch products for all stores
            const allStoreProducts = [];
            for (const store of nearbyStores) {
                try {
                    const products = await storesService.getStoreProducts(store.id);
                    // Add store info to each product
                    const productsWithStoreInfo = products.map(product => ({
                        ...product,
                        storeId: store.id,
                        storeName: store.name,
                        storeImageUrl: store.image_url // Add store image URL to product
                    }));
                    allStoreProducts.push(...productsWithStoreInfo);
                } catch (err) {
                    console.error(`Error fetching products for store ${store.id}:`, err);
                }
            }
            
            setAllProducts(allStoreProducts);
            setFilteredProducts(allStoreProducts); // Initially show all products
            setCart([]);
            setOrderStatus({});
            setCompletedOrders([]);
            setFailedOrders([]);
        } catch (err) {
            console.error('Error fetching stores:', err);
            setError('Failed to fetch stores. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Filter products based on search term and category
    useEffect(() => {
        let result = allProducts;
        
        // Apply search filter
        if (searchTerm) {
            result = result.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.sku_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.category.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Apply category filter
        if (selectedCategory !== 'all') {
            result = result.filter(p => p.category === selectedCategory);
        }
        
        setFilteredProducts(result);
    }, [searchTerm, selectedCategory, allProducts]);

    // Get unique categories from all products
    const categories = ['all', ...new Set(allProducts.map(p => p.category).filter(Boolean))];
    
    // Get cart item count
    const getCartItemCount = () => {
        return cart.reduce((total, item) => total + item.quantity, 0);
    };

    // Calculate total
    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + ((item.selling_price || item.price || 0) * item.quantity), 0);
    };

    // Add to cart
    const addToCart = (product) => {
        const stock = product.stock_levels?.[0]?.current_stock || product.stock || 0;
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

    // Update cart quantity
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

    // Remove from cart
    const removeFromCart = (productId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    };

    // Group cart items by store
    const getCartItemsByStore = () => {
        const itemsByStore = {};
        cart.forEach(item => {
            if (!itemsByStore[item.storeId]) {
                itemsByStore[item.storeId] = {
                    store: stores.find(s => s.id === item.storeId),
                    items: []
                };
            }
            itemsByStore[item.storeId].items.push(item);
        });
        return itemsByStore;
    };

    // Calculate store subtotal
    const calculateStoreSubtotal = (items) => {
        return items.reduce((sum, item) => sum + ((item.selling_price || item.price || 0) * item.quantity), 0);
    };

    // Handle place order - place orders one by one
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

        // Prevent multiple clicks
        if (isPlacingOrders) return;
        setIsPlacingOrders(true);
        setShowOrderProgress(true);
        setCurrentOrderIndex(0);
        setCompletedOrders([]);
        setFailedOrders([]);

        // Group items by store
        const itemsByStore = getCartItemsByStore();
        const storeEntries = Object.entries(itemsByStore);
        
        // Process orders one by one
        for (let i = 0; i < storeEntries.length; i++) {
            const [storeId, storeData] = storeEntries[i];
            const storeItems = storeData.items;
            const store = storeData.store;
            
            setCurrentOrderIndex(i + 1);
            
            // Update order status to "processing"
            setOrderStatus(prev => ({
                ...prev,
                [storeId]: { status: 'processing', message: `Placing order with ${store?.name || 'store'}...` }
            }));

            try {
                // Prepare items for the API
                const items = storeItems.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity
                }));

                // For store orders, we'll create them as "online" sales
                const saleData = {
                    customer_id: null, // Anonymous customer
                    items: items,
                    payment_method: 'online',
                    notes: `Online order from multi-store search. Customer: ${customerDetails.name}, Phone: ${customerDetails.phone}, Address: ${customerDetails.address}, Landmark: ${customerDetails.landmark || 'N/A'}, Store: ${store?.name || storeId}`,
                    source: 'online', // Mark as online order
                    customer_details: customerDetails, // Include customer details
                    intended_store_id: storeId // Include the intended store ID
                };

                // Place order
                const response = await api.post('/transactions/create', saleData);
                
                console.log(`Order placed for store ${storeId}:`, response.data);
                
                // Update order status to "success"
                setOrderStatus(prev => ({
                    ...prev,
                    [storeId]: { status: 'success', message: 'Order placed successfully!', orderId: response.data.transaction_id }
                }));
                
                // Add to completed orders
                setCompletedOrders(prev => [...prev, { 
                    storeId, 
                    data: response.data, 
                    storeName: store?.name || 'Unknown Store' 
                }]);
                
            } catch (error) {
                console.error(`Error placing order for store ${storeId}:`, error);
                
                // Update order status to "error"
                setOrderStatus(prev => ({
                    ...prev,
                    [storeId]: { status: 'error', message: 'Failed to place order' }
                }));
                
                // Add to failed orders
                setFailedOrders(prev => [...prev, { 
                    storeId, 
                    error, 
                    storeName: store?.name || 'Unknown Store' 
                }]);
            }
        }
        
        // All orders processed
        setIsPlacingOrders(false);
        
        // Clear cart only for completed orders
        if (completedOrders.length > 0) {
            // Remove items from cart that were successfully ordered
            const completedStoreIds = completedOrders.map(order => order.storeId);
            setCart(prevCart => prevCart.filter(item => !completedStoreIds.includes(item.storeId)));
        }
    };

    // Close order progress modal and reset
    const closeOrderProgress = () => {
        setShowOrderProgress(false);
        setShowCustomerForm(false);
        setShowCart(false);
        setOrderStatus({});
        setCompletedOrders([]);
        setFailedOrders([]);
        setCurrentOrderIndex(0);
        // Reset customer details
        setCustomerDetails({
            name: '',
            phone: '',
            address: '',
            landmark: ''
        });
    };

    // Toggle store details expansion
    const toggleStoreDetails = (storeId) => {
        setExpandedStore(expandedStore === storeId ? null : storeId);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Order Progress Modal */}
            {showOrderProgress && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
                        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-6 pt-6 pb-4 sm:p-8 sm:pb-6">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-2xl leading-6 font-bold text-gray-900 mb-4">
                                            Placing Orders
                                        </h3>
                                        
                                        {/* Progress Indicator */}
                                        <div className="mb-6">
                                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                                                <span>Order {currentOrderIndex} of {Object.keys(getCartItemsByStore()).length}</span>
                                                <span>{Math.round((currentOrderIndex / Object.keys(getCartItemsByStore()).length) * 100)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div 
                                                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                                                    style={{ width: `${(currentOrderIndex / Object.keys(getCartItemsByStore()).length) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        
                                        {/* Order Status List */}
                                        <div className="mb-6 max-h-60 overflow-y-auto">
                                            {Object.entries(getCartItemsByStore()).map(([storeId, storeData], index) => (
                                                <div key={storeId} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                                                    <div className="flex items-center">
                                                        <Store className="w-5 h-5 text-gray-500 mr-3" />
                                                        <span className="font-medium text-gray-900">{storeData.store?.name || 'Unknown Store'}</span>
                                                    </div>
                                                    <div>
                                                        {orderStatus[storeId] ? (
                                                            <>
                                                                {orderStatus[storeId].status === 'processing' && (
                                                                    <div className="flex items-center text-blue-600">
                                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                                                                        <span className="text-sm">Processing</span>
                                                                    </div>
                                                                )}
                                                                {orderStatus[storeId].status === 'success' && (
                                                                    <div className="flex items-center text-green-600">
                                                                        <Check className="w-4 h-4 mr-2" />
                                                                        <span className="text-sm">Success</span>
                                                                    </div>
                                                                )}
                                                                {orderStatus[storeId].status === 'error' && (
                                                                    <div className="flex items-center text-red-600">
                                                                        <X className="w-4 h-4 mr-2" />
                                                                        <span className="text-sm">Failed</span>
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span className="text-sm text-gray-400">Pending</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {/* Completion Message */}
                                        {!isPlacingOrders && (
                                            <div className="bg-blue-50 rounded-xl p-4">
                                                <p className="text-sm text-blue-800 text-center">
                                                    Order placement process completed. Your orders have been placed with different vendors.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {!isPlacingOrders && (
                                <div className="bg-gray-50 px-6 py-4 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-2xl">
                                    <button
                                        type="button"
                                        onClick={closeOrderProgress}
                                        className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-lg px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-base font-bold text-white hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-300 transform hover:-translate-y-0.5"
                                    >
                                        OK
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Cart Preview Component */}
            <CartPreview
                isOpen={showCart}
                onClose={() => setShowCart(false)}
                cartItems={cart}
                onUpdateQuantity={updateCartQuantity}
                onRemoveItem={removeFromCart}
                onCheckout={() => {
                    setShowCart(false);
                    setShowCustomerForm(true);
                }}
                totalAmount={calculateTotal()}
            />

            {/* Customer Form Modal */}
            {showCustomerForm && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCustomerForm(false)}></div>
                        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                            <div className="bg-white px-6 pt-6 pb-4 sm:p-8 sm:pb-6">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-2xl leading-6 font-bold text-gray-900 mb-6">Customer Information & Order Summary</h3>
                                        
                                        {/* Customer Details Form */}
                                        <div className="mb-8">
                                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h4>
                                            <div className="space-y-5">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                                                    <input
                                                        type="text"
                                                        value={customerDetails.name}
                                                        onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                                                        className="mt-1 block w-full border border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number <span className="text-red-500">*</span></label>
                                                    <input
                                                        type="tel"
                                                        value={customerDetails.phone}
                                                        onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})}
                                                        className="mt-1 block w-full border border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Delivery Address <span className="text-red-500">*</span></label>
                                                    <textarea
                                                        value={customerDetails.address}
                                                        onChange={(e) => setCustomerDetails({...customerDetails, address: e.target.value})}
                                                        rows={3}
                                                        className="mt-1 block w-full border border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Landmark (Optional)</label>
                                                    <input
                                                        type="text"
                                                        value={customerDetails.landmark}
                                                        onChange={(e) => setCustomerDetails({...customerDetails, landmark: e.target.value})}
                                                        className="mt-1 block w-full border border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Order Summary */}
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h4>
                                            <div className="bg-gray-50 rounded-xl p-4 max-h-60 overflow-y-auto">
                                                {Object.entries(getCartItemsByStore()).map(([storeId, storeData]) => (
                                                    <div key={storeId} className="mb-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0 last:mb-0">
                                                        <div className="flex items-center justify-between mb-2">
                                                            {/* Store Image */}
                                                            {storeData.store?.image_url ? (
                                                                <img 
                                                                    src={storeData.store.image_url} 
                                                                    alt={storeData.store.name} 
                                                                    className="w-6 h-6 rounded-full object-cover mr-2"
                                                                    onError={(e) => {
                                                                        e.target.style.display = 'none';
                                                                        e.target.nextSibling.style.display = 'flex';
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-1 rounded-full mr-2">
                                                                <Store className="w-3 h-3 text-white" />
                                                            </div>
                                                            <span className="font-medium text-gray-900">{storeData.store?.name || 'Unknown Store'}</span>
                                                            <span className="font-bold text-gray-900">₹{calculateStoreSubtotal(storeData.items).toFixed(2)}</span>
                                                        </div>
                                                        
                                                        <ul className="mt-2 space-y-1">
                                                            {storeData.items.map(item => (
                                                                <li key={item.id} className="flex justify-between text-sm text-gray-600">
                                                                    <span>{item.quantity} × {item.name}</span>
                                                                    <span>₹{((item.selling_price || item.price || 0) * item.quantity).toFixed(2)}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ))}
                                                
                                                <div className="flex justify-between font-bold text-gray-900 pt-4 mt-4 border-t border-gray-300">
                                                    <span>Total:</span>
                                                    <span>₹{calculateTotal().toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-4 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-2xl">
                                <button
                                    type="button"
                                    onClick={handlePlaceOrder}
                                    disabled={isPlacingOrders}
                                    className={`w-full inline-flex justify-center rounded-xl border border-transparent shadow-lg px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-base font-bold text-white hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-300 transform hover:-translate-y-0.5 ${
                                        isPlacingOrders ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                >
                                    {isPlacingOrders ? (
                                        <div className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Placing Orders...
                                        </div>
                                    ) : (
                                        'Place All Orders'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCustomerForm(false)}
                                    disabled={isPlacingOrders}
                                    className={`mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors ${
                                        isPlacingOrders ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header with Cart */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-2 rounded-xl shadow-lg">
                            <Store className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900">Kirana<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700">Store</span></span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setShowCart(true)}
                            className="relative p-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            <ShoppingCart className="w-6 h-6" />
                            {getCartItemCount() > 0 && (
                                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg">
                                    {getCartItemCount()}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">Find Your Nearest Kirana Store</h1>
                    <p className="text-xl mb-8 max-w-2xl mx-auto">Enter your pincode to discover stores near you and start shopping instantly</p>
                    
                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
                                <input
                                    type="text"
                                    value={pincode}
                                    onChange={(e) => setPincode(e.target.value)}
                                    placeholder="Enter your pincode"
                                    className="w-full pl-12 pr-4 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl focus:ring-2 focus:ring-white focus:border-transparent text-white placeholder-white/70 shadow-lg transition-all"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-gray-100 transition-all duration-300 font-semibold flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-5 h-5" />
                                        Find Stores
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Search Results Section */}
            <div className="container mx-auto px-4 py-12">
                {error && (
                    <div className="bg-red-100 text-red-700 p-6 rounded-2xl mb-8 shadow-sm max-w-2xl mx-auto">
                        <div className="flex items-center gap-3">
                            <div className="bg-red-200 p-2 rounded-lg">
                                <Store className="w-5 h-5 text-red-700" />
                            </div>
                            <span className="font-medium">{error}</span>
                        </div>
                    </div>
                )}

                {/* Results Section */}
                {stores.length > 0 && (
                    <div className="max-w-7xl mx-auto">
                        {/* Stores Section */}
                        <div className="mb-16">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900">
                                        Found {stores.length} store{stores.length !== 1 ? 's' : ''} near {pincode}
                                    </h2>
                                    <p className="text-gray-600 mt-2">Choose your preferred store or browse all products below</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-xl flex items-center gap-2">
                                        <Package className="w-4 h-4" />
                                        <span className="font-medium">{allProducts.length} products</span>
                                    </div>
                                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-xl flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" />
                                        <span className="font-medium">Fast delivery</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Modern Store Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {stores.map(store => (
                                    <div 
                                        key={store.id} 
                                        className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 group overflow-hidden transform hover:-translate-y-1"
                                    >
                                        {/* Store Image Header */}
                                        <div className="relative h-48 overflow-hidden">
                                            {store.image_url ? (
                                                <img 
                                                    src={store.image_url} 
                                                    alt={store.name} 
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.parentElement.innerHTML = '<div class="bg-gradient-to-r from-blue-400 to-indigo-500 w-full h-full flex items-center justify-center"><Store className="w-12 h-12 text-white" /></div>';
                                                    }}
                                                />
                                            ) : (
                                                <div className="bg-gradient-to-r from-blue-400 to-indigo-500 w-full h-full flex items-center justify-center">
                                                    <Store className="w-12 h-12 text-white" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                                            <div className="absolute bottom-4 left-4">
                                                <h3 className="font-bold text-xl text-white group-hover:text-blue-200 transition-colors">{store.name}</h3>
                                            </div>
                                        </div>
                                        
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                                                    {store.pincode}
                                                </span>
                                                <div className="flex items-center bg-yellow-100 px-2 py-1 rounded-lg">
                                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                                    <span className="text-sm text-gray-700 ml-1 font-semibold">4.8</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-start mb-4">
                                                <MapPin className="w-5 h-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                                <p className="text-gray-600 text-sm">{store.address}</p>
                                            </div>
                                            
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center">
                                                    <div className="bg-green-100 p-2 rounded-lg">
                                                        <Clock className="w-5 h-5 text-green-600" />
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="font-semibold text-gray-900">10-20 mins</div>
                                                        <div className="text-xs text-gray-500">Delivery</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <div className="bg-blue-100 p-2 rounded-lg">
                                                        <Phone className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="font-semibold text-gray-900 text-sm">{store.phone}</div>
                                                        <div className="text-xs text-gray-500">Contact</div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-3">
                                                <button 
                                                    onClick={() => toggleStoreDetails(store.id)}
                                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 font-medium text-sm"
                                                >
                                                    {expandedStore === store.id ? 'Hide Details' : 'View Details'}
                                                </button>
                                                <button 
                                                    onClick={() => navigate(`/store/${store.id}/products`)}
                                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 font-medium text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                                >
                                                    Shop Now
                                                </button>
                                            </div>
                                            
                                            {/* Expanded Store Details */}
                                            {expandedStore === store.id && (
                                                <div className="mt-6 pt-6 border-t border-gray-100">
                                                    <div className="flex items-center text-gray-600 mb-3">
                                                        <User className="w-4 h-4 mr-2" />
                                                        <span>Store Owner: {store.owner_name || 'Not specified'}</span>
                                                    </div>
                                                    <div className="flex items-center text-gray-600">
                                                        <Store className="w-4 h-4 mr-2" />
                                                        <span>Store ID: {store.id.substring(0, 8)}...</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Combined Products Section with Search */}
                        <div>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900">All Products</h2>
                                    <p className="text-gray-600 mt-2">Browse products from all nearby stores</p>
                                </div>
                            </div>
                            
                            {/* Search and Filter Bar */}
                            <div className="flex flex-col lg:flex-row gap-6 mb-8">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="Search products by name, SKU, or category..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm focus:shadow-md transition-all text-lg"
                                        />
                                    </div>
                                </div>
                                <div className="w-full lg:w-64">
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm focus:shadow-md transition-all text-lg font-medium"
                                    >
                                        {categories.map(category => (
                                            <option key={category} value={category}>
                                                {category === 'all' ? 'All Categories' : category}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            {/* Products Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                {filteredProducts.map(product => {
                                    return (
                                        <PremiumProductCard
                                            key={`${product.id}-${product.storeId}`}
                                            product={product}
                                            onAddToCart={addToCart}
                                        />
                                    );
                                })}
                                
                                {filteredProducts.length === 0 && !loading && (
                                    <div className="col-span-full text-center py-16">
                                        <div className="bg-gray-100 p-6 rounded-2xl w-24 h-24 mx-auto flex items-center justify-center mb-6">
                                            <Package className="w-12 h-12 text-gray-400" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No products found</h3>
                                        <p className="text-gray-500 text-lg">Try adjusting your search or filter criteria</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {!loading && pincode && stores.length === 0 && (
                    <div className="max-w-2xl mx-auto">
                        <div className="text-center py-16">
                            <div className="bg-gray-100 p-6 rounded-2xl w-24 h-24 mx-auto flex items-center justify-center mb-6">
                                <Store className="w-12 h-12 text-gray-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">No stores found</h3>
                            <p className="text-gray-500 text-lg mb-2">We couldn't find any stores for pincode {pincode}</p>
                            <p className="text-gray-400">Try another pincode or contact support</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StoreFinder;