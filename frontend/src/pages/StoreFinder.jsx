import React, { useState, useEffect } from 'react';
import { Search, MapPin, Phone, Star, Clock, Store, Package, TrendingUp, ShoppingCart, Plus, Minus, User, Filter, X, Check, Navigation } from 'lucide-react';
import storesService from '../services/stores';
import { useNavigate } from 'react-router-dom';
import PremiumProductCard from '../components/PremiumProductCard';
import CartPreview from '../components/CartPreview';
import api from '../services/api';

const StoreFinder = () => {
    const [searchMethod, setSearchMethod] = useState('pincode'); // 'pincode' or 'location'
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
    const [locationStatus, setLocationStatus] = useState('idle'); // 'idle', 'detecting', 'detected', 'error'
    const [userLocation, setUserLocation] = useState(null); // { latitude, longitude }
    const navigate = useNavigate();

    // Handle location detection
    const detectLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setLocationStatus('detecting');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ latitude, longitude });
                setLocationStatus('detected');
                // Automatically search for nearby stores
                handleLocationSearch(latitude, longitude);
            },
            (error) => {
                setLocationStatus('error');
                setError('Unable to retrieve your location. Please try entering a pincode instead.');
                console.error('Geolocation error:', error);
            }
        );
    };

    const handlePincodeSearch = async (e) => {
        e.preventDefault();
        if (!pincode.trim()) {
            setError('Please enter a pincode');
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const nearbyStores = await storesService.getNearbyStores(pincode);
            processStoresData(nearbyStores);
        } catch (err) {
            console.error('Error fetching stores:', err);
            setError('Failed to fetch stores. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLocationSearch = async (latitude, longitude) => {
        setLoading(true);
        setError(null);
        
        try {
            const nearbyStores = await storesService.getNearbyStoresByLocation(latitude, longitude);
            processStoresData(nearbyStores, latitude, longitude);
        } catch (err) {
            console.error('Error fetching stores:', err);
            setError('Failed to fetch stores. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const processStoresData = async (storesData, userLat, userLon) => {
        // Add distance information to stores if using location search
        if (searchMethod === 'location' && (userLat && userLon)) {
            console.log('Processing stores with user location:', { latitude: userLat, longitude: userLon });
            const storesWithDistance = storesData.map(store => {
                if (store.latitude && store.longitude) {
                    const distance = calculateDistance(
                        userLat, 
                        userLon, 
                        store.latitude, 
                        store.longitude
                    );
                    console.log(`Store ${store.name}: ${distance}km from user`);
                    return { ...store, distance: distance.toFixed(1) };
                }
                return { ...store, distance: 'N/A' };
            });
            setStores(storesWithDistance);
        } else {
            setStores(storesData);
        }
        
        // Fetch products for all stores
        const allStoreProducts = [];
        for (const store of storesData) {
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
    };

    // Calculate distance between two points using haversine formula
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth radius in kilometers
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // Distance in kilometers
        return distance;
    };

    const deg2rad = (deg) => {
        return deg * (Math.PI/180);
    };

    const toggleStoreDetails = (storeId) => {
        setExpandedStore(expandedStore === storeId ? null : storeId);
    };

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

    const calculateCartTotal = () => {
        return cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
    };

    const handlePlaceOrder = async () => {
        if (!showCustomerForm) {
            setShowCustomerForm(true);
            return;
        }
        
        if (!customerDetails.name || !customerDetails.phone || !customerDetails.address) {
            alert('Please fill in all required customer details');
            return;
        }

        // Group items by store
        const itemsByStore = {};
        cart.forEach(item => {
            if (!itemsByStore[item.storeId]) {
                itemsByStore[item.storeId] = [];
            }
            itemsByStore[item.storeId].push({
                product_id: item.id,
                quantity: item.quantity
            });
        });

        // Create separate orders for each store
        const orderPromises = Object.keys(itemsByStore).map(async (storeId) => {
            const items = itemsByStore[storeId];
            
            // Get store info
            const store = stores.find(s => s.id === storeId);
            
            const saleData = {
                customer_id: null, // Anonymous customer
                items: items,
                payment_method: 'online',
                notes: `Online order from store finder. Customer: ${customerDetails.name}, Phone: ${customerDetails.phone}, Address: ${customerDetails.address}, Landmark: ${customerDetails.landmark || 'N/A'}`,
                source: 'online', // Mark as online order
                customer_details: customerDetails,
                intended_store_id: storeId
            };

            try {
                const response = await api.post('/transactions/create', saleData);
                return { storeId, success: true, data: response.data };
            } catch (error) {
                console.error(`Error placing order for store ${storeId}:`, error);
                return { storeId, success: false, error: error.message };
            }
        });

        try {
            const results = await Promise.all(orderPromises);
            const successfulOrders = results.filter(r => r.success);
            const failedOrders = results.filter(r => !r.success);
            
            if (successfulOrders.length > 0) {
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
                
                if (failedOrders.length > 0) {
                    alert(`Orders placed successfully for ${successfulOrders.length} store(s). Failed for ${failedOrders.length} store(s). Check console for details.`);
                } else {
                    alert('Order(s) placed successfully!');
                }
            } else {
                alert('Failed to place orders. Please try again.');
            }
        } catch (error) {
            console.error('Error placing orders:', error);
            alert('Failed to place orders. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 p-2 rounded-lg">
                                <Store className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-gray-900">Kirana911</h1>
                        </div>
                        <button 
                            onClick={() => setShowCart(true)}
                            className="relative p-2 text-gray-600 hover:text-gray-900"
                        >
                            <ShoppingCart className="w-6 h-6" />
                            {cart.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {cart.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl p-8 mb-8">
                    <div className="max-w-3xl mx-auto text-center">
                        <h1 className="text-3xl md:text-4xl font-bold mb-4">Find Your Nearest Kirana Store</h1>
                        <p className="text-lg mb-6 opacity-90">Discover stores near you and start shopping instantly</p>
                        
                        {/* Location Method Toggle */}
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-1 mb-6 inline-flex">
                            <button
                                onClick={() => setSearchMethod('pincode')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    searchMethod === 'pincode' 
                                        ? 'bg-white text-blue-600 shadow' 
                                        : 'text-white/80 hover:text-white'
                                }`}
                            >
                                Enter Pincode
                            </button>
                            <button
                                onClick={() => setSearchMethod('location')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    searchMethod === 'location' 
                                        ? 'bg-white text-blue-600 shadow' 
                                        : 'text-white/80 hover:text-white'
                                }`}
                            >
                                Use My Location
                            </button>
                        </div>

                        {/* Search Form */}
                        {searchMethod === 'pincode' ? (
                            <form onSubmit={handlePincodeSearch} className="max-w-md mx-auto">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="flex-1 relative">
                                        <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5" />
                                        <input
                                            type="text"
                                            value={pincode}
                                            onChange={(e) => setPincode(e.target.value)}
                                            placeholder="Enter your pincode"
                                            className="w-full pl-12 pr-4 py-4 bg-white rounded-xl focus:ring-2 focus:ring-white focus:border-transparent text-gray-900 placeholder-gray-500 shadow-lg transition-all"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-lg disabled:opacity-70 flex items-center justify-center"
                                    >
                                        {loading ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                        ) : (
                                            <Search className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="max-w-md mx-auto">
                                {locationStatus === 'idle' && (
                                    <button
                                        onClick={detectLocation}
                                        className="px-6 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-lg flex items-center justify-center gap-2 mx-auto"
                                    >
                                        <Navigation className="w-5 h-5" />
                                        Detect My Location
                                    </button>
                                )}
                                
                                {locationStatus === 'detecting' && (
                                    <div className="px-6 py-4 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center gap-3">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Detecting your location...</span>
                                    </div>
                                )}
                                
                                {locationStatus === 'detected' && (
                                    <div className="px-6 py-4 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center gap-2">
                                        <Check className="w-5 h-5 text-green-300" />
                                        <span>Location detected successfully!</span>
                                    </div>
                                )}
                                
                                {locationStatus === 'error' && (
                                    <button
                                        onClick={detectLocation}
                                        className="px-6 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-lg flex items-center justify-center gap-2 mx-auto"
                                    >
                                        <Navigation className="w-5 h-5" />
                                        Try Again
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="max-w-2xl mx-auto mb-8">
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                            <div className="bg-red-100 p-2 rounded-lg">
                                <X className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-red-800">Error</h3>
                                <p className="text-red-700 text-sm mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="max-w-2xl mx-auto mb-8">
                        <div className="bg-white rounded-2xl shadow-sm p-8">
                            <div className="flex flex-col items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                                <p className="text-gray-600">Finding stores near you...</p>
                            </div>
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
                                        Found {stores.length} store{stores.length !== 1 ? 's' : ''} near you
                                    </h2>
                                    {searchMethod === 'pincode' ? (
                                        <p className="text-gray-600 mt-2">Stores in pincode {pincode}</p>
                                    ) : (
                                        <p className="text-gray-600 mt-2">Within 5km radius from your location</p>
                                    )}

                                </div>
                                <div className="flex gap-3">
                                    <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-xl flex items-center gap-2">
                                        <Package className="w-4 h-4" />
                                        <span className="font-medium">{allProducts.length} products</span>
                                    </div>
                                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-xl flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" />
                                        <span className="font-medium">Verified</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Stores Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {stores.map((store) => (
                                    <div key={store.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
                                        {store.image_url ? (
                                            <img 
                                                src={store.image_url} 
                                                alt={store.name}
                                                className="w-full h-48 object-cover"
                                            />
                                        ) : (
                                            <div className="bg-gray-100 w-full h-48 flex items-center justify-center">
                                                <Store className="w-12 h-12 text-gray-400" />
                                            </div>
                                        )}
                                        
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="text-xl font-bold text-gray-900">{store.name}</h3>
                                                <div className="flex items-center bg-yellow-100 px-2 py-1 rounded-lg">
                                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                                    <span className="text-sm text-gray-700 ml-1 font-semibold">4.8</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-start mb-4">
                                                <MapPin className="w-5 h-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                                                <p className="text-gray-600 text-sm">{store.address}</p>
                                            </div>
                                            
                                            {/* Distance indicator for location search */}
                                            {searchMethod === 'location' && store.distance && (
                                                <div className="flex items-center mb-4 text-sm">
                                                    <Navigation className="w-4 h-4 text-blue-500 mr-2" />
                                                    <span className="text-gray-700">{store.distance} km away</span>
                                                </div>
                                            )}
                                            
                                            {/* Pincode badge for pincode search */}
                                            {searchMethod === 'pincode' && (
                                                <div className="flex items-center mb-4">
                                                    <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                                                        {store.pincode}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center">
                                                    <Phone className="w-4 h-4 text-gray-500 mr-2" />
                                                    <span className="text-sm text-gray-700">{store.phone || 'N/A'}</span>
                                                </div>
                                                <div className="ml-3">
                                                    <div className="font-semibold text-gray-900 text-sm">{store.phone || 'N/A'}</div>
                                                    <div className="text-xs text-gray-500">Contact</div>
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
                                            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                                        />
                                    </div>
                                </div>
                                
                                <div className="w-full lg:w-64">
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                                    >
                                        <option value="all">All Categories</option>
                                        <option value="groceries">Groceries</option>
                                        <option value="dairy">Dairy</option>
                                        <option value="bakery">Bakery</option>
                                        <option value="beverages">Beverages</option>
                                        <option value="snacks">Snacks</option>
                                    </select>
                                </div>
                            </div>
                            
                            {/* Products Grid */}
                            {filteredProducts.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {filteredProducts.map((product) => (
                                        <PremiumProductCard 
                                            key={`${product.storeId}-${product.id}`}
                                            product={product}
                                            onAddToCart={addToCart}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <div className="bg-gray-100 p-6 rounded-2xl w-24 h-24 mx-auto flex items-center justify-center mb-6">
                                        <Package className="w-12 h-12 text-gray-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">No products found</h3>
                                    <p className="text-gray-500 text-lg">Try adjusting your search or filter criteria</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!loading && (
                    (searchMethod === 'pincode' && pincode && stores.length === 0) ||
                    (searchMethod === 'location' && locationStatus === 'detected' && stores.length === 0)
                ) && (
                    <div className="max-w-2xl mx-auto">
                        <div className="text-center py-16">
                            <div className="bg-gray-100 p-6 rounded-2xl w-24 h-24 mx-auto flex items-center justify-center mb-6">
                                <Store className="w-12 h-12 text-gray-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">No stores found</h3>
                            {searchMethod === 'pincode' ? (
                                <p className="text-gray-500 text-lg mb-2">We couldn't find any stores for pincode {pincode}</p>
                            ) : (
                                <p className="text-gray-500 text-lg mb-2">We couldn't find any stores within 5km of your location</p>
                            )}
                            <p className="text-gray-400">Try another search method or contact support</p>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Cart Preview Sidebar */}
            {showCart && (
                <CartPreview 
                    isOpen={showCart}
                    onClose={() => setShowCart(false)}
                    cartItems={cart}
                    onUpdateQuantity={updateCartQuantity}
                    onRemoveItem={removeFromCart}
                    onCheckout={handlePlaceOrder}
                    totalAmount={calculateCartTotal()}
                />
            )}

            {/* Customer Form Modal */}
            {showCustomerForm && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCustomerForm(false)}></div>
                        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-6 pt-6 pb-4 sm:p-8 sm:pb-6">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-2xl leading-6 font-bold text-gray-900 mb-6">Customer Information</h3>
                                        <div className="mt-4 space-y-5">
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
                                </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-4 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-2xl">
                                <button
                                    type="button"
                                    onClick={handlePlaceOrder}
                                    className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-lg px-6 py-3 bg-blue-600 text-base font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-300 transform hover:-translate-y-0.5"
                                >
                                    Place Order
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCustomerForm(false)}
                                    className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default StoreFinder;