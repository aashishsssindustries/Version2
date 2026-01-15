import React, { useState } from 'react';
import { authService, profileService } from '../../services/api';
import { X, CheckCircle, Loader2 } from 'lucide-react';
import './OnboardingWizard.css';

interface OnboardingWizardProps {
    onClose?: () => void;
    onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onClose, onComplete }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Step 1: OTP Verification State
    const [emailVerified, setEmailVerified] = useState(false);
    const [mobileVerified, setMobileVerified] = useState(false);
    const [emailOtpSent, setEmailOtpSent] = useState(false);
    const [mobileOtpSent, setMobileOtpSent] = useState(false);
    const [emailOtp, setEmailOtp] = useState('');
    const [mobileOtp, setMobileOtp] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
    const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);

    // Step 2: Financial Data State
    const [financialData, setFinancialData] = useState({
        age: 30,
        employment_type: 'Salaried',
        pan_number: '',
        gross_income: '',
        monthly_emi: '',
        fixed_expenses: '',
        insurance_premium: '',
        total_liabilities: '',
        existing_assets: '',
        insurance_coverage: '',
    });

    const sendEmailOtp = async () => {
        setSendingEmailOtp(true);
        try {
            const response = await authService.sendEmailOTP();
            setUserEmail(response.email);
            setEmailOtpSent(true);
            alert(`OTP sent successfully to ${response.email}`);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setSendingEmailOtp(false);
        }
    };

    const verifyEmail = async () => {
        if (!emailOtp || emailOtp.length !== 6) {
            alert('Please enter a valid 6-digit OTP');
            return;
        }

        setVerifyingEmailOtp(true);
        try {
            await authService.verifyEmailOTP(emailOtp);
            setEmailVerified(true);

            // Update user in localStorage
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.is_email_verified = true;
            localStorage.setItem('user', JSON.stringify(user));
        } catch (error: any) {
            alert(error.response?.data?.message || 'Invalid or expired OTP. Please try again.');
        } finally {
            setVerifyingEmailOtp(false);
        }
    };

    const verifyMobile = () => {
        // Simulation - keeping mobile OTP as dummy for now
        if (mobileOtp === '123456') {
            setMobileVerified(true);
        } else {
            alert('Invalid OTP. Use 123456');
        }
    };

    const handleFinancialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await profileService.updateProfile({
                age: Number(financialData.age),
                employment_type: financialData.employment_type as any,
                pan_number: financialData.pan_number,
                gross_income: Number(financialData.gross_income),
                monthly_emi: Number(financialData.monthly_emi),
                fixed_expenses: Number(financialData.fixed_expenses),
                insurance_premium: Number(financialData.insurance_premium),
                total_liabilities: Number(financialData.total_liabilities),
                existing_assets: Number(financialData.existing_assets),
                insurance_coverage: Number(financialData.insurance_coverage)
            });
            onComplete();
        } catch (error) {
            console.error(error);
            alert('Failed to save profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="wizard-overlay">
            <div className="wizard-container">
                <div className="wizard-header">
                    <h2>{step === 1 ? 'Verify Your Identity' : 'Financial Profile'}</h2>
                    {onClose && <button onClick={onClose}><X size={24} /></button>}
                </div>

                <div className="wizard-progress">
                    <div className={`step-indicator ${step >= 1 ? 'active' : ''}`}>1</div>
                    <div className="step-line"></div>
                    <div className={`step-indicator ${step >= 2 ? 'active' : ''}`}>2</div>
                </div>

                <div className="wizard-content">
                    {step === 1 && (
                        <div className="step-otp">
                            <p className="step-desc">Please verify your contact details to proceed.</p>

                            {/* Email Verification */}
                            <div className="verification-box">
                                <div className="verification-label">
                                    <span>Email Verification</span>
                                    {emailVerified && <CheckCircle size={20} className="text-success" />}
                                </div>
                                {!emailVerified ? (
                                    <div className="otp-input-group">
                                        {!emailOtpSent ? (
                                            <button
                                                className="btn btn-outline"
                                                onClick={sendEmailOtp}
                                                disabled={sendingEmailOtp}
                                            >
                                                {sendingEmailOtp ? 'Sending...' : 'Send OTP'}
                                            </button>
                                        ) : (
                                            <>
                                                <input
                                                    type="text"
                                                    placeholder="Enter Email OTP"
                                                    value={emailOtp}
                                                    onChange={(e) => setEmailOtp(e.target.value)}
                                                />
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={verifyEmail}
                                                    disabled={verifyingEmailOtp || emailOtp.length !== 6}
                                                >
                                                    {verifyingEmailOtp ? 'Verifying...' : 'Verify'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                ) : <span className="verified-badge">Verified</span>}
                            </div>

                            {/* Mobile Verification */}
                            <div className="verification-box">
                                <div className="verification-label">
                                    <span>Mobile Verification</span>
                                    {mobileVerified && <CheckCircle size={20} className="text-success" />}
                                </div>
                                {!mobileVerified ? (
                                    <div className="otp-input-group">
                                        {!mobileOtpSent ? (
                                            <button
                                                className="btn btn-outline"
                                                onClick={() => { setMobileOtpSent(true); alert('OTP Sent: 123456'); }}
                                            >
                                                Send OTP
                                            </button>
                                        ) : (
                                            <>
                                                <input
                                                    type="text"
                                                    placeholder="Enter Mobile OTP"
                                                    value={mobileOtp}
                                                    onChange={(e) => setMobileOtp(e.target.value)}
                                                />
                                                <button className="btn btn-primary" onClick={verifyMobile}>Verify</button>
                                            </>
                                        )}
                                    </div>
                                ) : <span className="verified-badge">Verified</span>}
                            </div>

                            <button
                                className="btn btn-primary btn-block mt-4"
                                disabled={!emailVerified || !mobileVerified}
                                onClick={() => setStep(2)}
                            >
                                Continue to Profile
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleFinancialSubmit} className="financial-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Age</label>
                                    <input
                                        type="number"
                                        value={financialData.age}
                                        onChange={(e) => setFinancialData({ ...financialData, age: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Employment Type</label>
                                    <select
                                        value={financialData.employment_type}
                                        onChange={(e) => setFinancialData({ ...financialData, employment_type: e.target.value })}
                                    >
                                        <option value="Salaried">Salaried</option>
                                        <option value="Self-employed">Self-employed</option>
                                        <option value="Retired">Retired</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>PAN Number</label>
                                    <input
                                        type="text"
                                        value={financialData.pan_number}
                                        onChange={(e) => setFinancialData({ ...financialData, pan_number: e.target.value.toUpperCase() })}
                                        placeholder="ABCDE1234F"
                                        pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                                        title="Format: ABCDE1234F"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Annual Gross Income (₹)</label>
                                    <input
                                        type="number"
                                        value={financialData.gross_income}
                                        onChange={(e) => setFinancialData({ ...financialData, gross_income: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Monthly Fixed Expenses (₹)</label>
                                    <input
                                        type="number"
                                        value={financialData.fixed_expenses}
                                        onChange={(e) => setFinancialData({ ...financialData, fixed_expenses: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Monthly EMI / Liabilities (₹)</label>
                                    <input
                                        type="number"
                                        value={financialData.monthly_emi}
                                        onChange={(e) => setFinancialData({ ...financialData, monthly_emi: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Insurance Premium (Annual) (₹)</label>
                                    <input
                                        type="number"
                                        value={financialData.insurance_premium}
                                        onChange={(e) => setFinancialData({ ...financialData, insurance_premium: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Existing Assets (₹)</label>
                                    <input
                                        type="number"
                                        value={financialData.existing_assets}
                                        onChange={(e) => setFinancialData({ ...financialData, existing_assets: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Life Insurance Cover (₹)</label>
                                    <input
                                        type="number"
                                        value={financialData.insurance_coverage}
                                        onChange={(e) => setFinancialData({ ...financialData, insurance_coverage: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary btn-block mt-4" disabled={loading}>
                                {loading ? <><Loader2 className="animate-spin" /> Analyzing...</> : 'Generate Financial Profile'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
