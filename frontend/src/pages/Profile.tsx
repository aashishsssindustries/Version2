import React, { useState, useEffect } from 'react';
import { User, DollarSign, Shield, Info, Edit2, Save, X, Activity, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { profileService } from '../services/api';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './Profile.css';

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Check if coming from calculator
    const fromCalculator = searchParams.get('from') === 'calculator';
    const toolName = searchParams.get('tool');

    // Form State
    const [formData, setFormData] = useState({
        gross_income: 0,
        fixed_expenses: 0,
        monthly_emi: 0,
        existing_assets: 0,
        insurance_premium: 0,
        total_liabilities: 0,
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await profileService.getProfile();
            setProfile(data);
            if (data) {
                setFormData({
                    gross_income: data.gross_income || 0,
                    fixed_expenses: data.fixed_expenses || 0,
                    monthly_emi: data.monthly_emi || 0,
                    existing_assets: data.existing_assets || 0,
                    insurance_premium: data.insurance_premium || 0,
                    total_liabilities: data.total_liabilities || 0,
                });
            }
        } catch (err) {
            console.error('Failed to fetch profile', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: parseFloat(value) || 0
        }));
    };

    const handleSave = async () => {
        try {
            setUpdating(true);
            setMessage(null);

            // Clean payload - only send required fields
            const payload = {
                age: profile.age,
                gross_income: formData.gross_income,
                fixed_expenses: formData.fixed_expenses,
                monthly_emi: formData.monthly_emi,
                existing_assets: formData.existing_assets,
                insurance_premium: formData.insurance_premium,
                total_liabilities: formData.total_liabilities,
                insurance_coverage: profile.insurance_coverage || 0,
                employment_type: profile.employment_type,
                asset_types: profile.asset_types,
                pan_number: profile.pan_number
            };

            const updated = await profileService.updateProfile(payload);
            setProfile(updated);
            setEditing(false);

            // Redirect to dashboard with success flag
            navigate('/dashboard?updated=true');

        } catch (err: any) {
            console.error('Update failed', err);
            setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
        } finally {
            setUpdating(false);
        }
    };

    if (loading && !profile) {
        return <div className="p-xl text-center text-muted">Loading profile...</div>;
    }

    if (!profile) {
        return (
            <div className="p-xl text-center">
                <p>Profile not found. Please complete onboarding.</p>
                <Link to="/dashboard" className="btn btn-primary mt-md">Go to Dashboard</Link>
            </div>
        );
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const renderField = (label: string, name: keyof typeof formData, bgClass = 'bg-slate-50', icon?: React.ReactNode) => (
        <div className="form-group">
            <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
            {editing ? (
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</div>
                    <input
                        type="number"
                        name={name}
                        value={formData[name]}
                        onChange={handleInputChange}
                        className="w-full pl-7 pr-3 py-2 border rounded focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        min="0"
                    />
                </div>
            ) : (
                <div className={`p-3 rounded border border-transparent ${bgClass} text-slate-800 font-mono font-medium flex items-center justify-between`}>
                    <span>₹ {formData[name].toLocaleString('en-IN')}</span>
                    {icon}
                </div>
            )}
        </div>
    );

    return (
        <div className="profile-page fade-in">
            {/* Header / Flash Message */}
            <div className="flex justify-between items-center mb-lg">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
                    <p className="text-slate-500">Manage your personal and financial details</p>
                </div>
                {!editing && (
                    <button
                        className="btn btn-primary flex items-center gap-2"
                        onClick={() => setEditing(true)}
                    >
                        <Edit2 size={16} /> Edit Financials
                    </button>
                )}
            </div>

            {message && (
                <div className={`mb-lg p-3 rounded flex items-center gap-2 text-sm font-medium animate-slideDown ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                    {message.text}
                </div>
            )}

            {/* Calculator Context Banner */}
            {fromCalculator && (
                <div className="mb-lg p-3 bg-blue-50 border border-blue-100 rounded text-blue-800 text-sm flex items-start gap-2">
                    <Info size={18} className="mt-0.5 shrink-0" />
                    <div>
                        <strong className="block mb-1">Update from {toolName || 'Calculator'}</strong>
                        Modify your financial assumptions below. Changes will recalculate your recommendations.
                    </div>
                </div>
            )}

            {/* Editing Warning */}
            {editing && (
                <div className="mb-lg p-3 bg-blue-50 border border-blue-100 rounded text-blue-800 text-sm flex items-start gap-2">
                    <Info size={18} className="mt-0.5 shrink-0" />
                    <div>
                        <strong className="block mb-1">Recalculation Warning</strong>
                        Updating your financials will immediately trigger a recalculation of your <strong>Financial Persona</strong>, <strong>Health Score</strong>, and <strong>Action Checklist</strong>.
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* 1. Basic Details (Read Only) */}
                <div className="card h-fit">
                    <div className="card-header border-b border-slate-100 p-4">
                        <div className="flex items-center gap-2 font-semibold text-slate-700">
                            <User size={18} className="text-primary" />
                            Personal Details
                        </div>
                    </div>
                    <div className="p-4 space-y-4">
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Full Name</label>
                            <div className="text-slate-900 font-medium">{user.name || 'User'}</div>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Email</label>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-900">{user.email}</span>
                                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">VERIFIED</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Mobile</label>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-900">{user.mobile || 'Not set'}</span>
                                {user.mobile && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">VERIFIED</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Financial Snapshot (Editable) */}
                <div className="card md:col-span-2">
                    <div className="card-header border-b border-slate-100 p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2 font-semibold text-slate-700">
                            <DollarSign size={18} className="text-green-600" />
                            Financial Snapshot
                        </div>
                        {editing && (
                            <div className="flex gap-2">
                                <button
                                    className="btn btn-sm btn-ghost text-slate-500"
                                    onClick={() => { setEditing(false); fetchProfile(); }} // Cancel: reset data
                                    disabled={updating}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-sm btn-primary flex items-center gap-1"
                                    onClick={handleSave}
                                    disabled={updating}
                                >
                                    {updating ? 'Saving...' : <><Save size={14} /> Save Changes</>}
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">

                        {/* Field Helper */}



                        {renderField("Monthly Gross Income", "gross_income", "bg-green-50 text-green-800")}
                        {renderField("Monthly Fixed Expenses", "fixed_expenses", "bg-red-50 text-red-800")}
                        {renderField("Monthly EMI & Debt", "monthly_emi", "bg-orange-50 text-orange-800")}
                        {renderField("Total Liabilities", "total_liabilities", "bg-red-50 text-red-800")}
                        {renderField("Existing Savings/Assets", "existing_assets", "bg-blue-50 text-blue-800")}
                        {renderField("Annual Insurance Premium", "insurance_premium", "bg-purple-50 text-purple-800")}


                    </div>
                </div>

                {/* 3. Risk & Persona Summary (Read Only via Logic) */}
                <div className="card md:col-span-3">
                    <div className="card-header border-b border-slate-100 p-4">
                        <div className="flex items-center gap-2 font-semibold text-slate-700">
                            <Activity size={18} className="text-blue-600" />
                            Current Assessment Status
                        </div>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded bg-slate-50 border border-slate-100">
                            <div className="text-xs text-slate-500 uppercase font-bold">Assigned Persona</div>
                            <div className="text-lg font-bold text-primary mt-1">
                                {profile.persona_data?.persona?.name || 'Not Assigned'}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">Based on Age & Income</div>
                        </div>

                        <div className="p-4 rounded bg-slate-50 border border-slate-100">
                            <div className="text-xs text-slate-500 uppercase font-bold">Risk Appetite</div>
                            <div className="text-lg font-bold text-slate-800 mt-1">
                                {profile.risk_class || profile.persona_data?.persona?.risk_appetite || 'Unknown'}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">From Survey & Behavior</div>
                        </div>

                        <div className="p-4 rounded bg-slate-50 border border-slate-100 flex flex-col justify-between">
                            <div>
                                <div className="text-xs text-slate-500 uppercase font-bold">Health Score</div>
                                <div className="text-lg font-bold text-green-600 mt-1">
                                    {profile.health_score || 0}/100
                                </div>
                            </div>
                            <Link to="/risk-assessment" className="text-xs text-primary hover:underline mt-2 flex items-center gap-1">
                                Retake Survey <ArrowRight size={10} />
                            </Link>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};



export default Profile;
