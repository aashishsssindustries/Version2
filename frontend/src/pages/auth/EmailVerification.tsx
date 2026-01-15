import React, { useState } from 'react';
import { authService } from '../../services/api';
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import './EmailVerification.css';

const EmailVerification: React.FC = () => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [emailSent, setEmailSent] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    const handleSendOTP = async () => {
        setSending(true);
        setMessage(null);

        try {
            const response = await authService.sendEmailOTP();
            setUserEmail(response.email);
            setEmailSent(true);
            setMessage({ type: 'success', text: 'OTP sent to your email successfully!' });
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to send OTP. Please try again.'
            });
        } finally {
            setSending(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!otp || otp.length !== 6) {
            setMessage({ type: 'error', text: 'Please enter a valid 6-digit OTP' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const response = await authService.verifyEmailOTP(otp);
            setIsVerified(true);
            setMessage({ type: 'success', text: 'Email verified successfully!' });

            // Update user in localStorage
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.is_email_verified = true;
            localStorage.setItem('user', JSON.stringify(user));

            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Invalid or expired OTP. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setOtp(value);
    };

    if (isVerified) {
        return (
            <div className="email-verification-page">
                <div className="verification-card success-card">
                    <CheckCircle size={64} className="success-icon" />
                    <h1>Email Verified!</h1>
                    <p>Your email has been successfully verified.</p>
                    <p className="redirect-text">Redirecting to dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="email-verification-page">
            <div className="verification-card">
                <div className="card-header">
                    <Mail size={48} className="header-icon" />
                    <h1>Email Verification</h1>
                    <p className="subtitle">Verify your email address to continue</p>
                </div>

                {!emailSent ? (
                    <div className="send-otp-section">
                        <p className="info-text">
                            Click the button below to receive a verification code at your registered email address.
                        </p>
                        <button
                            className="btn btn-primary btn-send-otp"
                            onClick={handleSendOTP}
                            disabled={sending}
                        >
                            {sending ? (
                                <>
                                    <RefreshCw className="animate-spin" size={18} />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Mail size={18} />
                                    Send Verification Code
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleVerifyOTP} className="verify-otp-form">
                        <div className="email-display">
                            <p className="email-label">OTP sent to:</p>
                            <p className="email-value">{userEmail}</p>
                        </div>

                        <div className="form-group">
                            <label htmlFor="otp">Enter 6-Digit OTP</label>
                            <input
                                type="text"
                                id="otp"
                                value={otp}
                                onChange={handleOTPChange}
                                placeholder="000000"
                                maxLength={6}
                                className="otp-input"
                                autoComplete="off"
                                autoFocus
                            />
                            <p className="helper-text">Check your email inbox for the verification code</p>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-verify"
                            disabled={loading || otp.length !== 6}
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="animate-spin" size={18} />
                                    Verifying...
                                </>
                            ) : (
                                'Verify Email'
                            )}
                        </button>

                        <button
                            type="button"
                            className="btn btn-secondary btn-resend"
                            onClick={handleSendOTP}
                            disabled={sending}
                        >
                            {sending ? 'Sending...' : 'Resend Code'}
                        </button>
                    </form>
                )}

                {message && (
                    <div className={`message ${message.type}`}>
                        {message.type === 'error' ? (
                            <AlertCircle size={18} />
                        ) : (
                            <CheckCircle size={18} />
                        )}
                        <span>{message.text}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailVerification;
