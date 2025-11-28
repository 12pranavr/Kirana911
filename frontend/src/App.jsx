import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './services/supabase';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Finance from './pages/Finance';
import Forecast from './pages/Forecast';
import Predictions from './pages/Predictions';

import Customers from './pages/Customers';
import Sales from './pages/Sales';
import Transactions from './pages/Transactions';
import MLModelsPage from './pages/MLModelsPage';
import Login from './pages/Login';
import PublicProducts from './pages/PublicProducts';
import Landing from './pages/Landing';
import CustomerEngagement from './pages/CustomerEngagement';
import StoreFinder from './pages/StoreFinder';
import StoreProducts from './pages/StoreProducts';
import AdminStores from './pages/AdminStores';

function App() {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    return (
        <ThemeProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSpatPath: true }}>
                <Routes>
                    {/* Public routes - accessible to everyone */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/products" element={<PublicProducts />} />
                    <Route path="/stores" element={<StoreFinder />} />
                    <Route path="/store/:storeId/products" element={<StoreProducts />} />
                    
                    {/* Authentication routes */}
                    <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" />} />
                    
                    {/* Protected routes - only accessible to authenticated users */}
                    <Route path="/dashboard" element={session ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />} />
                    <Route path="/inventory" element={session ? <Layout><Inventory /></Layout> : <Navigate to="/login" />} />
                    <Route path="/sales" element={session ? <Layout><Sales /></Layout> : <Navigate to="/login" />} />
                    <Route path="/transactions" element={session ? <Layout><Transactions /></Layout> : <Navigate to="/login" />} />
                    <Route path="/customers" element={session ? <Layout><Customers /></Layout> : <Navigate to="/login" />} />
                    <Route path="/finance" element={session ? <Layout><Finance /></Layout> : <Navigate to="/login" />} />
                    <Route path="/forecast" element={session ? <Layout><Forecast /></Layout> : <Navigate to="/login" />} />
                    <Route path="/predictions" element={session ? <Layout><Predictions /></Layout> : <Navigate to="/login" />} />
                    <Route path="/ml-models" element={session ? <Layout><MLModelsPage /></Layout> : <Navigate to="/login" />} />
                    <Route path="/customer-engagement" element={session ? <Layout><CustomerEngagement /></Layout> : <Navigate to="/login" />} />
                    <Route path="/admin/stores" element={session ? <Layout><AdminStores /></Layout> : <Navigate to="/login" />} />
                    
                    {/* Redirect unknown routes */}
                    <Route path="*" element={<Navigate to={session ? "/dashboard" : "/"} />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;