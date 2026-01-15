// @ts-nocheck
import axios from 'axios';
import db from '../src/config/database';

const API_URL = 'http://localhost:5000/api/v1';

async function verifyActionPlan() {
    try {
        console.log('--- Starting Action Plan Verification ---');

        // 1. Register User
        const email = `action_tester_${Date.now()}@test.com`;
        const password = 'Password@123';

        console.log('Creating User...');
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            email,
            mobile: `9${Date.now().toString().slice(0, 9)}`,
            name: 'Action Tester',
            pan: `ABCDE${Math.floor(1000 + Math.random() * 9000)}F`,
            password
        });
        const token = regRes.data.data.token;
        const authHeader = { Authorization: `Bearer ${token}` };

        // 2. Scenario: Critical Risks
        // A. Debt Trap: EMI (60k) > 50% of Income (100k)
        // B. Under-insured: Coverage (50k) < (10x Incl)
        // C. Emergency Shortfall: Assets (10k) < 1 month Exp (20k)

        const riskyProfile = {
            gross_income: 100000,
            monthly_emi: 60000,
            fixed_expenses: 20000,
            insurance_premium: 500,
            total_liabilities: 0,
            existing_assets: 10000,
            insurance_coverage: 50000, // Very low coverage
            asset_types: ['Cash']
        };

        console.log('Submitting Risky Profile...');
        const profileRes = await axios.post(`${API_URL}/profile/update`, riskyProfile, { headers: authHeader });
        const actions = profileRes.data.data.action_items;

        console.log('Generated Actions:', JSON.stringify(actions, null, 2));

        // Check for specific alerts
        const debtAlert = actions.find(a => a.type === 'Debt Management' && a.severity === 'CRITICAL');
        const insAlert = actions.find(a => a.type === 'Insurance' && a.severity === 'CRITICAL');
        const emgAlert = actions.find(a => a.type === 'Emergency Fund' && a.severity === 'CRITICAL');

        if (debtAlert && insAlert && emgAlert) {
            console.log('✅ All Critical Risks Detected');
        } else {
            console.error('❌ Failed to detect one or more critical risks');
            if (!debtAlert) console.error('- Missed Debt Trap');
            if (!insAlert) console.error('- Missed Under-insurance');
            if (!emgAlert) console.error('- Missed Emergency Shortfall');
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

verifyActionPlan();
