import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Store, TrendingUp, Users, Shield, ArrowRight, Package, MapPin, Star } from 'lucide-react';

const Landing = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: <Store className="w-8 h-8 text-blue-600" />,
            title: "Browse Products",
            description: "Explore our wide range of quality products with real-time stock updates"
        },
        {
            icon: <TrendingUp className="w-8 h-8 text-green-600" />,
            title: "Track Orders",
            description: "Monitor your order status and delivery timeline"
        },
        {
            icon: <Users className="w-8 h-8 text-purple-600" />,
            title: "Loyalty Program",
            description: "Earn points and rewards with every purchase"
        },
        {
            icon: <Shield className="w-8 h-8 text-orange-600" />,
            title: "Secure Payments",
            description: "Multiple payment options with bank-grade security"
        }
    ];

    const popularCategories = [
        { name: "Fresh Fruits", icon: "🍎", count: "120+ items" },
        { name: "Vegetables", icon: "🥕", count: "85+ items" },
        { name: "Dairy & Eggs", icon: "🥛", count: "65+ items" },
        { name: "Bakery", icon: "🍞", count: "40+ items" },
        { name: "Beverages", icon: "🥤", count: "90+ items" },
        { name: "Snacks", icon: "🍿", count: "110+ items" }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Navigation */}
            <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-2 rounded-xl shadow-lg">
                            <Store className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900">Kirana<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700">Store</span></span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-4 py-2 text-gray-600 hover:text-blue-600 font-medium transition-colors duration-300"
                        >
                            Owner Login
                        </button>
                        <button
                            onClick={() => navigate('/products')}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 font-medium flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            Shop Now
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="container mx-auto px-4 py-16 md:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="text-center lg:text-left">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                            Your Neighborhood
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700 block mt-2">Kirana Store Online</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto lg:mx-0">
                            Fresh groceries and essentials delivered right to your doorstep. 
                            Shop from our curated selection of quality products at competitive prices.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <button
                                onClick={() => navigate('/stores')}
                                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                <MapPin className="w-5 h-5" />
                                Find Stores Near Me
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="px-8 py-4 bg-white text-gray-800 border border-gray-200 rounded-xl hover:bg-gray-50 font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                Store Owner Portal
                            </button>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-8 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-white transform hover:scale-105 transition-transform duration-300">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Package className="w-5 h-5" />
                                        <span className="font-semibold">Fresh Stock</span>
                                    </div>
                                    <p className="text-sm opacity-90">Daily updated inventory</p>
                                </div>
                                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-white transform hover:scale-105 transition-transform duration-300">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Star className="w-5 h-5 fill-current" />
                                        <span className="font-semibold">4.8 Rating</span>
                                    </div>
                                    <p className="text-sm opacity-90">Customer satisfaction</p>
                                </div>
                                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-white transform hover:scale-105 transition-transform duration-300">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Store className="w-5 h-5" />
                                        <span className="font-semibold">50+ Stores</span>
                                    </div>
                                    <p className="text-sm opacity-90">In your neighborhood</p>
                                </div>
                                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-white transform hover:scale-105 transition-transform duration-300">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-5 h-5" />
                                        <span className="font-semibold">Fast Delivery</span>
                                    </div>
                                    <p className="text-sm opacity-90">Within 30 minutes</p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl shadow-xl transform rotate-12"></div>
                        <div className="absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl shadow-xl transform -rotate-12"></div>
                    </div>
                </div>
            </div>

            {/* Popular Categories */}
            <div className="container mx-auto px-4 py-16 bg-white/50 backdrop-blur-sm rounded-3xl my-8 shadow-lg">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular Categories</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Discover our most sought-after product categories
                    </p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {popularCategories.map((category, index) => (
                        <div 
                            key={index} 
                            className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 text-center group cursor-pointer transform hover:-translate-y-2"
                        >
                            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                                {category.icon}
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                            <p className="text-sm text-gray-500">{category.count}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Features Section */}
            <div className="container mx-auto px-4 py-16">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Us?</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Experience the convenience of modern shopping with the trust of your local kirana store
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <div 
                            key={index} 
                            className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group transform hover:-translate-y-2"
                        >
                            <div className="mb-6 group-hover:scale-110 transition-transform duration-300">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                            <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16 rounded-3xl mx-4 mb-16 shadow-2xl">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Shop?</h2>
                    <p className="text-blue-100 text-xl mb-8 max-w-2xl mx-auto">
                        Join thousands of satisfied customers enjoying the convenience of online grocery shopping
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate('/products')}
                            className="px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-gray-100 font-semibold text-lg flex items-center justify-center gap-3 mx-auto transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                            Browse Our Products
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => navigate('/stores')}
                            className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl hover:bg-white/10 font-semibold text-lg flex items-center justify-center gap-3 mx-auto transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <MapPin className="w-5 h-5" />
                            Find Stores
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center gap-3 mb-4 md:mb-0">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-2 rounded-xl shadow-lg">
                                <Store className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold">Kirana<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Store</span></span>
                        </div>
                        <div className="text-gray-400 text-center md:text-right">
                            <p>&copy; 2025 KiranaStore. All rights reserved.</p>
                            <p className="mt-2 text-sm">Your trusted neighborhood grocery partner</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;