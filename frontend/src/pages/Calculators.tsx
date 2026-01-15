import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Calculator as CalcIcon, TrendingUp, Home, CreditCard, ArrowLeft, RefreshCw, Download, Shield, BookOpen, Clock, Building, Percent, MapPin, Info, CheckCircle, PlusCircle, ExternalLink } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { calculatorService, profileService } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Calculators.css';

// --- CONFIGURATION ---
const CALCULATOR_CONFIG: any = {
    sip: {
        name: 'SIP Calculator',
        desc: 'Calculate future value of monthly investments',
        icon: TrendingUp,
        apiMethod: 'calculateSIP',
        inputs: [
            { name: 'monthlyInvestment', label: 'Monthly Investment (₹)', type: 'number', default: 5000, profileKey: 'suggestedSIP' },
            { name: 'rate', label: 'Expected Return (% p.a.)', type: 'number', default: 12 },
            { name: 'years', label: 'Time Period (Years)', type: 'number', default: 10 }
        ]
    },
    emi: {
        name: 'EMI Calculator',
        desc: 'Calculate loan EMI and interest breakdown',
        icon: CreditCard,
        apiMethod: 'calculateEMI',
        inputs: [
            { name: 'loanAmount', label: 'Loan Amount (₹)', type: 'number', default: 500000 },
            { name: 'interestRate', label: 'Interest Rate (% p.a.)', type: 'number', default: 9 },
            { name: 'tenureYears', label: 'Tenure (Years)', type: 'number', default: 5 }
        ]
    },
    retirement: {
        name: 'Retirement Planner',
        desc: 'Plan retirement corpus and monthly savings',
        icon: Home,
        apiMethod: 'calculateRetirement',
        inputs: [
            { name: 'currentAge', label: 'Current Age', type: 'number', default: 30, profileKey: 'age' },
            { name: 'retirementAge', label: 'Retirement Age', type: 'number', default: 60 },
            { name: 'monthlyExpenses', label: 'Current Monthly Expenses (₹)', type: 'number', default: 30000, profileKey: 'fixed_expenses' },
            { name: 'inflationRate', label: 'Inflation Rate (%)', type: 'number', default: 6 },
            { name: 'existingSavings', label: 'Existing Savings (₹)', type: 'number', default: 500000, profileKey: 'existing_assets' },
            { name: 'expectedReturn', label: 'Pre-Retirement Return (%)', type: 'number', default: 12 }
        ]
    },
    'life-insurance': {
        name: 'Life Insurance',
        desc: 'Calculate required life cover based on Human Life Value',
        icon: Shield,
        apiMethod: 'calculateLifeInsurance',
        inputs: [
            { name: 'income', label: 'Annual Income (₹)', type: 'number', default: 1000000, profileKey: 'gross_income_annual' },
            { name: 'age', label: 'Current Age', type: 'number', default: 30, profileKey: 'age' },
            { name: 'retirementAge', label: 'Retirement Age', type: 'number', default: 60 },
            { name: 'liabilities', label: 'Total Liabilities (Loans etc) (₹)', type: 'number', default: 2000000 },
            { name: 'assets', label: 'Existing Assets (Investments) (₹)', type: 'number', default: 500000, profileKey: 'existing_assets' },
            { name: 'dependents', label: 'Number of Dependents', type: 'number', default: 2 }
        ]
    },
    education: {
        name: 'Education Planner',
        desc: 'Calculate savings needed for child\'s education',
        icon: BookOpen,
        apiMethod: 'calculateEducation',
        inputs: [
            { name: 'childAge', label: 'Child\'s Current Age', type: 'number', default: 5 },
            { name: 'goalYear', label: 'Goal Year (e.g. 2035)', type: 'number', default: 2040 },
            { name: 'currentCost', label: 'Current Cost of Education (₹)', type: 'number', default: 1000000 },
            { name: 'inflation', label: 'Education Inflation (%)', type: 'number', default: 10 },
            { name: 'currentSavings', label: 'Current Savings for Goal (₹)', type: 'number', default: 200000, profileKey: 'existing_assets' },
            { name: 'returnRate', label: 'Expected Return (%)', type: 'number', default: 12 }
        ]
    },
    'cost-of-delay': {
        name: 'Cost of Delay',
        desc: 'See how much delaying investment costs you',
        icon: Clock,
        apiMethod: 'calculateCostOfDelay',
        inputs: [
            { name: 'sipAmount', label: 'Monthly SIP (₹)', type: 'number', default: 5000, profileKey: 'suggestedSIP' },
            { name: 'returnRate', label: 'Expected Return (%)', type: 'number', default: 12 },
            { name: 'delayYears', label: 'Delay in Starting (Years)', type: 'number', default: 5 },
            { name: 'totalYears', label: 'Total Investment Period (Years)', type: 'number', default: 20 }
        ]
    },
    hra: {
        name: 'HRA Calculator',
        desc: 'Calculate HRA tax exemption limit',
        icon: Building,
        apiMethod: 'calculateHRA',
        inputs: [
            { name: 'basic', label: 'Basic Salary (Monthly) (₹)', type: 'number', default: 50000, profileKey: 'gross_income' },
            { name: 'da', label: 'Dearness Allowance (Monthly) (₹)', type: 'number', default: 0 },
            { name: 'rentPaid', label: 'Rent Paid (Monthly) (₹)', type: 'number', default: 15000 },
            { name: 'isMetro', label: 'Is Metro City?', type: 'boolean', default: true }
        ]
    },
    'home-affordability': {
        name: 'Home Affordability',
        desc: 'Check how much loan you can afford',
        icon: MapPin,
        apiMethod: 'calculateHomeAffordability',
        inputs: [
            { name: 'monthlyIncome', label: 'Monthly In-hand Income (₹)', type: 'number', default: 80000, profileKey: 'gross_income' },
            { name: 'existingEMI', label: 'Existing Monthly EMIs (₹)', type: 'number', default: 10000, profileKey: 'monthly_emi' },
            { name: 'interestRate', label: 'Home Loan Interest Rate (%)', type: 'number', default: 8.5 },
            { name: 'tenureYears', label: 'Loan Tenure (Years)', type: 'number', default: 20 }
        ]
    },
    cagr: {
        name: 'CAGR Calculator',
        desc: 'Calculate Compound Annual Growth Rate',
        icon: Percent,
        apiMethod: 'calculateCAGR',
        inputs: [
            { name: 'startValue', label: 'Initial Investment (₹)', type: 'number', default: 10000 },
            { name: 'endValue', label: 'Final Value (₹)', type: 'number', default: 20000 },
            { name: 'years', label: 'Duration (Years)', type: 'number', default: 5 }
        ]
    }
};

const Calculators: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [activeId, setActiveId] = useState<string | null>(null);
    const [inputs, setInputs] = useState<any>({});
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [actionContext, setActionContext] = useState<{ title?: string; gap?: number } | null>(null);

    // Fetch Profile on Mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await profileService.getProfile();
                setProfile(data);
            } catch (err) {
                console.log('No profile found or error fetching profile');
            } finally {
                setProfileLoading(false);
            }
        };
        fetchProfile();
    }, []);

    // Handle URL Parameters for Deep Linking
    useEffect(() => {
        const tool = searchParams.get('tool');
        const context = searchParams.get('context');
        const title = searchParams.get('title');
        const gap = searchParams.get('gap');

        if (tool && CALCULATOR_CONFIG[tool]) {
            selectCalculator(tool);

            if (context === 'action' && title) {
                setActionContext({
                    title,
                    gap: gap ? parseInt(gap) : undefined
                });
            }
        }
    }, [searchParams]);

    // Prefill from Profile
    const selectCalculator = (id: string) => {
        setActiveId(id);
        setResult(null);

        const defaults: any = {};
        const config = CALCULATOR_CONFIG[id];

        config.inputs.forEach((inp: any) => {
            let value = inp.default;

            // Context-aware prefilling
            if (profile && inp.profileKey) {
                if (inp.profileKey === 'age') {
                    value = profile.age || inp.default;
                } else if (inp.profileKey === 'gross_income') {
                    value = profile.gross_income || inp.default;
                } else if (inp.profileKey === 'gross_income_annual') {
                    value = (profile.gross_income || 0) * 12;
                } else if (inp.profileKey === 'fixed_expenses') {
                    value = profile.fixed_expenses || inp.default;
                } else if (inp.profileKey === 'monthly_emi') {
                    value = profile.monthly_emi || inp.default;
                } else if (inp.profileKey === 'existing_assets') {
                    value = profile.existing_assets || inp.default;
                } else if (inp.profileKey === 'suggestedSIP') {
                    // Calculate suggested SIP from surplus
                    const surplus = (profile.gross_income || 0) - (profile.fixed_expenses || 0) - (profile.monthly_emi || 0);
                    value = Math.max(0, Math.round(surplus * 0.3)); // 30% of surplus
                }
            }

            defaults[inp.name] = value;
        });

        setInputs(defaults);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setInputs((prev: any) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : (type === 'number' ? Number(value) : value)
        }));
    };

    const handleToggle = (name: string) => {
        setInputs((prev: any) => ({ ...prev, [name]: !prev[name] }));
    };

    const calculate = async () => {
        if (!activeId) return;
        setLoading(true);
        try {
            const method = CALCULATOR_CONFIG[activeId].apiMethod;
            const apiCall = (calculatorService as any)[method];
            if (apiCall) {
                const res = await apiCall(inputs);
                if (res) setResult(res);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const generatePDF = () => {
        if (!result || !activeId) return;
        const config = CALCULATOR_CONFIG[activeId];
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('WealthMax Report: ' + config.name, 14, 20);
        doc.setFontSize(12);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);

        const inputRows = config.inputs.map((inp: any) => [inp.label, inputs[inp.name]?.toString() || '-']);
        autoTable(doc, {
            startY: 40,
            head: [['Input', 'Value']],
            body: inputRows,
            theme: 'plain'
        });

        const summaryRows = Object.entries(result.summary).map(([key, val]) => [key, (val as any).toString()]);
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 10,
            head: [['Result Metric', 'Value']],
            body: summaryRows,
        });

        doc.save(`${activeId}_report.pdf`);
    };

    const renderChart = () => {
        if (!result?.chartData || result.chartData.length === 0) return null;
        const data = result.chartData;

        if (activeId === 'emi' || activeId === 'life-insurance' || activeId === 'hra') {
            if (activeId === 'life-insurance' || activeId === 'hra') {
                return (
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
                                {data.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(val: any) => `₹${val.toLocaleString()}`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );
            }
        }

        if (activeId === 'cost-of-delay') {
            return (
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="year" fontSize={11} />
                        <YAxis tickFormatter={(val) => `${val / 1000}k`} width={50} />
                        <Tooltip formatter={(val: any) => `₹${val.toLocaleString()}`} />
                        <Legend />
                        <Line type="monotone" dataKey="immediate" stroke="#10b981" name="Start Now" strokeWidth={2} />
                        <Line type="monotone" dataKey="delayed" stroke="#ef4444" name="Delayed" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            );
        }

        return (
            <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="year" fontSize={11} />
                    <YAxis tickFormatter={(val) => `${val / 1000}k`} width={50} />
                    <Tooltip formatter={(val: any) => `₹${val.toLocaleString()}`} />
                    <Area type="monotone" dataKey={Object.keys(data[0]).find(k => k !== 'year') || 'value'} stroke="#3b82f6" fill="url(#colorMain)" />
                </AreaChart>
            </ResponsiveContainer>
        );
    };

    const renderCTAs = () => {
        if (!result) return null;

        return (
            <div className="cta-section">
                <div className="cta-divider">
                    <span>Next Steps</span>
                </div>
                <div className="cta-buttons">
                    <button className="cta-btn cta-primary" disabled title="Coming soon">
                        <CheckCircle size={18} />
                        Apply to My Plan
                    </button>
                    <button className="cta-btn cta-secondary" disabled title="Coming soon">
                        <PlusCircle size={18} />
                        Add as Goal
                    </button>
                    <button
                        className="cta-btn cta-secondary"
                        onClick={() => navigate(`/profile?from=calculator&tool=${activeId}`)}
                    >
                        <ExternalLink size={18} />
                        Update Profile Assumptions
                    </button>
                </div>
                <p className="cta-note">Update your profile to recalculate recommendations based on new financial data.</p>
            </div>
        );
    };

    return (
        <div className="calculators-page">
            <div className="page-header">
                <CalcIcon size={40} className="page-icon" />
                <div>
                    <h1>Financial Calculators</h1>
                    <p className="page-subtitle">Interactive tools to plan your financial goals</p>
                </div>
            </div>

            {!activeId ? (
                <div className="calculators-grid">
                    {Object.entries(CALCULATOR_CONFIG).map(([key, conf]: any) => {
                        const Icon = conf.icon;
                        return (
                            <div key={key} className="card calculator-card" onClick={() => selectCalculator(key)}>
                                <div className="calculator-icon-wrapper"><Icon size={32} /></div>
                                <h2 className="calculator-name">{conf.name}</h2>
                                <p className="calculator-description">{conf.desc}</p>
                                <button className="btn-link">Use Tool</button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="calculator-workspace fade-in">
                    <button className="back-btn" onClick={() => { setActiveId(null); setResult(null); }}><ArrowLeft size={16} /> Back to Tools</button>
                    <h2 className="calc-title">{CALCULATOR_CONFIG[activeId].name}</h2>

                    {/* Action Context Banner */}
                    {actionContext && (
                        <div className="context-message" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', border: 'none' }}>
                            <Info size={16} />
                            <div>
                                <strong>Calculating for:</strong> {actionContext.title}
                                {actionContext.gap && <span className="ml-2 text-sm opacity-90">(Gap: ₹{actionContext.gap.toLocaleString('en-IN')})</span>}
                            </div>
                        </div>
                    )}

                    {/* Profile Context Message */}
                    {profile && !actionContext && (
                        <div className="context-message">
                            <Info size={16} />
                            <span>This calculation is based on your current financial profile.</span>
                        </div>
                    )}

                    <div className="workspace-grid">
                        {/* INPUT PANEL */}
                        <div className="input-panel card">
                            {CALCULATOR_CONFIG[activeId].inputs.map((inp: any) => (
                                <div key={inp.name} className="form-group">
                                    <label>{inp.label}</label>
                                    {inp.type === 'boolean' ? (
                                        <div className="flex items-center gap-2 mt-2">
                                            <input
                                                type="checkbox"
                                                name={inp.name}
                                                checked={!!inputs[inp.name]}
                                                onChange={() => handleToggle(inp.name)}
                                                className="w-5 h-5 text-blue-600 rounded"
                                            />
                                            <span className="text-sm text-gray-600">{inputs[inp.name] ? 'Yes' : 'No'}</span>
                                        </div>
                                    ) : (
                                        <input
                                            type="number"
                                            name={inp.name}
                                            value={inputs[inp.name]}
                                            onChange={handleInputChange}
                                        />
                                    )}
                                </div>
                            ))}
                            <button className="btn btn-primary mt-4" onClick={calculate} disabled={loading}>
                                {loading ? <RefreshCw className="animate-spin" /> : 'Calculate'}
                            </button>
                        </div>

                        {/* RESULT PANEL */}
                        <div className="result-panel card">
                            {result ? (
                                <div className="result-container">
                                    <div className="result-header">
                                        <h3>Result Summary</h3>
                                        <button className="btn-icon" onClick={generatePDF}><Download size={18} /></button>
                                    </div>

                                    {/* Generic Summary Grid */}
                                    <div className="result-summary">
                                        {Object.entries(result.summary).map(([key, val]: any) => (
                                            <div key={key} className="result-item">
                                                <label>{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                                <span className="value">
                                                    {val > 1000 ? `₹${Number(val).toLocaleString()}` : val}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Chart */}
                                    <div className="chart-wrapper mt-6">
                                        {renderChart()}
                                    </div>

                                    {/* Platform CTAs */}
                                    {renderCTAs()}
                                </div>
                            ) : (
                                <div className="placeholder-result">
                                    <CalcIcon size={48} className="opacity-20 mb-2" />
                                    <p>Enter details to calculate</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calculators;
