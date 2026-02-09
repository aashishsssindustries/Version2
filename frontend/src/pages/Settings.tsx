import React, { useState, useEffect } from 'react';
import { User, Lock, AlertCircle, CheckCircle2, Save } from 'lucide-react';
import { userService } from '../services/api';
import { validateName, validateMobile, validatePassword, PASSWORD_RULES } from '../utils/validation';
import { PasswordInput } from '../components/ui/PasswordInput';
import './Settings.css';

export const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Profile state
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        mobile: ''
    });

    // Password state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Field-level errors for profile form
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const response = await userService.getCurrentUser();
            setProfileData({
                name: response.name || '',
                email: response.email || '',
                mobile: response.mobile || ''
            });
        } catch (err) {
            console.error('Failed to fetch user', err);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validate fields
        const errors: Record<string, string> = {};
        const nameResult = validateName(profileData.name);
        if (!nameResult.isValid) errors.name = nameResult.error;

        const mobileResult = validateMobile(profileData.mobile);
        if (!mobileResult.isValid) errors.mobile = mobileResult.error;

        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            return;
        }

        setLoading(true);

        try {
            await userService.updateProfile({
                name: profileData.name,
                mobile: profileData.mobile
            });
            setSuccess('Profile updated successfully');

            // Update localStorage
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.name = profileData.name;
            localStorage.setItem('user', JSON.stringify(user));
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        const passwordResult = validatePassword(passwordData.newPassword);
        if (!passwordResult.isValid) {
            setError(passwordResult.error);
            return;
        }

        setLoading(true);

        try {
            await userService.changePassword(passwordData.currentPassword, passwordData.newPassword);
            setSuccess('Password changed successfully');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-container">
            <div className="settings-header">
                <h1>Settings</h1>
                <p>Manage your account settings and preferences</p>
            </div>

            {/* Tabs */}
            <div className="settings-tabs">
                <button
                    className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('profile'); setError(''); setSuccess(''); }}
                >
                    <User size={18} />
                    Profile
                </button>
                <button
                    className={`tab ${activeTab === 'security' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('security'); setError(''); setSuccess(''); }}
                >
                    <Lock size={18} />
                    Security
                </button>
            </div>

            {/* Messages */}
            {error && (
                <div className="alert alert-error">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}
            {success && (
                <div className="alert alert-success">
                    <CheckCircle2 size={18} />
                    {success}
                </div>
            )}

            {/* Tab Content */}
            <div className="settings-content">
                {activeTab === 'profile' && (
                    <form onSubmit={handleProfileUpdate} className="settings-form">
                        <h2>Profile Information</h2>
                        <p className="form-description">Update your personal information</p>

                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                className={fieldErrors.name ? 'input-error' : ''}
                                value={profileData.name}
                                onChange={(e) => {
                                    setProfileData({ ...profileData, name: e.target.value });
                                    if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                                }}
                                required
                                placeholder="Enter your name"
                            />
                            {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                value={profileData.email}
                                disabled
                                className="disabled"
                            />
                            <span className="help-text">Email cannot be changed</span>
                        </div>

                        <div className="form-group">
                            <label htmlFor="mobile">Mobile Number</label>
                            <input
                                type="tel"
                                id="mobile"
                                className={fieldErrors.mobile ? 'input-error' : ''}
                                value={profileData.mobile}
                                onChange={(e) => {
                                    setProfileData({ ...profileData, mobile: e.target.value });
                                    if (fieldErrors.mobile) setFieldErrors(prev => ({ ...prev, mobile: '' }));
                                }}
                                required
                                placeholder="Enter mobile number"
                            />
                            {fieldErrors.mobile && <span className="field-error">{fieldErrors.mobile}</span>}
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                )}

                {activeTab === 'security' && (
                    <form onSubmit={handlePasswordChange} className="settings-form">
                        <h2>Change Password</h2>
                        <p className="form-description">Update your password to keep your account secure</p>

                        <div className="form-group">
                            <label htmlFor="currentPassword">Current Password</label>
                            <PasswordInput
                                id="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                required
                                placeholder="Enter current password"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="newPassword">New Password</label>
                            <PasswordInput
                                id="newPassword"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                required
                                placeholder={`At least ${PASSWORD_RULES.minLength} characters`}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm New Password</label>
                            <PasswordInput
                                id="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                required
                                placeholder="Re-enter new password"
                            />
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            <Lock size={18} />
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};
