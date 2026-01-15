import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { TrendingUp, Download, CheckCircle2 } from 'lucide-react';
import { profileService } from '../services/api';
import './Dashboard.css';
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard';
import { ActionChecklistCard } from '../components/dashboard/ActionChecklistCard';
import { SnapshotStats } from '../components/dashboard/SnapshotStats';
import { NextBestActionCard } from '../components/dashboard/NextBestActionCard';

const Dashboard: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showWizard, setShowWizard] = useState(false);
    const [downloadingPDF, setDownloadingPDF] = useState(false);
    const [pdfError, setPdfError] = useState('');
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const profileData = await profileService.getProfile();
            setProfile(profileData);
        } catch (err: any) {
            if (err.response?.status === 404) {
                setProfile(null);
            } else {
                console.error('Error fetching profile:', err);
                setError('Failed to load profile data');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();

        // Check if redirected from profile update
        if (searchParams.get('updated') === 'true') {
            setShowSuccessToast(true);
            setSearchParams({});
            setTimeout(() => setShowSuccessToast(false), 5000);
        }
    }, []);

    const handleWizardComplete = () => {
        setShowWizard(false);
        fetchProfile();
    };

    const handleDownloadPDF = async () => {
        try {
            setDownloadingPDF(true);
            setPdfError('');

            const token = localStorage.getItem('token');
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/pdf/advisory-report`,
                {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/pdf' }
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to generate PDF');
            }

            const blob = await response.blob();
            if (blob.type !== 'application/pdf') throw new Error('Invalid PDF received');

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `WealthMax_Advisory_Report_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (err: any) {
            console.error('PDF Download Error:', err);
            setPdfError(err.message || 'Failed to download PDF report');
        } finally {
            setDownloadingPDF(false);
        }
    };

    if (loading && !profile) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
                <div className="animate-pulse">Loading dashboard...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-red-500">
                <p>{error}</p>
                <button className="btn btn-primary mt-4" onClick={fetchProfile}>Retry</button>
            </div>
        );
    }

    // Limit to top 3 priority action items for focused dashboard experience
    const allActionItems = profile?.action_items || [];
    const actionItems = allActionItems.slice(0, 3);
    const topAction = actionItems.length > 0 ? actionItems[0] : null;

    const getJourneyCTA = (pid: string) => {
        switch (pid) {
            case 'A': return { title: 'Start Your Wealth Journey', text: 'Begin with a disciplined monthly investment plan.', btn: 'Start SIP', link: '/calculators' };
            case 'B': return { title: 'Optimize Your Taxes', text: 'Reduce liability and maximize compounding.', btn: 'Explore Tax Tools', link: '/calculators' };
            case 'C': return { title: 'Secure Your Retirement', text: 'Ensure meaningful income for your golden years.', btn: 'View Retirement Plan', link: '/calculators' };
            default: return null;
        }
    };

    const journey = profile?.persona_data?.persona?.id ? getJourneyCTA(profile.persona_data.persona.id) : null;

    // Snapshot Info
    const monthlySurplus = profile?.metrics?.monthly_surplus || 0;
    const emergencyMonths = (profile?.fixed_expenses > 0) ? (profile?.existing_assets || 0) / profile.fixed_expenses : 0;
    const debtRatio = profile?.metrics?.ratios?.liabilities || 0;
    const riskProfile = profile?.risk_class || profile?.persona_data?.persona?.risk_appetite || 'Unassessed';

    return (
        <div className="w-full bg-slate-50 min-h-screen p-8 font-sans text-slate-800">
            {/* Header */}
            <div className="max-w-[1600px] mx-auto mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 mt-1">
                        Overview of your financial health
                        {profile?.updated_at && (
                            <span className="ml-3 text-xs text-slate-400">
                                • Last updated {new Date(profile.updated_at).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                })}
                            </span>
                        )}
                    </p>
                </div>
                {profile && (
                    <div className="flex flex-col items-end">
                        <button
                            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold py-2 px-4 rounded-lg shadow-sm flex items-center gap-2 transition-all"
                            onClick={handleDownloadPDF}
                            disabled={downloadingPDF}
                        >
                            <Download size={18} className="text-slate-500" />
                            {downloadingPDF ? 'Generating...' : 'Download Report'}
                        </button>
                        {pdfError && <p className="text-xs text-red-500 mt-1">{pdfError}</p>}
                    </div>
                )}
            </div>

            <div className="max-w-[1600px] mx-auto">
                {/* Success Toast */}
                {showSuccessToast && (
                    <div className="fixed top-4 right-4 z-50 animate-slideDown">
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
                            <CheckCircle2 size={20} className="text-emerald-600" />
                            <div>
                                <strong className="block text-sm font-bold">Profile Updated!</strong>
                                <span className="text-xs">Your insights have been refreshed.</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Journey CTA Banner */}
                {journey && (
                    <div className="mb-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-8 shadow-lg relative overflow-hidden group">
                        <div className="absolute right-0 top-0 opacity-10 transform translate-x-12 -translate-y-12">
                            <TrendingUp size={200} />
                        </div>
                        <div className="relative z-10 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">{journey.title}</h2>
                                <p className="text-blue-100 text-lg mb-4 max-w-xl">{journey.text}</p>
                                {topAction && (
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-sm font-medium backdrop-blur-md border border-white/10">
                                        <span className="text-yellow-300">★ Next Step:</span>
                                        {topAction.title}
                                    </div>
                                )}
                            </div>
                            <Link to={journey.link} className="bg-white text-indigo-600 hover:bg-blue-50 font-bold py-3 px-6 rounded-lg shadow-md transition-all transform hover:translate-y-[-2px]">
                                {journey.btn}
                            </Link>
                        </div>
                    </div>
                )}

                {/* Snapshot Stats (Full Width) */}
                {profile && (
                    <SnapshotStats
                        surplus={monthlySurplus}
                        emergencyMonths={emergencyMonths}
                        debtRatio={debtRatio}
                        riskProfile={riskProfile}
                    />
                )}

                {/* Next Best Action Card - Replaces 3-column middle section */}
                <NextBestActionCard />

                {/* Bottom Row: Action Checklist */}
                <div className="w-full">
                    <ActionChecklistCard actionItems={actionItems} hasProfile={!!profile} />
                </div>
            </div>

            {showWizard && (
                <OnboardingWizard
                    onClose={() => setShowWizard(false)}
                    onComplete={handleWizardComplete}
                />
            )}
        </div>
    );
};

export default Dashboard;
