import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PredictionChart = ({ data, type = 'line', title }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">No data available for visualization</p>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: <span className="font-bold">{entry.value}</span> units
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (type === 'line') {
        return (
            <div className="w-full">
                {title && <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{title}</h4>}
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
                        <XAxis 
                            dataKey="date" 
                            className="text-xs" 
                            stroke="#9ca3af"
                            tick={{ fill: '#6b7280' }}
                        />
                        <YAxis 
                            className="text-xs" 
                            stroke="#9ca3af"
                            tick={{ fill: '#6b7280' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                            wrapperStyle={{ paddingTop: '10px' }}
                            iconType="line"
                        />
                        <Line 
                            type="monotone" 
                            dataKey="actual" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            dot={{ fill: '#3b82f6', r: 4 }}
                            name="Historical Sales"
                        />
                        <Line 
                            type="monotone" 
                            dataKey="predicted" 
                            stroke="#8b5cf6" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ fill: '#8b5cf6', r: 4 }}
                            name="Predicted Sales"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        );
    }

    if (type === 'bar') {
        return (
            <div className="w-full">
                {title && <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{title}</h4>}
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
                        <XAxis 
                            dataKey="name" 
                            className="text-xs" 
                            stroke="#9ca3af"
                            tick={{ fill: '#6b7280' }}
                        />
                        <YAxis 
                            className="text-xs" 
                            stroke="#9ca3af"
                            tick={{ fill: '#6b7280' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                            wrapperStyle={{ paddingTop: '10px' }}
                        />
                        <Bar 
                            dataKey="value" 
                            fill="#6366f1" 
                            name="Predicted Units"
                            radius={[8, 8, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    }

    return null;
};

export default PredictionChart;
