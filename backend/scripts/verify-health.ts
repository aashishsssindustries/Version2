// @ts-nocheck
import axios from 'axios';
import db from '../src/config/database';

const API_URL = 'http://localhost:5000/api/v1';

async function verifyHealthScore() {
    try {
        console.log('--- Starting Health Score Verification ---');

        // 1. Register
        const email = `health_tester_${Date.now()}@test.com`;
        const password = 'Password@123';

        console.log('Creating User...');
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            email,
            mobile: `9${Date.now().toString().slice(0, 9)}`,
            name: 'Health Tester',
            pan: `ABCDE${Math.floor(1000 + Math.random() * 9000)}F`,
            password
        });
        const token = regRes.data.data.token;
        const authHeader = { Authorization: `Bearer ${token}` };

        // 2. Submit Profile (Strong Financials)
        // Income 100k, EMI 10k (10% -> Full Debt Score), Expenses 20k.
        // Savings = 100 - 30 = 70k (70% -> Full Savings Score).
        // Assets 120k (6 months exp -> Full Liquidity).
        // Liabilities 0. 
        // Net Worth 120k / 1.2M = 0.1 (Goal Score Low).
        // Asset Diversity: ['Equity', 'Gold', 'Real Estate'] (3 -> Full Diversity).

        const profileInput = {
            gross_income: 100000,
            monthly_emi: 10000,
            fixed_expenses: 20000,
            insurance_premium: 0,
            total_liabilities: 0,
            existing_assets: 120000,
            asset_types: ['Equity', 'Gold', 'Real Estate']
        };

        console.log('Submitting Profile...');
        const profileRes = await axios.post(`${API_URL}/profile/update`, profileInput, { headers: authHeader });
        const initialScore = profileRes.data.data.health_score;
        console.log('Initial Health Score:', initialScore);

        if (initialScore > 50) {
            console.log('✅ Health Score Calculated (>50)');
        } else {
            console.error('❌ Score seems too low for good profile');
            process.exit(1);
        }

        // 3. Submit Survey (High Literacy)
        // High literacy -> Increases score
        const responses = Array.from({ length: 25 }, (_, i) => ({
            questionId: i + 1,
            weight: 5 // Max literacy assumes 5s on knowledge Qs
        }));

        console.log('Submitting Survey...');
        await axios.post(`${API_URL}/survey/submit`, { responses }, { headers: authHeader });

        // 4. Check Score Increase
        console.log('Fetching Updated Profile...');
        const updatedRes = await axios.get(`${API_URL}/profile`, { headers: authHeader });
        const updatedScore = updatedRes.data.data.health_score;
        console.log('Updated Health Score:', updatedScore);

        if (updatedScore >= initialScore) {
            console.log('✅ Score updated after survey (Non-decreasing)');
        } else {
            console.error('❌ Score decreased unexpectedly');
            process.exit(1);
        }

        console.log('--- Verification Complete: SUCCESS ---');
        process.exit(0);

    } catch (error: any) {
        console.error('❌ Verification Error:', error.response?.data || error.message);
        process.exit(1);
    } finally {
        await db.close();
    }
}

verifyHealthScore();
