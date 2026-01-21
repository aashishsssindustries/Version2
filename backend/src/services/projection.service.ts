/**
 * Projection Datasets Service
 * 
 * Generates projection datasets for reports.
 * All computations EXACTLY match CalculatorService logic.
 */

// ==================== Types ====================

export interface SIPProjectionParams {
    monthlyInvestment: number;
    rate: number;           // Annual return %
    years: number;
}

export interface SIPProjectionData {
    year: number;
    invested: number;       // Cumulative invested
    value: number;          // Corpus value
    returns: number;        // Value - Invested
}

export interface SIPProjection {
    summary: {
        investedAmount: number;
        estReturns: number;
        totalValue: number;
    };
    yearlyData: SIPProjectionData[];
}

export interface RetirementGlidePathParams {
    currentAge: number;
    retirementAge: number;
    monthlyExpenses: number;
    inflationRate: number;
    existingSavings: number;
    expectedReturn: number;
    postRetirementReturn?: number;
}

export interface RetirementGlidePathData {
    age: number;
    year: number;
    corpus: number;         // Projected corpus at this age
    target: number;         // Target corpus (constant)
    gap: number;            // Target - Corpus
    onTrack: boolean;       // gap <= 0
}

export interface RetirementGlidePath {
    summary: {
        yearsToRetire: number;
        targetCorpus: number;
        monthlySavingsRequired: number;
        gap: number;
        monthlyExpAtRetirement: number;
    };
    yearlyData: RetirementGlidePathData[];
}

export interface GoalFundingParams {
    goalName: string;
    goalYear: number;
    currentCost: number;
    inflation: number;      // Annual inflation %
    currentSavings: number;
    returnRate: number;     // Annual return %
}

export interface GoalFundingData {
    year: number;
    goal: string;
    cost: number;           // Inflated cost at this year
    savings: number;        // Projected savings at this year
    gap: number;            // Cost - Savings
    funded: boolean;        // gap <= 0
}

export interface GoalFundingTimeline {
    summary: {
        yearsToGoal: number;
        futureCost: number;
        shortfall: number;
        monthlySavingsRequired: number;
        existingSavingsFV: number;
    };
    yearlyData: GoalFundingData[];
}

export interface ProjectionBundle {
    sip?: SIPProjection;
    retirement?: RetirementGlidePath;
    goals?: GoalFundingTimeline[];
}

// ==================== Service ====================

export class ProjectionService {

    /**
     * Generate SIP Growth Projection
     * Logic copied from CalculatorService.calculateSIP
     */
    static generateSIPProjection(params: SIPProjectionParams): SIPProjection {
        const { monthlyInvestment, rate, years } = params;

        const i = rate / 100 / 12;          // Monthly rate
        const n = years * 12;               // Total months

        const investedAmount = monthlyInvestment * n;
        let fv = 0;

        if (rate === 0) {
            fv = investedAmount;
        } else {
            fv = monthlyInvestment * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
        }

        const estReturns = fv - investedAmount;

        // Year-by-year breakdown
        const yearlyData: SIPProjectionData[] = [];
        for (let y = 1; y <= years; y++) {
            const months = y * 12;
            let yearFV = 0;
            if (rate === 0) {
                yearFV = monthlyInvestment * months;
            } else {
                yearFV = monthlyInvestment * ((Math.pow(1 + i, months) - 1) / i) * (1 + i);
            }
            const invested = monthlyInvestment * months;
            yearlyData.push({
                year: y,
                invested: Math.round(invested),
                value: Math.round(yearFV),
                returns: Math.round(yearFV - invested)
            });
        }

        return {
            summary: {
                investedAmount: Math.round(investedAmount),
                estReturns: Math.round(estReturns),
                totalValue: Math.round(fv)
            },
            yearlyData
        };
    }

    /**
     * Generate Retirement Glide Path
     * Logic copied from CalculatorService.calculateRetirement
     */
    static generateRetirementGlidePath(params: RetirementGlidePathParams): RetirementGlidePath {
        const {
            currentAge,
            retirementAge,
            monthlyExpenses,
            inflationRate,
            existingSavings,
            expectedReturn,
            postRetirementReturn = 8
        } = params;

        const yearsToRetire = retirementAge - currentAge;
        if (yearsToRetire <= 0) {
            throw new Error("Retirement age must be greater than current age");
        }

        // Calculate expenses at retirement
        const expenseInflation = inflationRate / 100;
        const monthlyExpAtRetirement = monthlyExpenses * Math.pow(1 + expenseInflation, yearsToRetire);
        const annualExpAtRetirement = monthlyExpAtRetirement * 12;

        // Target corpus (perpetuity-style)
        const postRetRateDecimal = postRetirementReturn / 100;
        const targetCorpus = postRetRateDecimal > 0
            ? (annualExpAtRetirement / postRetRateDecimal)
            : (annualExpAtRetirement * 30);

        // Growth of existing savings
        const growthRate = expectedReturn / 100;
        const existingCorpusGrown = existingSavings * Math.pow(1 + growthRate, yearsToRetire);

        // Calculate gap
        let gap = targetCorpus - existingCorpusGrown;
        if (gap < 0) gap = 0;

        // Required SIP to fill gap
        const i = growthRate / 12;
        const months = yearsToRetire * 12;
        let requiredSIP = 0;

        if (gap > 0) {
            if (i > 0) {
                const factor = ((Math.pow(1 + i, months) - 1) / i) * (1 + i);
                requiredSIP = gap / factor;
            } else {
                requiredSIP = gap / months;
            }
        }

        // Year-by-year glide path
        const yearlyData: RetirementGlidePathData[] = [];
        const currentYear = new Date().getFullYear();

        for (let y = 0; y <= yearsToRetire; y++) {
            const monthsPassed = y * 12;
            let valSavings = existingSavings * Math.pow(1 + growthRate, y);
            let valSIP = 0;
            if (requiredSIP > 0) {
                if (i > 0) {
                    valSIP = requiredSIP * ((Math.pow(1 + i, monthsPassed) - 1) / i) * (1 + i);
                } else {
                    valSIP = requiredSIP * monthsPassed;
                }
            }
            const projectedCorpus = valSavings + valSIP;
            const yearGap = targetCorpus - projectedCorpus;

            yearlyData.push({
                age: currentAge + y,
                year: currentYear + y,
                corpus: Math.round(projectedCorpus),
                target: Math.round(targetCorpus),
                gap: Math.round(yearGap),
                onTrack: yearGap <= 0
            });
        }

        return {
            summary: {
                yearsToRetire,
                targetCorpus: Math.round(targetCorpus),
                monthlySavingsRequired: Math.round(requiredSIP),
                gap: Math.round(gap),
                monthlyExpAtRetirement: Math.round(monthlyExpAtRetirement)
            },
            yearlyData
        };
    }

    /**
     * Generate Goal Funding Timeline
     * Logic copied from CalculatorService.calculateEducation
     */
    static generateGoalFundingTimeline(params: GoalFundingParams): GoalFundingTimeline {
        const {
            goalName,
            goalYear,
            currentCost,
            inflation,
            currentSavings,
            returnRate
        } = params;

        const currentYear = new Date().getFullYear();
        let years = goalYear - currentYear;
        if (years < 1) years = 1;

        // Future cost with inflation
        const infl = inflation / 100;
        const futureCost = currentCost * Math.pow(1 + infl, years);

        // Future value of current savings
        const r = returnRate / 100;
        const existingSavingsFV = currentSavings * Math.pow(1 + r, years);

        // Shortfall
        const shortfall = Math.max(0, futureCost - existingSavingsFV);

        // Monthly savings required (sinking fund formula)
        const i = r / 12;
        const months = years * 12;
        let monthlySavings = 0;
        if (shortfall > 0 && i > 0) {
            monthlySavings = shortfall * i / (Math.pow(1 + i, months) - 1);
        } else if (shortfall > 0) {
            monthlySavings = shortfall / months;
        }

        // Year-by-year timeline
        const yearlyData: GoalFundingData[] = [];
        for (let y = 0; y <= years; y++) {
            const yearCost = currentCost * Math.pow(1 + infl, y);
            // Approximate savings growth (existing + SIP contributions)
            const yearSavings = currentSavings * Math.pow(1 + r, y) + (monthlySavings * 12 * y);
            const yearGap = yearCost - yearSavings;

            yearlyData.push({
                year: currentYear + y,
                goal: goalName,
                cost: Math.round(yearCost),
                savings: Math.round(yearSavings),
                gap: Math.round(yearGap),
                funded: yearGap <= 0
            });
        }

        return {
            summary: {
                yearsToGoal: years,
                futureCost: Math.round(futureCost),
                shortfall: Math.round(shortfall),
                monthlySavingsRequired: Math.round(monthlySavings),
                existingSavingsFV: Math.round(existingSavingsFV)
            },
            yearlyData
        };
    }

    /**
     * Generate bundled projections for reports
     * Uses default parameters if not provided
     */
    static generateReportBundle(options: {
        sipParams?: SIPProjectionParams;
        retirementParams?: RetirementGlidePathParams;
        goalParams?: GoalFundingParams[];
    }): ProjectionBundle {
        const bundle: ProjectionBundle = {};

        if (options.sipParams) {
            bundle.sip = this.generateSIPProjection(options.sipParams);
        }

        if (options.retirementParams) {
            bundle.retirement = this.generateRetirementGlidePath(options.retirementParams);
        }

        if (options.goalParams && options.goalParams.length > 0) {
            bundle.goals = options.goalParams.map(p => this.generateGoalFundingTimeline(p));
        }

        return bundle;
    }
}
