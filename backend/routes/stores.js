const express = require('express');
const router = express.Router();
const supabase = require('../services/supabaseClient');

// Middleware to check if user is admin
const checkAdmin = async (req, res, next) => {
    try {
        // Get the authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authorization header missing or invalid' });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        // Verify the token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Get user's role from our users table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('email', user.email)
            .single();

        if (userError) {
            return res.status(500).json({ error: 'Failed to fetch user data: ' + userError.message });
        }

        // Check if user is admin
        if (userData.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
        }

        // Attach user information to the request object
        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Authentication failed: ' + error.message });
    }
};

// Public route - Get nearby stores by pincode (no authentication required)
router.get('/nearby/:pincode', async (req, res) => {
    try {
        const { pincode } = req.params;
        
        const { data, error } = await supabase
            .from('stores')
            .select('*')
            .eq('pincode', pincode)
            .eq('is_active', true);
            
        if (error) return res.status(500).json({ error: error.message });
        
        res.json(data);
    } catch (error) {
        console.error('Error fetching nearby stores:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Public route - Get nearby stores by geolocation (no authentication required)
router.get('/nearby-location', async (req, res) => {
    try {
        const { latitude, longitude } = req.query;
        
        if (!latitude || !longitude) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }
        
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        
        // Get all active stores
        const { data: stores, error } = await supabase
            .from('stores')
            .select('*')
            .eq('is_active', true);
            
        if (error) return res.status(500).json({ error: error.message });
        
        // Filter stores within 5km range using haversine formula
        const nearbyStores = stores.filter(store => {
            if (!store.latitude || !store.longitude) return false;
            
            const distance = calculateDistance(lat, lon, store.latitude, store.longitude);
            // Debug logging
            console.log(`Store ${store.name}: ${distance}km from user (${lat}, ${lon})`);
            return distance <= 5; // Within 5km
        });
        
        console.log(`Found ${nearbyStores.length} stores within 5km`);
        res.json(nearbyStores);
    } catch (error) {
        console.error('Error fetching nearby stores by location:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Helper function to calculate distance between two points using haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in kilometers
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

// Public route - Get store products (no authentication required)
router.get('/:id/products', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data, error } = await supabase
            .from('products')
            .select('*, stock_levels(current_stock)')
            .eq('store_id', id);
            
        if (error) return res.status(500).json({ error: error.message });
        
        res.json(data);
    } catch (error) {
        console.error('Error fetching store products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Public route - Get current user's store (authentication required)
router.get('/user-store', async (req, res) => {
    try {
        // Get the authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authorization header missing or invalid' });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        // Verify the token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Get user's store from our users table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('store_id')
            .eq('email', user.email)
            .single();

        if (userError) {
            return res.status(500).json({ error: 'Failed to fetch user data: ' + userError.message });
        }

        // If user doesn't have a store, return null
        if (!userData.store_id) {
            return res.json(null);
        }

        // Get the store information
        const { data: storeData, error: storeError } = await supabase
            .from('stores')
            .select('*')
            .eq('id', userData.store_id)
            .single();

        if (storeError) {
            return res.status(500).json({ error: 'Failed to fetch store data: ' + storeError.message });
        }

        res.json(storeData);
    } catch (error) {
        console.error('Error fetching user store:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// Apply admin middleware to all routes below this point
router.use(checkAdmin);

// Get all stores (admin only)
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('stores')
            .select('*')
            .order('name');
            
        if (error) return res.status(500).json({ error: error.message });
        
        res.json(data);
    } catch (error) {
        console.error('Error fetching stores:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get store by ID (admin only)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data, error } = await supabase
            .from('stores')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) return res.status(500).json({ error: error.message });
        
        res.json(data);
    } catch (error) {
        console.error('Error fetching store:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new store (admin only)
router.post('/create', async (req, res) => {
    try {
        const { name, email, password, phone, address, pincode, latitude, longitude, image_url } = req.body;
        
        // Validate required fields
        if (!name || !email || !pincode) {
            return res.status(400).json({ error: 'Name, email, and pincode are required' });
        }
        
        // Validate password for new stores
        if (!password) {
            return res.status(400).json({ error: 'Password is required for new stores' });
        }
        
        // Create store
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .insert([{
                name,
                email,
                phone: phone || '',
                address: address || '',
                pincode,
                latitude: latitude || null,
                longitude: longitude || null,
                image_url: image_url || null,
                is_active: true
            }])
            .select()
            .single();
            
        if (storeError) {
            console.error('Store creation error:', storeError);
            return res.status(500).json({ error: storeError.message });
        }
        
        // Create owner user for the store with custom password
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true
        });
        
        if (authError) {
            console.error('Auth user creation error:', authError);
            // Delete the store if user creation fails
            await supabase.from('stores').delete().eq('id', store.id);
            return res.status(500).json({ error: 'Failed to create store owner account: ' + authError.message });
        }
        
        // Link user to store
        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert([{
                name: name + ' Owner',
                email: email,
                password_hash: 'supabase_managed',
                role: 'owner',
                store_id: store.id
            }])
            .select()
            .single();
            
        if (userError) {
            console.error('User linking error:', userError);
            // Delete the store and auth user if user linking fails
            await supabase.from('stores').delete().eq('id', store.id);
            await supabase.auth.admin.deleteUser(authUser.user.id);
            return res.status(500).json({ error: 'Failed to link owner to store: ' + userError.message });
        }
        
        res.json({
            message: 'Store created successfully',
            store,
            owner_credentials: {
                email: email,
                password: password
            }
        });
    } catch (error) {
        console.error('Error creating store:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// Update store (admin only)
router.post('/update', async (req, res) => {
    try {
        const { id, name, email, phone, address, pincode, latitude, longitude, is_active, image_url } = req.body;
        
        const { data, error } = await supabase
            .from('stores')
            .update({
                name,
                email,
                phone,
                address,
                pincode,
                latitude,
                longitude,
                image_url,
                is_active,
                updated_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();
            
        if (error) return res.status(500).json({ error: error.message });
        
        res.json({ message: 'Store updated successfully', store: data });
    } catch (error) {
        console.error('Error updating store:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// Delete store (admin only)
router.post('/remove', async (req, res) => {
    try {
        const { id } = req.body;
        
        // First, get all related data to delete
        console.log(`Deleting store with ID: ${id}`);
        
        // 1. Delete all sales records for this store
        const { error: salesError } = await supabase
            .from('sales')
            .delete()
            .eq('products.store_id', id);
            
        if (salesError) {
            console.error('Error deleting sales:', salesError);
            // Continue with deletion even if some operations fail
        } else {
            console.log('Sales records deleted');
        }
        
        // 2. Delete all products for this store
        const { error: productsError } = await supabase
            .from('products')
            .delete()
            .eq('store_id', id);
            
        if (productsError) {
            console.error('Error deleting products:', productsError);
            // Continue with deletion even if some operations fail
        } else {
            console.log('Products deleted');
        }
        
        // 3. Delete all transactions for this store
        const { error: transactionsError } = await supabase
            .from('transactions')
            .delete()
            .eq('store_id', id);
            
        if (transactionsError) {
            console.error('Error deleting transactions:', transactionsError);
            // Continue with deletion even if some operations fail
        } else {
            console.log('Transactions deleted');
        }
        
        // 4. Delete all budgets for this store
        const { error: budgetError } = await supabase
            .from('budget')
            .delete()
            .eq('store_id', id);
            
        if (budgetError) {
            console.error('Error deleting budgets:', budgetError);
            // Continue with deletion even if some operations fail
        } else {
            console.log('Budgets deleted');
        }
        
        // 5. Delete the store owner user account
        // First, get the store owner's email
        const { data: storeData, error: storeError } = await supabase
            .from('stores')
            .select('email')
            .eq('id', id)
            .single();
            
        if (storeError) {
            console.error('Error fetching store:', storeError);
            // Continue with deletion even if we can't get store data
        } else {
            // Get the user ID for the store owner
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('email', storeData.email)
                .single();
                
            if (!userError && userData) {
                // Delete the store owner user from our users table
                const { error: deleteUserError } = await supabase
                    .from('users')
                    .delete()
                    .eq('id', userData.id);
                    
                if (deleteUserError) {
                    console.error('Error deleting user record:', deleteUserError);
                } else {
                    console.log('User record deleted');
                }
            }
        }
        
        // 6. Finally, delete the store itself
        const { error: deleteStoreError } = await supabase
            .from('stores')
            .delete()
            .eq('id', id);
            
        if (deleteStoreError) {
            console.error('Error deleting store:', deleteStoreError);
            return res.status(500).json({ error: 'Failed to delete store: ' + deleteStoreError.message });
        }
        
        console.log('Store deleted successfully');
        res.json({ message: 'Store and all related data deleted successfully' });
    } catch (error) {
        console.error('Error deleting store:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

module.exports = router;