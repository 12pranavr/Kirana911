import React, { useState } from 'react';
import { Search, MapPin, Phone, Star, Clock, Store } from 'lucide-react';
import storesService from '../services/stores';
import { useNavigate } from 'react-router-dom';

const StoreFinder = () => {
    const [pincode, setPincode] = useState('');
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
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
        } catch (err) {
            console.error('Error fetching stores:', err);
            setError('Failed to fetch stores. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleStoreSelect = (storeId) => {
        // Navigate to store products page
        navigate(`/store/${storeId}/products`);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Store className="w-6 h-6 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-800">🏪 Kirana Store Finder</h1>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-12">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-4">Find Your Nearest Kirana Store</h2>
                    <p className="text-xl mb-8">Enter your pincode to discover stores near you</p>
                </div>
            </div>

            {/* Search Section */}
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <form onSubmit={handleSearch} className="mb-8">
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    value={pincode}
                                    onChange={(e) => setPincode(e.target.value)}
                                    placeholder="Enter your pincode"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-5 h-5" />
                                        Search
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {error && (
                        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    {/* Results Section */}
                    {stores.length > 0 ? (
                        <div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-6">
                                Found {stores.length} store{stores.length !== 1 ? 's' : ''} near {pincode}
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {stores.map(store => (
                                    <div 
                                        key={store.id} 
                                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
                                        onClick={() => handleStoreSelect(store.id)}
                                    >
                                        <div className="p-5">
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="font-bold text-lg text-gray-800">{store.name}</h3>
                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                    {store.pincode}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center mb-2">
                                                <MapPin className="w-4 h-4 text-gray-500 mr-2" />
                                                <p className="text-sm text-gray-600">{store.address}</p>
                                            </div>
                                            
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center">
                                                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                                    <span className="text-sm text-gray-700 ml-1">4.5</span>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    <span>10-20 mins</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-gray-600">
                                                    <Phone className="inline w-4 h-4 mr-1" />
                                                    {store.phone}
                                                </div>
                                                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">
                                                    View Products
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : !loading && pincode && (
                        <div className="text-center py-12">
                            <Store className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 text-lg">No stores found for pincode {pincode}</p>
                            <p className="text-gray-400 mt-2">Try another pincode or contact support</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StoreFinder;