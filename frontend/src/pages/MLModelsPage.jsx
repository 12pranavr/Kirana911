import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle, CheckCircle, ChevronDown, ChevronRight, Brain } from 'lucide-react';
import ProductPredictionCard from '../components/ProductPredictionCard';
import { fetchMLPredictions } from '../services/ml_models';

const MLModelsPage = () => {
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [expandedProduct, setExpandedProduct] = useState(null);

    useEffect(() => {
        loadPredictions();
    }, []);

    const loadPredictions = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchMLPredictions();
            
            if (data.success) {
                setPredictions(data.predictions || []);
                setLastUpdated(new Date(data.generated_at));
            } else {
                setError(data.error || 'Failed to load predictions');
            }
        } catch (err) {
            console.error('Error loading predictions:', err);
            setError('Failed to load predictions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (date) => {
        return date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown';
    };

    const toggleProduct = (productId) => {
        setExpandedProduct(expandedProduct === productId ? null : productId);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🤖 Smart Sales Predictions (High Accuracy Mode)</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        AI-powered predictions with data cleaning, normalization, and accuracy fusion
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={loadPredictions}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-2">
                    {error ? (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : loading ? (
                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {error ? 'Error loading predictions' : 
                         loading ? 'Loading predictions...' : 
                         `Loaded ${predictions.length} products`}
                    </span>
                </div>
                
                {!loading && !error && lastUpdated && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Last updated: {formatTime(lastUpdated)}
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="font-medium text-red-800 dark:text-red-200">Error</span>
                    </div>
                    <p className="mt-1 text-red-700 dark:text-red-300">{error}</p>
                    <button
                        onClick={loadPredictions}
                        className="mt-3 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">7-Day Sales</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Prediction</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Trend</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Confidence</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {[1, 2, 3, 4].map((i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Results - Profile Table */}
            {!loading && !error && (
                <div className="space-y-6">
                    {predictions.length === 0 ? (
                        <div className="text-center py-12">
                            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No predictions available</h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                There are no products with sufficient sales data for prediction.
                            </p>
                        </div>
                    ) : (
                        <div className="card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Product</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">7-Day Sales</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Prediction</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Trend</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Confidence</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {predictions.map((product) => {
                                            const isExpanded = expandedProduct === product.product_id;
                                            
                                            return (
                                                <React.Fragment key={product.product_id}>
                                                    <tr 
                                                        className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${isExpanded ? 'bg-gray-50 dark:bg-gray-700' : ''}`}
                                                        onClick={() => toggleProduct(product.product_id)}
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{product.product_name}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900 dark:text-white">{product.current_stock} units</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900 dark:text-white">{product.total_sales_7_days}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                                                {product.final_prediction?.value || 0} units
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                {product.final_prediction?.range || '0-0'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {product.final_prediction?.trend && (
                                                                <span className={`inline-flex items-center text-sm font-medium ${
                                                                    product.final_prediction.trend === 'upward' ? 'text-green-600' : 
                                                                    product.final_prediction.trend === 'downward' ? 'text-red-600' : 'text-yellow-600'
                                                                }`}>
                                                                    {product.final_prediction.trend === 'upward' && '↑ Up'}
                                                                    {product.final_prediction.trend === 'downward' && '↓ Down'}
                                                                    {product.final_prediction.trend === 'stable' && '→ Stable'}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {product.final_prediction?.confidence && (
                                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                                    product.final_prediction.confidence === 'high' ? 'text-green-600 bg-green-100' : 
                                                                    product.final_prediction.confidence === 'medium' ? 'text-yellow-600 bg-yellow-100' : 'text-red-600 bg-red-100'
                                                                }`}>
                                                                    {product.final_prediction.confidence.charAt(0).toUpperCase() + product.final_prediction.confidence.slice(1)}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                            <div className="flex items-center">
                                                                {isExpanded ? (
                                                                    <ChevronDown className="w-5 h-5" />
                                                                ) : (
                                                                    <ChevronRight className="w-5 h-5" />
                                                                )}
                                                                <span className="ml-1">{isExpanded ? 'Collapse' : 'Expand'}</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {isExpanded && (
                                                        <tr>
                                                            <td colSpan="7" className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
                                                                <ProductPredictionCard product={product} />
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    <strong>How to use this page:</strong> Click on any product row to see detailed predictions. 
                                    The final prediction combines all 5 machine learning models for the most accurate forecast.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Info Section */}
            {!loading && !error && predictions.length > 0 && (
                <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="p-4">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                            <Brain className="w-5 h-5" />
                            How This High-Accuracy Prediction Works
                        </h3>
                        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                            <li>• <strong>Data Preprocessing:</strong> Outliers removed, missing values filled with stock-based estimation</li>
                            <li>• <strong>5 ML Models:</strong> Linear Regression, Weighted Moving Average, Holt-Winters, Random Forest, and Gemini AI</li>
                            <li>• <strong>Accuracy Fusion:</strong> Weighted combination of all models for stable, precise forecasts</li>
                            <li>• <strong>Narrow Ranges:</strong> Predictions with tight confidence intervals (±1-2 units)</li>
                            <li>• <strong>User-Friendly:</strong> Clear explanations and actionable insights</li>
                        </ul>
                        <p className="text-sm text-blue-800 dark:text-blue-200 mt-3">
                            <strong>Tip:</strong> Pay attention to the confidence level and trend indicators. High confidence predictions are more reliable for stock decisions.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MLModelsPage;