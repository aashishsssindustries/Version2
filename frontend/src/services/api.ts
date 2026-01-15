import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => {
        if (response.data && response.data.success) {
            return { ...response, data: response.data.data };
        }
        return response;
    },
    (error) => {
        // Handle authentication errors
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }

        // Return structured error with message
        const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
        return Promise.reject(new Error(errorMessage));
    }
);

export default apiClient;

export const authService = {
    signup: async (name: string, email: string, password: string, mobile: string) => {
        const response = await apiClient.post('/auth/register', { name, email, password, mobile });
        return response.data;
    },
    login: async (email: string, password: string) => {
        const response = await apiClient.post('/auth/login', { email, password });
        return response.data;
    },
    requestOTP: async (mobile: string) => {
        const response = await apiClient.post('/auth/otp/request', { mobile });
        return response.data;
    },
    loginWithOTP: async (mobile: string, otp: string) => {
        const response = await apiClient.post('/auth/otp/verify', { mobile, otp });
        return response.data;
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
};

export const profileService = {
    getProfile: async () => {
        const response = await apiClient.get('/profile');
        return response.data;
    },
    updateProfile: async (data: any) => {
        const response = await apiClient.post('/profile/update', data);
        return response.data;
    },
    getNextBestAction: async () => {
        const response = await apiClient.get('/profile/next-best-action');
        return response.data;
    },
};

export const surveyService = {
    getQuestions: async () => {
        const response = await apiClient.get('/survey/questions');
        return response.data;
    },
    submitSurvey: async (answers: any) => {
        const response = await apiClient.post('/survey/submit', { responses: answers });
        return response.data;
    },
};

export const marketplaceService = {
    getRecommendations: async () => {
        const response = await apiClient.get('/marketplace/recommendations');
        return response.data;
    },
};

// ============================================
// Calculator Services (Expanded)
// ============================================
export interface SIPCalculatorInput {
    monthlyInvestment: number;
    rate: number;
    years: number;
}
export interface EMICalculatorInput {
    loanAmount: number;
    interestRate: number;
    tenureYears: number;
}
export interface RetirementCalculatorInput {
    currentAge: number;
    retirementAge: number;
    monthlyExpenses: number;
    inflationRate: number;
    existingSavings: number;
    expectedReturn: number;
    postRetirementReturn?: number;
}
// New Interfaces
export interface LifeInsuranceInput {
    income: number;
    age: number;
    retirementAge: number;
    liabilities: number;
    assets: number;
    dependents: number;
}
export interface EducationInput {
    childAge: number;
    goalYear: number;
    currentCost: number;
    inflation: number;
    currentSavings: number;
    returnRate: number;
}
export interface CostOfDelayInput {
    sipAmount: number;
    returnRate: number;
    delayYears: number;
    totalYears: number;
}
export interface HRAInput {
    basic: number;
    da: number;
    rentPaid: number;
    isMetro: boolean;
}
export interface HomeAffordabilityInput {
    monthlyIncome: number;
    existingEMI: number;
    interestRate: number;
    tenureYears: number;
}
export interface CAGRInput {
    startValue: number;
    endValue: number;
    years: number;
}


export const calculatorService = {
    calculateSIP: async (input: SIPCalculatorInput) => (await apiClient.post('/calculators/sip', input)).data,
    calculateEMI: async (input: EMICalculatorInput) => (await apiClient.post('/calculators/emi', input)).data,
    calculateRetirement: async (input: RetirementCalculatorInput) => (await apiClient.post('/calculators/retirement', input)).data,

    // New Methods
    calculateLifeInsurance: async (input: LifeInsuranceInput) => (await apiClient.post('/calculators/life-insurance', input)).data,
    calculateEducation: async (input: EducationInput) => (await apiClient.post('/calculators/education', input)).data,
    calculateCostOfDelay: async (input: CostOfDelayInput) => (await apiClient.post('/calculators/cost-of-delay', input)).data,
    calculateHRA: async (input: HRAInput) => (await apiClient.post('/calculators/hra', input)).data,
    calculateHomeAffordability: async (input: HomeAffordabilityInput) => (await apiClient.post('/calculators/home-affordability', input)).data,
    calculateCAGR: async (input: CAGRInput) => (await apiClient.post('/calculators/cagr', input)).data,
};
