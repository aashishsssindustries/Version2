import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Save, AlertCircle } from 'lucide-react';
import { profileService } from '../../services/api';
import './ProfileEditModal.css';

interface ProfileEditModalProps {
    profile: any;
    onClose: () => void;
    onSave: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ profile, onClose, onSave }) => {
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        // Step 1: Income & Expenses
        gross_income: profile?.gross_income || 0,
        fixed_expenses: profile?.fixed_expenses || 0,
        monthly_emi: profile?.monthly_emi || 0,

        // Step 2: Assets & Liabilities
        existing_assets: profile?.existing_assets || 0,
        emergency_fund_amount: profile?.emergency_fund_amount || 0,
        total_liabilities: profile?.total_liabilities || 0,

        // Step 3: Insurance & Protection
        insurance_premium: profile?.insurance_premium || 0,
        insurance_cover: profile?.insurance_cover || profile?.insurance_coverage || 0,
        dependents: profile?.dependents || 0,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: parseFloat(value) || 0
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError('');

            const payload = {
                age: profile?.age || 30,
                gross_income: formData.gross_income,
                fixed_expenses: formData.fixed_expenses,
                monthly_emi: formData.monthly_emi,
                existing_assets: formData.existing_assets,
                emergency_fund_amount: formData.emergency_fund_amount,
                total_liabilities: formData.total_liabilities,
                insurance_premium: formData.insurance_premium,
                insurance_coverage: formData.insurance_cover,
                insurance_cover: formData.insurance_cover,
                dependents: formData.dependents,
                employment_type: profile?.employment_type || 'Salaried',
                asset_types: profile?.asset_types || [],
                pan_number: profile?.pan_number
            };

            await profileService.updateProfile(payload);
            onSave();
        } catch (err: any) {
            console.error('Update failed', err);
            setError(err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const steps = [
        { num: 1, title: 'Income & Expenses' },
        { num: 2, title: 'Assets & Liabilities' },
        { num: 3, title: 'Insurance & Protection' }
    ];

    const renderField = (label: string, name: keyof typeof formData, prefix = '₹', hint?: string) => (
        <div className="field-group">
            <label>{label}</label>
            <div className="input-wrapper">
                <span className="prefix">{prefix}</span>
                <input
                    type="number"
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    min="0"
                />
            </div>
            {hint && <span className="hint">{hint}</span>}
        </div>
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <h2>Edit Profile</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Step Indicator */}
                <div className="step-indicator">
                    {steps.map(s => (
                        <div key={s.num} className={`step ${step === s.num ? 'active' : ''} ${step > s.num ? 'completed' : ''}`}>
                            <span className="step-num">{s.num}</span>
                            <span className="step-title">{s.title}</span>
                        </div>
                    ))}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="error-banner">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {/* Form Content */}
                <div className="modal-body">
                    {step === 1 && (
                        <div className="step-content">
                            <p className="step-desc">Enter your monthly income and regular expenses.</p>
                            {renderField('Annual Gross Income', 'gross_income', '₹', 'Total yearly income before taxes')}
                            {renderField('Monthly Fixed Expenses', 'fixed_expenses', '₹', 'Rent, utilities, groceries, etc.')}
                            {renderField('Monthly EMI / Debt Payments', 'monthly_emi', '₹', 'All loan EMIs combined')}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="step-content">
                            <p className="step-desc">Your savings, investments, and outstanding liabilities.</p>
                            {renderField('Total Savings / Investments', 'existing_assets', '₹', 'FD, MF, stocks, real estate value')}
                            {renderField('Emergency Fund', 'emergency_fund_amount', '₹', 'Liquid savings for emergencies')}
                            {renderField('Total Liabilities', 'total_liabilities', '₹', 'Outstanding loan principal')}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="step-content">
                            <p className="step-desc">Insurance coverage and dependents information.</p>
                            {renderField('Annual Insurance Premium', 'insurance_premium', '₹', 'Total premium for all policies')}
                            {renderField('Life Cover Amount', 'insurance_cover', '₹', 'Sum assured on life policies')}
                            {renderField('Number of Dependents', 'dependents', '', 'Family members depending on you')}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="modal-footer">
                    {step > 1 ? (
                        <button className="btn-secondary" onClick={() => setStep(step - 1)}>
                            <ChevronLeft size={16} /> Back
                        </button>
                    ) : (
                        <button className="btn-secondary" onClick={onClose}>Cancel</button>
                    )}

                    {step < 3 ? (
                        <button className="btn-primary" onClick={() => setStep(step + 1)}>
                            Next <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button className="btn-primary save" onClick={handleSave} disabled={saving}>
                            <Save size={16} />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    )}
                </div>

                {/* Recalculation Notice */}
                <div className="recalc-notice">
                    <AlertCircle size={14} />
                    Saving will recalculate your Persona, Health Score, and Action Items.
                </div>
            </div>
        </div>
    );
};
