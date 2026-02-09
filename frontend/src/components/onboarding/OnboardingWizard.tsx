import React, { useState } from 'react';
import { authService, profileService } from '../../services/api';
import { X, CheckCircle, Loader2, ArrowRight, ShieldCheck, Banknote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

    const stepVariants = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            >
                {/* Header */}
                <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {step === 1 ? 'Verify Identity' : 'Financial Profile'}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            {step === 1 ? 'Secure your account to proceed' : 'Let\'s build your wealth plan'}
                        </p>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-2 rounded-full border border-slate-200">
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-1">
                    <motion.div
                        className="h-full bg-blue-600"
                        initial={{ width: '0%' }}
                        animate={{ width: step === 1 ? '50%' : '100%' }}
                        transition={{ duration: 0.5 }}
                    />
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1 p-8 bg-white custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                variants={stepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="space-y-6 max-w-lg mx-auto"
                            >
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ShieldCheck size={32} className="text-blue-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800">Security Check</h3>
                                    <p className="text-sm text-slate-500">We need to verify your contact details before handling financial data.</p>
                                </div>

                                {/* Email Verification */}
                                <div className={`p-5 rounded-xl border transition-all ${emailVerified ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-200 shadow-sm'}`}>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                                            Email Verification
                                            {emailVerified && <CheckCircle size={16} className="text-emerald-500" />}
                                        </span>
                                        {emailVerified && <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">Verified</span>}
                                    </div>

                                    {!emailVerified && (
                                        <div className="flex gap-2">
                                            {!emailOtpSent ? (
                                                <button
                                                    onClick={sendEmailOtp}
                                                    disabled={sendingEmailOtp}
                                                    className="w-full py-2.5 px-4 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 disabled:opacity-50 transition-colors"
                                                >
                                                    {sendingEmailOtp ? 'Sending...' : 'Send OTP to Email'}
                                                </button>
                                            ) : (
                                                <>
                                                    <input
                                                        type="text"
                                                        placeholder="Enter 6-digit OTP"
                                                        value={emailOtp}
                                                        onChange={(e) => setEmailOtp(e.target.value)}
                                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                        maxLength={6}
                                                    />
                                                    <button
                                                        onClick={verifyEmail}
                                                        disabled={verifyingEmailOtp || emailOtp.length !== 6}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                                    >
                                                        {verifyingEmailOtp ? '...' : 'Verify'}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Mobile Verification */}
                                <div className={`p-5 rounded-xl border transition-all ${mobileVerified ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-200 shadow-sm'}`}>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                                            Mobile Verification
                                            {mobileVerified && <CheckCircle size={16} className="text-emerald-500" />}
                                        </span>
                                        {mobileVerified && <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">Verified</span>}
                                    </div>

                                    {!mobileVerified && (
                                        <div className="flex gap-2">
                                            {!mobileOtpSent ? (
                                                <button
                                                    onClick={() => { setMobileOtpSent(true); alert('OTP Sent: 123456'); }}
                                                    className="w-full py-2.5 px-4 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                                                >
                                                    Send SMS OTP
                                                </button>
                                            ) : (
                                                <>
                                                    <input
                                                        type="text"
                                                        placeholder="Enter Mobile OTP"
                                                        value={mobileOtp}
                                                        onChange={(e) => setMobileOtp(e.target.value)}
                                                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                        maxLength={6}
                                                    />
                                                    <button
                                                        onClick={verifyMobile}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                                    >
                                                        Verify
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <button
                                    className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                                    disabled={!emailVerified || !mobileVerified}
                                    onClick={() => setStep(2)}
                                >
                                    Continue to Profile <ArrowRight size={18} />
                                </button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.form
                                key="step2"
                                variants={stepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                onSubmit={handleFinancialSubmit}
                                className="space-y-6"
                            >
                                <div className="text-center mb-6">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Banknote size={24} className="text-indigo-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800">Financial Overview</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="form-group">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 ml-1">Current Age<span className="text-red-500 font-semibold"> *</span></label>
                                        <input
                                            type="number"
                                            value={financialData.age}
                                            onChange={(e) => setFinancialData({ ...financialData, age: Number(e.target.value) })}
                                            required
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 ml-1">Employment</label>
                                        <select
                                            value={financialData.employment_type}
                                            onChange={(e) => setFinancialData({ ...financialData, employment_type: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                        >
                                            <option value="Salaried">Salaried</option>
                                            <option value="Self-employed">Self-employed</option>
                                            <option value="Retired">Retired</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 ml-1">PAN Number<span className="text-red-500 font-semibold"> *</span></label>
                                        <input
                                            type="text"
                                            value={financialData.pan_number}
                                            onChange={(e) => setFinancialData({ ...financialData, pan_number: e.target.value.toUpperCase() })}
                                            placeholder="ABCDE1234F"
                                            pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                                            title="Format: ABCDE1234F"
                                            required
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all uppercase tracking-widest placeholder:tracking-normal"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 ml-1">Annual Income (₹)<span className="text-red-500 font-semibold"> *</span></label>
                                        <input
                                            type="number"
                                            value={financialData.gross_income}
                                            onChange={(e) => setFinancialData({ ...financialData, gross_income: e.target.value })}
                                            required
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 ml-1">Monthly Expenses (₹)<span className="text-red-500 font-semibold"> *</span></label>
                                        <input
                                            type="number"
                                            value={financialData.fixed_expenses}
                                            onChange={(e) => setFinancialData({ ...financialData, fixed_expenses: e.target.value })}
                                            required
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 ml-1">Monthly EMI (₹)<span className="text-red-500 font-semibold"> *</span></label>
                                        <input
                                            type="number"
                                            value={financialData.monthly_emi}
                                            onChange={(e) => setFinancialData({ ...financialData, monthly_emi: e.target.value })}
                                            required
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 ml-1">Total Assets (₹)<span className="text-red-500 font-semibold"> *</span></label>
                                        <input
                                            type="number"
                                            value={financialData.existing_assets}
                                            onChange={(e) => setFinancialData({ ...financialData, existing_assets: e.target.value })}
                                            required
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 ml-1">Total Liabilities (₹)<span className="text-red-500 font-semibold"> *</span></label>
                                        <input
                                            type="number"
                                            value={financialData.total_liabilities}
                                            onChange={(e) => setFinancialData({ ...financialData, total_liabilities: e.target.value })}
                                            required
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                        />
                                    </div>
                                    {/* Full width divider */}
                                    <div className="col-span-1 md:col-span-2 border-t border-slate-100 my-2"></div>

                                    <div className="form-group">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 ml-1">Life Insurance Cover (₹)<span className="text-red-500 font-semibold"> *</span></label>
                                        <input
                                            type="number"
                                            value={financialData.insurance_coverage}
                                            onChange={(e) => setFinancialData({ ...financialData, insurance_coverage: e.target.value })}
                                            required
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 ml-1">Annual Premium (₹)<span className="text-red-500 font-semibold"> *</span></label>
                                        <input
                                            type="number"
                                            value={financialData.insurance_premium}
                                            onChange={(e) => setFinancialData({ ...financialData, insurance_premium: e.target.value })}
                                            required
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full mt-8 py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-70 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                                    disabled={loading}
                                >
                                    {loading ? <><Loader2 className="animate-spin" /> Analyzing Financial Health...</> : 'Generate My Wealth Report'}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};
