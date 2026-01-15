import React from 'react';
import { IndianRupee, Shield, TrendingDown, Activity, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface SnapshotStatsProps {
    surplus: number;
    emergencyMonths: number;
    debtRatio: number;
    riskProfile: string;
}

export const SnapshotStats: React.FC<SnapshotStatsProps> = ({
    surplus,
    emergencyMonths,
    debtRatio,
    riskProfile
}) => {
    // Utility to determine trend color and icon
    const getTrend = (type: 'surplus' | 'emergency' | 'debt', value: number) => {
        if (type === 'surplus') {
            return { color: 'text-emerald-500', icon: <ArrowUpRight size={14} /> }; // More is better
        }
        if (type === 'emergency') {
            if (value >= 6) return { color: 'text-emerald-500', icon: <ArrowUpRight size={14} /> };
            if (value >= 3) return { color: 'text-amber-500', icon: <Minus size={14} /> };
            return { color: 'text-red-500', icon: <ArrowDownRight size={14} /> };
        }
        if (type === 'debt') {
            if (value > 40) return { color: 'text-red-500', icon: <ArrowUpRight size={14} /> }; // High debt is bad
            if (value > 20) return { color: 'text-amber-500', icon: <Minus size={14} /> };
            return { color: 'text-emerald-500', icon: <ArrowDownRight size={14} /> }; // Low debt is goodTrend
        }
        return { color: 'text-slate-500', icon: <Minus size={14} /> };
    };

    const surplusTrend = getTrend('surplus', surplus);
    const emergencyTrend = getTrend('emergency', emergencyMonths);
    const debtTrend = getTrend('debt', debtRatio);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 col-span-full">
            {/* Net Monthly Surplus */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:scale-[1.01] transition-all duration-200">
                <div className="flex justify-between items-start mb-2">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Net Monthly Surplus</div>
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                        <IndianRupee size={18} />
                    </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 mb-1">₹{surplus.toLocaleString('en-IN')}</div>
                <div className={`text-xs font-semibold flex items-center gap-1 ${surplusTrend.color}`}>
                    {surplusTrend.icon} Investable Amount
                </div>
            </div>

            {/* Emergency Cover */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:scale-[1.01] transition-all duration-200">
                <div className="flex justify-between items-start mb-2">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Emergency Cover</div>
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                        <Shield size={18} />
                    </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 mb-1 flex items-baseline gap-1">
                    {emergencyMonths.toFixed(1)} <span className="text-sm font-semibold text-slate-400">mo</span>
                </div>
                <div className={`text-xs font-semibold flex items-center gap-1 ${emergencyTrend.color}`}>
                    {emergencyTrend.icon} Target: 6 months
                </div>
            </div>

            {/* Debt Ratio */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:scale-[1.01] transition-all duration-200">
                <div className="flex justify-between items-start mb-2">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Debt Ratio</div>
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                        <TrendingDown size={18} />
                    </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 mb-1">{debtRatio.toFixed(1)}%</div>
                <div className={`text-xs font-semibold flex items-center gap-1 ${debtTrend.color}`}>
                    {debtTrend.icon} Of Monthly Income
                </div>
            </div>

            {/* Risk Profile */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:scale-[1.01] transition-all duration-200">
                <div className="flex justify-between items-start mb-2">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Risk Profile</div>
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                        <Activity size={18} />
                    </div>
                </div>
                <div className="text-xl font-bold text-slate-900 mb-1 truncate" title={riskProfile}>{riskProfile || 'Unassessed'}</div>
                <div className="text-xs text-slate-500 font-semibold">
                    Based on Assessment
                </div>
            </div>
        </div>
    );
};
