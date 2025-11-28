import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';

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
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <h2 className="text-2xl font-bold text-center text-primary mb-6">
                    {mode === 'login' ? 'Login to KIRANA911' : 'Register New Account'}
                </h2>

                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
                        Error: {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full border rounded-md p-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full border rounded-md p-2"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white py-2 rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : (mode === 'login' ? 'Login' : 'Register')}
                    </button>
                </form>

                <div className="mt-4 text-center text-sm">
                    {mode === 'login' ? (
                        <p>
                            Don't have an account?{' '}
                            <button onClick={() => setMode('register')} className="text-primary hover:underline">
                                Register
                            </button>
                        </p>
                    ) : (
                        <p>
                            Already have an account?{' '}
                            <button onClick={() => setMode('login')} className="text-primary hover:underline">
                                Login
                            </button>
                        </p>
                    )}
                </div>
                
                <div className="mt-4 text-center text-xs text-gray-500">
                    <p>Use test@kirana911.com / password123 for testing</p>
                </div>
            </div>
        </div>
    );
};

export default Login;