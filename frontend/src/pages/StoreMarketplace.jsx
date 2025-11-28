import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { Store, Globe, MapPin, Phone, Star, ExternalLink } from 'lucide-react';

const StoreMarketplace = () => {
    const [userStore, setUserStore] = useState(null);
    const [nearbyStores, setNearbyStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUserStore();
    }, []);

    const fetchUserStore = async () => {
        try {
            // Get the current user's store information
            const userResponse = await api.get('/stores/user-store');
            if (userResponse.data) {
                setUserStore(userResponse.data);
                
                // Get nearby stores in the same pincode
                if (userResponse.data.pincode) {
                    const nearbyResponse = await api.get(`/stores/nearby/${userResponse.data.pincode}`);
                    setNearbyStores(nearbyResponse.data || []);
                }
            }
        } catch (err) {
            console.error('Error fetching store data:', err);
            setError('Failed to load store data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">🏪 Store Marketplace</h1>
                <Link 
                    to="/admin/stores" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                    Manage Stores
                </Link>
            </div>

            {/* User's Own Store Card */}
            {userStore ? (
                <div className="card bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold">Your Store</h2>
                            <h3 className="text-2xl font-bold mt-1">{userStore.name}</h3>
                            <div className="mt-3 space-y-1">
                                <div className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-2" />
                                    <span>{userStore.address || 'Address not provided'}, {userStore.pincode}</span>
                                </div>
                                {userStore.phone && (
                                    <div className="flex items-center">
                                        <Phone className="w-4 h-4 mr-2" />
                                        <span>{userStore.phone}</span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    userStore.is_active 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {userStore.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <Link 
                                to={`/store/${userStore.id}/products`}
                                className="inline-flex items-center bg-white text-indigo-600 px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
                            >
                                View Products
                                <ExternalLink className="w-4 h-4 ml-1" />
                            </Link>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card bg-yellow-50 border-l-4 border-yellow-400">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                You don't have a store registered yet. Contact your administrator to register your store.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Nearby Stores Section */}
            <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">📍 Nearby Stores</h2>
                
                {nearbyStores.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {nearbyStores
                            .filter(store => store.id !== userStore?.id) // Exclude user's own store
                            .map((store) => (
                            <div key={store.id} className="card hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800 dark:text-white">{store.name}</h3>
                                        <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                            <div className="flex items-center">
                                                <MapPin className="w-4 h-4 mr-2" />
                                                <span>{store.address || 'Address not provided'}, {store.pincode}</span>
                                            </div>
                                            {store.phone && (
                                                <div className="flex items-center">
                                                    <Phone className="w-4 h-4 mr-2" />
                                                    <span>{store.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-3 flex items-center">
                                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                            <span className="ml-1 text-sm text-gray-600 dark:text-gray-300">4.5 (128 reviews)</span>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        store.is_active 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {store.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="mt-4 flex space-x-2">
                                    <Link 
                                        to={`/store/${store.id}/products`}
                                        className="flex-1 text-center bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                                    >
                                        View Products
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card text-center py-12">
                        <Globe className="w-12 h-12 mx-auto text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No nearby stores found</h3>
                        <p className="mt-1 text-gray-500 dark:text-gray-400">
                            There are no other stores registered in your area yet.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StoreMarketplace;