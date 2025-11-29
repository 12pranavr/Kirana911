import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import storesService from '../services/stores';
import { supabase } from '../services/supabase'; // Import Supabase client
import api from '../services/api';
import StoreTemplate from '../components/StoreTemplate';
import discoveryService from '../services/discovery';
import ProductDiscoverySection from '../components/ProductDiscoverySection';
import { TrendingUp, Clock, Star } from 'lucide-react';

const StoreProducts = () => {
    const { storeId } = useParams();
    const [store, setStore] = useState(null);
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [customerDetails, setCustomerDetails] = useState({
        name: '',
        phone: '',
        address: '',
        landmark: ''
    });
    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const [discoveryData, setDiscoveryData] = useState({
        topSellers: [],
        newArrivals: [],
        highlyRated: [],
        trending: []
    });

    useEffect(() => {
        fetchStoreData();
        fetchDiscoveryData();
    }, [storeId]);

    const fetchDiscoveryData = async () => {
        try {
            const data = await discoveryService.getDiscoveryData();
            setDiscoveryData(data);
        } catch (error) {
            console.error('Error fetching discovery data:', error);
        }
    };

    const fetchStoreData = async () => {
        try {
            setLoading(true);
            setError(null); // Clear any previous errors
            
            // Check if storeId is valid
            if (!storeId) {
                setError('Invalid store ID');
                setLoading(false);
                return;
            }
            
            // First, let's check if the store exists by querying Supabase directly
            const { data: storeData, error: storeError } = await supabase
                .from('stores')
                .select('*')
                .eq('id', storeId)
                .single();

            if (storeError) {
                console.error('Supabase store error:', storeError);
                setError('Store not found. Please check the store ID and try again.');
                setLoading(false);
                return;
            }

            if (!storeData) {
                setError('Store not found. Please check the store ID and try again.');
                setLoading(false);
                return;
            }

            setStore(storeData);
            
            // Fetch store products
            const storeProducts = await storesService.getStoreProducts(storeId);
            setProducts(storeProducts);
        } catch (err) {
            console.error('Error fetching store data:', err);
            setError('Failed to load store data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product) => {
        const stock = product.stock_levels[0]?.current_stock || 0;
        if (stock === 0) return;
        
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                return [...prevCart, { ...product, quantity: 1 }];
            }
        });
    };

    const updateCartQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }
        
        setCart(prevCart => 
            prevCart.map(item => 
                item.id === productId 
                    ? { ...item, quantity: newQuantity } 
                    : item
            )
        );
    };

    const removeFromCart = (productId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    };

    const handlePlaceOrder = async () => {
        // Show customer form if not already shown
        if (!showCustomerForm) {
            setShowCustomerForm(true);
            return;
        }
        
        if (!customerDetails.name || !customerDetails.phone || !customerDetails.address) {
            alert('Please fill in all required customer details');
            return;
        }

        // Prepare items for the API
        const items = cart.map(item => ({
            product_id: item.id,
            quantity: item.quantity
        }));

        // For store orders, we'll create them as "online" sales
        const saleData = {
            customer_id: null, // Anonymous customer
            items: items,
            payment_method: 'online',
            notes: `Online order from store page. Customer: ${customerDetails.name}, Phone: ${customerDetails.phone}, Address: ${customerDetails.address}, Landmark: ${customerDetails.landmark || 'N/A'}, Store: ${store.name}`,
            source: 'online', // Mark as online order
            customer_details: customerDetails // Include customer details
        };

        try {
            const response = await api.post('/transactions/create', saleData);
            console.log('Order response:', response.data);
            setCart([]);
            setShowCart(false);
            setShowCustomerForm(false);
            // Reset customer details
            setCustomerDetails({
                name: '',
                phone: '',
                address: '',
                landmark: ''
            });
            alert('Order placed successfully! Order ID: ' + response.data.transaction_id);
        } catch (error) {
            console.error('Error placing order:', error);
            alert('Failed to place order. Please try again.');
        }
    };

    // Pass all necessary props to the StoreTemplate component
    return (
        <StoreTemplate
            store={store}
            products={products}
            loading={loading}
            error={error}
            onRetry={fetchStoreData}
            onAddToCart={addToCart}
            onUpdateCartQuantity={updateCartQuantity}
            onRemoveFromCart={removeFromCart}
            onPlaceOrder={handlePlaceOrder}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            cart={cart}
            showCart={showCart}
            setShowCart={setShowCart}
            customerDetails={customerDetails}
            setCustomerDetails={setCustomerDetails}
            showCustomerForm={showCustomerForm}
            setShowCustomerForm={setShowCustomerForm}
            discoveryData={discoveryData}
        />
    );
};

export default StoreProducts;