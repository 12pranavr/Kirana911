import React, { useState } from 'react';
import { supabase } from '../services/supabase.js';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, ArrowRight, Store } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [mode, setMode] = useState('login'); // 'login' or 'register'
    const navigate = useNavigate();

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'register') {
                console.log('Attempting to register user:', email);
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                console.log('Registration response:', data, error);
                if (error) throw error;
                alert('Registration successful! Please check your email for confirmation or try logging in.');
                setMode('login');
            } else {
                console.log('Attempting to login user:', email);
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                console.log('Login response:', data, error);
                if (error) throw error;
                
                // Check if user exists in our users table
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', email)
                    .single();
                
                console.log('User data from database:', userData, userError);
                
                if (userError && userError.code !== 'PGRST116') {
                    throw userError;
                }
                
                // If user doesn't exist in our table, create them
                if (!userData) {
                    console.log('User not found in users table, creating...');
                    const { data: newUser, error: createError } = await supabase
                        .from('users')
                        .insert([
                            {
                                name: email.split('@')[0],
                                email: email,
                                password_hash: 'supabase_managed', // We don't store passwords in our table
                                role: 'owner' // Default to owner for new registrations
                            }
                        ])
                        .select()
                        .single();
                    
                    console.log('Created user:', newUser, createError);
                    if (createError) throw createError;
                }
                
                navigate('/dashboard');
            }
        } catch (err) {
            console.error('Authentication error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md mx-4">
                <div className="text-center mb-8">
                    <div className="mx-auto bg-gradient-to-r from-blue-600 to-indigo-700 p-3 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 shadow-lg">
                        <Store className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {mode === 'login' ? 'Login to KIRANA911' : 'Register New Account'}
                    </h2>
                    <p className="text-gray-500 mt-2">
                        {mode === 'login' ? 'Access your store dashboard' : 'Create your store account'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-6 text-sm shadow-sm">
                        <div className="flex items-center">
                            <div className="bg-red-200 p-1 rounded-lg mr-3">
                                <Lock className="w-4 h-4 text-red-700" />
                            </div>
                            <span>Error: {error}</span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm focus:shadow-md transition-all"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm focus:shadow-md transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn btn-primary flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </>
                        ) : (
                            <>
                                <User className="w-5 h-5" />
                                {mode === 'login' ? 'Login to Dashboard' : 'Create Account'}
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    {mode === 'login' ? (
                        <p>
                            Don't have an account?{' '}
                            <button 
                                onClick={() => setMode('register')} 
                                className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                            >
                                Register here
                            </button>
                        </p>
                    ) : (
                        <p>
                            Already have an account?{' '}
                            <button 
                                onClick={() => setMode('login')} 
                                className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                            >
                                Login here
                            </button>
                        </p>
                    )}
                </div>
                
                <div className="mt-6 text-center text-xs text-gray-500">
                    <p>Use test@kirana911.com / password123 for testing</p>
                </div>
            </div>
        </div>
    );
};

export default Login;