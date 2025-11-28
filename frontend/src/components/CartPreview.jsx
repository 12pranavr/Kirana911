import React from 'react';
import { X, ShoppingCart, Store, Package, Plus, Minus, Trash2 } from 'lucide-react';

const CartPreview = ({ 
    isOpen, 
    onClose, 
    cartItems, 
    onUpdateQuantity, 
    onRemoveItem, 
    onCheckout,
    totalAmount 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
            <div className="absolute inset-y-0 right-0 max-w-full flex">
                <div className="relative w-screen max-w-md">
                    <div className="h-full flex flex-col bg-white shadow-xl rounded-l-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <ShoppingCart className="w-6 h-6 text-blue-600" />
                                Your Cart
                            </h2>
                            <button 
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {cartItems.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="mx-auto bg-gray-100 p-4 rounded-2xl w-20 h-20 flex items-center justify-center mb-4">
                                        <ShoppingCart className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                                    <p className="text-gray-500">Add some products to your cart</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {cartItems.map((item) => (
                                        <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-2xl">
                                            {/* Product Image */}
                                            <div className="bg-white rounded-xl w-16 h-16 flex-shrink-0 flex items-center justify-center border border-gray-200">
                                                {item.image_url ? (
                                                    <img 
                                                        src={item.image_url} 
                                                        alt={item.name} 
                                                        className="w-full h-full object-contain rounded-xl"
                                                    />
                                                ) : (
                                                    <Package className="w-6 h-6 text-gray-400" />
                                                )}
                                            </div>
                                            
                                            {/* Product Details */}
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-900">{item.name}</h3>
                                                <p className="text-sm text-gray-500 mt-1">{item.storeName}</p>
                                                <div className="flex items-center justify-between mt-3">
                                                    <span className="font-bold text-blue-600">₹{(item.selling_price * item.quantity).toFixed(2)}</span>
                                                    
                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                                            className="p-1 rounded-lg hover:bg-gray-200 transition-colors"
                                                        >
                                                            <Minus className="w-4 h-4 text-gray-600" />
                                                        </button>
                                                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                                                        <button
                                                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                                            className="p-1 rounded-lg hover:bg-gray-200 transition-colors"
                                                        >
                                                            <Plus className="w-4 h-4 text-gray-600" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Remove Button */}
                                            <button
                                                onClick={() => onRemoveItem(item.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {cartItems.length > 0 && (
                            <div className="border-t border-gray-200 p-6">
                                <div className="flex justify-between text-lg font-bold text-gray-900 mb-4">
                                    <span>Total:</span>
                                    <span>₹{totalAmount.toFixed(2)}</span>
                                </div>
                                <button
                                    onClick={onCheckout}
                                    className="w-full btn btn-primary py-3 font-bold"
                                >
                                    Proceed to Checkout
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full mt-3 text-center text-blue-600 font-medium hover:text-blue-800 transition-colors"
                                >
                                    Continue Shopping
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPreview;