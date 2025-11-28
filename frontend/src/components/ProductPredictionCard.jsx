import React from 'react';
import ModelSection from './ModelSection';

const ProductPredictionCard = ({ product }) => {
    if (!product) return null;

    // Get trend indicator
    const getTrendIndicator = (finalPrediction) => {
        if (!finalPrediction || !finalPrediction.trend) return null;
        
        return {
            text: finalPrediction.trend.charAt(0).toUpperCase() + finalPrediction.trend.slice(1),
            color: finalPrediction.trend === 'upward' ? 'text-green-600' : 
                   finalPrediction.trend === 'downward' ? 'text-red-600' : 'text-yellow-600'
        };
    };

    // Get confidence color
    const getConfidenceColor = (confidence) => {
        switch (confidence?.toLowerCase()) {
            case 'high': return 'text-green-600 bg-green-100';
            case 'medium': return 'text-yellow-600 bg-yellow-100';
            case 'low': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const trend = getTrendIndicator(product.final_prediction);

    return (
        <div className="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{product.product_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Stock: {product.current_stock} units
                            </span>
                            {trend && (
                                <span className={`flex items-center text-sm font-medium ${trend.color}`}>
                                    {trend.text} Trend
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-600 dark:text-gray-400">7-Day Sales</div>
                        <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                            {product.total_sales_7_days}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4">
                {product.final_prediction && (
                    <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Final Prediction (Fused)</h4>
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Tomorrow's Sales</p>
                                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                        {product.final_prediction.value} units
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Range: {product.final_prediction.range} units
                                    </p>
                                </div>
                                {product.final_prediction.confidence && (
                                    <span className={`px-3 py-1 text-sm rounded-full ${getConfidenceColor(product.final_prediction.confidence)}`}>
                                        {product.final_prediction.confidence.charAt(0).toUpperCase() + product.final_prediction.confidence.slice(1)} Confidence
                                    </span>
                                )}
                            </div>
                            
                            {trend && (
                                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        {product.final_prediction.trend === 'upward' && '📈 Demand is rising slowly.'}
                                        {product.final_prediction.trend === 'downward' && '📉 Demand is decreasing.'}
                                        {product.final_prediction.trend === 'stable' && '➡️ Demand is stable.'}
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                        {product.current_stock > 0 && 
                                            `📦 Your stock will last approximately ${Math.floor(product.current_stock / product.final_prediction.value)} more days.`}
                                    </p>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            This is the final prediction combining all 5 models. It's more accurate than any single model because it uses the strengths of each approach.
                        </p>
                    </div>
                )}

                <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">ML Model Predictions</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        Each model looks at your data in a different way to predict sales. The final prediction combines all of them.
                    </p>
                    {product.models && Object.entries(product.models).map(([modelName, modelData]) => (
                        <ModelSection 
                            key={modelName}
                            model={modelData}
                            modelName={modelName}
                            product={product}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductPredictionCard;