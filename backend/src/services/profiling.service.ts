// Redefining interface locally to avoid dependency issues 
// Actually, recreating types here to be self-contained as per previous pattern.

export interface FinancialInput {
    age?: number;
    gross_income: number; // Annual
    monthly_emi: number;
    fixed_expenses: number;
    existing_assets: number;
    total_liabilities: number;
    insurance_premium: number; // Annual
    insurance_coverage?: number; // Sum Assured
}

export interface RiskBehaviorContext {
    riskClass?: 'Conservative' | 'Moderate' | 'Aggressive';
    liquidityMonths: number;
    savingsRate: number;
    dti: number;
    personaId: string;
    hasContradictions?: boolean;
}

export interface ProfilingResult {
    metrics: {
        monthly_gross_income: number;
        monthly_surplus: number;
        ratios: {
            expenses: number;
            liabilities: number;
            investments: number;
            emergency_fund: number;
        }
    };
    deviations: {
        expenses: { actual: number; ideal: number; deviation: number; status: 'ok' | 'high' | 'low' };
        liabilities: { actual: number; ideal: number; deviation: number; status: 'ok' | 'high' | 'low' };
        investments: { actual: number; ideal: number; deviation: number; status: 'ok' | 'high' | 'low' };
        emergency_fund: { actual: number; ideal: number; deviation: number; status: 'ok' | 'high' | 'low' };
    };
    persona: {
        id: 'A' | 'B' | 'C';
        name: string;
        description: string;
        risk_appetite: 'Low' | 'Medium' | 'High';
    };
    behavior: {
        tag: string;
        description: string;
        reasons: string[];
    };
    recommendations: {
        id: string;
        title: string;
        description: string;
        category: string;
        trigger?: string;
        type?: string;
        priority: 'High' | 'Medium' | 'Low';
        gap?: number;
        scoreImpact?: string;
        action?: string;
        linked_tool?: string;
        persona_context?: string;
    }[];
    journey_path: {
        step: string;
        description: string;
    }[];
}

export class ProfilingService {
    private static IDEAL_RATIOS = {
        EXPENSES: 0.30,
        LIABILITIES: 0.30,
        INVESTMENTS: 0.30,
        EMERGENCY_FUND: 0.10,
    };

    static analyze(input: FinancialInput, riskClass?: 'Conservative' | 'Moderate' | 'Aggressive'): ProfilingResult {
        // 1. Income Normalization (Annual -> Monthly)
        const annual_income = input.gross_income || 0;
        const monthly_gross_income = annual_income > 0 ? annual_income / 12 : 1;

        const monthly_expenses = input.fixed_expenses || 0;
        const monthly_liabilities = input.monthly_emi || 0;
        const monthly_insurance = (input.insurance_premium || 0) / 12; // Annual to Monthly

        // 2. Metrics Calculation
        // Investments = Surplus = Income - Expenses - Liabilities - Insurance
        const monthly_surplus = monthly_gross_income - (monthly_expenses + monthly_liabilities + monthly_insurance);
        const monthly_investments = monthly_surplus > 0 ? monthly_surplus : 0;

        // Ratios
        const ratios = {
            expenses: monthly_expenses / monthly_gross_income,
            liabilities: monthly_liabilities / monthly_gross_income,
            investments: monthly_investments / monthly_gross_income,
            emergency_fund: monthly_insurance / monthly_gross_income // Proxy for now unless we add 'monthly_sip' input
        };

        // 3. Deviations
        const deviations = {
            expenses: this.getDeviation(ratios.expenses, this.IDEAL_RATIOS.EXPENSES),
            liabilities: this.getDeviation(ratios.liabilities, this.IDEAL_RATIOS.LIABILITIES),
            investments: this.getDeviation(ratios.investments, this.IDEAL_RATIOS.INVESTMENTS),
            emergency_fund: this.getDeviation(ratios.emergency_fund, this.IDEAL_RATIOS.EMERGENCY_FUND),
        };

        // 4. Classifications
        const persona = this.determinePersona(input.age || 30, annual_income);
        const behavior = this.determineBehavior(deviations);
        const recommendations = this.generateRecommendations(persona.id, ratios, input, riskClass);
        const journey_path = this.generateJourney(persona.id);

        return {
            metrics: {
                monthly_gross_income,
                monthly_surplus,
                ratios: {
                    expenses: ratios.expenses * 100,
                    liabilities: ratios.liabilities * 100,
                    investments: ratios.investments * 100,
                    emergency_fund: ratios.emergency_fund * 100
                }
            },
            deviations,
            persona,
            behavior,
            recommendations,
            journey_path
        };
    }

    private static getDeviation(actual: number, ideal: number) {
        const diffPoints = (actual - ideal) * 100;
        let status: 'ok' | 'high' | 'low' = 'ok';

        if (diffPoints > 5) status = 'high';
        else if (diffPoints < -5) status = 'low';

        return {
            actual: parseFloat((actual * 100).toFixed(1)),
            ideal: ideal * 100,
            deviation: parseFloat(diffPoints.toFixed(1)),
            status
        };
    }

    private static determinePersona(age: number, annualIncome: number) {
        // Persona A: Early Career Builder
        if (age <= 35 && annualIncome <= 1800000) {
            return {
                id: 'A' as const,
                name: 'Early Career Builder',
                description: 'Focus on Savings, SIPs, and Future Goals.',
                risk_appetite: 'Medium' as const
            };
        }

        // Persona B: Growth Strategist
        if ((age > 35 && age <= 50) || (annualIncome > 1800000)) {
            return {
                id: 'B' as const,
                name: 'Growth Strategist',
                description: 'Focus on Tax Optimization, Diversification, and Wealth Creation.',
                risk_appetite: 'High' as const
            };
        }

        // Persona C: Wealth Preserver
        return {
            id: 'C' as const,
            name: 'Wealth Preserver',
            description: 'Focus on Capital Preservation, Income, and Estate Planning.',
            risk_appetite: 'Low' as const
        };
    }

    private static determineBehavior(deviations: any) {
        const reasons: string[] = [];
        let tag = 'Balanced Accumulator';
        let desc = 'Your financial health is stable and balanced.';

        // Logic based on Monthly Ratios
        if (deviations.investments.status === 'low') {
            tag = 'Consumption Heavy';
            desc = 'Current spending is limiting wealth creation capacity.';
            reasons.push('Monthly investments are below the 30% target.');
            if (deviations.expenses.status === 'high') reasons.push('Fixed expenses exceed 30% of monthly income.');
            if (deviations.liabilities.status === 'high') reasons.push('Debt obligations are eating into surplus.');
        } else if (deviations.liabilities.status === 'high') {
            tag = 'Credit Leveraged';
            desc = 'High debt exposure requires immediate attention.';
            reasons.push('Monthly EMI outflow exceeds safe limits (30%).');
        } else if (deviations.investments.status === 'high' || deviations.investments.actual > 40) {
            tag = 'Aggressive Saver';
            desc = 'Excellent saving discipline detected.';
            reasons.push('You are investing significantly more than the 30% benchmark.');
        } else {
            // Balanced
            reasons.push('Monthly expenses are within safe limits.');
            reasons.push('Liability exposure is controlled.');
            reasons.push('Investment ratio meets the 30% target.');
        }

        return { tag, description: desc, reasons };
    }

    private static generateRecommendations(personaId: string, _ratios: any, input: FinancialInput, riskClass?: 'Conservative' | 'Moderate' | 'Aggressive') {
        const recs: any[] = [];
        const monthlyIncome = input.gross_income / 12;
        const monthlyExpenses = input.fixed_expenses;
        const monthlyEMI = input.monthly_emi;
        const monthlyInsurance = input.insurance_premium / 12;

        // Persona Name for Context
        const personaName = personaId === 'A' ? 'Early Career Builder'
            : personaId === 'B' ? 'Growth Strategist'
                : 'Wealth Preserver';

        // Calculate monthly surplus for savings rate
        const monthlySurplus = monthlyIncome - (monthlyExpenses + monthlyEMI + monthlyInsurance);
        const savingsRate = monthlyIncome > 0 ? monthlySurplus / monthlyIncome : 0;

        // --- RULE 1: Emergency Fund Shortfall (Graduated Priority) ---
        // Condition: Emergency fund < 3 × monthly expenses
        const liquidityMonths = monthlyExpenses > 0 ? input.existing_assets / monthlyExpenses : 0;

        if (liquidityMonths < 1) {
            // CRITICAL: Less than 1 month
            const gap = Math.round((3 * monthlyExpenses) - input.existing_assets);
            recs.push({
                id: 'emergency-fund-critical',
                title: 'Critical Emergency Fund Gap',
                category: 'Emergency Fund',
                type: 'Liquidity',
                priority: 'High' as const,
                description: `You have less than 1 month of emergency runway. Any income disruption could lead to financial crisis.`,
                gap: gap,
                scoreImpact: '+15',
                action: `Immediately build emergency fund to ₹${(3 * monthlyExpenses).toLocaleString()}.`,
                linked_tool: 'SIP',
                persona_context: `As a ${personaName}, liquidity is your first line of defense against uncertainty.`
            });
        } else if (liquidityMonths < 3) {
            // HIGH: Less than 3 months
            const gap = Math.round((3 * monthlyExpenses) - input.existing_assets);
            recs.push({
                id: 'emergency-fund-high',
                title: 'Emergency Fund Below Target',
                category: 'Emergency Fund',
                type: 'Liquidity',
                priority: 'High' as const,
                description: `Your emergency fund covers only ${liquidityMonths.toFixed(1)} months. The recommended minimum is 3 months of expenses.`,
                gap: gap,
                scoreImpact: '+12',
                action: `Build emergency fund by ₹${gap.toLocaleString()} to reach 3-month safety net.`,
                linked_tool: 'SIP',
                persona_context: `${personaName}s should prioritize emergency reserves before aggressive investments.`
            });
        } else if (liquidityMonths < 6) {
            // MEDIUM: Less than 6 months (optimal)
            const gap = Math.round((6 * monthlyExpenses) - input.existing_assets);
            recs.push({
                id: 'emergency-fund-medium',
                title: 'Strengthen Emergency Reserves',
                category: 'Emergency Fund',
                type: 'Liquidity',
                priority: 'Medium' as const,
                description: `You have ${liquidityMonths.toFixed(1)} months covered. Aim for 6 months for optimal security.`,
                gap: gap,
                scoreImpact: '+8',
                action: `Gradually increase emergency fund by ₹${gap.toLocaleString()}.`,
                linked_tool: 'SIP',
                persona_context: `A robust emergency fund allows ${personaName}s to take calculated investment risks.`
            });
        }

        // --- RULE 2: Under-Insurance ---
        // Condition: Life cover < (Annual income × 10 + liabilities)
        const requiredCover = (10 * input.gross_income) + input.total_liabilities;
        const currentCover = input.insurance_coverage || 0;

        if (currentCover < requiredCover) {
            const protectionGap = requiredCover - currentCover;
            const severity = protectionGap > (5 * input.gross_income) ? 'High' : 'Medium';

            recs.push({
                id: 'insurance-gap',
                title: 'Life Insurance Coverage Gap',
                category: 'Insurance',
                type: 'Insurance',
                priority: severity as 'High' | 'Medium',
                description: `Your current coverage of ₹${(currentCover / 100000).toFixed(1)}L falls short of the recommended ₹${(requiredCover / 100000).toFixed(1)}L. This leaves your dependents exposed.`,
                gap: protectionGap,
                scoreImpact: severity === 'High' ? '+15' : '+10',
                action: `Purchase additional Term Insurance of ₹${(protectionGap / 100000).toFixed(1)} Lakhs.`,
                linked_tool: 'Insurance',
                persona_context: `${personaName}s need comprehensive coverage to protect against income loss and liabilities.`
            });
        }

        // --- RULE 3: High Debt Burden ---
        // Condition: EMI / monthly income > 40%
        const dti = monthlyIncome > 0 ? monthlyEMI / monthlyIncome : 0;

        if (dti > 0.40) {
            const excessEMI = Math.round(monthlyEMI - (0.40 * monthlyIncome));
            const severity = dti > 0.50 ? 'High' : 'Medium';

            recs.push({
                id: 'debt-burden',
                title: 'High Debt-to-Income Ratio',
                category: 'Debt Management',
                type: 'Debt',
                priority: severity as 'High' | 'Medium',
                description: `Your EMI commitments consume ${(dti * 100).toFixed(1)}% of your income, severely limiting wealth creation capacity.`,
                gap: excessEMI,
                scoreImpact: severity === 'High' ? '+20' : '+15',
                action: `Reduce monthly EMI by ₹${excessEMI.toLocaleString()} through debt consolidation or prepayment.`,
                linked_tool: 'EMI',
                persona_context: `For ${personaName}s, high debt restricts the ability to invest for future goals.`
            });
        }

        // --- RULE 4: Low Savings Rate ---
        // Condition: Savings rate < 20%
        if (savingsRate < 0.20 && savingsRate >= 0) {
            const targetSavings = monthlyIncome * 0.20;
            const currentSavings = monthlySurplus > 0 ? monthlySurplus : 0;
            const gap = Math.round(targetSavings - currentSavings);

            recs.push({
                id: 'low-savings-rate',
                title: 'Below-Target Savings Rate',
                category: 'Savings',
                type: 'Investment',
                priority: 'Medium' as const,
                description: `Your current savings rate is ${(savingsRate * 100).toFixed(1)}%, below the recommended 20% minimum for wealth building.`,
                gap: gap,
                scoreImpact: '+10',
                action: `Increase monthly savings by ₹${gap.toLocaleString()} to reach 20% target.`,
                linked_tool: 'SIP',
                persona_context: `${personaName}s should aim for consistent savings to achieve long-term financial goals.`
            });
        } else if (savingsRate < 0) {
            // Negative savings (spending more than earning)
            const deficit = Math.abs(Math.round(monthlySurplus));
            recs.push({
                id: 'negative-savings',
                title: 'Negative Cash Flow Alert',
                category: 'Savings',
                type: 'Investment',
                priority: 'High' as const,
                description: `You are spending ₹${deficit.toLocaleString()} more than you earn each month. This is unsustainable.`,
                gap: deficit,
                scoreImpact: '+25',
                action: `Immediately reduce expenses or increase income to achieve positive cash flow.`,
                linked_tool: 'SIP',
                persona_context: `${personaName}s must establish positive cash flow before pursuing investment goals.`
            });
        }

        // --- RULE 5: Risk-Behavior Mismatch ---
        // Note: This requires risk profile data which comes from survey
        // We'll add a placeholder that can be enhanced when risk data is available
        // For now, we check if aggressive persona (B) has low liquidity
        if (personaId === 'B' && liquidityMonths < 3) {
            recs.push({
                id: 'risk-behavior-mismatch',
                title: 'Risk Profile Mismatch',
                category: 'Risk Management',
                type: 'General',
                priority: 'Medium' as const,
                description: `As a Growth Strategist with moderate-to-high risk appetite, your low liquidity (${liquidityMonths.toFixed(1)} months) creates vulnerability.`,
                gap: 0,
                scoreImpact: '+8',
                action: `Build emergency reserves before pursuing aggressive investment strategies.`,
                linked_tool: 'SIP',
                persona_context: `Growth Strategists need a solid foundation before taking calculated risks.`
            });
        }

        // --- Backfill with Positive Reinforcement if no critical issues ---
        if (recs.length === 0) {
            recs.push({
                id: 'portfolio-review',
                title: 'Financial Health Excellent',
                category: 'Optimization',
                type: 'General',
                priority: 'Low' as const,
                description: `Your financial fundamentals are strong. Continue monitoring and optimizing your portfolio.`,
                gap: 0,
                scoreImpact: '+0',
                action: `Review asset allocation quarterly and rebalance as needed.`,
                linked_tool: 'Retirement',
                persona_context: `${personaName}s in good financial health should focus on optimization and tax efficiency.`
            });
        }

        // --- RANKING ALGORITHM ---
        // Sort by: (1) Priority, (2) Score Impact, (3) Gap Amount
        const priorityWeight: Record<'High' | 'Medium' | 'Low', number> = { 'High': 3, 'Medium': 2, 'Low': 1 };

        recs.sort((a, b) => {
            // First by priority
            const priorityDiff = priorityWeight[b.priority as 'High' | 'Medium' | 'Low'] - priorityWeight[a.priority as 'High' | 'Medium' | 'Low'];
            if (priorityDiff !== 0) return priorityDiff;

            // Then by score impact
            const scoreA = parseInt(a.scoreImpact?.replace(/\D/g, '') || '0');
            const scoreB = parseInt(b.scoreImpact?.replace(/\D/g, '') || '0');
            if (scoreB !== scoreA) return scoreB - scoreA;

            // Finally by gap amount
            return (b.gap || 0) - (a.gap || 0);
        });

        // --- ENHANCEMENT: Apply Risk-Behavior Context ---
        if (riskClass) {
            const context: RiskBehaviorContext = {
                riskClass,
                liquidityMonths,
                savingsRate,
                dti,
                personaId
            };

            // Enhance each recommendation with contextual messaging
            const enhancedRecs = recs.map(rec => this.enhanceRecommendation(rec, context));

            // Reorder if risk-behavior mismatch detected
            const reordered = this.reorderForRiskMismatch(enhancedRecs, context);
            return reordered.slice(0, 5);
        }

        // Limit to top 5 items
        return recs.slice(0, 5);
    }

    private static generateJourney(personaId: string) {
        if (personaId === 'A') {
            return [
                { step: 'Start SIP', description: 'Begin your wealth journey with automated investments.' },
                { step: 'Tax Planning', description: 'Basic tax saving under 80C.' }
            ];
        } else if (personaId === 'B') {
            return [
                { step: 'Portfolio Review', description: 'Analyze existing assets for diversification.' },
                { step: 'Advanced Tax', description: 'Explore HRA, NPS, and other avenues.' }
            ];
        } else {
            return [
                { step: 'Income Security', description: 'Secure guaranteed income streams.' },
                { step: 'Estate Planning', description: 'Structure wealth transfer.' }
            ];
        }
    }

    /**
     * Enhance recommendation with risk-behavior context
     * Adjusts messaging based on survey risk class and financial behavior
     */
    private static enhanceRecommendation(rec: any, context: RiskBehaviorContext): any {
        const enhanced = { ...rec };

        // 1. Emergency Fund Recommendations
        if (rec.category === 'Emergency Fund') {
            if (context.riskClass === 'Aggressive' && context.liquidityMonths < 3) {
                enhanced.description = `⚠️ ${rec.description} Your aggressive risk profile requires a stronger safety foundation before pursuing high-return investments.`;
                enhanced.action = `PRIORITY: ${rec.action} Build this safety net before aggressive equity exposure.`;
                enhanced.persona_context = `Aggressive investors need robust emergency reserves to weather market volatility without forced liquidation.`;
            } else if (context.riskClass === 'Conservative') {
                enhanced.description = `${rec.description} This aligns perfectly with your conservative approach to financial security.`;
                enhanced.persona_context = `Conservative investors prioritize safety and liquidity—this is your foundation.`;
            } else if (context.riskClass === 'Moderate') {
                enhanced.description = `${rec.description} A balanced emergency fund supports your moderate risk strategy.`;
            }
        }

        // 2. Investment/Savings Recommendations
        if (rec.category === 'Savings' || rec.type === 'Investment') {
            if (context.riskClass === 'Conservative' && context.savingsRate > 0.30) {
                enhanced.action = `${rec.action} Consider debt funds, fixed deposits, or conservative balanced SIPs for stable, predictable growth.`;
                enhanced.persona_context = `Your strong savings discipline and conservative approach are ideal for gradual wealth building through low-risk instruments.`;
            } else if (context.riskClass === 'Aggressive' && context.liquidityMonths < 3) {
                enhanced.action = `${rec.action} However, prioritize emergency fund first before aggressive investments.`;
                enhanced.description = `${rec.description} Note: Aggressive investing requires a safety buffer.`;
            } else if (context.riskClass === 'Moderate') {
                enhanced.action = `${rec.action} Consider balanced or hybrid funds that match your moderate risk tolerance.`;
            }
        }

        // 3. Debt Management
        if (rec.category === 'Debt Management') {
            if (context.riskClass === 'Aggressive') {
                enhanced.description = `${rec.description} High debt limits your ability to take advantage of aggressive investment opportunities.`;
                enhanced.action = `${rec.action} Reducing debt frees up capital for higher-return investments.`;
            } else if (context.riskClass === 'Conservative') {
                enhanced.description = `${rec.description} Debt reduction aligns with your preference for financial stability.`;
            }
        }

        // 4. Insurance Recommendations
        if (rec.category === 'Insurance') {
            if (context.riskClass === 'Aggressive') {
                enhanced.description = `${rec.description} Adequate insurance is crucial when pursuing aggressive investment strategies.`;
            } else if (context.riskClass === 'Conservative') {
                enhanced.description = `${rec.description} Comprehensive coverage is essential for conservative risk management.`;
            }
        }

        // 5. Persona C (Wealth Preserver) Override
        if (context.personaId === 'C') {
            enhanced.persona_context = `As a Wealth Preserver, prioritize capital protection and guaranteed income over growth. Focus on preservation strategies.`;

            // Adjust messaging for preservation focus
            if (rec.type === 'Investment' || rec.category === 'Savings') {
                enhanced.action = enhanced.action.replace(/SIP|equity|growth/gi, (match: string) => {
                    if (match.toLowerCase().includes('sip')) return 'conservative debt funds';
                    if (match.toLowerCase().includes('equity')) return 'fixed income';
                    if (match.toLowerCase().includes('growth')) return 'preservation';
                    return match;
                });
            }
        }

        return enhanced;
    }

    /**
     * Reorder recommendations when risk-behavior mismatch is detected
     * Ensures safety-first approach for aggressive users with poor liquidity
     */
    private static reorderForRiskMismatch(recs: any[], context: RiskBehaviorContext): any[] {
        // Scenario: Aggressive Risk + Low Liquidity = Safety First
        if (context.riskClass === 'Aggressive' && context.liquidityMonths < 3) {
            const emergencyFundRecs = recs.filter(r => r.category === 'Emergency Fund');
            const debtRecs = recs.filter(r => r.category === 'Debt Management');
            const otherRecs = recs.filter(r => r.category !== 'Emergency Fund' && r.category !== 'Debt Management');

            // Prioritize: Emergency Fund → Debt → Others
            return [...emergencyFundRecs, ...debtRecs, ...otherRecs];
        }

        // Scenario: Conservative Risk + High Surplus = Gradual Escalation
        if (context.riskClass === 'Conservative' && context.savingsRate > 0.30) {
            // Keep order but ensure investment recommendations emphasize conservative instruments
            return recs;
        }

        // Default: No reordering
        return recs;
    }
}
