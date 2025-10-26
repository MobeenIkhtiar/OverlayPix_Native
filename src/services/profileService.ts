import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';
import { endPoints } from './Endpoints';

export interface UserProfile {
    uid?: string;
    email?: string;
    fullName?: string;
    profilePicture?: string;
    profilePictureUrl?: string;
    createdAt?: string;
    provider?: string;
    phoneNumber?: string;
    location?: string;
    timeZone?: string;
    // Add other profile fields as needed
}

export const profileService = {
    /**
     * Get user profile data from the API
     * Gets the uid from AsyncStorage and passes it as a query param
     */
    getUserProfile: async (): Promise<UserProfile> => {
        try {
            const uid = await AsyncStorage.getItem('uid');
            console.log('Fetching user profile, uid from AsyncStorage:', uid);
            if (!uid) {
                throw new Error('User ID (uid) not found in AsyncStorage');
            }
            const response = await apiService<UserProfile>(
                `${endPoints.profile}/${encodeURIComponent(uid)}`,
                'GET',
                undefined,
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    },

    /**
     * Update user profile data
     * Gets the uid from AsyncStorage and passes it in the request body and endpoint
     */
    updateUserProfile: async (profileData: Partial<UserProfile>): Promise<UserProfile> => {
        try {
            const uid = await AsyncStorage.getItem('uid');
            if (!uid) {
                throw new Error('User ID (uid) not found in AsyncStorage');
            }

            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            };
            const response = await apiService<UserProfile>(
                `${endPoints.profile}/${encodeURIComponent(uid)}`,
                'PUT',
                profileData,
                config
            );
            return response.data;
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    },

    /**
     * Delete user profile
     * Gets the uid from AsyncStorage and passes it in the request body
     */
    deleteUserProfile: async (): Promise<{ message: string }> => {
        try {
            const uid = await AsyncStorage.getItem('uid');
            console.log('Deleting user profile, uid from AsyncStorage:', uid);
            if (!uid) {
                throw new Error('User ID (uid) not found in AsyncStorage');
            }

            const response = await apiService<{ message: string }>(
                `${endPoints.deleteUser}`,
                'POST',
                { uid }
            );
            return response.data;
        } catch (error) {
            console.error('Error deleting user profile:', error);
            throw error;
        }
    }
};