import axios from 'axios';
import db from '../src/config/database';

const API_URL = 'http://localhost:5000/api/v1';

async function verifyProfiling() {
    try {
        console.log('--- Starting Financial Profiling Verification ---');

        // 1. Register/Login User to get Token
        const email = `profiler_${Date.now()}@test.com`;
        const password = 'Password@123';

        console.log('Creating User...');
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            email,
            mobile: `9${Date.now().toString().slice(0, 9)}`,
            name: 'Profiler User',
            pan: 'ABCDE5678F',
            password
        });

        const token = regRes.data.data.token;
        const authHeader = { Authorization: `Bearer ${token}` };

        // 2. Submit Financial Data (Scenario: Debt Burdened)
        // Income: 100k. EMI: 60k (60% deviation). Expenses: 20k.
        const input = {
            gross_income: 100000,
            monthly_emi: 60000,
            fixed_expenses: 20000,
            insurance_premium: 5000,
            total_liabilities: 500000,
            existing_assets: 20000
        };

        console.log('Submitting Profile Data (Scenario: Debt Burdened)...');
        const updateRes = await axios.post(`${API_URL}/profile/update`, input, { headers: authHeader });

        if (updateRes.status === 200 && updateRes.data.success) {
            console.log('✅ Profile Update Successful');

            const persona = updateRes.data.data.persona_data.persona;
            console.log('Persona Assigned:', persona.title);

            if (persona.title === 'Debt Burdened') {
                console.log('✅ Correct Persona Assigned');
            } else {
                console.error('❌ Incorrect Persona:', persona.title);
                process.exit(1);
            }

            const deviations = updateRes.data.data.persona_data.deviations;
            console.log('EMI Deviation Status:', deviations.emis.status);

            if (deviations.emis.status === 'high') {
                console.log('✅ Correct Deviation Calculation');
            } else {
                console.error('❌ Incorrect Deviation:', deviations.emis);
                process.exit(1);
            }

        } else {
            console.error('❌ Profile Update Failed');
            process.exit(1);
        }

        // 3. Get Profile
        console.log('Fetching Profile...');
        const getRes = await axios.get(`${API_URL}/profile`, { headers: authHeader });
        if (getRes.status === 200 && getRes.data.data.monthly_emi == 60000) {
            console.log('✅ Profile Retrieval Successful');
        } else {
            console.error('❌ Profile Retrieval Failed or Mismatched Data');
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

verifyProfiling();
