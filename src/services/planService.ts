import { Plan, PlansResponse } from '../types/plan';
import { apiService } from './api';
import { endPoints } from './Endpoints';

// Types matching the actual discount code API response
type DiscountCode = {
    id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
};

type ValidateDiscountCodeResponse = {
    status: number;
    success: boolean;
    message: string;
    data?: {
        isValid: boolean;
        discountCode?: DiscountCode;
    };
};

export const planService = {
    /**
     * Fetch all available plans from the API
     */
    getPlans: async (): Promise<Plan[]> => {
        try {
            const response = await apiService<PlansResponse>(
                endPoints.getPlans,
                'GET'
            );
            return response.data.data;
        } catch (error) {
            console.error('Error fetching plans from API, using mock data:', error);
            return [];
        }
    },

    /**
     * Fetch a specific plan by ID
     */
    getPlanById: async (planId: string): Promise<Plan | undefined> => {
        try {
            const response = await apiService<{ success: boolean; data: Plan }>(
                `${endPoints.getPlans}/${planId}`,
                'GET'
            );
            return response.data.data;
        } catch (error) {
            console.error('Error fetching plan by id, using mock data:', error);
            return undefined;
        }
    },

    /**
     * Validate a discount code
     */
    validateDiscountCode: async (code: string): Promise<ValidateDiscountCodeResponse> => {
        try {
            const response = await apiService<ValidateDiscountCodeResponse>(
                `${endPoints.validateDiscountCode}`,
                'POST',
                { code }
            );
            return response.data;
        } catch (error) {
            console.error('Error validating discount code:', error);
            return { status: 500, success: false, message: 'Failed to validate discount code' };
        }
    },
};