export interface RiskQuestion {
    id: number;
    text: string;
    category: 'Time Horizon' | 'Risk Tolerance' | 'Financial Knowledge' | 'Reaction' | 'Goal';
    options: { text: string; weight: number }[];
}

export const RISK_QUESTIONS: RiskQuestion[] = [
    // --- Time Horizon (1-5) ---
    {
        id: 1,
        text: "What is your current age bracket?",
        category: "Time Horizon",
        options: [
            { text: "60 and above", weight: 1 },
            { text: "51 - 59", weight: 2 },
            { text: "41 - 50", weight: 3 },
            { text: "31 - 40", weight: 4 },
            { text: "Under 30", weight: 5 }
        ]
    },
    {
        id: 2,
        text: "When do you expect to start withdrawing your investment principal?",
        category: "Time Horizon",
        options: [
            { text: "Less than 1 year", weight: 1 },
            { text: "1 - 3 years", weight: 2 },
            { text: "3 - 5 years", weight: 3 },
            { text: "5 - 10 years", weight: 4 },
            { text: "More than 10 years", weight: 5 }
        ]
    },
    {
        id: 3,
        text: "What is your primary goal for these investments?",
        category: "Goal",
        options: [
            { text: "Capital Preservation", weight: 1 },
            { text: "Regular Income", weight: 2 },
            { text: "Balance of Growth and Income", weight: 3 },
            { text: "Long-term Growth", weight: 4 },
            { text: "Aggressive Growth", weight: 5 }
        ]
    },
    {
        id: 4,
        text: "Do you foresee any major expenses (e.g., buying a home, education) in the near future?",
        category: "Time Horizon",
        options: [
            { text: "Yes, within 1 year", weight: 1 },
            { text: "Yes, within 2-3 years", weight: 2 },
            { text: "Yes, within 3-5 years", weight: 3 },
            { text: "Maybe in 5-10 years", weight: 4 },
            { text: "No major expenses foreseen", weight: 5 }
        ]
    },
    {
        id: 5,
        text: "How stable is your current stream of income?",
        category: "Risk Tolerance",
        options: [
            { text: "Very Unstable", weight: 1 },
            { text: "Somewhat Unstable", weight: 2 },
            { text: "Stable but flexible", weight: 3 },
            { text: "Stable", weight: 4 },
            { text: "Very Stable / Government Job", weight: 5 }
        ]
    },

    // --- Risk Tolerance / Attitude (6-15) ---
    {
        id: 6,
        text: "How would you describe your attitude towards financial risk?",
        category: "Risk Tolerance",
        options: [
            { text: "I avoid risk at all costs", weight: 1 },
            { text: "I prefer low risk", weight: 2 },
            { text: "I accept moderate risk", weight: 3 },
            { text: "I am willing to take risks for returns", weight: 4 },
            { text: "I seek maximum returns regardless of risk", weight: 5 }
        ]
    },
    {
        id: 7,
        text: "If your portfolio dropped by 20% in one month, what would you do?",
        category: "Reaction",
        options: [
            { text: "Sell everything immediately", weight: 1 },
            { text: "Sell a portion to cut losses", weight: 2 },
            { text: "Do nothing / Wait it out", weight: 3 },
            { text: "Buy more at lower prices", weight: 4 },
            { text: "Invest aggressively (Buy the dip)", weight: 5 }
        ]
    },
    {
        id: 8,
        text: "Which investment statement resonates most with you?",
        category: "Risk Tolerance",
        options: [
            { text: "Better safe than sorry", weight: 1 },
            { text: "Slow and steady wins the race", weight: 2 },
            { text: "Balanced approach is key", weight: 3 },
            { text: "No risk, no reward", weight: 4 },
            { text: "Go big or go home", weight: 5 }
        ]
    },
    {
        id: 9,
        text: "How much of your liquid net worth are you willing to invest in equities?",
        category: "Risk Tolerance",
        options: [
            { text: "0 - 10%", weight: 1 },
            { text: "10 - 30%", weight: 2 },
            { text: "30 - 50%", weight: 3 },
            { text: "50 - 80%", weight: 4 },
            { text: "80 - 100%", weight: 5 }
        ]
    },
    {
        id: 10,
        text: "Would you invest in a start-up or crypto currency?",
        category: "Risk Tolerance",
        options: [
            { text: "Never", weight: 1 },
            { text: "Highly unlikely", weight: 2 },
            { text: "Maybe a small amount", weight: 3 },
            { text: "Yes, up to 10% of portfolio", weight: 4 },
            { text: "Yes, a significant amount", weight: 5 }
        ]
    },
    {
        id: 11,
        text: "Do you have an emergency fund covering 6 months of expenses?",
        category: "Financial Knowledge",
        options: [
            { text: "No", weight: 1 },
            { text: "Partially (1-2 months)", weight: 2 },
            { text: "Partially (3-4 months)", weight: 3 },
            { text: "Yes, almost (5 months)", weight: 4 },
            { text: "Yes, fully funded", weight: 5 }
        ]
    },
    {
        id: 12,
        text: "How comfortable are you with volatility (daily price swings)?",
        category: "Reaction",
        options: [
            { text: "Not comfortable at all", weight: 1 },
            { text: "Slightly uncomfortable", weight: 2 },
            { text: "Neutral", weight: 3 },
            { text: "Comfortable", weight: 4 },
            { text: "Thrive on it", weight: 5 }
        ]
    },
    {
        id: 13,
        text: "Inflation is 6%. What return do you target?",
        category: "Goal",
        options: [
            { text: "4-5% (Safety priority)", weight: 1 },
            { text: "6-7% (Match inflation)", weight: 2 },
            { text: "8-10% (Beat inflation moderate)", weight: 3 },
            { text: "10-15% (Solid growth)", weight: 4 },
            { text: "15%+ (Aggressive growth)", weight: 5 }
        ]
    },
    {
        id: 14,
        text: "Have you ever borrowed money to invest (Leverage)?",
        category: "Financial Knowledge",
        options: [
            { text: "Never and never will", weight: 1 },
            { text: "No, but might consider", weight: 2 },
            { text: "Only for real estate", weight: 3 },
            { text: "Yes, successfully", weight: 4 },
            { text: "Yes, frequently", weight: 5 }
        ]
    },
    {
        id: 15,
        text: "The global market crashes 15% tomorrow. Your sleep is:",
        category: "Reaction",
        options: [
            { text: "Ruined, panic attacks", weight: 1 },
            { text: "Disturbed, worried", weight: 2 },
            { text: "Okay, but checking news", weight: 3 },
            { text: "Sound, I trust the long term", weight: 4 },
            { text: "Sound, excited to buy", weight: 5 }
        ]
    },

    // --- Financial Knowledge / Situation (16-25) ---
    {
        id: 16,
        text: "How would you rate your knowledge of financial markets?",
        category: "Financial Knowledge",
        options: [
            { text: "None / Beginner", weight: 1 },
            { text: "Basic", weight: 2 },
            { text: "Intermediate", weight: 3 },
            { text: "Advanced", weight: 4 },
            { text: "Professional / Expert", weight: 5 }
        ]
    },
    {
        id: 17,
        text: "What is your experience with mutual funds or stocks?",
        category: "Financial Knowledge",
        options: [
            { text: "No experience", weight: 1 },
            { text: "Fixed Deposits only", weight: 2 },
            { text: "Some Mutual Funds", weight: 3 },
            { text: "Direct Stocks matching market", weight: 4 },
            { text: "Derivatives / F&O", weight: 5 }
        ]
    },
    {
        id: 18,
        text: "Do you understand the difference between Large Cap and Small Cap?",
        category: "Financial Knowledge",
        options: [
            { text: "No", weight: 1 },
            { text: "Vaguely", weight: 2 },
            { text: "Yes, somewhat", weight: 3 },
            { text: "Yes, clearly", weight: 4 },
            { text: "Yes, I analyze them", weight: 5 }
        ]
    },
    {
        id: 19,
        text: "How dependent are you on this portfolio for daily bills?",
        category: "Financial Knowledge",
        options: [
            { text: "Highly dependent", weight: 1 },
            { text: "Moderately dependent", weight: 2 },
            { text: "Slightly dependent", weight: 3 },
            { text: "Not dependent currently", weight: 4 },
            { text: "Completely independent (Surplus)", weight: 5 }
        ]
    },
    {
        id: 20,
        text: "If an investment loses principal, how long can you wait for recovery?",
        category: "Time Horizon",
        options: [
            { text: "I cannot afford any loss", weight: 1 },
            { text: "3 months", weight: 2 },
            { text: "1 year", weight: 3 },
            { text: "2-3 years", weight: 4 },
            { text: "5+ years", weight: 5 }
        ]
    },
    {
        id: 21,
        text: "What implies 'Risk' to you?",
        category: "Risk Tolerance",
        options: [
            { text: "Loss of money", weight: 1 },
            { text: "Uncertainty of return", weight: 2 },
            { text: "Opportunity cost", weight: 3 },
            { text: "Volatility", weight: 4 },
            { text: "Thrilling opportunity", weight: 5 }
        ]
    },
    {
        id: 22,
        text: "Do you review your portfolio based on market news daily?",
        category: "Reaction",
        options: [
            { text: "Yes, I panic trade", weight: 1 }, // Note: High anxiety = Low Risk Tolerance usually, but action is high risk? 
            // Actually, panic selling is bad. Low weight = Low Risk Capacity/Tolerance. Correct.
            { text: "Yes, I worry", weight: 2 },
            { text: "Sometimes", weight: 3 },
            { text: "Rarely", weight: 4 },
            { text: "Never, I stick to plan", weight: 5 }
        ]
    },
    {
        id: 23,
        text: "What is your total debt servicing ratio (EMI / Income)?",
        category: "Financial Knowledge",
        options: [
            { text: "Over 60%", weight: 1 },
            { text: "40 - 60%", weight: 2 },
            { text: "30 - 40%", weight: 3 },
            { text: "10 - 30%", weight: 4 },
            { text: "0 - 10%", weight: 5 }
        ]
    },
    {
        id: 24,
        text: "Would you rather have:",
        category: "Goal",
        options: [
            { text: "Guaranteed $1,000", weight: 1 },
            { text: "50% chance of $2,500", weight: 2 }, // EV 1250
            { text: "20% chance of $7,500", weight: 3 }, // EV 1500
            { text: "10% chance of $20,000", weight: 4 }, // EV 2000
            { text: "5% chance of $100,000", weight: 5 } // EV 5000
        ]
    },
    {
        id: 25,
        text: "Scenario: You won a lottery of $100k. What do you do?",
        category: "Reaction",
        options: [
            { text: "Bank FD / Pay Debt", weight: 1 },
            { text: "Buy Gold / Real Estate", weight: 2 },
            { text: "Balanced Mutual Funds", weight: 3 },
            { text: "Equity Mutual Funds", weight: 4 },
            { text: "Stocks / Crypto", weight: 5 }
        ]
    }
];
