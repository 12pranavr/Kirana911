import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { TrendingUp, TrendingDown, Minus, ShoppingCart, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

const getDemandColor = (level) => {
    switch (level) {
        case 'HIGH': return 'bg-green-100 text-green-800 border-green-300';
        case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        case 'LOW': return 'bg-red-100 text-red-800 border-red-300';
        default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
};

const getRecommendationConfig = (recommendation) => {
    switch (recommendation) {
        case 'BUY_MORE':
            return {
                text: '📈 Buy More Stock',
                color: 'text-green-700 bg-green-50 border-green-200',
                icon: ShoppingCart,
                iconColor: 'text-green-600'
            };
        case 'MAINTAIN':
            return {
                text: '➡️ Maintain Current',
                color: 'text-blue-700 bg-blue-50 border-blue-200',
                icon: CheckCircle,
                iconColor: 'text-blue-600'
            };
        case 'REDUCE':
            return {
                text: '⚠️ Reduce Stock',
                color: 'text-orange-700 bg-orange-50 border-orange-200',
                icon: AlertTriangle,
                iconColor: 'text-orange-600'
            };
        case 'IGNORE':
            return {
                text: '❌ Consider Removing',
                color: 'text-red-700 bg-red-50 border-red-200',
                icon: XCircle,
                iconColor: 'text-red-600'
            };
        default:
            return {
                text: recommendation,
                color: 'text-gray-700 bg-gray-50 border-gray-200',
                icon: Minus,
                iconColor: 'text-gray-600'
            };
    }
};

const getTrendIcon = (trend) => {
    switch (trend) {
        case 'RISING': return <TrendingUp className="w-4 h-4 text-green-600" />;
        case 'FALLING': return <TrendingDown className="w-4 h-4 text-red-600" />;
        default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
};

// Get demand level description
const getDemandDescription = (level, avgDailySales) => {
    switch (level) {
        case 'HIGH':
            return `This product sells an average of ${avgDailySales} units per day, which exceeds our high-demand threshold of 5 units/day. These are your best-selling items that require frequent restocking.`;
        case 'MEDIUM':
            return `This product sells an average of ${avgDailySales} units per day, which falls within our medium-demand range of 2-5 units/day. These items have steady sales and should be maintained at moderate stock levels.`;
        case 'LOW':
            return `This product sells an average of ${avgDailySales} units per day, which is below our medium-demand threshold of 2 units/day. These items may need promotional efforts or consideration for removal.`;
        default:
            return 'Product demand level not determined.';
    }
};

// Get trend description
const getTrendDescription = (trend, trendPercent) => {
    switch (trend) {
        case 'RISING':
            return `Sales are increasing by ${Math.abs(trendPercent)}% compared to the previous week. This product is gaining popularity.`;
        case 'FALLING':
            return `Sales are decreasing by ${Math.abs(trendPercent)}% compared to the previous week. This product may be losing popularity.`;
        case 'STABLE':
            return `Sales are stable with minimal change (${trendPercent}%). This product has consistent demand.`;
        default:
            return 'Sales trend not determined.';
    }
};

const Forecast = () => {
    const [productAnalysis, setProductAnalysis] = useState([]);
    const [productsNeverSold, setProductsNeverSold] = useState([]);
    const [correlations, setCorrelations] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchForecast();
    }, []);

    const fetchForecast = async () => {
        try {
            const res = await api.get('/forecast');
            if (res.data.product_analysis) {
                setProductAnalysis(res.data.product_analysis);
                setProductsNeverSold(res.data.products_never_sold || []);
                setCorrelations(res.data.correlations || []);
                setSummary(res.data.summary || {});
            }
        } catch (error) {
            console.error("Error fetching forecast", error);
        } finally {
            setLoading(false);
        }
    };

    const highDemandProducts = productAnalysis.filter(p => p.demand_level === 'HIGH');
    const mediumDemandProducts = productAnalysis.filter(p => p.demand_level === 'MEDIUM');
    const lowDemandProducts = productAnalysis.filter(p => p.demand_level === 'LOW');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">📊 Product Demand Forecast</h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    AI-Powered Demand Analysis
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-700 dark:text-green-400 font-medium">High Demand</p>
                            <p className="text-3xl font-bold text-green-900 dark:text-green-300">{summary.high_demand_products || 0}</p>
                            <p className="text-xs text-green-600 dark:text-green-500 mt-1">Products to stock up</p>
                        </div>
                        <ShoppingCart className="w-12 h-12 text-green-500 opacity-50" />
                    </div>
                </div>

                <div className="card bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">Medium Demand</p>
                            <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-300">{summary.medium_demand_products || 0}</p>
                            <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">Maintain current levels</p>
                        </div>
                        <CheckCircle className="w-12 h-12 text-yellow-500 opacity-50" />
                    </div>
                </div>

                <div className="card bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-700 dark:text-red-400 font-medium">Low Demand</p>
                            <p className="text-3xl font-bold text-red-900 dark:text-red-300">{summary.low_demand_products || 0}</p>
                            <p className="text-xs text-red-600 dark:text-red-500 mt-1">Consider reducing</p>
                        </div>
                        <AlertTriangle className="w-12 h-12 text-red-500 opacity-50" />
                    </div>
                </div>

                <div className="card bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">Never Sold</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{summary.products_never_sold_count || 0}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">No sales yet</p>
                        </div>
                        <XCircle className="w-12 h-12 text-gray-500 opacity-50" />
                    </div>
                </div>
            </div>

            {/* Demand Level Explanation */}
            <div className="card bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Understanding Demand Levels
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-green-200 dark:border-green-700">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 text-xs rounded-full border ${getDemandColor('HIGH')}`}>
                                HIGH
                            </span>
                            <span className="font-semibold text-green-700 dark:text-green-300">High Demand</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                            Products that sell more than 5 units per day on average. These are your best-selling items that require frequent restocking.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-yellow-200 dark:border-yellow-700">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 text-xs rounded-full border ${getDemandColor('MEDIUM')}`}>
                                MEDIUM
                            </span>
                            <span className="font-semibold text-yellow-700 dark:text-yellow-300">Medium Demand</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                            Products that sell between 2-5 units per day. These items have steady sales and should be maintained at moderate stock levels.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-red-200 dark:border-red-700">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 text-xs rounded-full border ${getDemandColor('LOW')}`}>
                                LOW
                            </span>
                            <span className="font-semibold text-red-700 dark:text-red-300">Low Demand</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                            Products that sell fewer than 2 units per day. These items may need promotional efforts or consideration for removal.
                        </p>
                    </div>
                </div>
            </div>

            {/* High Demand Products Section */}
            {highDemandProducts.length > 0 && (
                <div className="card border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
                    <h3 className="text-lg font-bold text-green-900 dark:text-green-300 mb-4 flex items-center gap-2">
                        <ShoppingCart className="w-6 h-6" />
                        🔥 HIGH DEMAND PRODUCTS
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {highDemandProducts.map((product) => (
                            <div key={product.product_id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-300 dark:border-green-700 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">{product.product_name}</h4>
                                    <span className={`px-2 py-1 text-xs rounded-full border ${getDemandColor(product.demand_level)}`}>
                                        {product.demand_level}
                                    </span>
                                </div>
                                <div className="space-y-1 text-sm">
                                    <div className="flex items-center gap-2">
                                        {getTrendIcon(product.trend)}
                                        <span className={`text-sm font-medium ${product.trend === 'RISING' ? 'text-green-600 dark:text-green-400' : product.trend === 'FALLING' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                            {product.trend_percent > 0 ? '+' : ''}{product.trend_percent || 0}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Current Stock:</span>
                                        <span className="font-semibold">{product.current_stock || 0} units</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Avg Daily Sales:</span>
                                        <span className="font-semibold">{product.avg_daily_sales}</span>
                                    </div>
                                </div>
                                {/* Demand Explanation */}
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        <span className="font-medium">Why High Demand:</span> {getDemandDescription('HIGH', product.avg_daily_sales)}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        <span className="font-medium">Trend:</span> {getTrendDescription(product.trend, product.trend_percent)}
                                    </p>
                                </div>
                                {(() => {
                                    const config = getRecommendationConfig(product.recommendation);
                                    const Icon = config.icon;
                                    return (
                                        <div className={`mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between`}>
                                            <div className={`flex items-center gap-2 px-3 py-1 rounded-md border ${config.color}`}>
                                                <Icon className={`w-4 h-4 ${config.iconColor}`} />
                                                <span className="text-xs font-medium">{config.text}</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Medium Demand Products Section */}
            {mediumDemandProducts.length > 0 && (
                <div className="card border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
                    <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-300 mb-4 flex items-center gap-2">
                        <CheckCircle className="w-6 h-6" />
                        ⚖️ MEDIUM DEMAND PRODUCTS
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mediumDemandProducts.map((product) => (
                            <div key={product.product_id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-yellow-300 dark:border-yellow-700 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">{product.product_name}</h4>
                                    <span className={`px-2 py-1 text-xs rounded-full border ${getDemandColor(product.demand_level)}`}>
                                        {product.demand_level}
                                    </span>
                                </div>
                                <div className="space-y-1 text-sm">
                                    <div className="flex items-center gap-2">
                                        {getTrendIcon(product.trend)}
                                        <span className={`text-sm font-medium ${product.trend === 'RISING' ? 'text-green-600 dark:text-green-400' : product.trend === 'FALLING' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                            {product.trend_percent > 0 ? '+' : ''}{product.trend_percent || 0}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Current Stock:</span>
                                        <span className="font-semibold">{product.current_stock || 0} units</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Avg Daily Sales:</span>
                                        <span className="font-semibold">{product.avg_daily_sales}</span>
                                    </div>
                                </div>
                                {/* Demand Explanation */}
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        <span className="font-medium">Why Medium Demand:</span> {getDemandDescription('MEDIUM', product.avg_daily_sales)}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        <span className="font-medium">Trend:</span> {getTrendDescription(product.trend, product.trend_percent)}
                                    </p>
                                </div>
                                {(() => {
                                    const config = getRecommendationConfig(product.recommendation);
                                    const Icon = config.icon;
                                    return (
                                        <div className={`mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between`}>
                                            <div className={`flex items-center gap-2 px-3 py-1 rounded-md border ${config.color}`}>
                                                <Icon className={`w-4 h-4 ${config.iconColor}`} />
                                                <span className="text-xs font-medium">{config.text}</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Low Demand Products Section */}
            {lowDemandProducts.length > 0 && (
                <div className="card border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                    <h3 className="text-lg font-bold text-red-900 dark:text-red-300 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6" />
                        📉 LOW DEMAND PRODUCTS
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {lowDemandProducts.map((product) => (
                            <div key={product.product_id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-red-300 dark:border-red-700 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">{product.product_name}</h4>
                                    <span className={`px-2 py-1 text-xs rounded-full border ${getDemandColor(product.demand_level)}`}>
                                        {product.demand_level}
                                    </span>
                                </div>
                                <div className="space-y-1 text-sm">
                                    <div className="flex items-center gap-2">
                                        {getTrendIcon(product.trend)}
                                        <span className={`text-sm font-medium ${product.trend === 'RISING' ? 'text-green-600 dark:text-green-400' : product.trend === 'FALLING' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                            {product.trend_percent > 0 ? '+' : ''}{product.trend_percent || 0}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Current Stock:</span>
                                        <span className="font-semibold">{product.current_stock || 0} units</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Avg Daily Sales:</span>
                                        <span className="font-semibold">{product.avg_daily_sales}</span>
                                    </div>
                                </div>
                                {/* Demand Explanation */}
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        <span className="font-medium">Why Low Demand:</span> {getDemandDescription('LOW', product.avg_daily_sales)}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        <span className="font-medium">Trend:</span> {getTrendDescription(product.trend, product.trend_percent)}
                                    </p>
                                </div>
                                {(() => {
                                    const config = getRecommendationConfig(product.recommendation);
                                    const Icon = config.icon;
                                    return (
                                        <div className={`mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between`}>
                                            <div className={`flex items-center gap-2 px-3 py-1 rounded-md border ${config.color}`}>
                                                <Icon className={`w-4 h-4 ${config.iconColor}`} />
                                                <span className="text-xs font-medium">{config.text}</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Products Never Sold Warning Section */}
            {productsNeverSold.length > 0 && (
                <div className="card border-2 border-gray-400 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <XCircle className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        📦 PRODUCTS NEVER SOLD
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        These products have never been sold. Consider running promotions or removing them from inventory.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {productsNeverSold.map((product) => (
                            <div key={product.product_id} className="bg-white dark:bg-gray-700 p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-sm">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{product.product_name}</h4>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">SKU:</span>
                                        <span className="font-mono text-gray-900 dark:text-gray-200">{product.sku_id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Stock:</span>
                                        <span className="font-semibold text-gray-900 dark:text-gray-200">{product.current_stock || 0} units</span>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                        <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs rounded-full">
                                            ⚠️ No sales recorded
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Bundling Opportunities */}
            {correlations.length > 0 && (
                <div className="card border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
                    <h3 className="text-lg font-bold text-purple-900 dark:text-purple-300 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6" />
                        ✨ Bundling Opportunities (Frequently Bought Together)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {correlations.map((pair, idx) => (
                            <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-purple-300 dark:border-purple-700 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold border-2 border-white dark:border-gray-800">
                                            {pair.product1.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold border-2 border-white dark:border-gray-800">
                                            {pair.product2.name.substring(0, 2).toUpperCase()}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                            {pair.product1.name} + {pair.product2.name}
                                        </p>
                                        <p className="text-xs text-purple-600 dark:text-purple-400">
                                            Bought together {pair.frequency} times
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${pair.frequency >= 3
                                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                                    : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                    }`}>
                                    {pair.frequency >= 3 ? '🔥 Popular Bundle' : '✓ Good Pairing'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Forecast;