import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { validateEmail } from '../../utils/validation';
import './Auth.css';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(false);

    // Validate a single field
    const validateField = (field: keyof typeof formData, value: string): string => {
        switch (field) {
            case 'email':
                return validateEmail(value).error;
            case 'password':
                if (!value) return 'Password is required';
                return '';
            default:
                return '';
        }
    };

    // Validate all fields on submit
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        const emailResult = validateEmail(formData.email);
        if (!emailResult.isValid) errors.email = emailResult.error;

        if (!formData.password) {
            errors.password = 'Password is required';
        }

        setFieldErrors(errors);
        setTouched({ email: true, password: true });
        return Object.keys(errors).length === 0;
    };

    const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData({ ...formData, [field]: value });

        if (touched[field]) {
            const fieldError = validateField(field, value);
            setFieldErrors(prev => ({ ...prev, [field]: fieldError }));
        }
    };

    const handleBlur = (field: keyof typeof formData) => () => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const fieldError = validateField(field, formData[field]);
        setFieldErrors(prev => ({ ...prev, [field]: fieldError }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const response = await authService.login(formData.email, formData.password);

            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));

            window.dispatchEvent(new Event('auth-change'));
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1 className="auth-title">Welcome Back</h1>
                    <p className="auth-subtitle">Sign in to your WealthMax account</p>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    <div className="input-group">
                        <label htmlFor="email" className="input-label">
                            Email <span className="required-asterisk">*</span>
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
                        <label htmlFor="password" className="input-label">
                            Password <span className="required-asterisk">*</span>
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

                    <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                        <Link to="/forgot-password" className="link" style={{ fontSize: '14px' }}>
                            Forgot password?
                        </Link>
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p className="auth-footer-text">
                        Don't have an account?{' '}
                        <Link to="/signup" className="link">
                            Create account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
