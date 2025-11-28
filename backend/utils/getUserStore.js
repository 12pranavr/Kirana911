const supabase = require('../services/supabaseClient');

const getUserStore = async (req) => {
    try {
        // Get the authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error('Authorization header missing or invalid');
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        // Verify the token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            throw new Error('Invalid or expired token');
        }

        // Get user's store_id from our users table
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('store_id, role')
            .eq('email', user.email)
            .single();

        if (userError) {
            throw new Error('Failed to fetch user data: ' + userError.message);
        }

        return {
            user: {
                ...user,
                store_id: userData.store_id,
                role: userData.role
            },
            store_id: userData.store_id,
            role: userData.role
        };
    } catch (error) {
        console.error('Error getting user store:', error);
        throw error;
    }
};

module.exports = getUserStore;