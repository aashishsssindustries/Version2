import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';

interface Holding {
    id: string;
    name: string;
    type: 'EQUITY' | 'MUTUAL_FUND';
    quantity: number;
    last_valuation?: number;
}

interface AllocationChartProps {
    holdings: Holding[];
}

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6'];

const AllocationChart: React.FC<AllocationChartProps> = ({ holdings }) => {
    // Group by asset type
    const typeData = holdings.reduce((acc, h) => {
        const key = h.type === 'MUTUAL_FUND' ? 'Mutual Funds' : 'Equities';
        const val = h.last_valuation || 0;
        acc[key] = (acc[key] || 0) + val;
        return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(typeData).map(([name, value]) => ({
        name,
        value: Math.round(value)
    }));

    if (chartData.length === 0 || chartData.every(d => d.value === 0)) {
        return (
            <div className="chart-empty">
                <p>No valuation data available</p>
            </div>
        );
    }

    const total = chartData.reduce((sum, d) => sum + d.value, 0);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const percent = ((data.value / total) * 100).toFixed(1);
            const color = data.fill || COLORS[payload[0].dataKey === 'value' ? payload[0].payload.index % COLORS.length : 0]; // Fallback if fill not passed directly
            // Note: Recharts Pie Cell index mapping is separate, so we'll grab color from Cell map logic or payload if available.
            // Simplified: Pie passes fill in payload usually if mapped. Let's rely on index match logic if needed or ensure Cell passes it. 
            // Better: We'll calculate index color inside map to be safe.
            const index = chartData.findIndex(item => item.name === data.name);
            const actualColor = COLORS[index % COLORS.length];

            return (
                <div className="chart-tooltip">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: actualColor }}></div>
                        <p className="tooltip-label mb-0">{data.name}</p>
                    </div>
                    <p className="tooltip-value">₹{data.value.toLocaleString('en-IN')}</p>
                    <p className="tooltip-percent text-gray-400">{percent}% of Portfolio</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="chart-container">
            <div className="flex justify-between items-start mb-4">
                <h3 className="chart-title mb-0">Asset Allocation</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                    >
                        {chartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} cursor={false} />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        formatter={(value) => <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 500 }}>{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AllocationChart;
