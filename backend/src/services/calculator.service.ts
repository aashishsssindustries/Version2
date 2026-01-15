export class CalculatorService {

    // 1. SIP Calculator
    static calculateSIP(monthlyInvestment: number, rate: number, years: number) {
        // ... (Existing implementation)
        const i = rate / 100 / 12;
        const n = years * 12;

        const investedAmount = monthlyInvestment * n;
        let fv = 0;

        if (rate === 0) {
            fv = investedAmount;
        } else {
            fv = monthlyInvestment * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
        }

        const estReturns = fv - investedAmount;

        const yearlyBreakdown = [];
        for (let y = 1; y <= years; y++) {
            const months = y * 12;
            let yearFV = 0;
            if (rate === 0) {
                yearFV = monthlyInvestment * months;
            } else {
                yearFV = monthlyInvestment * ((Math.pow(1 + i, months) - 1) / i) * (1 + i);
            }
            yearlyBreakdown.push({
                year: y,
                value: Math.round(yearFV),
                invested: monthlyInvestment * months
            });
        }

        return {
            summary: {
                investedAmount: Math.round(investedAmount),
                estReturns: Math.round(estReturns),
                totalValue: Math.round(fv)
            },
            breakdown: yearlyBreakdown,
            chartData: yearlyBreakdown
        };
    }

    // 2. EMI Calculator
    static calculateEMI(loanAmount: number, interestRate: number, tenureYears: number) {
        // ... (Existing implementation)
        const r = interestRate / 100 / 12;
        const n = tenureYears * 12;

        let emi = 0;
        if (interestRate === 0) {
            emi = loanAmount / n;
        } else {
            emi = (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        }

        const totalPayment = emi * n;
        const totalInterest = totalPayment - loanAmount;

        const breakdown = [];
        let balance = loanAmount;

        for (let m = 1; m <= n; m++) {
            const interest = balance * r;
            const principal = emi - interest;
            balance -= principal;
            if (balance < 0) balance = 0;

            breakdown.push({
                month: m,
                principal: Math.round(principal),
                interest: Math.round(interest),
                balance: Math.round(balance)
            });
        }

        return {
            summary: {
                monthlyEMI: Math.round(emi),
                totalInterest: Math.round(totalInterest),
                totalPayment: Math.round(totalPayment)
            },
            breakdown: breakdown,
            chartData: breakdown
        };
    }

    // 3. Retirement Calculator
    static calculateRetirement(
        currentAge: number,
        retirementAge: number,
        monthlyExpenses: number,
        inflationRate: number,
        existingSavings: number,
        expectedReturn: number,
        postRetirementReturn: number = 8
    ) {
        // ... (Existing implementation)
        const yearsToRetire = retirementAge - currentAge;
        if (yearsToRetire <= 0) {
            throw new Error("Retirement age must be greater than current age");
        }

        const expenseInflation = inflationRate / 100;
        const monthlyExpAtRetirement = monthlyExpenses * Math.pow(1 + expenseInflation, yearsToRetire);
        const annualExpAtRetirement = monthlyExpAtRetirement * 12;

        const postRetRateDecimal = postRetirementReturn / 100;
        const targetCorpus = postRetRateDecimal > 0
            ? (annualExpAtRetirement / postRetRateDecimal)
            : (annualExpAtRetirement * 30);

        const growthRate = expectedReturn / 100;
        const existingCorpusGrown = existingSavings * Math.pow(1 + growthRate, yearsToRetire);

        let gap = targetCorpus - existingCorpusGrown;
        if (gap < 0) gap = 0;

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

        const chartData = [];
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
            chartData.push({
                year: currentAge + y,
                corpus: Math.round(projectedCorpus),
                target: Math.round(targetCorpus)
            });
        }

        return {
            summary: {
                yearsToRetire,
                monthlyExpAtRetirement: Math.round(monthlyExpAtRetirement),
                targetCorpus: Math.round(targetCorpus),
                existingCorpusGrown: Math.round(existingCorpusGrown),
                gap: Math.round(gap),
                monthlySavingsRequired: Math.round(requiredSIP)
            },
            breakdown: [],
            chartData
        };
    }

    // 4. Life Insurance Calculator
    static calculateLifeInsurance(income: number, age: number, retirementAge: number, liabilities: number, assets: number, _dependents: number) {
        const workingYears = Math.max(0, retirementAge - age);

        // Human Life Value (Simple: Annual Income * Working Years) - Discounting could be added but stick to User req
        // Req: (Future Income) + Liabilities - Assets
        // Assuming linear for now as "PV of future income" usually implies some discounting, 
        // but let's use a standard multiplier if user didn't specify rates. 
        // User said: PV of future income. Let's assume a discount rate = inflation ~ risk free rate cancel out => Income * Years
        // or strictly PV: Income * ((1-(1+r)^-n)/r). Let's use 6% discount rate.

        const r = 0.06;
        const pvIncome = income * ((1 - Math.pow(1 + r, -workingYears)) / r);

        const totalNeeds = pvIncome + liabilities;
        const requiredCover = Math.max(0, totalNeeds - assets);


        // Let's assume inputs might need `existingCover`? 
        // User inputs list: "Annual Income, Dependents, Liabilities, Existing Assets". No existing cover input listed in user request. 
        // But Output said "Existing Cover (if any)". Let's assume 0 for now or add to inputs if we can refactor.
        // I will stick to the listed inputs in the prompt: "Annual Income, Dependents, Liabilities, Existing Assets"
        // So existing cover = 0.

        const chartData = [
            { name: 'Assets', value: assets },
            { name: 'Insurance Needed', value: requiredCover }
        ];

        return {
            summary: {
                pvFutureIncome: Math.round(pvIncome),
                totalLiabilities: Math.round(liabilities),
                existingAssets: Math.round(assets),
                requiredCover: Math.round(requiredCover)
            },
            chartData
        };
    }

    // 5. Education Calculator
    static calculateEducation(_childAge: number, goalYear: number, currentCost: number, inflation: number, currentSavings: number, returnRate: number) {

        // User Req Inputs: "Child Age, Goal Year". So we calc years.
        // Wait, "Goal Year" usually means the calendar year (e.g. 2035).
        // Let's assume input is relative or absolute? "Goal Year" usually absolute.
        // But simpler to ask "Age at College"? 
        // User prompt says: "Child Age, Goal Year".
        // Let's assume `Goal Year` is e.g. 2035.

        const currentYear = new Date().getFullYear();
        let years = goalYear - currentYear;
        // Fallback: If user entered age (e.g. 18), handle that? No, strict to contract.
        if (years < 1) years = 1;

        const infl = inflation / 100;
        const fvCost = currentCost * Math.pow(1 + infl, years);

        const r = returnRate / 100;
        const fvSavings = currentSavings * Math.pow(1 + r, years);

        const shortfall = Math.max(0, fvCost - fvSavings);

        // Monthly Savings Required
        const i = r / 12;
        const months = years * 12;
        let monthlySavings = 0;
        if (shortfall > 0) {
            monthlySavings = shortfall * i / (Math.pow(1 + i, months) - 1); // Sinking fund
        }

        // Chart: Cost Growth vs Savings Growth
        const chartData = [];
        for (let y = 0; y <= years; y++) {
            chartData.push({
                year: currentYear + y,
                cost: Math.round(currentCost * Math.pow(1 + infl, y)),
                savings: Math.round(currentSavings * Math.pow(1 + r, y) + (monthlySavings * 12 * y)) // Rough approx for chart
            });
        }

        return {
            summary: {
                yearsToGoal: years,
                futureCost: Math.round(fvCost),
                existingSavingsFV: Math.round(fvSavings),
                shortfall: Math.round(shortfall),
                monthlySavingsRequired: Math.round(monthlySavings)
            },
            chartData
        };
    }

    // 6. Cost of Delay
    static calculateCostOfDelay(sipAmount: number, returnRate: number, delayYears: number, totalYears: number) {
        // Logic: FV(total) vs FV(total - delay)
        // And the difference is the Cost.

        const r = returnRate / 100 / 12;
        const nTotal = totalYears * 12;
        const nDelayed = (totalYears - delayYears) * 12;

        const fvImmediate = sipAmount * ((Math.pow(1 + r, nTotal) - 1) / r) * (1 + r);
        const fvDelayed = nDelayed > 0
            ? sipAmount * ((Math.pow(1 + r, nDelayed) - 1) / r) * (1 + r)
            : 0;

        const cost = fvImmediate - fvDelayed;

        // Chart: Two curves
        const chartData = [];
        for (let y = 1; y <= totalYears; y++) {
            const months = y * 12;
            const valImm = sipAmount * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);

            let valDel = 0;
            if (y > delayYears) {
                const mDel = (y - delayYears) * 12;
                valDel = sipAmount * ((Math.pow(1 + r, mDel) - 1) / r) * (1 + r);
            }

            chartData.push({
                year: y,
                immediate: Math.round(valImm),
                delayed: Math.round(valDel)
            });
        }

        return {
            summary: {
                fvImmediate: Math.round(fvImmediate),
                fvDelayed: Math.round(fvDelayed),
                costOfDelay: Math.round(cost)
            },
            chartData
        };
    }

    // 7. HRA Calculator
    static calculateHRA(basic: number, da: number, rentPaid: number, isMetro: boolean) {
        // Annual or Monthly? Inputs usually Monthly in India context for calculators unless specified. 
        // Let's assume Monthly inputs, output Annualized tax saved? 
        // Usually HRA exemption is calculated annually, but components are monthly.
        // Let's Compute Monthly Exemption * 12.

        const salary = basic + da;

        // 1. Actual HRA Received? User didn't input "HRA Received". 
        // The prompt says Inputs: "Basic, DA, Rent Paid, City". 
        // Missing "HRA Received". I'll assume HRA Received is 40% or 50% of Basic as standard structure? 
        // Or typically user inputs it. 
        // I will add `hraReceived` as an optional input or derived? 
        // Let's Assume `hraReceived` = Rent Paid (optimistic) or just return the Exemption LIMIT.
        // Logic says: Min(Actual HRA, Rent - 10%, 50/40%).
        // Without Actual HRA, we can only calculate the Eligible Exemption Limit based on Rent & Salary.
        // I will assume the user inputs include `hraReceived` in the controller/frontend even if not strictly in the summary list, 
        // OR calculate the max possible exemption.
        // Let's assume HRA Received = 40% of Basic (common standard) if not provided.
        // For now, I'll compute the "Exempt Amount" strictly based on Rent & Basic rules.

        const c1 = rentPaid - (0.10 * salary); // Rent - 10% Basic+DA
        const c2 = isMetro ? (0.50 * salary) : (0.40 * salary); // 50% or 40%
        // We lack c3 (Actual HRA). 
        // Let's return the min of these two as "Max Eligible Exemption".

        const exempt = Math.max(0, Math.min(c1, c2));

        return {
            summary: {
                rentMinus10Percent: Math.round(c1 > 0 ? c1 : 0),
                limitOnBasic: Math.round(c2),
                exemptAmountMonthly: Math.round(exempt),
                exemptAmountYearly: Math.round(exempt * 12)
            },
            chartData: [
                { name: 'Exempt', value: Math.round(exempt) },
                { name: 'Taxable', value: Math.round(Math.max(0, rentPaid - exempt)) } // conceptual
            ]
        };
    }

    // 8. Home Affordability
    static calculateHomeAffordability(monthlyIncome: number, existingEMI: number, interestRate: number, tenureYears: number) {
        // Logic: Max EMI capped at 40% income
        const maxEMI = (monthlyIncome * 0.40) - existingEMI;

        let loanEligible = 0;
        if (maxEMI > 0) {
            const r = interestRate / 100 / 12;
            const n = tenureYears * 12;
            // PV = EMI * ( (1 - (1+r)^-n) / r )
            loanEligible = maxEMI * ((1 - Math.pow(1 + r, -n)) / r);
        }

        return {
            summary: {
                maxMonthlyEMI: Math.round(maxEMI > 0 ? maxEMI : 0),
                loanEligible: Math.round(loanEligible),
                monthlyIncome: monthlyIncome
            },
            chartData: [] // Simple widget
        };
    }

    // 9. CAGR Calculator
    static calculateCAGR(startValue: number, endValue: number, years: number) {
        let cagr = 0;
        if (startValue > 0 && years > 0) {
            cagr = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
        }

        // Chart: Growth curve
        const chartData = [];
        for (let y = 0; y <= years; y++) {
            chartData.push({
                year: y,
                value: Math.round(startValue * Math.pow(1 + cagr / 100, y))
            });
        }

        return {
            summary: {
                cagr: Number(cagr.toFixed(2)),
                absoluteReturn: Math.round(endValue - startValue),
                multiplier: Number((endValue / startValue).toFixed(2))
            },
            chartData
        };
    }
}
