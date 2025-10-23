// import { v4 as uuidv4 } from 'uuid';
import { apiService } from './api';
import { loginAnonymously } from './loginService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TermsAcceptanceData, TermsCheckResponse } from '../types/terms';

export const termsService = {
    /**
     * Accept terms and conditions for a guest
     * @param shareId - The share ID from the event
     * @returns Promise with acceptance data
     */
    acceptTerms: async (shareId: string, isGuest: boolean): Promise<TermsAcceptanceData & { acceptanceId: string }> => {
        if (!shareId || shareId.trim() === '') {
            throw new Error('Share ID is required');
        }

        try {
            let userId: any;
            if (!isGuest) {
                const anonRes = await loginAnonymously();
                if (!anonRes || !anonRes.user.uid) {
                    throw new Error('Anonymous sign-in failed or did not return a uid.');
                }
                await AsyncStorage.setItem('token', anonRes.token);
                await AsyncStorage.setItem('isAnonymous', 'true');
                userId = anonRes.user.uid
                // console.log('anon Token=>>>>>>>>.', anonRes.token);
            } else {
                const uid = await AsyncStorage.getItem('uid');
                userId = uid
            }

            // Use anonRes.uid as the acceptanceId
            const response = await apiService(`guests/share/${shareId}/consent`, 'POST', { guestId: userId });

            return {
                ...(response.data as TermsAcceptanceData),
                acceptanceId: userId
            };
        } catch (error) {
            console.error('Error accepting terms:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to accept terms: ${error.message}`);
            }
            throw new Error('Failed to accept terms. Please try again.');
        }
    },

    /**
     * Check if terms have been accepted for a share ID
     * @param shareId - The share ID to check
     * @returns Promise with acceptance status
     */
    checkTermsAcceptance: async (shareId: string): Promise<TermsCheckResponse> => {
        if (!shareId || shareId.trim() === '') {
            throw new Error('Share ID is required');
        }

        try {
            const response = await apiService(`/guests/check-terms/${shareId.trim()}`, 'GET');
            return response.data as TermsCheckResponse;
        } catch (error) {
            console.error('Error checking terms acceptance:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to check terms acceptance: ${error.message}`);
            }
            throw new Error('Failed to check terms acceptance. Please try again.');
        }
    },

    /**
     * Generate a unique acceptance ID
     * @returns A new UUID string
     */
    // generateAcceptanceId: (): string => {
    //     return uuidv4();
    // },

    /**
     * Check if terms were previously accepted (local storage check)
     * @param shareId - The share ID to check
     * @returns boolean indicating if terms were previously accepted
     */
    checkLocalTermsAcceptance: async (shareId: string): Promise<boolean> => {
        if (!shareId) return false;
        const value = await AsyncStorage.getItem(`terms_accepted_${shareId}`);
        return value === 'true';
    },

    /**
     * Clear local terms acceptance for a share ID
     * @param shareId - The share ID to clear
     */
    clearLocalTermsAcceptance: async (shareId: string): Promise<void> => {
        if (shareId) {
            await AsyncStorage.removeItem(`terms_accepted_${shareId}`);
        }
    }
}; 