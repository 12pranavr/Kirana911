import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { 
    LayoutDashboard, 
    Package, 
    ShoppingCart, 
    Users, 
    DollarSign, 
    TrendingUp, 
    BarChart3, 
    UserCheck, 
    Store,
    LogOut,
    Moon,
    Sun,
    Menu,
    X,
    Receipt,
    Globe
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ChatWidget from './ChatWidget';
import storesService from '../services/stores';

const Layout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [userName, setUserName] = useState('');
    const [storeInfo, setStoreInfo] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    // Get user role from users table
                    const { data: userData, error } = await supabase
                        .from('users')
                        .select('role, name')
                        .eq('email', user.email)
                        .single();
                    
                    if (!error && userData) {
                        setUserRole(userData.role);
                        setUserName(userData.name || user.email);
                        
                        // If user is an owner, fetch store information
                        if (userData.role === 'owner') {
                            try {
                                const storeData = await storesService.getCurrentUserStore();
                                setStoreInfo(storeData);
                            } catch (storeError) {
                                console.error('Error fetching store data:', storeError);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
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
            // { path: '/marketplace', label: 'Marketplace', icon: Globe },  // Removed marketplace
            { path: '/sales', label: 'New Sale', icon: ShoppingCart },
            { path: '/transactions', label: 'Transactions', icon: Receipt },
            { path: '/inventory', label: 'Inventory', icon: Package },
            { path: '/customers', label: 'Customers', icon: Users },
            { path: '/finance', label: 'Finance', icon: DollarSign },
            { path: '/forecast', label: 'Forecast', icon: TrendingUp },
            // { path: '/predictions', label: 'Predictions', icon: BarChart3 },  // Removed predictions
            { path: '/customer-engagement', label: 'Engagement', icon: UserCheck },
        ];

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-2 rounded-lg shadow-lg">
                            <Store className="h-6 w-6 text-white" />
                        </div>
                        <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">Kirana<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700">911</span></span>
                    </div>
                    <button 
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>
                
                <nav className="mt-6 px-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 mb-1 ${
                                location.pathname === item.path
                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <item.icon className="h-5 w-5 mr-3" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
                
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                <span className="text-white text-sm font-medium">
                                    {userName ? userName.charAt(0).toUpperCase() : 'U'}
                                </span>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{userName || 'User'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{userRole || 'owner'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <button
                        onClick={toggleTheme}
                        className="flex items-center justify-center w-full p-3 mb-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-300"
                    >
                        {theme === 'dark' ? (
                            <>
                                <Sun className="h-5 w-5 mr-2" />
                                <span>Light Mode</span>
                            </>
                        ) : (
                            <>
                                <Moon className="h-5 w-5 mr-2" />
                                <span>Dark Mode</span>
                            </>
                        )}
                    </button>
                    
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center w-full p-3 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all duration-300"
                    >
                        <LogOut className="h-5 w-5 mr-2" />
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile header */}
                <header className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between h-16 px-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        <div className="flex items-center">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-1 rounded-lg shadow-lg">
                                <Store className="h-6 w-6 text-white" />
                            </div>
                            <span className="ml-2 text-lg font-bold text-gray-900 dark:text-white">Kirana<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700">911</span></span>
                        </div>
                        <div className="w-6"></div> {/* Spacer for symmetry */}
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 md:p-6">
                    {children}
                </main>
                {/* Chat Widget */}
                <ChatWidget userName={userName} storeInfo={storeInfo} />
            </div>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}
        </div>
    );
};

export default Layout;