import axios from 'axios';
import db from '../src/config/database';
import { User } from '../src/models/user.model';

const API_URL = 'http://localhost:5000/api/v1/auth';

async function verifyAuth() {
    try {
        console.log('--- Starting Auth Verification ---');

        // 1. Register User
        const email = `test_${Date.now()}@example.com`;
        const mobile = `9${Date.now().toString().slice(0, 9)}`; // Random 10 digit
        const pan = 'ABCDE1234F';
        const password = 'Password@123';

        console.log(`Registering user: ${email} ...`);
        const regRes = await axios.post(`${API_URL}/register`, {
            email,
            mobile,
            name: 'Test User',
            pan,
            password
        });

        if (regRes.status === 201 && regRes.data.success) {
            console.log('✅ Registration Successful');
        } else {
            console.error('❌ Registration Failed', regRes.data);
            process.exit(1);
        }

        const userId = regRes.data.data.user.id;

        // 2. Verify Database Content
        console.log(`Verifying DB for User ID: ${userId} ...`);
        const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        const user: User = userResult.rows[0];

        if (!user) {
            console.error('❌ User not found in DB');
            process.exit(1);
        }

        // Check Password Hash
        if (user.password_hash === password) {
            console.error('❌ Password stored in plaintext!');
            process.exit(1);
        } else {
            console.log('✅ Password Hashed');
        }

        // Check Encrypted PAN
        if (user.pan === pan) {
            console.error('❌ PAN stored in plaintext!');
            process.exit(1);
        } else {
            console.log('✅ PAN Encrypted');
        }

        // Check PAN Digest
        if (!user.pan_digest) {
            console.error('❌ PAN Digest missing');
            process.exit(1);
        } else {
            console.log('✅ PAN Digest created');
        }

        // 3. Login
        console.log('Testing Login ...');
        const loginRes = await axios.post(`${API_URL}/login`, {
            email,
            password
        });

        if (loginRes.status === 200 && loginRes.data.success) {
            console.log('✅ Login Successful');
            console.log('Token received:', loginRes.data.data.token ? 'Yes' : 'No');
        } else {
            console.error('❌ Login Failed');
            process.exit(1);
        }

        // 4. Test OTP Request
        console.log('Testing OTP Request ...');
        const otpReqRes = await axios.post(`${API_URL}/otp/request`, { mobile });
        if (otpReqRes.status === 200 && otpReqRes.data.success) {
            console.log('✅ OTP Request Successful');
            const otp = otpReqRes.data.data.otp; // We enabled this dev feature in controller

            // 5. Test OTP Login
            console.log(`Testing OTP Login with OTP: ${otp} ...`);
            const otpLoginRes = await axios.post(`${API_URL}/otp/verify`, { mobile, otp });
            if (otpLoginRes.status === 200 && otpLoginRes.data.success) {
                console.log('✅ OTP Login Successful');
            } else {
                console.error('❌ OTP Login Failed');
                process.exit(1);
            }
        } else {
            console.error('❌ OTP Request Failed');
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

verifyAuth();
