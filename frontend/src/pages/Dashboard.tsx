import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Calculator, User, TrendingUp } from 'lucide-react';
import { profileService } from '../services/api';
import './Dashboard.css';
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard';
import { InteractivePersonaCard } from '../components/dashboard/InteractivePersonaCard';
import { HealthScoreCard } from '../components/dashboard/HealthScoreCard';
import { ActionItemsGrid } from '../components/dashboard/ActionItemsGrid';
import { ScoreTrendCard } from '../components/dashboard/ScoreTrendCard';

import { DownloadReportButton } from '../components/reports/DownloadReportButton';
import { checkProfileCompletion, getFlowGuardMessage } from '../utils/flowGuard';

const Dashboard: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showWizard, setShowWizard] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const profileData = await profileService.getProfile();
            setProfile(profileData);
            setLoading(false);
        } catch (err: any) {
            if (err.response?.status === 404) {
                // New user - show onboarding wizard to complete profile
                setShowWizard(true);
                setLoading(false);
            } else {
                console.error('Error fetching profile:', err);
                setError('Failed to load profile data');
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchProfile();
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

    // Flow Guard Check
    const flowStatus = checkProfileCompletion(profile);

    // Scroll to action items
    const scrollToActions = () => {
        document.querySelector('.action-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    // Render Primary CTA based on flow state
    const renderPrimaryCTA = () => {
        switch (flowStatus.primaryCTA) {
            case 'complete-profile':
                return (
                    <Link to="/profile" className="primary-cta incomplete">
                        <User size={18} />
                        Complete Profile
                        <ArrowRight size={16} />
                    </Link>
                );
            case 'improve-score':
                return (
                    <button className="primary-cta improve" onClick={scrollToActions}>
                        <TrendingUp size={18} />
                        Improve Score
                        <ArrowRight size={16} />
                    </button>
                );
            case 'use-calculator':
                return (
                    <Link to="/calculators" className="primary-cta calculator">
                        <Calculator size={18} />
                        Plan Your Goals
                        <ArrowRight size={16} />
                    </Link>
                );
        }
    };

    if (loading && !profile) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner"></div>
                <span>Loading your financial dashboard...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-error">
                <p>{error}</p>
                <button className="retry-btn" onClick={fetchProfile}>Retry</button>
            </div>
        );
    }

    const actionItems = profile?.action_items || [];

    return (
        <div className="dashboard-container">
            {/* Success Toast */}
            {showSuccessToast && (
                <div className="success-toast">
                    <CheckCircle2 size={20} />
                    <div>
                        <strong>Profile Updated!</strong>
                        <span>Your insights have been refreshed.</span>
                    </div>
                </div>
            )}

            {/* Sticky Header */}
            <header className="dashboard-header">
                <div className="header-left">
                    <h1>Dashboard</h1>
                    <p className="header-subtitle">
                        Overview of your financial health
                        {profile?.updated_at && (
                            <span className="last-updated">
                                • Last updated {new Date(profile.updated_at).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                })}
                            </span>
                        )}
                    </p>
                </div>
                <div className="header-right">
                    {/* Primary CTA */}
                    {renderPrimaryCTA()}

                    {/* Download Report V2 */}
                    <DownloadReportButton
                        flowStatus={{
                            canDownloadReport: flowStatus.canDownloadReport,
                            message: getFlowGuardMessage(flowStatus)
                        }}
                    />
                </div>
            </header>

            {/* Profile Incomplete Alert */}
            {!flowStatus.isComplete && profile && (
                <div className="flow-alert">
                    <div className="alert-content">
                        <span className="alert-text">
                            Profile {flowStatus.percentage}% complete.
                            <strong> Missing: {flowStatus.missingFields.join(', ')}</strong>
                        </span>
                        <Link to="/profile" className="alert-cta">Complete Now →</Link>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="dashboard-main">
                {/* Primary Insight Row - 2 Column Grid */}
                <section className="primary-insights">
                    <div className="insight-card">
                        <InteractivePersonaCard profile={profile} />
                    </div>
                    <div className="insight-card">
                        <HealthScoreCard profile={profile} />
                    </div>
                </section>

                {/* Score Trend Section */}
                <section className="trend-section">
                    <ScoreTrendCard />
                </section>



                {/* Action Intelligence Section */}
                <section className="action-section">
                    <ActionItemsGrid
                        actionItems={actionItems}
                        hasProfile={!!profile}
                        onActionUpdate={fetchProfile}
                    />
                </section>
            </main>

            {/* Onboarding Wizard Modal */}
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
