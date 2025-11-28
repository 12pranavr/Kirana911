import React from 'react';
import { Star, Truck, Package } from 'lucide-react';

const PremiumProductCard = ({ 
    product, 
    onAddToCart, 
    showVendor = true,
    showDelivery = true,
    showRatings = true
}) => {
    // Extract stock information
    const stock = product.stock_levels?.[0]?.current_stock || product.stock || 0;
    const isInStock = stock > 0;
    
    // Extract pricing information
    const price = product.selling_price || product.price || 0;
    
    // Extract image information (if available)
    // Handle case where image_url field might not exist yet
    const imageUrl = (product.hasOwnProperty('image_url') ? product.image_url : null) || product.image || null;
    
    return (
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 group transform hover:-translate-y-1">
            {/* Product Image Area */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 aspect-square flex items-center justify-center p-4 relative overflow-hidden">
                {imageUrl ? (
                    <img 
                        src={imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-contain rounded-xl"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            // Create fallback element
                            const fallback = document.createElement('div');
                            fallback.className = 'bg-white rounded-lg w-full h-full flex items-center justify-center border border-gray-200';
                            fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-12 h-12 text-gray-300"><line x1="16" y1="8" x2="2" y2="21"></line><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path><polyline points="16 8 2 21"></polyline><line x1="5" y1="15" x2="16" y2="8"></line></svg>';
                            e.target.parentNode.replaceChild(fallback, e.target);
                        }}
                    />
                ) : (
                    <div className="bg-white rounded-xl w-full h-full flex items-center justify-center border border-gray-200 shadow-inner">
                        <Package className="w-12 h-12 text-gray-300" />
                    </div>
                )}
                
                {/* Stock Badge */}
                <div className="absolute top-3 right-3">
                    {isInStock ? (
                        <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full shadow-sm">
                            {stock} left
                        </span>
                    ) : (
                        <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded-full shadow-sm">
                            Out of Stock
                        </span>
                    )}
                </div>
            </div>
            
            <div className="p-5">
                {/* Product Title */}
                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-base leading-tight mb-2 line-clamp-2">
                    {product.name}
                </h3>
                
                {/* Vendor Tag */}
                {showVendor && product.storeName && (
                    <div className="flex items-center mb-3">
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full truncate">
                            {product.storeName}
                        </span>
                    </div>
                )}
                
                {/* Product Details */}
                <div className="flex flex-col gap-3">
                    {/* Price and Ratings */}
                    <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700">
                            ₹{price.toFixed(2)}
                        </span>
                        
                        {showRatings && (
                            <div className="flex items-center bg-gray-100 px-2 py-1 rounded-lg">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="text-sm text-gray-700 ml-1 font-semibold">4.5</span>
                            </div>
                        )}
                    </div>
                    
                    {/* Delivery Info */}
                    {showDelivery && (
                        <div className="flex items-center text-xs text-gray-500">
                            <Truck className="w-3 h-3 mr-1" />
                            <span>Delivery in 10-15 mins</span>
                        </div>
                    )}
                    
                    {/* Add to Cart Button */}
                    <button
                        onClick={() => onAddToCart && onAddToCart(product)}
                        disabled={!isInStock}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 ${
                            !isInStock
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800 shadow-lg hover:shadow-xl'
                        }`}
                    >
                        {!isInStock ? (
                            <>
                                <Package className="w-4 h-4" />
                                Out of Stock
                            </>
                        ) : (
                            <>
                                <Package className="w-4 h-4" />
                                Add to Cart
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PremiumProductCard;