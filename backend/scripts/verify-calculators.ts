// @ts-nocheck
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1/calculators';

async function verifyCalculators() {
    try {
        console.log('--- Starting Calculator Verification ---');

        // 1. Test SIP
        // P=10000, r=12%, t=10 years
        // Exp: Invested = 12L. FV approx 23.2L
        console.log('Testing SIP...');
        const sipRes = await axios.post(`${API_URL}/sip`, {
            monthlyInvestment: 10000,
            rate: 12,
            years: 10
        });
        const sipData = sipRes.data.data;
        if (sipData.investedAmount === 1200000 && sipData.totalValue > 2300000) {
            console.log('✅ SIP Valid:', sipData.totalValue);
        } else {
            console.error('❌ SIP Invalid:', sipData);
            process.exit(1);
        }

        // 2. Test EMI
        // L=10L, r=10%, t=20 years
        console.log('Testing EMI...');
        const emiRes = await axios.post(`${API_URL}/emi`, {
            loanAmount: 1000000,
            rate: 10,
            tenureYears: 20
        });
        const emiData = emiRes.data.data;
        // Exp EMI ~9650
        if (emiData.monthlyEMI > 9600 && emiData.monthlyEMI < 9700) {
            console.log('✅ EMI Valid:', emiData.monthlyEMI);
        } else {
            console.error('❌ EMI Invalid:', emiData);
            process.exit(1);
        }

        // 3. Test Retirement
        // Age 30, Ret 60, Exp 30k, Inf 6%, Sav 0, RetRate 12%
        console.log('Testing Retirement...');
        const retRes = await axios.post(`${API_URL}/retirement`, {
            currentAge: 30,
            retirementAge: 60,
            currentMonthlyExp: 30000,
            inflation: 6,
            currentSavings: 0,
            returnRate: 12
        });
        const retData = retRes.data.data;
        // Exp at 60 ~ 30k * (1.06)^30 ~ 172k monthly
        // Corpus ~ 172k * 12 * 25 ~ 5.1 Cr
        if (retData.targetCorpus > 50000000) {
            console.log('✅ Retirement Valid:', retData.targetCorpus);
        } else {
            console.error('❌ Retirement Invalid:', retData);
            process.exit(1);
        }

        console.log('--- Verification Complete: SUCCESS ---');

    } catch (error: any) {
        console.error('❌ Calculator Error:', error.response?.data || error.message);
        process.exit(1);
    }
}

verifyCalculators();
