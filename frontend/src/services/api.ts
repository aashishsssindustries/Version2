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

        // Preserve the original error with response for status code checking
        return Promise.reject(error);
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
    // Email OTP methods
    sendEmailOTP: async () => {
        const response = await apiClient.post('/auth/email-otp/send');
        return response.data;
    },
    verifyEmailOTP: async (otp: string) => {
        const response = await apiClient.post('/auth/email-otp/verify', { otp });
        return response.data;
    },
    forgotPassword: async (email: string) => {
        const response = await apiClient.post('/auth/forgot-password', { email });
        return response.data;
    },
    resetPassword: async (token: string, newPassword: string) => {
        const response = await apiClient.post('/auth/reset-password', { token, newPassword });
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
    updateActionItemStatus: async (id: string, status: string) => {
        const response = await apiClient.put(`/profile/action-items/${id}/status`, { status });
        return response.data;
    },
    getScoreHistory: async (limit: number = 30) => {
        const response = await apiClient.get(`/profile/score-history?limit=${limit}`);
        return response.data;
    },
    getAuditLogs: async () => {
        const response = await apiClient.get('/profile/audit-logs');
        return response.data;
    },
};

export const userService = {
    getCurrentUser: async () => {
        const response = await apiClient.get('/user/me');
        return response.data;
    },
    updateProfile: async (data: { name?: string; mobile?: string }) => {
        const response = await apiClient.put('/user/profile', data);
        return response.data;
    },
    changePassword: async (currentPassword: string, newPassword: string) => {
        const response = await apiClient.put('/user/change-password', { currentPassword, newPassword });
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
    // Discovery APIs
    getCatalog: async (filters?: any) => {
        const response = await apiClient.get('/marketplace/catalog', { params: filters });
        return response.data.data; // data.data because Controller wraps in data
    },
    getProductDetail: async (id: string) => {
        const response = await apiClient.get(`/marketplace/catalog/${id}`);
        return response.data.data;
    },
    searchProducts: async (query: string) => {
        const response = await apiClient.get('/marketplace/search', { params: { q: query } });
        return response.data.data;
    },
    getCategories: async () => {
        const response = await apiClient.get('/marketplace/categories');
        return response.data.data;
    },
    getFilters: async () => {
        const response = await apiClient.get('/marketplace/filters');
        return response.data.data;
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

// ============================================
// Portfolio Service (Phase 2)
// ============================================
export const portfolioService = {
    getHoldings: async () => {
        const response = await apiClient.get('/portfolio/holdings');
        return response.data;
    },
    addManualHolding: async (isin: string, asset_type: string, quantity: number) => {
        const response = await apiClient.post('/portfolio/manual', { isin, asset_type, quantity });
        return response.data;
    },
    uploadCSV: async (csv: string) => {
        const response = await apiClient.post('/portfolio/upload-csv', { csv });
        return response.data;
    },
    uploadCAS: async (file: File, password?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        if (password) {
            formData.append('password', password);
        }
        const response = await apiClient.post('/portfolio/upload-cas', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    deleteHolding: async (holdingId: string) => {
        // Use axios directly to avoid the response interceptor unwrapping
        // Delete returns { success, message } not { success, data }
        const response = await apiClient.delete(`/portfolio/holdings/${holdingId}`);
        // The interceptor may have unwrapped, so check both scenarios
        return response.data ?? response;
    },
    getPortfolioAlignment: async () => {
        const response = await apiClient.get('/portfolio/alignment');
        return response.data;
    },
};
