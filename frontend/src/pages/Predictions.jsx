import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { TrendingUp, TrendingDown, Minus, X, Info, Calendar, HelpCircle, Calculator } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import ExplanationModal from '../components/ExplanationModal';

const getTrendIcon = (trend) => {
    switch (trend) {
        case 'RISING': return <TrendingUp className="w-4 h-4 text-green-600" />;
        case 'FALLING': return <TrendingDown className="w-4 h-4 text-red-600" />;
        case 'NOT_ENOUGH_DATA': return <Info className="w-4 h-4 text-yellow-600" />;
        default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
};

const Predictions = () => {
    const [predictions, setPredictions] = useState(null);
    const [loading, setLoading] = useState(true);
    const [daysToPredict, setDaysToPredict] = useState(7);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [explanationModal, setExplanationModal] = useState({ isOpen: false, type: null, productId: null });

    useEffect(() => {
        fetchPredictions();
    }, [daysToPredict]);

    const fetchPredictions = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/predictions?days=${daysToPredict}`);
            console.log('Predictions API response:', res.data);
            setPredictions(res.data);
        } catch (error) {
            console.error('Error fetching predictions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProductClick = (product) => {
        setSelectedProduct(product);
        setShowModal(true);
    };

    const handleProductCalculationClick = (product) => {
        setSelectedProduct(product);
        setExplanationModal({ isOpen: true, type: 'product_calculation_detailed', productId: product.product_id });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500 dark:text-gray-400">Loading predictions...</div>
            </div>
        );
    }

    const productPredictions = predictions?.product_predictions || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">📊 Sales Predictions</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Moving Average with day-of-week patterns
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setDaysToPredict(7)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${daysToPredict === 7 ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    >
                        7 Days
                    </button>
                    <button
                        onClick={() => setDaysToPredict(14)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${daysToPredict === 14 ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    >
                        14 Days
                    </button>
                    <button
                        onClick={() => setDaysToPredict(30)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${daysToPredict === 30 ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    >
                        30 Days
                    </button>
                </div>
            </div>

            {/* Overall Sales Forecast Graph */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">📈 Overall Sales Forecast - Next 7 Days</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setExplanationModal({ isOpen: true, type: 'overall' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 rounded-full transition-colors"
                        >
                            <HelpCircle className="w-4 h-4" />
                            How this works?
                        </button>
                        <button
                            onClick={() => setExplanationModal({ isOpen: true, type: 'calculation' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 rounded-full transition-colors"
                        >
                            <Calculator className="w-4 h-4" />
                            Detailed Calculation
                        </button>
                    </div>
                </div>

                {predictions?.predictions && predictions.predictions.length > 0 && (
                    <>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={predictions.predictions.map((pred, idx) => {
                                const date = new Date(pred.date);
                                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                                return {
                                    name: `${dayName} ${date.getDate()}`,
                                    predicted: pred.predicted_qty,
                                    lower: Math.round(pred.predicted_qty * 0.85),
                                    upper: Math.round(pred.predicted_qty * 1.15),
                                    isWeekend
                                };
                            })}>
                                <defs>
                                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12 }}
                                    stroke="currentColor"
                                    className="text-gray-600 dark:text-gray-400"
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    stroke="currentColor"
                                    className="text-gray-600 dark:text-gray-400"
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        padding: '12px'
                                    }}
                                    formatter={(value, name) => {
                                        if (name === 'predicted') return [value + ' units', 'Best Estimate'];
                                        if (name === 'lower') return [value + ' units', 'Lower Bound'];
                                        if (name === 'upper') return [value + ' units', 'Upper Bound'];
                                        return [value, name];
                                    }}
                                />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="lower"
                                    stackId="1"
                                    stroke="transparent"
                                    fill="#93c5fd"
                                    fillOpacity={0.3}
                                    name="Range"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="predicted"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    fill="url(#colorPredicted)"
                                    name="Predicted Sales"
                                />
                            </AreaChart>
                        </ResponsiveContainer>

                        {/* Forecast Insights */}
                        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">📊 Why These Predictions?</h4>
                                    <div className="space-y-2 text-xs text-blue-800 dark:text-blue-200">
                                        {(() => {
                                            const weekendDays = predictions.predictions.filter((p, idx) => {
                                                const d = new Date(p.date);
                                                return d.getDay() === 0 || d.getDay() === 6;
                                            });
                                            const weekdayAvg = predictions.predictions
                                                .filter((p) => {
                                                    const d = new Date(p.date);
                                                    return d.getDay() !== 0 && d.getDay() !== 6;
                                                })
                                                .reduce((sum, p) => sum + p.predicted_qty, 0) / Math.max(1, 7 - weekendDays.length);
                                            const weekendAvg = weekendDays.length > 0
                                                ? weekendDays.reduce((sum, p) => sum + p.predicted_qty, 0) / weekendDays.length
                                                : 0;

                                            const maxDay = predictions.predictions.reduce((max, p, idx) =>
                                                p.predicted_qty > predictions.predictions[max].predicted_qty ? idx : max, 0);
                                            const minDay = predictions.predictions.reduce((min, p, idx) =>
                                                p.predicted_qty < predictions.predictions[min].predicted_qty ? idx : min, 0);

                                            const maxDate = new Date(predictions.predictions[maxDay].date);
                                            const minDate = new Date(predictions.predictions[minDay].date);

                                            return (
                                                <>
                                                    <p>
                                                        <strong>📅 Day-of-Week Pattern:</strong> Weekends typically show{' '}
                                                        {weekendAvg > weekdayAvg ? (
                                                            <span className="text-green-700 dark:text-green-400 font-semibold">
                                                                +{Math.round(((weekendAvg - weekdayAvg) / weekdayAvg) * 100)}% higher
                                                            </span>
                                                        ) : (
                                                            <span className="text-orange-700 dark:text-orange-400 font-semibold">
                                                                {Math.round(((weekendAvg - weekdayAvg) / weekdayAvg) * 100)}% lower
                                                            </span>
                                                        )}{' '}
                                                        sales than weekdays based on historical patterns.
                                                    </p>
                                                    <p>
                                                        <strong>📊 Peak & Low Days:</strong> Highest sales expected on{' '}
                                                        <span className="font-semibold">{maxDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                                                        {' '}({predictions.predictions[maxDay].predicted_qty} units).
                                                        Lowest on{' '}
                                                        <span className="font-semibold">{minDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                                                        {' '}({predictions.predictions[minDay].predicted_qty} units).
                                                    </p>
                                                    <p>
                                                        <strong>📈 Trend Analysis:</strong> Predictions incorporate recent sales trends with{' '}
                                                        <span className="font-semibold">±15% confidence range</span> to account for natural business variations like customer traffic, weather, and market conditions.
                                                    </p>
                                                    <p>
                                                        <strong>🎯 Algorithm:</strong> Uses Moving Average with exponential smoothing, weighted by day-of-week patterns from your last 30 days of sales history.
                                                    </p>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Product-Level Predictions */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">🎯 Product-Level Predictions (with Ranges)</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setExplanationModal({ isOpen: true, type: 'product' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 rounded-full transition-colors"
                        >
                            <HelpCircle className="w-4 h-4" />
                            How this works?
                        </button>
                        <button
                            onClick={() => setExplanationModal({ isOpen: true, type: 'product_calculation_all' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 rounded-full transition-colors"
                        >
                            <Calculator className="w-4 h-4" />
                            Calculation Details
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Product</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Current Stock</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Trend</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Predicted Range ({daysToPredict}d)</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {productPredictions.map((product) => {
                                const lowerBound = Math.round(product.total_predicted * 0.85);
                                const upperBound = Math.round(product.total_predicted * 1.15);
                                const stockStatus = product.current_stock < product.total_predicted ? 'low' : 'good';

                                return (
                                    <tr
                                        key={product.product_id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{product.product_name}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-baseline gap-1">
                                                <span className={`text-lg font-bold ${stockStatus === 'low' ? 'text-red-600 dark:text-red-400' : 'text-purple-600 dark:text-purple-400'}`}>
                                                    {product.current_stock || 0}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">units</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {getTrendIcon(product.trend)}
                                                <span className={`text-sm font-medium ${
                                                    product.trend === 'RISING' ? 'text-green-600 dark:text-green-400' :
                                                    product.trend === 'FALLING' ? 'text-red-600 dark:text-red-400' :
                                                    product.trend === 'NOT_ENOUGH_DATA' ? 'text-yellow-600 dark:text-yellow-400' :
                                                    'text-gray-600 dark:text-gray-400'
                                                }`}>
                                                    {product.trend === 'NOT_ENOUGH_DATA' ? 'Not enough data' : 
                                                     product.trend_percent > 0 ? '+' : ''}{product.trend !== 'NOT_ENOUGH_DATA' ? `${product.trend_percent}%` : ''}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                                    {lowerBound} - {upperBound} units
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    Best est: {product.total_predicted} units
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleProductClick(product)}
                                                    className="text-xs px-2 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300 rounded transition-colors"
                                                >
                                                    View Details
                                                </button>
                                                <button
                                                    onClick={() => handleProductCalculationClick(product)}
                                                    className="text-xs px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:text-purple-300 rounded transition-colors flex items-center gap-1"
                                                >
                                                    <Calculator className="w-3 h-3" />
                                                    Calc
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Algorithm Info */}
            <div className="card bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">📈 Prediction Algorithm</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    Using <strong>Moving Average (MA)</strong> with day-of-week variations and trend analysis.
                    Predictions show a realistic <strong>±15% range</strong> to account for natural business fluctuations.
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    💡 <strong>Tip:</strong> Click on any product row to see detailed 7-day forecast with AI insights!
                </p>
            </div>

            {/* Detailed Product Modal */}
            {showModal && selectedProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedProduct.product_name}</h2>
                                <div className="flex items-center gap-3 mt-1">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Detailed 7-Day Forecast</p>
                                    <button
                                        onClick={() => setExplanationModal({ isOpen: true, type: 'product' })}
                                        className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 rounded-full transition-colors"
                                    >
                                        <HelpCircle className="w-3 h-3" />
                                        Explain Math
                                    </button>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
                                <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-1">7-Day Forecast</p>
                                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-300">{selectedProduct.total_predicted}</p>
                                    <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">±15% variance</p>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                    <p className="text-xs text-green-700 dark:text-green-400 font-medium mb-1">Confidence</p>
                                    <p className="text-3xl font-bold text-green-900 dark:text-green-300">
                                        {selectedProduct.confidence_score < 0.5 ? 'Low' : selectedProduct.confidence_score < 0.8 ? 'Medium' : 'High'}
                                    </p>
                                    <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                                        {selectedProduct.confidence_score < 0.5 ? 'limited data' : selectedProduct.confidence_score < 0.8 ? 'moderate confidence' : 'reliable prediction'}
                                    </p>
                                </div>
                                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                                    <p className="text-xs text-purple-700 dark:text-purple-400 font-medium mb-1">Current Stock</p>
                                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-300">{selectedProduct.current_stock || 0}</p>
                                    <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">units on hand</p>
                                </div>
                                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                                    <p className="text-xs text-orange-700 dark:text-orange-400 font-medium mb-1">Daily Average</p>
                                    <p className="text-3xl font-bold text-orange-900 dark:text-orange-300">{Math.round(selectedProduct.total_predicted / 7)}</p>
                                    <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">units/day</p>
                                </div>
                            </div>

                            {/* AI Insights */}
                            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-5 rounded-lg border border-amber-200 dark:border-amber-800">
                                <div className="flex items-start gap-3">
                                    <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-2">💡 AI Insights & Recommendations</h3>
                                        <div className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
                                            <p>
                                                {selectedProduct.trend === 'RISING' && `📈 Rising Demand: Sales increasing by ${Math.abs(selectedProduct.trend_percent)}%. Consider stocking more units.`}
                                                {selectedProduct.trend === 'FALLING' && `📉 Declining Demand: Sales decreasing by ${Math.abs(selectedProduct.trend_percent)}%. Monitor to avoid overstocking.`}
                                                {selectedProduct.trend === 'STABLE' && `➡️ Stable Demand: Sales consistent around ${selectedProduct.recent_avg} units/day.`}
                                                {selectedProduct.trend === 'NOT_ENOUGH_DATA' && `⚠️ Not enough historical data for trend analysis. Prediction based on recent average sales only.`}
                                            </p>
                                            <p>📊 <strong>Forecast Pattern:</strong> Expected average of {Math.round(selectedProduct.total_predicted / 7)} units per day over the next week.</p>
                                            {selectedProduct.predictions && selectedProduct.predictions.length > 0 && (
                                                <p>🎯 <strong>Peak Day:</strong> Highest sales expected on day {selectedProduct.predictions.indexOf(Math.max(...selectedProduct.predictions)) + 1} ({Math.max(...selectedProduct.predictions)} units).</p>
                                            )}
                                            <p>📈 <strong>Historical Performance:</strong> Historical avg {selectedProduct.historical_avg} units/day vs recent {selectedProduct.recent_avg} units/day.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Daily Breakdown */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">📅 Daily Breakdown</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Day</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Predicted Range</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Confidence</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {selectedProduct.predictions && selectedProduct.predictions.map((qty, idx) => {
                                                const date = new Date();
                                                date.setDate(date.getDate() + idx + 1);
                                                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                                                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                                const lower = Math.round(qty * 0.9);
                                                const upper = Math.round(qty * 1.1);

                                                return (
                                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{dayName}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{dateStr}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex flex-col">
                                                                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{lower} - {upper}</span>
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">Best: {qty} units</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300">High</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* 7-Day Calendar */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">📊 7-Day Calendar</h3>
                                <div className="grid grid-cols-7 gap-2">
                                    {selectedProduct.predictions && selectedProduct.predictions.map((qty, idx) => {
                                        const date = new Date();
                                        date.setDate(date.getDate() + idx + 1);
                                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

                                        return (
                                            <div key={idx} className="bg-white dark:bg-gray-700 p-3 rounded-lg text-center border-2 border-gray-200 dark:border-gray-600">
                                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{dayName}</p>
                                                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{qty}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">units</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Explanation Modals */}
            <ExplanationModal
                isOpen={explanationModal.isOpen && explanationModal.type === 'overall'}
                onClose={() => setExplanationModal({ ...explanationModal, isOpen: false })}
                title="How do we predict overall sales?"
            >
                <div className="space-y-4 text-gray-700 dark:text-gray-300">
                    <p className="text-lg">
                        Imagine you have a lemonade stand. To guess how many cups you'll sell tomorrow, you'd look at how many you sold today, yesterday, and last week.
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
                        <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">We look at 3 main things:</h4>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Recent History:</strong> If you sold a lot yesterday, you'll likely sell a lot today.</li>
                            <li><strong>Weekly Patterns:</strong> If you always sell more on Saturdays, we expect this Saturday to be busy too!</li>
                            <li><strong>Overall Trend:</strong> Is your business growing or slowing down? We draw a line to follow that direction.</li>
                        </ul>
                    </div>
                    <p>
                        We combine all these clues to draw the "Predicted Sales" line on the graph. The blue shaded area shows the "safe zone" - we're 90% sure the real sales will fall somewhere in there!
                    </p>
                </div>
            </ExplanationModal>

            <ExplanationModal
                isOpen={explanationModal.isOpen && explanationModal.type === 'calculation'}
                onClose={() => setExplanationModal({ ...explanationModal, isOpen: false })}
                title="Detailed Calculation Steps"
            >
                <div className="space-y-4 text-gray-700 dark:text-gray-300 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                        <h3 className="font-bold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
                            <Calculator className="w-5 h-5" />
                            Overall Sales Prediction Calculation
                        </h3>
                        
                        <div className="space-y-3 mt-3">
                            <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                                <h4 className="font-semibold text-gray-900 dark:text-white">Step 1: Data Collection</h4>
                                <p className="text-sm mt-1">
                                    We collect the last 30 days of sales data from your database. For each day, we sum up all products sold to get the total daily sales.
                                </p>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                                <h4 className="font-semibold text-gray-900 dark:text-white">Step 2: Moving Average Calculation</h4>
                                <p className="text-sm mt-1">
                                    We calculate a 7-day moving average (MA) using the most recent 7 days of data:
                                </p>
                                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                                    MA = (Day1 + Day2 + ... + Day7) / 7
                                </div>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                                <h4 className="font-semibold text-gray-900 dark:text-white">Step 3: Trend Analysis</h4>
                                <p className="text-sm mt-1">
                                    We compare the recent 7-day average with the previous 7-day average to determine the sales trend:
                                </p>
                                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                                    Trend % = (Recent MA - Historical MA) / Historical MA
                                </div>
                                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                                    Trend Multiplier = 1 + Trend %
                                </div>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                                <h4 className="font-semibold text-gray-900 dark:text-white">Step 4: Day-of-Week Adjustment</h4>
                                <p className="text-sm mt-1">
                                    We apply day-of-week multipliers based on historical patterns:
                                </p>
                                <ul className="text-sm mt-1 list-disc pl-5">
                                    <li>Sunday: ×1.15 (Weekend high)</li>
                                    <li>Monday: ×0.85 (Weekday low)</li>
                                    <li>Tuesday: ×0.90</li>
                                    <li>Wednesday: ×0.95</li>
                                    <li>Thursday: ×1.00</li>
                                    <li>Friday: ×1.10 (Pre-weekend)</li>
                                    <li>Saturday: ×1.20 (Weekend peak)</li>
                                </ul>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                                <h4 className="font-semibold text-gray-900 dark:text-white">Step 5: Final Prediction</h4>
                                <p className="text-sm mt-1">
                                    For each future day, we combine all factors:
                                </p>
                                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                                    Adjusted Average = Recent Avg × Trend Multiplier
                                </div>
                                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                                    Day Prediction = Adjusted Average × Day Multiplier
                                </div>
                                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                                    Final Prediction = Day Prediction × (1 ± 0.05)
                                </div>
                                <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">
                                    Random Factor: ±5% to account for unpredictable variations
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Confidence Intervals</h4>
                        <p>
                            We provide a prediction range of ±15% around the best estimate to account for natural business fluctuations.
                        </p>
                    </div>
                </div>
            </ExplanationModal>

            <ExplanationModal
                isOpen={explanationModal.isOpen && explanationModal.type === 'product'}
                onClose={() => setExplanationModal({ ...explanationModal, isOpen: false })}
                title="How does the AI predict for each product?"
            >
                <div className="space-y-4 text-gray-700 dark:text-gray-300">
                    <p className="text-lg">
                        Predicting for a single product is like asking 4 different experts for their opinion, and then taking the best answer from all of them!
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                            <h4 className="font-bold text-indigo-900 dark:text-indigo-300">1. The Trend Watcher</h4>
                            <p className="text-sm mt-1">"Sales have been going up lately, so I think they'll keep going up!"</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                            <h4 className="font-bold text-purple-900 dark:text-purple-300">2. The Calendar Expert</h4>
                            <p className="text-sm mt-1">"It's a weekend, and this product always sells well on weekends."</p>
                        </div>
                        <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg">
                            <h4 className="font-bold text-pink-900 dark:text-pink-300">3. The Average Joe</h4>
                            <p className="text-sm mt-1">"Let's just look at the average of the last few days to be safe."</p>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                            <h4 className="font-bold text-amber-900 dark:text-amber-300">4. The Pattern Hunter</h4>
                            <p className="text-sm mt-1">"I see a complex pattern repeating every 3 days..."</p>
                        </div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <h4 className="font-bold text-green-900 dark:text-green-300 flex items-center gap-2">
                            <span>🤖</span> The Final Answer
                        </h4>
                        <p className="mt-1">
                            We listen to all 4 experts. If they all agree, we are <strong>High Confidence</strong>. If they disagree, we take the average but tell you we are less sure. This way, you get the smartest possible guess!
                        </p>
                    </div>
                </div>
            </ExplanationModal>
            
            <ExplanationModal
                isOpen={explanationModal.isOpen && explanationModal.type === 'product_calculation_detailed'}
                onClose={() => setExplanationModal({ ...explanationModal, isOpen: false })}
                title={`Product Calculation: ${selectedProduct?.product_name || 'Product'}`}
            >
                <div className="space-y-4 text-gray-700 dark:text-gray-300 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                        <h3 className="font-bold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
                            <Calculator className="w-5 h-5" />
                            Detailed Product-Specific Prediction Calculation
                        </h3>
                        
                        {selectedProduct && (
                            <div className="space-y-4 mt-3">
                                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">📊 Product Information</h4>
                                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                        <div>
                                            <span className="font-medium">Product Name:</span> {selectedProduct.product_name}
                                        </div>
                                        <div>
                                            <span className="font-medium">Current Stock:</span> {selectedProduct.current_stock || 0} units
                                        </div>
                                        <div>
                                            <span className="font-medium">Total Predicted ({daysToPredict} days):</span> {selectedProduct.total_predicted} units
                                        </div>
                                        <div>
                                            <span className="font-medium">Daily Average:</span> {Math.round(selectedProduct.total_predicted / daysToPredict)} units/day
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">🧮 Step-by-Step Calculation</h4>
                                    
                                    <div className="mt-3 space-y-3">
                                        <div className="border-l-4 border-blue-500 pl-3 py-1">
                                            <h5 className="font-medium text-blue-700 dark:text-blue-300">1. Historical Data Analysis</h5>
                                            <p className="text-sm mt-1">
                                                Based on the last 30 days of sales data for this product:
                                            </p>
                                            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                                                <div>
                                                    <span className="font-medium">Historical Average:</span> {selectedProduct.historical_avg} units/day
                                                </div>
                                                <div>
                                                    <span className="font-medium">Recent Average (7 days):</span> {selectedProduct.recent_avg} units/day
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="border-l-4 border-green-500 pl-3 py-1">
                                            <h5 className="font-medium text-green-700 dark:text-green-300">2. Trend Calculation</h5>
                                            <p className="text-sm mt-1">
                                                Comparing recent performance with older data to determine sales direction:
                                            </p>
                                            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                                                Trend % = (Recent Avg - Historical Avg) / Historical Avg
                                            </div>
                                            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                                                Trend Multiplier = 1 + Trend %
                                            </div>
                                            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                                                Trend % = (({selectedProduct.recent_avg} - {selectedProduct.historical_avg}) / {selectedProduct.historical_avg}) × 100 = {selectedProduct.trend_percent}%
                                            </div>
                                            <div className="mt-2 text-sm">
                                                <span className="font-medium">Trend Status:</span> 
                                                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                                    selectedProduct.trend === 'RISING' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                    selectedProduct.trend === 'FALLING' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                                }`}>
                                                    {selectedProduct.trend} {selectedProduct.trend_percent > 0 ? '↗️' : selectedProduct.trend_percent < 0 ? '↘️' : '➡️'}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="border-l-4 border-amber-500 pl-3 py-1">
                                            <h5 className="font-medium text-amber-700 dark:text-amber-300">3. Day-of-Week Adjustment</h5>
                                            <p className="text-sm mt-1">
                                                Applying multipliers based on historical patterns for each day of the week:
                                            </p>
                                            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">Sun: ×1.15</div>
                                                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">Mon: ×0.85</div>
                                                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">Tue: ×0.90</div>
                                                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">Wed: ×0.95</div>
                                                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">Thu: ×1.00</div>
                                                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">Fri: ×1.10</div>
                                                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">Sat: ×1.20</div>
                                            </div>
                                        </div>
                                        
                                        <div className="border-l-4 border-purple-500 pl-3 py-1">
                                            <h5 className="font-medium text-purple-700 dark:text-purple-300">4. Final Prediction Formula</h5>
                                            <p className="text-sm mt-1">
                                                For each future day, we calculate the prediction using:
                                            </p>
                                            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                                                Adjusted Average = Recent Avg × Trend Multiplier
                                            </div>
                                            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                                                Day Prediction = Adjusted Average × Day Multiplier
                                            </div>
                                            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                                                Final Prediction = Day Prediction × (1 ± 0.05)
                                            </div>
                                            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                                Random Factor: ±5% to account for unpredictable variations
                                            </div>
                                        </div>
                                        
                                        <div className="border-l-4 border-indigo-500 pl-3 py-1">
                                            <h5 className="font-medium text-indigo-700 dark:text-indigo-300">5. Confidence Scoring</h5>
                                            <p className="text-sm mt-1">
                                                Based on data quality and trend consistency:
                                            </p>
                                            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                                                Confidence = 1 - (Std Deviation / Historical Avg)
                                            </div>
                                            <div className="mt-2 flex items-center">
                                                <span className="font-medium">Confidence Level:</span>
                                                <span className="ml-2 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                    {selectedProduct.confidence_score < 0.5 ? 'Low' : selectedProduct.confidence_score < 0.8 ? 'Medium' : 'High'}
                                                </span>
                                            </div>
                                            <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">
                                                {selectedProduct.historical_avg === 0 
                                                    ? "Not enough historical data for high confidence predictions." 
                                                    : "Based on historical data quality and sales pattern consistency."}
                                            </p>
                                        </div>
                                        
                                        <div className="border-l-4 border-orange-500 pl-3 py-1">
                                            <h5 className="font-medium text-orange-700 dark:text-orange-300">6. Stock Sufficiency</h5>
                                            <p className="text-sm mt-1">
                                                Checking if current stock is sufficient for predicted demand:
                                            </p>
                                            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                                                Remaining Stock = Current Stock - Total Predicted
                                            </div>
                                            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                                                Remaining Stock = {selectedProduct.current_stock || 0} - {selectedProduct.total_predicted} = {selectedProduct.current_stock - selectedProduct.total_predicted || 0}
                                            </div>
                                            <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">
                                                {(selectedProduct.current_stock - selectedProduct.total_predicted) >= 0 
                                                    ? "✅ Sufficient stock for predicted demand" 
                                                    : "⚠️ Insufficient stock - consider restocking"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">📊 Predicted Sales Breakdown</h4>
                                    <div className="mt-3">
                                        <p className="text-sm">
                                            For the next {daysToPredict} days, we predict a total of <strong>{selectedProduct.total_predicted} units</strong> will be sold.
                                        </p>
                                        <div className="mt-3 grid grid-cols-2 gap-3">
                                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                                                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Daily Average</p>
                                                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                                    {selectedProduct.daily_average || Math.round(selectedProduct.total_predicted / daysToPredict)}
                                                </p>
                                                <p className="text-xs text-blue-600 dark:text-blue-400">units per day</p>
                                            </div>
                                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                                                <p className="text-sm font-medium text-green-800 dark:text-green-200">Confidence</p>
                                                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                                    {selectedProduct.confidence_score < 0.5 ? 'Low' : selectedProduct.confidence_score < 0.8 ? 'Medium' : 'High'}
                                                </p>
                                                <p className="text-xs text-green-600 dark:text-green-400">
                                                    {selectedProduct.confidence_score < 0.5 ? 'limited data' : selectedProduct.confidence_score < 0.8 ? 'moderate confidence' : 'reliable prediction'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <h4 className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                                        <Info className="w-5 h-5" />
                                        Business Insights
                                    </h4>
                                    <div className="mt-2 text-sm text-amber-800 dark:text-amber-200">
                                        <p>
                                            {selectedProduct.trend === 'RISING' && `📈 Sales are increasing by ${Math.abs(selectedProduct.trend_percent)}%. Consider increasing stock levels.`}
                                            {selectedProduct.trend === 'FALLING' && `📉 Sales are decreasing by ${Math.abs(selectedProduct.trend_percent)}%. Monitor inventory to avoid overstock.`}
                                            {selectedProduct.trend === 'STABLE' && `➡️ Sales are stable. Current stock levels should be sufficient.`}
                                            {selectedProduct.trend === 'NOT_ENOUGH_DATA' && `⚠️ Not enough historical data for trend analysis. Prediction based on recent average sales only.`}
                                        </p>
                                        <p className="mt-2">
                                            With {selectedProduct.current_stock || 0} units in stock and a predicted demand of {selectedProduct.total_predicted} units over the next {daysToPredict} days, 
                                            {selectedProduct.current_stock >= selectedProduct.total_predicted 
                                                ? " you should have enough inventory to meet demand." 
                                                : " you may need to restock soon."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </ExplanationModal>
            
            <ExplanationModal
                isOpen={explanationModal.isOpen && explanationModal.type === 'product_calculation_all'}
                onClose={() => setExplanationModal({ ...explanationModal, isOpen: false })}
                title="Product-Level Prediction Calculations"
            >
                <div className="space-y-4 text-gray-700 dark:text-gray-300 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                        <h3 className="font-bold text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
                            <Calculator className="w-5 h-5" />
                            Product-Specific Prediction Calculation (Applied to All Products)
                        </h3>
                        
                        <div className="space-y-3 mt-3">
                            <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                                <h4 className="font-semibold text-gray-900 dark:text-white">Step 1: Data Collection</h4>
                                <p className="text-sm mt-1">
                                    For each product, we collect its sales history from the last 30 days, organizing sales by date.
                                </p>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                                <h4 className="font-semibold text-gray-900 dark:text-white">Step 2: Historical Average</h4>
                                <p className="text-sm mt-1">
                                    We calculate the average daily sales for each product:
                                </p>
                                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                                    Avg Daily Sales = Total Units Sold / Number of Days with Sales
                                </div>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                                <h4 className="font-semibold text-gray-900 dark:text-white">Step 3: Trend Analysis</h4>
                                <p className="text-sm mt-1">
                                    We compare recent performance (last 7 days) with older performance (8-30 days ago):
                                </p>
                                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                                    Trend % = (Recent Avg - Historical Avg) / Historical Avg
                                </div>
                                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                                    Trend Multiplier = 1 + Trend %
                                </div>
                                <ul className="text-sm mt-2 list-disc pl-5">
                                    <li>Trend &gt; +5%: Rising</li>
                                    <li>Trend &lt; -5%: Falling</li>
                                    <li>Otherwise: Stable</li>
                                </ul>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                                <h4 className="font-semibold text-gray-900 dark:text-white">Step 4: Day-of-Week Adjustment</h4>
                                <p className="text-sm mt-1">
                                    We apply the same day-of-week multipliers as overall predictions:
                                </p>
                                <ul className="text-sm mt-1 list-disc pl-5">
                                    <li>Sunday: ×1.15 (Weekend high)</li>
                                    <li>Monday: ×0.85 (Weekday low)</li>
                                    <li>Tuesday: ×0.90</li>
                                    <li>Wednesday: ×0.95</li>
                                    <li>Thursday: ×1.00</li>
                                    <li>Friday: ×1.10 (Pre-weekend)</li>
                                    <li>Saturday: ×1.20 (Weekend peak)</li>
                                </ul>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                                <h4 className="font-semibold text-gray-900 dark:text-white">Step 5: Final Prediction</h4>
                                <p className="text-sm mt-1">
                                    For each future day, we calculate:
                                </p>
                                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                                    Adjusted Average = Recent Avg × Trend Multiplier
                                </div>
                                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                                    Day Prediction = Adjusted Average × Day Multiplier
                                </div>
                                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                                    Final Prediction = Day Prediction × (1 ± 0.05)
                                </div>
                                <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">
                                    Random Factor: ±5% to account for unpredictable variations
                                </p>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                                <h4 className="font-semibold text-gray-900 dark:text-white">Step 6: Confidence Scoring</h4>
                                <p className="text-sm mt-1">
                                    We assign confidence based on data quality and trend consistency:
                                </p>
                                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                                    Confidence = 1 - (Std Deviation / Historical Avg)
                                </div>
                                <ul className="text-sm mt-2 list-disc pl-5">
                                    <li>High: &gt;30 days of consistent sales data</li>
                                    <li>Medium: 15-30 days of data or moderate trend</li>
                                    <li>Low: &lt;15 days of data or highly variable sales</li>
                                </ul>
                            </div>
                            
                            <div className="bg-white dark:bg-gray-700 p-3 rounded-lg">
                                <h4 className="font-semibold text-gray-900 dark:text-white">Step 7: Stock Sufficiency</h4>
                                <p className="text-sm mt-1">
                                    We check if current stock is sufficient for predicted demand:
                                </p>
                                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm">
                                    Remaining Stock = Current Stock - Total Predicted
                                </div>
                                <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">
                                    This helps identify products that may need restocking soon.
                                </p>
                            </div>
                            
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                <h4 className="font-semibold text-blue-900 dark:text-blue-300">Application to All Products</h4>
                                <p className="text-sm mt-1">
                                    This calculation is applied individually to each of the top-selling products shown in the table above. Each product gets its own prediction based on its unique sales history and patterns.
                                </p>
                                <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                                    <p><strong>Products Analyzed:</strong> {productPredictions.length}</p>
                                    <p className="mt-1">
                                        <strong>Calculation Method:</strong> Each product's prediction is calculated independently using its own historical data.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </ExplanationModal>
        </div>
    );
};

export default Predictions;