import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Store, TrendingUp, Users, Shield, ArrowRight } from 'lucide-react';

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Navigation */}
            <nav className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Store className="w-8 h-8 text-blue-600" />
                        <span className="text-2xl font-bold text-gray-800">KiranaStore</span>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                        >
                            Owner Login
                        </button>
                        <button
                            onClick={() => navigate('/products')}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 transition-colors"
                        >
                            Shop Now
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="container mx-auto px-4 py-16 md:py-24">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                        Your Neighborhood
                        <span className="text-blue-600 block">Kirana Store Online</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                        Fresh groceries and essentials delivered right to your doorstep. 
                        Shop from our curated selection of quality products at competitive prices.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate('/stores')}
                            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg flex items-center justify-center gap-2 transition-colors shadow-lg"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            Find Stores Near Me
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-8 py-4 bg-white text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-lg transition-colors"
                        >
                            Store Owner Portal
                        </button>
                    </div>
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
                        <div key={index} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                            <div className="mb-4">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                            <p className="text-gray-600">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-16">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-white mb-6">Ready to Shop?</h2>
                    <p className="text-blue-100 text-xl mb-8 max-w-2xl mx-auto">
                        Join thousands of satisfied customers enjoying the convenience of online grocery shopping
                    </p>
                    <button
                        onClick={() => navigate('/products')}
                        className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 font-medium text-lg flex items-center justify-center gap-2 mx-auto transition-colors shadow-lg"
                    >
                        Browse Our Products
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center gap-2 mb-4 md:mb-0">
                            <Store className="w-8 h-8 text-blue-400" />
                            <span className="text-2xl font-bold">KiranaStore</span>
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