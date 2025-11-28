import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import storesService from '../services/stores';
import { ShoppingCart, Search, Package, Star, MapPin, Phone, Store as StoreIcon } from 'lucide-react';

const StoreProducts = () => {
    const { storeId } = useParams();
    const [store, setStore] = useState(null);
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            
            // Fetch store products
            const storeProducts = await storesService.getStoreProducts(storeId);
            setProducts(storeProducts);
            
            // Set store info from first product (in a real app, you'd have a separate endpoint)
            if (storeProducts.length > 0) {
                // This is a simplification - in reality, you'd fetch store details separately
                setStore({
                    name: "Store Name", // Would come from store details endpoint
                    address: "Store Address", // Would come from store details endpoint
                    phone: "Store Phone" // Would come from store details endpoint
                });
            }
        } catch (err) {
            console.error('Error fetching store data:', err);
            setError('Failed to load store data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Get unique categories for filter
    const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

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
            {/* Header */}
            <header className="bg-white shadow">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <StoreIcon className="w-6 h-6 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-800">🏪 Kirana Store</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="relative p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                            <ShoppingCart className="w-6 h-6" />
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                0
                            </span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Store Info */}
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
                                    <span className="text-sm">{store.address}</span>
                                </div>
                                <div className="flex items-center mt-1">
                                    <Phone className="w-4 h-4 mr-1" />
                                    <span className="text-sm">{store.phone}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
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

                {/* Products Grid */}
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