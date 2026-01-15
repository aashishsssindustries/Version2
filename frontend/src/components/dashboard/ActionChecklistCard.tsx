import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Trophy, Zap, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionItem {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: 'High' | 'Medium' | 'Low';
    gap_amount?: number;
    estimated_score_impact?: number;
    action?: string;
    linked_tool?: string;
    persona_context?: string;
    risk_type?: string;
}

interface ActionChecklistCardProps {
    actionItems: ActionItem[];
    hasProfile: boolean;
}

export const ActionChecklistCard: React.FC<ActionChecklistCardProps> = ({ actionItems, hasProfile }) => {

    const getToolLink = (item: ActionItem) => {
        if (!item.linked_tool) return '/calculators';

        const tool = item.linked_tool.toLowerCase();
        let toolId = '';

        if (tool.includes('sip')) toolId = 'sip';
        else if (tool.includes('retire')) toolId = 'retirement';
        else if (tool.includes('insurance') || tool.includes('life')) toolId = 'life-insurance';
        else if (tool.includes('emi')) toolId = 'emi';
        else if (tool.includes('education')) toolId = 'education';

        // Build URL with context parameters
        const params = new URLSearchParams({
            tool: toolId,
            context: 'action',
            title: item.title,
            ...(item.gap_amount && { gap: item.gap_amount.toString() })
        });

        return `/calculators?${params.toString()}`;
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Trophy size={18} className="text-amber-500" />
                    Top 3 Priorities
                </h3>
                {actionItems.length > 0 && (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                        Focus Areas
                    </span>
                )}
            </div>

            <div className="space-y-3 flex-1 overflow-visible">
                <AnimatePresence>
                    {actionItems && actionItems.length > 0 ? (
                        actionItems.map((item, index) => (
                            <motion.div
                                key={item.id || index}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all flex items-start gap-4 relative overflow-hidden group cursor-default"
                            >
                                {/* Priority Indicator Strip */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.priority === 'High' ? 'bg-red-500' :
                                    item.priority === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`} />

                                <div className={`p-2.5 rounded-xl shrink-0 ${item.priority === 'High' ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-500'
                                    }`}>
                                    <AlertTriangle size={20} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-800 text-sm leading-tight mb-1 truncate pr-2" title={item.title}>
                                        {item.title}
                                    </h4>
                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                                        {item.description}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex items-center gap-2">
                                            {item.estimated_score_impact && (
                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1 border border-emerald-100">
                                                    <Zap size={10} className="fill-emerald-600" /> +{item.estimated_score_impact} pts
                                                </span>
                                            )}
                                        </div>
                                        <Link
                                            to={getToolLink(item)}
                                            className="text-xs font-bold text-white bg-slate-900 hover:bg-indigo-600 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors shadow-sm"
                                        >
                                            Fix <ChevronRight size={12} />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : hasProfile ? (
                        <div className="bg-emerald-50 rounded-xl p-6 text-center border dashed border-emerald-200">
                            <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-3" />
                            <h3 className="font-bold text-emerald-800 text-sm">All Cleared!</h3>
                            <p className="text-xs text-emerald-600 mt-1">You're optimizing like a pro.</p>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400">
                            <p className="text-sm">Complete profile to unlock quests.</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
