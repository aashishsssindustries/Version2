import { Product } from '../types/marketplace';

export const MARKETPLACE_PRODUCTS: Product[] = [
    // --- SIP / Mutual Funds ---
    {
        id: 'mf-bluechip',
        category: 'SIP',
        name: 'Bluechip Index Fund',
        description: 'Invest in the top 50 companies. Low volatility, steady long-term growth.',
        riskLevel: 'Low',
        minInvestment: 500,
        returns: '10-12% p.a.',
        tags: ['stable', 'long-term', 'equity'],
        suitablePersona: 'Conservative Investors'
    },
    {
        id: 'mf-midcap',
        category: 'SIP',
        name: 'Emerging Leaders Midcap Fund',
        description: 'High growth potential by investing in mid-sized future giants.',
        riskLevel: 'Moderate',
        minInvestment: 1000,
        returns: '14-16% p.a.',
        tags: ['growth', 'high-return', 'equity'],
        suitablePersona: 'Moderate Risk Takers'
    },
    {
        id: 'mf-smallcap',
        category: 'SIP',
        name: 'High Growth Smallcap Fund',
        description: 'Aggressive growth strategy focused on small cap companies.',
        riskLevel: 'High',
        minInvestment: 1000,
        returns: '18-22% p.a.',
        tags: ['aggressive', 'multi-bagger', 'equity'],
        suitablePersona: 'Aggressive Investors'
    },

    // --- Term Insurance ---
    {
        id: 'ins-term-basic',
        category: 'Term Insurance',
        name: 'Pure Life Term Plan',
        description: 'High life cover at affordable premiums. Essential for every breadwinner.',
        riskLevel: 'Low',
        minInvestment: 500, // Monthly premium approx
        returns: 'Life Cover',
        tags: ['safety', 'family-protection', 'tax-saving'],
        suitablePersona: 'Breadwinners & Families'
    },
    {
        id: 'ins-term-rop',
        category: 'Term Insurance',
        name: 'Term Plan with Return of Premium',
        description: 'Get life cover now and your premiums back at the end of the term.',
        riskLevel: 'Low',
        minInvestment: 1200,
        returns: 'Premium Back',
        tags: ['safety', 'money-back'],
        suitablePersona: 'Value Seekers'
    },

    // --- Tax Saving ---
    {
        id: 'tax-elss',
        category: 'Tax Saving',
        name: 'ELSS Tax Saver Fund',
        description: 'Save up to ₹46,800 in tax under 80C while building wealth.',
        riskLevel: 'Moderate',
        minInvestment: 500,
        returns: '12-15% p.a.',
        tags: ['tax-saving', '80c', 'equity'],
        suitablePersona: 'Salaried Professionals'
    },
    {
        id: 'tax-ppf',
        category: 'Tax Saving',
        name: 'Public Provident Fund (PPF)',
        description: 'Government-backed 15-year scheme with tax-free returns.',
        riskLevel: 'Low',
        minInvestment: 500,
        returns: '7.1% p.a.',
        tags: ['govt-backed', 'risk-free', '80c'],
        suitablePersona: 'Conservative Savers'
    },
    {
        id: 'tax-nps',
        category: 'Retirement', // Also Tax Saving
        name: 'National Pension System (NPS)',
        description: 'Save for retirement with additional tax benefits under 80CCD.',
        riskLevel: 'Moderate',
        minInvestment: 500,
        returns: '9-11% p.a.',
        tags: ['retirement', 'tax-saving', 'pension'],
        suitablePersona: 'Long-term Planners'
    },

    // --- Safe / Liquid ---
    {
        id: 'save-liquid',
        category: 'General',
        name: 'Smart Liquid Fund',
        description: 'Better returns than savings account. Withdraw anytime.',
        riskLevel: 'Low',
        minInvestment: 100,
        returns: '6-7% p.a.',
        tags: ['emergency-fund', 'short-term'],
        suitablePersona: 'Everyone'
    },
    {
        id: 'gold-bond',
        category: 'General',
        name: 'Sovereign Gold Bond (SGB)',
        description: 'Earn 2.5% interest + Gold price appreciation. No making charges.',
        riskLevel: 'Low',
        minInvestment: 5000, // Approx 1gm
        returns: 'Gold + 2.5%',
        tags: ['gold', 'govt-backed'],
        suitablePersona: 'Diversifiers'
    }
];
