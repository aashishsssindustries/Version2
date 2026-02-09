import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { PasswordInput } from '../../components/ui/PasswordInput';
import {
    validateName,
    validateEmail,
    validateMobile,
    validatePassword,
    validateConfirmPassword
} from '../../utils/validation';
import './Auth.css';

const Signup: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(false);

    // Validate a single field
    const validateField = (field: keyof typeof formData, value: string): string => {
        switch (field) {
            case 'name':
                return validateName(value).error;
            case 'email':
                return validateEmail(value).error;
            case 'mobile':
                return validateMobile(value).error;
            case 'password':
                return validatePassword(value).error;
            case 'confirmPassword':
                return validateConfirmPassword(formData.password, value).error;
            default:
                return '';
        }
    };

    // Validate all fields on submit
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        const nameResult = validateName(formData.name);
        if (!nameResult.isValid) errors.name = nameResult.error;

        const emailResult = validateEmail(formData.email);
        if (!emailResult.isValid) errors.email = emailResult.error;

        const mobileResult = validateMobile(formData.mobile);
        if (!mobileResult.isValid) errors.mobile = mobileResult.error;

        const passwordResult = validatePassword(formData.password);
        if (!passwordResult.isValid) errors.password = passwordResult.error;

        const confirmResult = validateConfirmPassword(formData.password, formData.confirmPassword);
        if (!confirmResult.isValid) errors.confirmPassword = confirmResult.error;

        setFieldErrors(errors);
        // Mark all fields as touched on submit
        setTouched({ name: true, email: true, mobile: true, password: true, confirmPassword: true });
        return Object.keys(errors).length === 0;
    };

    const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData({ ...formData, [field]: value });

        // If field was touched, validate on change to clear errors
        if (touched[field]) {
            const error = validateField(field, value);
            setFieldErrors(prev => ({ ...prev, [field]: error }));
        }
    };

    const handleBlur = (field: keyof typeof formData) => () => {
        // Mark field as touched
        setTouched(prev => ({ ...prev, [field]: true }));
        // Validate on blur
        const error = validateField(field, formData[field]);
        setFieldErrors(prev => ({ ...prev, [field]: error }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const response = await authService.signup(
                formData.name,
                formData.email,
                formData.password,
                formData.mobile
            );

            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));

            window.dispatchEvent(new Event('auth-change'));
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">Start your financial journey with WealthMax</p>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    <div className="input-group">
                        <label htmlFor="name" className="input-label">
                            Full Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            className={`input ${fieldErrors.name ? 'input-error' : ''}`}
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={handleChange('name')}
                            onBlur={handleBlur('name')}
                            required
                        />
                        {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
                    </div>

                    <div className="input-group">
                        <label htmlFor="email" className="input-label">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            className={`input ${fieldErrors.email ? 'input-error' : ''}`}
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange('email')}
                            onBlur={handleBlur('email')}
                            required
                        />
                        {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
                    </div>

                    <div className="input-group">
                        <label htmlFor="mobile" className="input-label">
                            Mobile Number
                        </label>
                        <input
                            id="mobile"
                            type="tel"
                            className={`input ${fieldErrors.mobile ? 'input-error' : ''}`}
                            placeholder="9876543210"
                            value={formData.mobile}
                            onChange={handleChange('mobile')}
                            onBlur={handleBlur('mobile')}
                            required
                        />
                        {fieldErrors.mobile && <span className="field-error">{fieldErrors.mobile}</span>}
                    </div>

                    <div className="input-group">
                        <label htmlFor="password" className="input-label">
                            Password
                        </label>
                        <PasswordInput
                            id="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange('password')}
                            onBlur={handleBlur('password')}
                            error={!!fieldErrors.password}
                            required
                        />
                        {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirmPassword" className="input-label">
                            Confirm Password
                        </label>
                        <PasswordInput
                            id="confirmPassword"
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={handleChange('confirmPassword')}
                            onBlur={handleBlur('confirmPassword')}
                            error={!!fieldErrors.confirmPassword}
                            required
                        />
                        {fieldErrors.confirmPassword && <span className="field-error">{fieldErrors.confirmPassword}</span>}
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p className="auth-footer-text">
                        Already have an account?{' '}
                        <Link to="/login" className="link">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
