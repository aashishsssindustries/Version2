import React, { useState } from 'react';
import './PersonaAllocationChart.css';

// 30-30-30-10 Rule segments
const ALLOCATION_SEGMENTS = [
    {
        id: 'needs',
        label: 'Needs',
        percentage: 30,
        color: '#6366f1',
        description: 'Essential expenses: rent, utilities, groceries, EMIs, insurance premiums',
        examples: ['Rent/Mortgage', 'Utilities', 'Groceries', 'EMI payments', 'Basic insurance']
    },
    {
        id: 'wants',
        label: 'Wants',
        percentage: 30,
        color: '#8b5cf6',
        description: 'Lifestyle spending: dining, entertainment, travel, shopping',
        examples: ['Dining out', 'Entertainment', 'Travel', 'Shopping', 'Subscriptions']
    },
    {
        id: 'savings',
        label: 'Savings',
        percentage: 30,
        color: '#22c55e',
        description: 'Wealth building: investments, emergency fund, retirement corpus',
        examples: ['SIP/Mutual Funds', 'Stocks', 'PPF/NPS', 'Emergency fund', 'FDs']
    },
    {
        id: 'protection',
        label: 'Protection',
        percentage: 10,
        color: '#f59e0b',
        description: 'Risk coverage: term insurance, health insurance, contingency buffer',
        examples: ['Term life insurance', 'Health insurance', 'Critical illness cover', 'Contingency buffer']
    }
];

interface PersonaAllocationChartProps {
    actual?: {
        needs?: number;
        wants?: number;
        savings?: number;
        protection?: number;
    };
    showActual?: boolean;
    size?: number;
    interactive?: boolean;
    className?: string;
}

export const PersonaAllocationChart: React.FC<PersonaAllocationChartProps> = ({
    actual,
    showActual = false,
    size = 240,
    interactive = true,
    className = ''
}) => {
    const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

    const centerX = size / 2;
    const centerY = size / 2;
    const outerRadius = size * 0.42;
    const innerRadius = size * 0.25;



    const polarToCartesian = (cx: number, cy: number, radius: number, angleInDegrees: number) => {
        const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
        return {
            x: cx + radius * Math.cos(angleInRadians),
            y: cy + radius * Math.sin(angleInRadians)
        };
    };

    // Generate donut segment path
    const describeDonutSegment = (startAngle: number, endAngle: number, outerR: number, innerR: number): string => {
        const outerStart = polarToCartesian(centerX, centerY, outerR, endAngle);
        const outerEnd = polarToCartesian(centerX, centerY, outerR, startAngle);
        const innerStart = polarToCartesian(centerX, centerY, innerR, startAngle);
        const innerEnd = polarToCartesian(centerX, centerY, innerR, endAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

        return `
            M ${outerStart.x} ${outerStart.y}
            A ${outerR} ${outerR} 0 ${largeArcFlag} 0 ${outerEnd.x} ${outerEnd.y}
            L ${innerStart.x} ${innerStart.y}
            A ${innerR} ${innerR} 0 ${largeArcFlag} 1 ${innerEnd.x} ${innerEnd.y}
            Z
        `;
    };

    // Calculate angles for each segment
    let currentAngle = 0;
    const segments = ALLOCATION_SEGMENTS.map(segment => {
        const angleSpan = (segment.percentage / 100) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angleSpan;
        const midAngle = startAngle + angleSpan / 2;
        currentAngle = endAngle;

        const labelRadius = (outerRadius + innerRadius) / 2;
        const labelPos = polarToCartesian(centerX, centerY, labelRadius, midAngle);

        return {
            ...segment,
            startAngle,
            endAngle,
            midAngle,
            labelPos,
            path: describeDonutSegment(startAngle, endAngle, outerRadius, innerRadius)
        };
    });

    const hoveredData = segments.find(s => s.id === hoveredSegment);

    return (
        <div className={`persona-allocation-container ${className}`}>
            <svg
                viewBox={`0 0 ${size} ${size}`}
                className="persona-allocation-svg"
                width={size}
                height={size}
            >
                {/* Donut segments */}
                {segments.map(segment => (
                    <g key={segment.id}>
                        <path
                            d={segment.path}
                            fill={segment.color}
                            className={`segment ${hoveredSegment === segment.id ? 'active' : ''} ${hoveredSegment && hoveredSegment !== segment.id ? 'dimmed' : ''}`}
                            onMouseEnter={() => interactive && setHoveredSegment(segment.id)}
                            onMouseLeave={() => interactive && setHoveredSegment(null)}
                            style={{ cursor: interactive ? 'pointer' : 'default' }}
                        />
                    </g>
                ))}

                {/* Center text */}
                <text x={centerX} y={centerY - 8} className="center-title" textAnchor="middle">
                    30-30-30-10
                </text>
                <text x={centerX} y={centerY + 12} className="center-subtitle" textAnchor="middle">
                    Rule
                </text>

                {/* Segment labels */}
                {segments.map(segment => (
                    <g key={`label-${segment.id}`}>
                        <text
                            x={segment.labelPos.x}
                            y={segment.labelPos.y - 4}
                            className="segment-label"
                            textAnchor="middle"
                            dominantBaseline="middle"
                        >
                            {segment.percentage}%
                        </text>
                    </g>
                ))}
            </svg>

            {/* Legend */}
            <div className="allocation-legend">
                {segments.map(segment => (
                    <div
                        key={segment.id}
                        className={`legend-item ${hoveredSegment === segment.id ? 'active' : ''}`}
                        onMouseEnter={() => interactive && setHoveredSegment(segment.id)}
                        onMouseLeave={() => interactive && setHoveredSegment(null)}
                    >
                        <span className="legend-dot" style={{ backgroundColor: segment.color }}></span>
                        <span className="legend-label">{segment.label}</span>
                        <span className="legend-percent">{segment.percentage}%</span>
                    </div>
                ))}
            </div>

            {/* Hover tooltip */}
            {interactive && hoveredData && (
                <div className="allocation-tooltip">
                    <div className="tooltip-header" style={{ borderColor: hoveredData.color }}>
                        <span className="tooltip-dot" style={{ backgroundColor: hoveredData.color }}></span>
                        <span className="tooltip-title">{hoveredData.label}</span>
                        <span className="tooltip-percent">{hoveredData.percentage}%</span>
                    </div>
                    <p className="tooltip-desc">{hoveredData.description}</p>
                    <div className="tooltip-examples">
                        {hoveredData.examples.map((ex, i) => (
                            <span key={i} className="example-tag">{ex}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* Actual vs Ideal comparison */}
            {showActual && actual && (
                <div className="actual-comparison">
                    <h4>Your Allocation vs Ideal</h4>
                    {segments.map(segment => {
                        const actualValue = actual[segment.id as keyof typeof actual] || 0;
                        const diff = actualValue - segment.percentage;
                        const status = Math.abs(diff) <= 5 ? 'ok' : diff > 0 ? 'over' : 'under';

                        return (
                            <div key={segment.id} className="comparison-row">
                                <span className="comp-label">{segment.label}</span>
                                <div className="comp-bars">
                                    <div className="bar-ideal" style={{ width: `${segment.percentage}%`, backgroundColor: segment.color }}></div>
                                    <div className={`bar-actual ${status}`} style={{ width: `${Math.min(actualValue, 100)}%` }}></div>
                                </div>
                                <span className={`comp-diff ${status}`}>
                                    {diff > 0 ? '+' : ''}{diff.toFixed(0)}%
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// Static SVG export for PDF generation
export const PersonaAllocationSVG = (): string => {
    const size = 200;
    const centerX = size / 2;
    const centerY = size / 2;
    const outerRadius = size * 0.42;
    const innerRadius = size * 0.25;

    const polarToCartesian = (cx: number, cy: number, radius: number, angleInDegrees: number) => {
        const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
        return {
            x: cx + radius * Math.cos(angleInRadians),
            y: cy + radius * Math.sin(angleInRadians)
        };
    };

    const describeDonutSegment = (startAngle: number, endAngle: number, outerR: number, innerR: number): string => {
        const outerStart = polarToCartesian(centerX, centerY, outerR, endAngle);
        const outerEnd = polarToCartesian(centerX, centerY, outerR, startAngle);
        const innerStart = polarToCartesian(centerX, centerY, innerR, startAngle);
        const innerEnd = polarToCartesian(centerX, centerY, innerR, endAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

        return `M ${outerStart.x} ${outerStart.y} A ${outerR} ${outerR} 0 ${largeArcFlag} 0 ${outerEnd.x} ${outerEnd.y} L ${innerStart.x} ${innerStart.y} A ${innerR} ${innerR} 0 ${largeArcFlag} 1 ${innerEnd.x} ${innerEnd.y} Z`;
    };

    let currentAngle = 0;
    const paths = ALLOCATION_SEGMENTS.map(segment => {
        const angleSpan = (segment.percentage / 100) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angleSpan;
        currentAngle = endAngle;

        return `<path d="${describeDonutSegment(startAngle, endAngle, outerRadius, innerRadius)}" fill="${segment.color}" />`;
    }).join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
        ${paths}
        <text x="${centerX}" y="${centerY - 5}" text-anchor="middle" font-size="14" font-weight="700" fill="#1e293b">30-30-30-10</text>
        <text x="${centerX}" y="${centerY + 12}" text-anchor="middle" font-size="10" fill="#64748b">Rule</text>
    </svg>`;
};

export default PersonaAllocationChart;
