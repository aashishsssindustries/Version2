import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, AlertTriangle, TrendingUp, Award, Shield } from 'lucide-react';
import { surveyService, profileService } from '../services/api';
import './RiskAssessment.css';

interface Question {
    id: number;
    text: string;
    category: string;
    options: { text: string; weight: number }[];
}

const RiskAssessment: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [profile, setProfile] = useState<any>(null);
    const [currentStep, setCurrentStep] = useState(0); // 0 = Intro, 1 = Survey, 2 = Result
    const [page, setPage] = useState(0);
    const QUESTIONS_PER_PAGE = 5;

    useEffect(() => {
        const init = async () => {
            try {
                const [qs, prof] = await Promise.all([
                    surveyService.getQuestions(),
                    profileService.getProfile()
                ]);
                setQuestions(qs.data || qs); // Handle strict response structure
                setProfile(prof);

                // If profile has risk score, show results
                if (prof && prof.risk_class) {
                    setCurrentStep(2);
                }
            } catch (err) {
                console.error("Failed to load survey data", err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const handleOptionSelect = (qId: number, weight: number) => {
        setAnswers(prev => ({ ...prev, [qId]: weight }));
    };

    const handleNext = () => {
        const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
        if (page < totalPages - 1) {
            setPage(prev => prev + 1);
            window.scrollTo(0, 0);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (page > 0) setPage(prev => prev - 1);
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const formattedAnswers = Object.entries(answers).map(([qId, weight]) => ({
                questionId: parseInt(qId),
                weight
            }));

            await surveyService.submitSurvey(formattedAnswers);

            // Refresh profile to show new data
            const updatedProfile = await profileService.getProfile();
            setProfile(updatedProfile);
            setCurrentStep(2);
        } catch (err) {
            console.error("Submission failed", err);
            alert("Failed to submit survey. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleRetake = () => {
        if (window.confirm("Retaking the survey will overwrite your current Risk Profile and might change your portfolio recommendations. Continue?")) {
            setAnswers({});
            setPage(0);
            setCurrentStep(1);
        }
    };

    const renderIntro = () => (
        <div className="risk-intro-card">
            <div className="intro-icon">
                <Shield size={64} />
            </div>
            <h1>Investment Aptitude Survey</h1>
            <p>
                To provide the best financial advice, WealthMax needs to understand your relationship with money,
                risk tolerance, and investment horizon.
            </p>
            <div className="intro-details">
                <div className="detail-item">
                    <span className="badge">25 Questions</span>
                </div>
                <div className="detail-item">
                    <span className="badge">~5 Minutes</span>
                </div>
            </div>
            <button className="btn btn-primary btn-lg" onClick={() => setCurrentStep(1)}>
                Start Assessment <ArrowRight size={20} className="ml-2" />
            </button>
        </div>
    );

    const renderSurvey = () => {
        const startIdx = page * QUESTIONS_PER_PAGE;
        const currentQuestions = questions.slice(startIdx, startIdx + QUESTIONS_PER_PAGE);
        const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);

        // Check if current page is complete
        const isPageComplete = currentQuestions.every(q => answers[q.id]);

        return (
            <div className="survey-container">
                <div className="survey-header">
                    <h2>Risk Assessment</h2>
                    <span className="step-indicator">Page {page + 1} of {totalPages}</span>
                </div>

                <div className="progress-bar-container">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${((page) / totalPages) * 100}%` }}
                    ></div>
                </div>

                <div className="questions-list">
                    {currentQuestions.map((q, idx) => (
                        <div key={q.id} className="question-card">
                            <div className="question-category">{q.category}</div>
                            <h3 className="question-text">{startIdx + idx + 1}. {q.text}</h3>
                            <div className="options-grid">
                                {q.options.map((opt, oIdx) => (
                                    <button
                                        key={oIdx}
                                        className={`option-btn ${answers[q.id] === opt.weight ? 'selected' : ''}`}
                                        onClick={() => handleOptionSelect(q.id, opt.weight)}
                                    >
                                        {opt.text}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="survey-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={handleBack}
                        disabled={page === 0}
                    >
                        <ArrowLeft size={18} className="mr-2" /> Back
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleNext}
                        disabled={!isPageComplete}
                    >
                        {page === totalPages - 1 ? 'Submit Analysis' : 'Next'}
                        {page !== totalPages - 1 && <ArrowRight size={18} className="ml-2" />}
                    </button>
                </div>
            </div>
        );
    };

    const renderResult = () => {
        if (!profile) return null;

        const { risk_class, risk_score } = profile;
        let badgeColor = 'bg-blue-600';
        if (risk_class === 'Conservative') badgeColor = 'bg-teal-600';
        if (risk_class === 'Aggressive') badgeColor = 'bg-orange-600';

        return (
            <div className="result-container animate-fadeIn">
                <div className="result-header">
                    <div className="flex items-center justify-center mb-6">
                        <Award size={64} className="text-primary" />
                    </div>
                    <h1>Your Risk Profile</h1>
                    <div className={`risk-badge-large ${badgeColor}`}>
                        {risk_class} Investor
                    </div>
                    <div className="score-display-large">
                        <span className="label">Aptitude Score</span>
                        <span className="value">{risk_score}/100</span>
                    </div>
                </div>

                <div className="result-details">
                    <div className="detail-card">
                        <TrendingUp size={24} className="mb-2 text-primary" />
                        <h3>Strategy</h3>
                        <p>Based on your score, we recommend a {risk_class.toLowerCase()} allocation strategy focusing on
                            {risk_class === 'Aggressive' ? ' accumulation ' : risk_class === 'Conservative' ? ' preservation ' : ' balanced growth '}.
                        </p>
                    </div>
                    <div className="detail-card">
                        <AlertTriangle size={24} className="mb-2 text-primary" />
                        <h3>Guardrails</h3>
                        <p>Our system actively monitors your portfolio against this profile to prevent emotional decision making.</p>
                    </div>
                </div>

                <div className="result-actions">
                    <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')}>
                        Go to Dashboard
                    </button>
                    <button className="btn btn-ghost" onClick={handleRetake}>
                        Retake Survey
                    </button>
                </div>
            </div>
        );
    };

    if (loading) return <div className="p-xl text-center">Loading Assessment...</div>;

    return (
        <div className="risk-page">
            {currentStep === 0 && renderIntro()}
            {currentStep === 1 && renderSurvey()}
            {currentStep === 2 && renderResult()}
        </div>
    );
};

export default RiskAssessment;
