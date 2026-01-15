import { Request, Response } from 'express';
import { CalculatorService } from '../services/calculator.service';

export class CalculatorController {

    static calculateSIP(req: Request, res: Response) {
        try {
            const { monthlyInvestment, rate, years } = req.body;
            if ([monthlyInvestment, rate, years].some(val => val === undefined || isNaN(Number(val)))) {
                res.status(400).json({ success: false, message: 'Invalid or missing numeric parameters' });
                return;
            }
            const result = CalculatorService.calculateSIP(Number(monthlyInvestment), Number(rate), Number(years));
            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static calculateEMI(req: Request, res: Response) {
        try {
            const { loanAmount, interestRate, tenureYears } = req.body;
            if ([loanAmount, interestRate, tenureYears].some(val => val === undefined || isNaN(Number(val)))) {
                res.status(400).json({ success: false, message: 'Invalid parameters' });
                return;
            }
            const result = CalculatorService.calculateEMI(Number(loanAmount), Number(interestRate), Number(tenureYears));
            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static calculateRetirement(req: Request, res: Response) {
        try {
            const { currentAge, retirementAge, monthlyExpenses, inflationRate, existingSavings, expectedReturn, postRetirementReturn } = req.body;
            if ([currentAge, retirementAge, monthlyExpenses, inflationRate, existingSavings, expectedReturn].some(val => val === undefined || isNaN(Number(val)))) {
                res.status(400).json({ success: false, message: 'Invalid parameters' });
                return;
            }
            const result = CalculatorService.calculateRetirement(
                Number(currentAge),
                Number(retirementAge),
                Number(monthlyExpenses),
                Number(inflationRate),
                Number(existingSavings),
                Number(expectedReturn),
                postRetirementReturn ? Number(postRetirementReturn) : 8
            );
            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    // New Controllers
    static calculateLifeInsurance(req: Request, res: Response) {
        try {
            const { income, age, retirementAge, liabilities, assets, dependents } = req.body;
            const result = CalculatorService.calculateLifeInsurance(Number(income), Number(age), Number(retirementAge), Number(liabilities), Number(assets), Number(dependents));
            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static calculateEducation(req: Request, res: Response) {
        try {
            const { childAge, goalYear, currentCost, inflation, currentSavings, returnRate } = req.body;
            const result = CalculatorService.calculateEducation(Number(childAge), Number(goalYear), Number(currentCost), Number(inflation), Number(currentSavings), Number(returnRate));
            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static calculateCostOfDelay(req: Request, res: Response) {
        try {
            const { sipAmount, returnRate, delayYears, totalYears } = req.body;
            const result = CalculatorService.calculateCostOfDelay(Number(sipAmount), Number(returnRate), Number(delayYears), Number(totalYears));
            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static calculateHRA(req: Request, res: Response) {
        try {
            const { basic, da, rentPaid, isMetro } = req.body;
            const result = CalculatorService.calculateHRA(Number(basic), Number(da), Number(rentPaid), Boolean(isMetro));
            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static calculateHomeAffordability(req: Request, res: Response) {
        try {
            const { monthlyIncome, existingEMI, interestRate, tenureYears } = req.body;
            const result = CalculatorService.calculateHomeAffordability(Number(monthlyIncome), Number(existingEMI), Number(interestRate), Number(tenureYears));
            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static calculateCAGR(req: Request, res: Response) {
        try {
            const { startValue, endValue, years } = req.body;
            const result = CalculatorService.calculateCAGR(Number(startValue), Number(endValue), Number(years));
            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}
