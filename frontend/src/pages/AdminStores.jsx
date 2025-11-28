import React, { useEffect, useState } from 'react';
import storesService from '../services/stores';
import { Plus, Edit, Trash2, Store, MapPin, Phone, Mail, Link as LinkIcon, X } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';

const AdminStores = () => {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingStore, setEditingStore] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        pincode: '',
        latitude: '',
        longitude: '',
        image_url: ''
    });
    const [userRole, setUserRole] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        checkUserRole();
    }, []);

    const checkUserRole = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }

            // Fetch user role from the users table
            const { data: userData, error } = await supabase
                .from('users')
                .select('role')
                .eq('email', user.email)
                .single();

            if (error) {
                console.error('Error fetching user role:', error);
                navigate('/dashboard');
                return;
            }

            setUserRole(userData.role);
            
            // Only allow admins to access this page
            if (userData.role !== 'admin') {
                navigate('/dashboard');
                return;
            }

            fetchStores();
        } catch (err) {
            console.error('Error checking user role:', err);
            navigate('/dashboard');
        }
    };

    const fetchStores = async () => {
        try {
            setLoading(true);
            const storesData = await storesService.getAllStores();
            setStores(storesData);
        } catch (err) {
            console.error('Error fetching stores:', err);
            setError('Failed to fetch stores');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            if (editingStore) {
                // Update existing store
                const storeData = {
                    id: editingStore.id,
                    ...formData,
                    latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                    longitude: formData.longitude ? parseFloat(formData.longitude) : null
                };
                
                await storesService.updateStore(storeData);
            } else {
                // Create new store
                const storeData = {
                    ...formData,
                    latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                    longitude: formData.longitude ? parseFloat(formData.longitude) : null
                };
                
                const result = await storesService.createStore(storeData);
                
                // Show credentials to admin
                alert(`Store created successfully!\nOwner credentials:\nEmail: ${result.owner_credentials.email}\nPassword: ${result.owner_credentials.password}`);
            }
            
            // Reset form and refresh data
            setFormData({
                name: '',
                email: '',
                password: '',
                phone: '',
                address: '',
                pincode: '',
                latitude: '',
                longitude: '',
                image_url: ''
            });
            setEditingStore(null);
            setShowForm(false);
            fetchStores();
        } catch (err) {
            console.error('Error saving store:', err);
            alert('Failed to save store: ' + err.message);
        }
    };

    const handleEdit = (store) => {
        setEditingStore(store);
        setFormData({
            name: store.name,
            email: store.email,
            password: '', // Don't prefill password for security
            phone: store.phone || '',
            address: store.address || '',
            pincode: store.pincode,
            latitude: store.latitude || '',
            longitude: store.longitude || '',
            image_url: store.image_url || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (storeId) => {
        if (!window.confirm('Are you sure you want to delete this store? This will permanently delete:\n\n- All products and inventory data\n- All sales records\n- All transactions\n- All budget data\n- The store owner account\n\nThis action cannot be undone.')) {
            return;
        }
        
        try {
            await storesService.deleteStore(storeId);
            fetchStores();
        } catch (err) {
            console.error('Error deleting store:', err);
            alert('Failed to delete store: ' + err.message);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            phone: '',
            address: '',
            pincode: '',
            latitude: '',
            longitude: '',
            image_url: ''
        });
        setEditingStore(null);
        setShowForm(false);
    };

    // If user is not admin, don't render the component
    if (userRole && userRole !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                    <div className="text-red-500 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                    </div>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Access Denied</h3>
                    <p className="text-gray-500 mb-6">Only administrators can access the store management page.</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">🏪 Store Management</h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add New Store
                </button>
            </div>

            {/* Add/Edit Store Form */}
            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">
                        {editingStore ? 'Edit Store' : 'Add New Store'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Store Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>
                            {!editingStore && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required={!editingStore}
                                            placeholder="Enter password for store owner"
                                        />
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                                <input
                                    type="text"
                                    name="pincode"
                                    value={formData.pincode}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows="2"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                                    <input
                                        type="text"
                                        name="latitude"
                                        value={formData.latitude}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                                    <input
                                        type="text"
                                        name="longitude"
                                        value={formData.longitude}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            
                            {/* Image URL */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Store Image URL</label>
                                <div className="flex items-center">
                                    <div className="relative flex-1">
                                        <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input
                                            type="url"
                                            name="image_url"
                                            value={formData.image_url}
                                            onChange={handleInputChange}
                                            placeholder="https://example.com/store-image.jpg"
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                                {formData.image_url && (
                                    <div className="mt-2">
                                        <img 
                                            src={formData.image_url} 
                                            alt="Store preview" 
                                            className="w-24 h-24 object-cover rounded-md border border-gray-300"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.style.display = 'none';
                                                // Create fallback element
                                                const fallback = document.createElement('div');
                                                fallback.className = 'bg-gray-100 border-2 border-dashed rounded-md w-24 h-24 flex items-center justify-center';
                                                fallback.innerHTML = '<span class="text-gray-400 text-sm">Invalid Image URL</span>';
                                                e.target.parentNode.replaceChild(fallback, e.target);
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                {editingStore ? 'Update Store' : 'Create Store'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Stores List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="mt-2 text-gray-600">Loading stores...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-red-600">
                        {error}
                    </div>
                ) : stores.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No stores found. Add your first store using the "Add New Store" button.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {stores.map((store) => (
                                    <tr key={store.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    {(store.hasOwnProperty('image_url') && store.image_url) ? (
                                                        <img 
                                                            src={store.image_url} 
                                                            alt={store.name} 
                                                            className="h-10 w-10 rounded-full object-cover"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.style.display = 'none';
                                                                // Create fallback element
                                                                const fallback = document.createElement('div');
                                                                fallback.className = 'flex items-center justify-center';
                                                                fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-blue-600"><path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/></svg>';
                                                                e.target.parentNode.replaceChild(fallback, e.target);
                                                            }}
                                                        />
                                                    ) : (
                                                        <Store className="h-6 w-6 text-blue-600" />
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{store.name}</div>
                                                    <div className="text-sm text-gray-500">{store.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{store.phone || 'N/A'}</div>
                                            <div className="text-sm text-gray-500">Pincode: {store.pincode}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{store.address || 'N/A'}</div>
                                            {store.latitude && store.longitude && (
                                                <div className="text-sm text-gray-500">
                                                    {store.latitude}, {store.longitude}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                store.is_active 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {store.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(store)}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(store.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminStores;