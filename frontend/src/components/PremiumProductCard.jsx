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
    
    return (
        <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 group">
            {/* Product Image Area - Placeholder */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 aspect-square flex items-center justify-center p-4">
                <div className="bg-white rounded-lg w-full h-full flex items-center justify-center border border-gray-200">
                    <Package className="w-12 h-12 text-gray-300" />
                </div>
            </div>
            
            <div className="p-4">
                {/* Product Title */}
                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-base leading-tight mb-2">
                    {product.name}
                </h3>
                
                {/* Vendor Tag */}
                {showVendor && product.storeName && (
                    <div className="flex items-center mb-3">
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full truncate">
                            {product.storeName}
                        </span>
                    </div>
                )}
                
                {/* Product Details */}
                <div className="flex flex-col gap-3">
                    {/* Price and Ratings */}
                    <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-blue-600">₹{price.toFixed(2)}</span>
                        
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
                    
                    {/* Stock Status */}
                    <div className="flex justify-between items-center">
                        {isInStock ? (
                            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                {stock} in stock
                            </span>
                        ) : (
                            <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                Out of stock
                            </span>
                        )}
                        
                        {/* Add to Cart Button */}
                        <button
                            onClick={() => onAddToCart && onAddToCart(product)}
                            disabled={!isInStock}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300 transform hover:-translate-y-0.5 ${
                                !isInStock
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                            }`}
                        >
                            {!isInStock ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PremiumProductCard;