import React from 'react';

const SimpleChart = ({ data, type = 'line', color = 'blue' }) => {
    if (!data || data.length === 0) {
        return <div className="text-center py-4 text-gray-500">No data available</div>;
    }

    // For line charts
    if (type === 'line') {
        const maxValue = Math.max(...data.map(d => d.value), 1);
        const minValue = Math.min(...data.map(d => d.value), 0);
        const range = maxValue - minValue || 1;

        return (
            <div className="w-full h-32 relative">
                <svg viewBox="0 0 300 100" className="w-full h-full">
                    <polyline
                        fill="none"
                        stroke={color === 'green' ? '#10B981' : color === 'red' ? '#EF4444' : color === 'yellow' ? '#F59E0B' : '#3B82F6'}
                        strokeWidth="2"
                        points={data.map((d, i) => {
                            const x = (i / (data.length - 1)) * 300;
                            const y = 100 - ((d.value - minValue) / range) * 100;
                            return `${x},${y}`;
                        }).join(' ')}
                    />
                    {data.map((d, i) => {
                        const x = (i / (data.length - 1)) * 300;
                        const y = 100 - ((d.value - minValue) / range) * 100;
                        return (
                            <circle
                                key={i}
                                cx={x}
                                cy={y}
                                r="2"
                                fill={color === 'green' ? '#10B981' : color === 'red' ? '#EF4444' : color === 'yellow' ? '#F59E0B' : '#3B82F6'}
                            />
                        );
                    })}
                </svg>
            </div>
        );
    }

    // For bar charts
    if (type === 'bar') {
        const maxValue = Math.max(...data.map(d => d.value), 1);

        return (
            <div className="flex items-end h-32 space-x-1">
                {data.map((d, i) => {
                    const height = (d.value / maxValue) * 100;
                    return (
                        <div
                            key={i}
                            className="flex-1 flex flex-col items-center"
                            title={`${d.label}: ${d.value}`}
                        >
                            <div
                                className="w-full rounded-t"
                                style={{
                                    height: `${height}%`,
                                    backgroundColor: color === 'green' ? '#10B981' : color === 'red' ? '#EF4444' : color === 'yellow' ? '#F59E0B' : '#3B82F6'
                                }}
                            />
                            <div className="text-xs text-gray-500 mt-1 truncate w-full text-center">
                                {d.label}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // For forecast charts
    if (type === 'forecast') {
        const maxValue = Math.max(...data, 1);
        const minValue = Math.min(...data, 0);
        const range = maxValue - minValue || 1;

        return (
            <div className="w-full h-32 relative">
                <svg viewBox="0 0 300 100" className="w-full h-full">
                    <polyline
                        fill="none"
                        stroke={color === 'green' ? '#10B981' : color === 'red' ? '#EF4444' : color === 'yellow' ? '#F59E0B' : '#3B82F6'}
                        strokeWidth="2"
                        points={data.map((value, i) => {
                            const x = (i / (data.length - 1)) * 300;
                            const y = 100 - ((value - minValue) / range) * 100;
                            return `${x},${y}`;
                        }).join(' ')}
                    />
                </svg>
            </div>
        );
    }

    return <div className="text-center py-4 text-gray-500">Unsupported chart type</div>;
};

export default SimpleChart;