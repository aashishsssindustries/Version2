import React from 'react';
import { Link } from 'react-router-dom';
import './FinancialPersonaCard.css';

interface FinancialPersonaCardProps {
    profile: any;
}

export const FinancialPersonaCard: React.FC<FinancialPersonaCardProps> = ({ profile }) => {
    if (!profile || !profile.persona_data) return null;

    const { persona, behavior } = profile.persona_data;
    if (!persona || !behavior) return null;

    return (
        <div className="persona-card">
            <div className="persona-header">
                <div className="persona-icon">👤</div>
                <div className="persona-info">
                    <h3 className="persona-title">Persona {persona.id}: {persona.name}</h3>
                    <p className="persona-subtitle">{persona.description}</p>
                </div>
            </div>

            <div className="persona-details">
                <div className="persona-section">
                    <h4 className="section-title">Behavior</h4>
                    <p className="section-tag">{behavior.tag}</p>
                    <p className="section-desc">{behavior.description}</p>
                </div>

                <div className="persona-section">
                    <h4 className="section-title">Risk Appetite</h4>
                    <p className="risk-badge">{persona.risk_appetite}</p>
                </div>

                <div className="persona-section">
                    <h4 className="section-title">Recommended Allocation</h4>
                    <div className="habits-list">
                        {persona.recommended_allocation?.expenses && (
                            <div className="habit-item">
                                <span className="habit-label">Living Expenses:</span>
                                <span className="habit-value">{persona.recommended_allocation.expenses}%</span>
                            </div>
                        )}
                        {persona.recommended_allocation?.investments && (
                            <div className="habit-item">
                                <span className="habit-label">Investments:</span>
                                <span className="habit-value">{persona.recommended_allocation.investments}%</span>
                            </div>
                        )}
                        {persona.recommended_allocation?.liabilities && (
                            <div className="habit-item">
                                <span className="habit-label\">Debt Servicing:</span>
                                <span className="habit-value">{persona.recommended_allocation.liabilities}%</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="persona-section">
                    <h4 className="section-title">Long-term Goals</h4>
                    <ul className="goals-list">
                        {persona.long_term_goals?.map((goal: string, idx: number) => (
                            <li key={idx}>{goal}</li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="persona-footer">
                <Link to="/risk-assessment" className="update-link">Update Profile</Link>
            </div>
        </div>
    );
};
