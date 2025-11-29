import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Package, Star, MapPin, Phone, Store as StoreIcon, X, Plus, Minus, Clock, Truck, TrendingUp, Heart, Navigation, Edit } from 'lucide-react';
import PremiumProductCard from './PremiumProductCard';
import ProductDiscoverySection from './ProductDiscoverySection';
import storesService from '../services/stores';
import { supabase } from '../services/supabase';

const StoreTemplate = ({ 
    store, 
    products, 
    loading, 
    error, 
    onRetry,
    onAddToCart,
    onUpdateCartQuantity,
    onRemoveFromCart,
    onPlaceOrder,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    cart,
    showCart,
    setShowCart,
    customerDetails,
    setCustomerDetails,
    showCustomerForm,
    setShowCustomerForm,
    discoveryData
}) => {
    const [filteredProducts, setFilteredProducts] = useState([]);
    const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
    
    // Location update state
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [locationData, setLocationData] = useState({
        latitude: '',
        longitude: '',
        pincode: ''
    });
    const [updatingLocation, setUpdatingLocation] = useState(false);
    const [locationUpdateError, setLocationUpdateError] = useState('');
    const [locationUpdateSuccess, setLocationUpdateSuccess] = useState(false);

    // Filter products based on search term and category
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

    // Initialize location data when store changes
    useEffect(() => {
        if (store) {
            setLocationData({
                latitude: store.latitude || '',
                longitude: store.longitude || '',
                pincode: store.pincode || ''
            });
        }
    }, [store]);

    const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];
    
    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
    };

    // Handle location update
    const handleLocationUpdate = async () => {
        if (!store) return;
        
        setUpdatingLocation(true);
        setLocationUpdateError('');
        setLocationUpdateSuccess(false);
        
        try {
            // Validate inputs
            if (!locationData.pincode) {
                throw new Error('Pincode is required');
            }
            
            // Update store location
            const updateData = {
                id: store.id,
                latitude: locationData.latitude ? parseFloat(locationData.latitude) : null,
                longitude: locationData.longitude ? parseFloat(locationData.longitude) : null,
                pincode: locationData.pincode
            };
            
            await storesService.updateStore(updateData);
            
            setLocationUpdateSuccess(true);
            
            // Hide modal after success
            setTimeout(() => {
                setShowLocationModal(false);
                setLocationUpdateSuccess(false);
            }, 2000);
        } catch (err) {
            console.error('Error updating location:', err);
            setLocationUpdateError(err.message || 'Failed to update location. Please try again.');
        } finally {
            setUpdatingLocation(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <svg className="animate-spin h-16 w-16 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-6 text-xl font-semibold text-gray-700">Loading store products...</p>
                    <p className="mt-2 text-gray-500">Please wait while we fetch the latest items</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <div className="bg-red-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Error Loading Products</h3>
                    <p className="text-gray-600 mb-8">{error}</p>
                    <button
                        onClick={onRetry}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Cart Sidebar */}
            {showCart && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowCart(false)}></div>
                    <div className="absolute inset-y-0 right-0 max-w-full flex">
                        <div className="relative w-screen max-w-md">
                            <div className="h-full flex flex-col bg-white shadow-xl rounded-l-2xl">
                                <div className="flex-1 overflow-y-auto py-6 px-6 sm:px-6">
                                    <div className="flex items-start justify-between">
                                        <h2 className="text-2xl font-bold text-gray-900">Your Shopping Cart</h2>
                                        <button 
                                            onClick={() => setShowCart(false)}
                                            className="ml-3 h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>

                                    <div className="mt-8">
                                        {cart.length === 0 ? (
                                            <div className="text-center py-16">
                                                <div className="bg-gray-100 p-5 rounded-2xl w-24 h-24 mx-auto flex items-center justify-center mb-6">
                                                    <ShoppingCart className="mx-auto h-10 w-10 text-gray-400" />
                                                </div>
                                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                                                <p className="text-gray-500 mb-6">Start adding some products to your cart</p>
                                                <button
                                                    onClick={() => setShowCart(false)}
                                                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 font-medium"
                                                >
                                                    Continue Shopping
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flow-root">
                                                <ul className="-my-6 divide-y divide-gray-200">
                                                    {cart.map((item) => (
                                                        <li key={item.id} className="py-6 flex">
                                                            <div className="ml-4 flex-1 flex flex-col">
                                                                <div>
                                                                    <div className="flex justify-between text-base font-medium text-gray-900">
                                                                        <h3 className="font-semibold">{item.name}</h3>
                                                                        <p className="ml-4 font-bold">₹{(item.selling_price * item.quantity).toFixed(2)}</p>
                                                                    </div>
                                                                    <p className="mt-1 text-sm text-gray-500">₹{item.selling_price} each</p>
                                                                </div>
                                                                <div className="flex-1 flex items-end justify-between text-sm mt-3">
                                                                    <div className="flex items-center border border-gray-200 rounded-xl">
                                                                        <button
                                                                            onClick={() => onUpdateCartQuantity(item.id, item.quantity - 1)}
                                                                            className="px-3 py-2 text-gray-600 hover:text-gray-800 rounded-l-xl hover:bg-gray-50 transition-colors"
                                                                        >
                                                                            <Minus className="h-4 w-4" />
                                                                        </button>
                                                                        <span className="px-3 py-2 font-medium">{item.quantity}</span>
                                                                        <button
                                                                            onClick={() => onUpdateCartQuantity(item.id, item.quantity + 1)}
                                                                            className="px-3 py-2 text-gray-600 hover:text-gray-800 rounded-r-xl hover:bg-gray-50 transition-colors"
                                                                        >
                                                                            <Plus className="h-4 w-4" />
                                                                        </button>
                                                                    </div>

                                                                    <button
                                                                        onClick={() => onRemoveFromCart(item.id)}
                                                                        type="button"
                                                                        className="font-medium text-red-600 hover:text-red-500 transition-colors"
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
                                    <div className="border-t border-gray-200 py-6 px-6 sm:px-6">
                                        <div className="flex justify-between text-base font-bold text-gray-900 mb-2">
                                            <p>Subtotal</p>
                                            <p>₹{calculateTotal().toFixed(2)}</p>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-6">Shipping and taxes calculated at checkout.</p>
                                        <div className="mt-2">
                                            <button
                                                onClick={onPlaceOrder}
                                                className="w-full bg-blue-600 border border-transparent rounded-xl shadow-lg py-4 px-4 text-base font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:-translate-y-0.5"
                                            >
                                                {showCustomerForm ? 'Confirm Order' : 'Proceed to Checkout'}
                                            </button>
                                        </div>
                                        <div className="mt-4 flex justify-center text-sm text-center text-gray-500">
                                            <button
                                                type="button"
                                                className="text-blue-600 font-semibold hover:text-blue-500 transition-colors"
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
                                    onClick={onPlaceOrder}
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

            {/* Header with Store Info */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-xl">
                            <StoreIcon className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {store ? store.name : '🏪 Kirana Store'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setShowCart(true)}
                            className="relative p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                        >
                            <ShoppingCart className="w-6 h-6" />
                            {cartItemCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg">
                                    {cartItemCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Store Banner */}
            {store && (
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-8">
                    <div className="container mx-auto px-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                {(store.hasOwnProperty('image_url') && store.image_url) ? (
                                    <img 
                                        src={store.image_url} 
                                        alt={store.name} 
                                        className="w-20 h-20 rounded-2xl object-cover border-4 border-white/30 shadow-xl"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.style.display = 'none';
                                            // Create fallback element
                                            const fallback = document.createElement('div');
                                            fallback.className = 'bg-white/20 p-4 rounded-2xl';
                                            fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-12 h-12"><path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/></svg>';
                                            e.target.parentNode.replaceChild(fallback, e.target);
                                        }}
                                    />
                                ) : (
                                    <div className="bg-white/20 p-4 rounded-2xl">
                                        <StoreIcon className="w-12 h-12" />
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-3xl font-bold">{store.name}</h2>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                                        <div className="flex items-center">
                                            <MapPin className="w-4 h-4 mr-1" />
                                            <span className="text-sm">{store.address || 'Address not provided'}, {store.pincode}</span>
                                        </div>
                                        {store.phone && (
                                            <div className="flex items-center">
                                                <Phone className="w-4 h-4 mr-1" />
                                                <span className="text-sm">{store.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Truck className="w-5 h-5" />
                                    <div>
                                        <div className="font-semibold">Fast Delivery</div>
                                        <div className="text-xs opacity-90">Within 30 mins</div>
                                    </div>
                                </div>
                                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2">
                                    <Star className="w-5 h-5 fill-current" />
                                    <div>
                                        <div className="font-semibold">4.8 Rating</div>
                                        <div className="text-xs opacity-90">Excellent service</div>
                                    </div>
                                </div>
                                {/* Update Location Button for Store Owners */}
                                <button 
                                    onClick={() => setShowLocationModal(true)}
                                    className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-white/30 transition-all"
                                >
                                    <Edit className="w-5 h-5" />
                                    <div>
                                        <div className="font-semibold">Update Location</div>
                                        <div className="text-xs opacity-90">Manage store location</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Location Update Modal */}
            {showLocationModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowLocationModal(false)}></div>
                        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-6 pt-6 pb-4 sm:p-8 sm:pb-6">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-2xl leading-6 font-bold text-gray-900 mb-6">Update Store Location</h3>
                                        <div className="mt-4 space-y-5">
                                            <div className="bg-blue-50 p-4 rounded-xl">
                                                <div className="flex items-start">
                                                    <Navigation className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                                                    <p className="text-sm text-blue-700">
                                                        Update your store's location to ensure customers can find you accurately. 
                                                        You can either enter coordinates manually or use the map to select your location.
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Latitude</label>
                                                <input
                                                    type="text"
                                                    value={locationData.latitude}
                                                    onChange={(e) => setLocationData({...locationData, latitude: e.target.value})}
                                                    placeholder="e.g., 28.613939"
                                                    className="mt-1 block w-full border border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Longitude</label>
                                                <input
                                                    type="text"
                                                    value={locationData.longitude}
                                                    onChange={(e) => setLocationData({...locationData, longitude: e.target.value})}
                                                    placeholder="e.g., 77.209021"
                                                    className="mt-1 block w-full border border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Pincode</label>
                                                <input
                                                    type="text"
                                                    value={locationData.pincode}
                                                    onChange={(e) => setLocationData({...locationData, pincode: e.target.value})}
                                                    placeholder="e.g., 123456"
                                                    className="mt-1 block w-full border border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                />
                                            </div>
                                            
                                            {locationUpdateError && (
                                                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                                    <p className="text-red-700 text-sm">{locationUpdateError}</p>
                                                </div>
                                            )}
                                            
                                            {locationUpdateSuccess && (
                                                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                                                    <p className="text-green-700 text-sm">Location updated successfully!</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-4 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-2xl">
                                <button
                                    type="button"
                                    onClick={handleLocationUpdate}
                                    disabled={updatingLocation}
                                    className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-lg px-6 py-3 bg-blue-600 text-base font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50"
                                >
                                    {updatingLocation ? (
                                        <div className="flex items-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Updating...
                                        </div>
                                    ) : (
                                        'Update Location'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowLocationModal(false)}
                                    className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Discovery Sections */}
            {discoveryData && (
                <div className="container mx-auto px-4 py-8">
                    <div className="mb-8">
                        {/* Top Sellers Section */}
                        <ProductDiscoverySection 
                            title="Top Sellers" 
                            products={discoveryData.topSellers} 
                            onAddToCart={onAddToCart}
                            icon={TrendingUp}
                        />

                        {/* New Arrivals Section */}
                        <ProductDiscoverySection 
                            title="New Arrivals" 
                            products={discoveryData.newArrivals} 
                            onAddToCart={onAddToCart}
                            icon={Clock}
                        />

                        {/* Highly Rated Section */}
                        <ProductDiscoverySection 
                            title="Highly Rated" 
                            products={discoveryData.highlyRated} 
                            onAddToCart={onAddToCart}
                            icon={Star}
                        />

                        {/* Trending Section */}
                        <ProductDiscoverySection 
                            title="Trending Now" 
                            products={discoveryData.trending} 
                            onAddToCart={onAddToCart}
                            icon={TrendingUp}
                        />
                    </div>
                </div>
            )}

            {/* Search and Filter Section */}
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-6 mb-8">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search products by name or SKU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm focus:shadow-md transition-all text-lg"
                            />
                        </div>
                    </div>
                    <div className="w-full lg:w-64">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm focus:shadow-md transition-all text-lg font-medium"
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
                                key={product.id}
                                product={product}
                                onAddToCart={onAddToCart}
                            />
                        );
                    })}
                </div>

                {filteredProducts.length === 0 && (
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
    );
};

export default StoreTemplate;