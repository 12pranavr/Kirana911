import React from 'react';
import SimpleChart from './SimpleChart';
import { TrendingUp, TrendingDown, Minus, BarChart2, Zap, Brain, Layers, LineChart, Info } from 'lucide-react';

const ModelSection = ({ model, modelName, product }) => {
    if (!model) return null;

    // Get appropriate icon for each model
    const getModelIcon = (name) => {
        switch (name) {
            case 'linear_regression': return <LineChart className="w-5 h-5" />;
            case 'weighted_ma': return <BarChart2 className="w-5 h-5" />;
            case 'holt_winters': return <Zap className="w-5 h-5" />;
            case 'random_forest': return <Layers className="w-5 h-5" />;
            case 'gemini_ai': return <Brain className="w-5 h-5" />;
            default: return <LineChart className="w-5 h-5" />;
        }
    };

    // Get model title
    const getModelTitle = (name) => {
        switch (name) {
            case 'linear_regression': return 'Linear Regression (Trend)';
            case 'weighted_ma': return 'Weighted Moving Average';
            case 'holt_winters': return 'Holt-Winters (Seasonal Trend)';
            case 'random_forest': return 'Random Forest Regression (Feature-Based)';
            case 'gemini_ai': return 'Gemini AI Reasoning';
            default: return name;
        }
    };

    // Get model description
    const getModelDescription = (name) => {
        switch (name) {
            case 'linear_regression':
                return 'This looks at recent sales to see if they are going up, down, or staying the same.';
            case 'weighted_ma':
                return 'This gives more importance to recent sales when predicting tomorrow\'s sales.';
            case 'holt_winters':
                return 'This looks for patterns that repeat every week (like weekend sales) to make better predictions.';
            case 'random_forest':
                return 'This uses many factors like stock levels, time of day, and sales patterns to predict sales.';
            case 'gemini_ai':
                return 'This is like asking an expert to look at all the data and explain what\'s happening.';
            default: return '';
        }
    };

    // Get model visualization description
    const getModelVisualizationDescription = (name) => {
        switch (name) {
            case 'linear_regression':
                return 'This chart shows your sales over the last 7 days (blue dots) and the predicted sales for tomorrow (red dot). The line shows the trend direction.';
            case 'weighted_ma':
                return 'This chart shows your sales over the last 7 days. The height of each bar represents how many items you sold on that day.';
            case 'holt_winters':
                return 'This chart shows your sales over the last 7 days. Look for patterns - do you sell more on weekends or weekdays?';
            case 'random_forest':
                return 'This chart shows how important each factor is in making the prediction. Higher bars mean that factor matters more.';
            case 'gemini_ai':
                return 'This section shows the AI expert\'s explanation of why it made this prediction.';
            default: return 'This chart shows your sales data over time.';
        }
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

    // Get trend color
    const getTrendColor = (trend) => {
        switch (trend?.toLowerCase()) {
            case 'upward': return 'text-green-600';
            case 'downward': return 'text-red-600';
            case 'stable': return 'text-yellow-600';
            default: return 'text-gray-600';
        }
    };

    // Prepare data for charts
    const prepareChartData = () => {
        // For all models, if we have sales history, show it
        if (product.sales_history && product.sales_history.length > 0) {
            // For linear regression, show the trend line
            if (modelName === 'linear_regression') {
                // Create a simple trend visualization
                const historyData = product.sales_history.map((sale, index) => ({
                    label: `Day ${index + 1}`,
                    value: sale.qty_sold
                }));
                
                // Add the predicted value
                historyData.push({
                    label: 'Prediction',
                    value: model.value
                });
                
                return historyData;
            }
            
            // For random forest feature importance
            if (modelName === 'random_forest' && model.feature_importance) {
                return Object.entries(model.feature_importance).map(([feature, importance]) => ({
                    label: feature.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
                    value: importance
                }));
            }
            
            // For other models, show sales history
            return product.sales_history.map((sale, index) => ({
                label: `Day ${index + 1}`,
                value: sale.qty_sold
            }));
        }
        
        // Fallback to single point
        return [
            { label: 'Prediction', value: model.value }
        ];
    };

    const chartData = prepareChartData();

    // Determine chart type based on model
    const getChartType = () => {
        if (modelName === 'linear_regression') return 'line';
        if (modelName === 'random_forest' && model.feature_importance) return 'bar';
        if (modelName === 'weighted_ma') return 'bar';
        return 'line';
    };

    return (
        <div className="border rounded-lg p-4 mb-4 bg-white dark:bg-gray-800 shadow-sm">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300">
                        {getModelIcon(modelName)}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{getModelTitle(modelName)}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{getModelDescription(modelName)}</p>
                    </div>
                </div>
                {model.confidence && (
                    <span className={`px-2 py-1 text-xs rounded-full ${getConfidenceColor(model.confidence)}`}>
                        {model.confidence.charAt(0).toUpperCase() + model.confidence.slice(1)} Confidence
                    </span>
                )}
            </div>

            {/* Prediction Value and Range */}
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Predicted Tomorrow</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{model.value} units</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Range: {model.range} units</p>
                </div>
            </div>

            {/* Special sections for specific models */}
            {modelName === 'linear_regression' && model.trend && (
                <div className="flex items-center justify-center mb-3">
                    <div className={`text-xl font-bold ${getTrendColor(model.trend)}`}>
                        {model.trend === 'upward' && '↑ Trending Up'}
                        {model.trend === 'downward' && '↓ Trending Down'}
                        {model.trend === 'stable' && '→ Stable Trend'}
                    </div>
                </div>
            )}

            {modelName === 'holt_winters' && (
                <div className="mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                        Seasonal Pattern Detected
                    </span>
                </div>
            )}

            {modelName === 'random_forest' && model.feature_importance && (
                <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Feature Importance</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.entries(model.feature_importance).map(([feature, importance]) => (
                            <div key={feature} className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                    {feature.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </span>
                                <span className="font-medium">{importance}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {modelName === 'gemini_ai' && model.reasoning && (
                <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h4 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-1">AI Reasoning</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">{model.reasoning}</p>
                </div>
            )}

            {/* Chart */}
            <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Visualization</h4>
                    <div className="group relative">
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                        <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            {getModelVisualizationDescription(modelName)}
                        </div>
                    </div>
                </div>
                <SimpleChart 
                    data={chartData} 
                    type={getChartType()} 
                    color={modelName === 'linear_regression' ? 
                        (model.trend === 'upward' ? 'green' : 
                         model.trend === 'downward' ? 'red' : 'yellow') : 'blue'} 
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {getModelVisualizationDescription(modelName)}
                </p>
            </div>
        </div>
    );
};

export default ModelSection;