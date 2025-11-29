import React from 'react';
import { ChevronRight, Star, TrendingUp, Heart, Clock, MapPin } from 'lucide-react';
import PremiumProductCard from './PremiumProductCard';

const ProductDiscoverySection = ({ 
  title, 
  products, 
  onAddToCart,
  icon: Icon,
  showViewAll = false,
  onViewAll
}) => {
  if (!products || products.length === 0) return null;

  // Filter products to only show those from the current store
  const storeProducts = products.slice(0, 10); // Limit to 10 products per section

  if (storeProducts.length === 0) return null;

  return (
    <div className="mb-12">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-xl shadow-lg">
              <Icon className="w-5 h-5 text-white" />
            </div>
          )}
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>
        {showViewAll && onViewAll && (
          <button 
            onClick={onViewAll}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium transition-colors group"
          >
            View All
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>

      {/* Horizontal Scrollable Product Cards */}
      <div className="relative">
        <div className="flex overflow-x-auto gap-6 pb-4 -mx-4 px-4 scrollbar-hide">
          {storeProducts.map((product) => (
            <div key={product.id} className="flex-shrink-0 w-64">
              <PremiumProductCard 
                product={{
                  ...product,
                  storeName: product.stores?.name || 'Local Store'
                }}
                onAddToCart={onAddToCart}
                showVendor={true}
                showDelivery={true}
                showRatings={true}
              />
            </div>
          ))}
        </div>
        
        {/* Gradient overlay for scroll indication */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
};

export default ProductDiscoverySection;