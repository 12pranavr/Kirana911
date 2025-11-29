import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { ShoppingCart, Search, Package, Star, User, MapPin, Phone, Clock, Store, Navigation } from 'lucide-react';
import { playAddToCartSound, playPlaceOrderSound, playButtonClickSound } from '../utils/sound';
import { useNavigate } from 'react-router-dom';

const PublicProducts = () => {
    const navigate = useNavigate();
    
    // Redirect to store finder page
    useEffect(() => {
        navigate('/stores');
    }, [navigate]);
    
    // This component now redirects to the store finder
    // The original functionality has been moved to StoreProducts page
    return null;

    // Mock shops data (in a real app, this would come from an API)
    const mockShops = [
        {
            id: 1,
            name: "Rajesh Kirana Store",
            distance: 0.5, // km
            rating: 4.5,
            address: "123 Main Street, Sector 15",
            phone: "+91 98765 43210",
            delivery_time: "10-15 mins",
            products: []
        },
        {
            id: 2,
            name: "Sharma General Store",
            distance: 0.8,
            rating: 4.2,
            address: "456 Market Road, Sector 12",
            phone: "+91 98765 43211",
            delivery_time: "15-20 mins",
            products: []
        },
        {
            id: 3,
            name: "Prem Grocery Shop",
            distance: 1.2,
            rating: 4.7,
            address: "789 Commercial Complex, Sector 10",
            phone: "+91 98765 43212",
            delivery_time: "20-25 mins",
            products: []
        },
        {
            id: 4,
            name: "Gupta Provision Store",
            distance: 1.4,
            rating: 4.0,
            address: "101 Shopping Center, Sector 8",
            phone: "+91 98765 43213",
            delivery_time: "25-30 mins",
            products: []
        }
    ];

    useEffect(() => {
        fetchProducts();
        // Initialize mock shops
        setShops(mockShops);
    }, []);

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

    const fetchProducts = async () => {
        try {
            const res = await api.get('/inventory/products');
            setProducts(res.data);
            
            // Assign products to shops (mock distribution)
            const updatedShops = [...mockShops];
            res.data.forEach((product, index) => {
                // Distribute products among shops
                const shopIndex = index % updatedShops.length;
                if (!updatedShops[shopIndex].products) {
                    updatedShops[shopIndex].products = [];
                }
                updatedShops[shopIndex].products.push({
                    ...product,
                    stock: product.stock_levels[0]?.current_stock || 0
                });
            });
            setShops(updatedShops);
        } catch (error) {
            console.error("Error fetching products", error);
        }
    };

    const selectShop = (shop) => {
        playButtonClickSound();
        setSelectedShop(shop);
        setShowShopsList(false);
        // Set products to the selected shop's products
        setFilteredProducts(shop.products || []);
    };

    const goBackToShops = () => {
        playButtonClickSound();
        setSelectedShop(null);
        setShowShopsList(true);
        setFilteredProducts(products);
        setSearchTerm('');
        setSelectedCategory('all');
    };

    const addToCart = (product) => {
        playAddToCartSound(); // Play sound when adding to cart
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
                stock: product.stock || product.stock_levels[0]?.current_stock || 0
            }]);
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

    const handlePlaceOrder = async () => {
        playPlaceOrderSound();
        
        // Show customer form if not already shown
        if (!showCustomerForm) {
            setShowCustomerForm(true);
            return;
        }
        
        if (!customerDetails.name || !customerDetails.phone || !customerDetails.address) {
            alert('Please fill in all required customer details');
            return;
        }

        // Use current date/time if custom date is not provided
        const orderDateTime = useCustomDate && orderDate ? new Date(orderDate) : new Date();
        const formattedOrderDate = orderDateTime.toISOString();

        // Prepare items for the API
        const items = cart.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity
        }));

        // For public orders, we'll create them as "online" sales
        const saleData = {
            customer_id: null, // Anonymous customer
            items: items,
            payment_method: 'online',
            notes: `Online order from public website. Customer: ${customerDetails.name}, Phone: ${customerDetails.phone}, Address: ${customerDetails.address}, Landmark: ${customerDetails.landmark || 'N/A'}${selectedShop ? `, Shop: ${selectedShop.name}` : ''}`,
            date: formattedOrderDate,
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
            // Reset date selection
            setOrderDate('');
            setUseCustomDate(false);
            alert('Order placed successfully! Order ID: ' + response.data.transaction_id);
        } catch (error) {
            console.error('Error placing order:', error);
            alert('Failed to place order. Please try again.');
        }
    };

    // Get unique categories for filter
    const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Store className="w-6 h-6 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-800">🏪 Kirana Store</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {selectedShop && (
                            <button 
                                onClick={goBackToShops}
                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
                            >
                                Back to Shops
                            </button>
                        )}
                        <button 
                            onClick={() => {
                                playButtonClickSound(); // Play sound when opening cart
                                setShowCart(!showCart);
                            }}
                            className="relative p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                        >
                            <ShoppingCart className="w-6 h-6" />
                            {cart.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {cart.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-8">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-2">Find Nearby Kirana Stores</h2>
                    <p className="text-lg mb-4">Shop from stores within 1.5km radius</p>
                    {!selectedShop && (
                        <div className="flex items-center justify-center gap-2 text-sm">
                            <Navigation className="w-4 h-4" />
                            <span>Your location detected</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Shop Selection or Products Display */}
            <div className="container mx-auto px-4 py-6">
                {showShopsList && !selectedShop ? (
                    // Shops List View
                    <div>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Nearby Kirana Stores</h2>
                            <p className="text-gray-600">Select a store to browse their products</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {shops
                                .filter(shop => shop.distance <= 1.5) // Filter shops within 1.5km
                                .map(shop => (
                                    <div 
                                        key={shop.id} 
                                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
                                        onClick={() => selectShop(shop)}
                                    >
                                        <div className="p-5">
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="font-bold text-lg text-gray-800">{shop.name}</h3>
                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                    {shop.distance} km away
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center mb-2">
                                                <MapPin className="w-4 h-4 text-gray-500 mr-2" />
                                                <p className="text-sm text-gray-600">{shop.address}</p>
                                            </div>
                                            
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center">
                                                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                                    <span className="text-sm text-gray-700 ml-1">{shop.rating}</span>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    <span>{shop.delivery_time}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-gray-600">
                                                    <Phone className="inline w-4 h-4 mr-1" />
                                                    {shop.phone}
                                                </div>
                                                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">
                                                    View Products
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                        
                        {shops.filter(shop => shop.distance <= 1.5).length === 0 && (
                            <div className="text-center py-12">
                                <Store className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 text-lg">No nearby shops found within 1.5km</p>
                            </div>
                        )}
                    </div>
                ) : (
                    // Products View (either all products or shop-specific)
                    <div>
                        {selectedShop ? (
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <button 
                                        onClick={goBackToShops}
                                        className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                                    >
                                        ← Back to all shops
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Store className="w-8 h-8 text-blue-600" />
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800">{selectedShop.name}</h2>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <MapPin className="w-4 h-4 mr-1" />
                                            <span>{selectedShop.distance} km away • {selectedShop.address}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">All Products</h2>
                                <p className="text-gray-600">Browse all available products</p>
                            </div>
                        )}

                        {/* Filters */}
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

                        {/* Products Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {filteredProducts.map(product => {
                                const stock = product.stock || product.stock_levels[0]?.current_stock || 0;
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
                )}
            </div>

            {/* Shopping Cart Sidebar */}
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
                                            className="text-gray-400 hover:text-gray-500"
                                        >
                                            <span className="sr-only">Close</span>
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="mt-8">
                                        {cart.length === 0 ? (
                                            <div className="text-center py-12">
                                                <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                                <p className="text-gray-500">Your cart is empty</p>
                                            </div>
                                        ) : (
                                            <div className="flow-root">
                                                <ul className="-my-6 divide-y divide-gray-200">
                                                    {cart.map((item) => (
                                                        <li key={item.product_id} className="py-6 flex">
                                                            <div className="ml-4 flex-1 flex flex-col">
                                                                <div>
                                                                    <div className="flex justify-between text-base font-medium text-gray-900">
                                                                        <h3>{item.name}</h3>
                                                                        <p className="ml-4">₹{(item.price * item.quantity).toFixed(2)}</p>
                                                                    </div>
                                                                    <p className="mt-1 text-sm text-gray-500">₹{item.price} each</p>
                                                                </div>
                                                                <div className="flex-1 flex items-end justify-between text-sm">
                                                                    <div className="flex items-center border rounded-md">
                                                                        <button
                                                                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                                                            className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                                                                        >
                                                                            -
                                                                        </button>
                                                                        <span className="px-3 py-1">{item.quantity}</span>
                                                                        <button
                                                                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                                                            className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                                                                        >
                                                                            +
                                                                        </button>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => removeFromCart(item.product_id)}
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
                                        
                                        {/* Customer Details Form */}
                                        {showCustomerForm && (
                                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                                                <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                                                    <h3 className="text-xl font-bold mb-4">Customer Details</h3>
                                                    
                                                    {/* Selected Shop Info */}
                                                    {selectedShop && (
                                                        <div className="mb-4 p-3 bg-blue-50 rounded-md">
                                                            <div className="flex items-center">
                                                                <Store className="w-5 h-5 text-blue-600 mr-2" />
                                                                <span className="font-medium text-blue-800">Ordering from: {selectedShop.name}</span>
                                                            </div>
                                                            <p className="text-sm text-blue-600 mt-1">{selectedShop.address}</p>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Custom Order Date Option */}
                                                    <div className="mb-4">
                                                        <label className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={useCustomDate}
                                                                onChange={(e) => setUseCustomDate(e.target.checked)}
                                                                className="mr-2"
                                                            />
                                                            Specify order date and time
                                                        </label>
                                                        
                                                        {useCustomDate && (
                                                            <div className="mt-2">
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                    Order Date and Time
                                                                </label>
                                                                <input
                                                                    type="datetime-local"
                                                                    value={orderDate}
                                                                    onChange={(e) => setOrderDate(e.target.value)}
                                                                    className="w-full p-2 border border-gray-300 rounded-md"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Full Name <span className="text-red-500">*</span>
                                                        </label>
                                                        <div className="relative">
                                                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                            <input
                                                                type="text"
                                                                value={customerDetails.name}
                                                                onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                placeholder="Enter your full name"
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Phone Number <span className="text-red-500">*</span>
                                                        </label>
                                                        <div className="relative">
                                                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                            <input
                                                                type="tel"
                                                                value={customerDetails.phone}
                                                                onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})}
                                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                placeholder="Enter your phone number"
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Delivery Address <span className="text-red-500">*</span>
                                                        </label>
                                                        <div className="relative">
                                                            <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                                                            <textarea
                                                                value={customerDetails.address}
                                                                onChange={(e) => setCustomerDetails({...customerDetails, address: e.target.value})}
                                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                placeholder="Enter your complete address"
                                                                rows="3"
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Landmark (Optional)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={customerDetails.landmark}
                                                            onChange={(e) => setCustomerDetails({...customerDetails, landmark: e.target.value})}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            placeholder="Nearby landmark for easy delivery"
                                                        />
                                                    </div>

                                                    <div className="flex justify-between mt-4">
                                                        <button
                                                            onClick={() => {
                                                                playButtonClickSound();
                                                                setShowCustomerForm(false);
                                                            }}
                                                            className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={handlePlaceOrder}
                                                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                                        >
                                                            Place Order
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-6">
                                            <button
                                                onClick={() => {
                                                    playButtonClickSound();
                                                    handlePlaceOrder();
                                                }}
                                                className="w-full bg-blue-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                {showCustomerForm ? 'Place Order' : 'Continue to Checkout'}
                                            </button>
                                        </div>
                                        <div className="mt-4 flex justify-center text-sm text-center text-gray-500">
                                            <p>
                                                or{' '}
                                                <button
                                                    type="button"
                                                    className="text-blue-600 font-medium hover:text-blue-500"
                                                    onClick={() => setShowCart(false)}
                                                >
                                                    Continue Shopping<span aria-hidden="true"> &rarr;</span>
                                                </button>
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicProducts;