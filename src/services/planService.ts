import { Plan, PlansResponse } from '../types/plan';
import { apiService } from './api';
import { endPoints } from './Endpoints';
import { revenueCatPlanService } from './revenueCatPlanService';

// Configuration: Set to true to use RevenueCat, false to use backend API
const USE_REVENUECAT_PLANS = true;

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
     * Fetch all available plans
     * Uses RevenueCat if enabled, otherwise falls back to backend API
     */
    getPlans: async (): Promise<Plan[]> => {
        try {
            if (USE_REVENUECAT_PLANS) {
                console.log('Fetching plans from RevenueCat...');
                const plans = await revenueCatPlanService.getPlans();

                if (plans.length > 0) {
                    console.log('Successfully fetched plans from RevenueCat:', plans.length);
                    return plans;
                }

                console.log('No plans from RevenueCat, falling back to API...');
            }

            // Fallback to backend API
            const response = await apiService<PlansResponse>(
                endPoints.getPlans,
                'GET'
            );
            return response.data.data;
        } catch (error) {
            console.error('Error fetching plans:', error);
            return [];
        }
    },

    /**
     * Fetch a specific plan by ID
     * Uses RevenueCat if enabled, otherwise falls back to backend API
     */
    getPlanById: async (planId: string): Promise<Plan | undefined> => {
        try {
            if (USE_REVENUECAT_PLANS) {
                return await revenueCatPlanService.getPlanById(planId);
            }

            // Fallback to backend API
            const response = await apiService<{ success: boolean; data: Plan }>(
                `${endPoints.getPlans}/${planId}`,
                'GET'
            );
            return response.data.data;
        } catch (error) {
            console.error('Error fetching plan by id:', error);
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