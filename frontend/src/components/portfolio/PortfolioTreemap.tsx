import React from 'react';
import {
    Treemap,
    ResponsiveContainer,
    Tooltip
} from 'recharts';

interface Holding {
    id: string;
    name: string;
    type: 'EQUITY' | 'MUTUAL_FUND';
    quantity: number;
    last_valuation?: number;
}

interface PortfolioTreemapProps {
    holdings: Holding[];
}

const COLORS = {
    EQUITY: ['#22c55e', '#16a34a', '#15803d', '#14532d'],
    MUTUAL_FUND: ['#6366f1', '#4f46e5', '#4338ca', '#3730a3']
};

const PortfolioTreemap: React.FC<PortfolioTreemapProps> = ({ holdings }) => {
    const validHoldings = holdings.filter(h => h.last_valuation && h.last_valuation > 0);

    if (validHoldings.length === 0) {
        return (
            <div className="chart-empty">
                <p>No valuation data available</p>
            </div>
        );
    }

    const data = validHoldings.map((h, i) => ({
        name: h.name,
        size: h.last_valuation || 0,
        type: h.type,
        fill: h.type === 'EQUITY'
            ? COLORS.EQUITY[i % COLORS.EQUITY.length]
            : COLORS.MUTUAL_FUND[i % COLORS.MUTUAL_FUND.length]
    }));

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            return (
                <div className="chart-tooltip">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }}></div>
                        <p className="tooltip-label mb-0">{item.name}</p>
                    </div>
                    <p className="tooltip-value">₹{item.size.toLocaleString('en-IN')}</p>
                    <p className="tooltip-type mt-1">{item.type === 'MUTUAL_FUND' ? 'Mutual Fund' : 'Equity'}</p>
                </div>
            );
        }
        return null;
    };

    const CustomContent = (props: any) => {
        const { x, y, width, height, name, fill } = props;

        if (width < 50 || height < 30) return null;

        return (
            <g>
                <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={fill}
                    stroke="#fff"
                    strokeWidth={2}
                    rx={6}
                />
                <text
                    x={x + width / 2}
                    y={y + height / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#fff"
                    fontSize={width > 120 ? 13 : 11}
                    fontWeight={600}
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                    {name.length > 12 ? name.substring(0, 10) + '...' : name}
                </text>
            </g>
        );
    };

    return (
        <div className="chart-container">
            <h3 className="chart-title mb-4">Portfolio Distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
                <Treemap
                    data={data}
                    dataKey="size"
                    aspectRatio={4 / 3}
                    stroke="#fff"
                    content={<CustomContent />}
                >
                    <Tooltip content={<CustomTooltip />} cursor={false} />
                </Treemap>
            </ResponsiveContainer>
        </div>
    );
};

export default PortfolioTreemap;
