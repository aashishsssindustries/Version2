/**
 * XIRR (Extended Internal Rate of Return) calculation
 * Uses Newton-Raphson method to find the rate where NPV = 0
 */

export interface Cashflow {
    date: Date;
    amount: number; // Negative for outflows, positive for inflows
}

/**
 * Calculate XIRR for a series of cashflows
 * @param cashflows Array of cashflows with dates and amounts
 * @param guess Initial guess for IRR (default: 0.1 = 10%)
 * @param tolerance Convergence tolerance (default: 0.0001)
 * @param maxIterations Maximum iterations (default: 100)
 * @returns Annualized rate as decimal (e.g., 0.12 = 12%)
 */
export function calculateXIRR(
    cashflows: Cashflow[],
    guess: number = 0.1,
    tolerance: number = 0.0001,
    maxIterations: number = 100
): number | null {
    if (cashflows.length < 2) {
        return null; // Need at least 2 cashflows
    }

    // Sort cashflows by date
    const sorted = [...cashflows].sort((a, b) => a.date.getTime() - b.date.getTime());
    const firstDate = sorted[0].date;

    let rate = guess;
    let iteration = 0;

    while (iteration < maxIterations) {
        const npv = calculateNPV(sorted, rate, firstDate);
        const derivative = calculateDerivative(sorted, rate, firstDate);

        if (Math.abs(derivative) < 1e-10) {
            return null; // Derivative too small, cannot continue
        }

        const newRate = rate - npv / derivative;

        if (Math.abs(newRate - rate) < tolerance) {
            return newRate; // Converged
        }

        rate = newRate;
        iteration++;
    }

    return null; // Did not converge
}

/**
 * Calculate Net Present Value for given rate
 */
function calculateNPV(cashflows: Cashflow[], rate: number, baseDate: Date): number {
    let npv = 0;

    for (const cf of cashflows) {
        const years = daysBetween(baseDate, cf.date) / 365;
        npv += cf.amount / Math.pow(1 + rate, years);
    }

    return npv;
}

/**
 * Calculate derivative of NPV with respect to rate
 */
function calculateDerivative(cashflows: Cashflow[], rate: number, baseDate: Date): number {
    let derivative = 0;

    for (const cf of cashflows) {
        const years = daysBetween(baseDate, cf.date) / 365;
        derivative -= (years * cf.amount) / Math.pow(1 + rate, years + 1);
    }

    return derivative;
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
    const msPerDay = 1000 * 60 * 60 * 24;
    return (date2.getTime() - date1.getTime()) / msPerDay;
}

/**
 * Convert XIRR decimal to percentage
 */
export function xirrToPercentage(xirr: number): number {
    return parseFloat((xirr * 100).toFixed(2));
}
