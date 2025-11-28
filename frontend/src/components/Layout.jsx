import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, DollarSign, TrendingUp, LogOut, Users, ShoppingCart, Receipt, Sun, Moon, Brain, BarChart3, UserCheck, Store, Globe } from 'lucide-react';
import { supabase } from '../services/supabase';
import ChatWidget from './ChatWidget';
import { useTheme } from '../context/ThemeContext';

const Layout = ({ children }) => {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState('owner'); // default to owner

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                setUser(authUser);
                
                // Fetch user role and name from the users table
                const { data: userData, error } = await supabase
                    .from('users')
                    .select('role, name')
                    .eq('email', authUser.email)
                    .single();
                
                if (!error && userData) {
                    setUserRole(userData.role);
                }
            }
        };
        
        fetchUserData();
    }, []);

    // Different navigation items based on user role
    const navItems = userRole === 'admin' 
        ? [
            { path: '/admin/stores', label: 'Store Management', icon: Store },
        ]
        : [
            { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/marketplace', label: 'Marketplace', icon: Globe },
            { path: '/sales', label: 'New Sale', icon: ShoppingCart },
            { path: '/transactions', label: 'Transactions', icon: Receipt },
            { path: '/inventory', label: 'Inventory', icon: Package },
            { path: '/customers', label: 'Customers', icon: Users },
            { path: '/finance', label: 'Finance', icon: DollarSign },
            { path: '/forecast', label: 'Forecast', icon: TrendingUp },
            { path: '/predictions', label: 'Predictions', icon: BarChart3 },
            { path: '/customer-engagement', label: 'Engagement', icon: UserCheck },
        ];

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
            {/* Sidebar */}
            <div className="w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col transition-colors duration-200">
                <div className="p-6 border-b dark:border-gray-700">
                    <h1 className="text-2xl font-bold text-primary dark:text-indigo-400">KIRANA911</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Smart Inventory System</p>
                </div>
                <nav className="mt-6 flex-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isActive ? 'bg-indigo-50 dark:bg-gray-700 text-primary dark:text-indigo-400 border-r-4 border-primary' : ''
                                    }`}
                            >
                                <Icon className="w-5 h-5 mr-3" />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}</nav>
                <div className="p-4 border-t dark:border-gray-700">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
                <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center transition-colors duration-200">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                        {navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
                    </h2>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                            title="Toggle Dark Mode"
                        >
                            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </button>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Welcome, {user ? (user.user_metadata?.full_name || user.email.split('@')[0]) : (userRole === 'admin' ? 'Administrator' : 'Shop Owner')}
                        </span>
                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-primary dark:text-indigo-300 font-bold">
                            {user ? (user.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0) : user.email.charAt(0)) : 'K'}
                        </div>
                    </div>
                </header>
                <main className="p-6">
                    {children}
                </main>
            </div>

            {/* Chat Widget - Floating */}
            <ChatWidget />
        </div>
    );
};

export default Layout;