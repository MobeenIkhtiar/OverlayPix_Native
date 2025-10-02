import { apiService } from './api';
import { endPoints } from './Endpoints';
import { DashboardData } from '../types/dashboard';
import { CreateEventData } from '../types/createEvent';

export const dashboardService = {
    /**
     * Fetch dashboard data including stats and events
     */
    getDashboardData: async (endPoint: string): Promise<DashboardData> => {
        try {
            const response = await apiService<DashboardData>(
                endPoint,
                'GET'
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            throw error;
        }
    },

    /**
     * Fetch event details by ID for editing
     */
    getEventById: async (eventId: string) => {
        try {
            console.log('Making API call to:', `${endPoints.getEvent}/${eventId}`);
            const response = await apiService(
                `${endPoints.getEvent}/${eventId}`,
                'GET'
            );
            console.log('Event data=>>>>>>>>>', response.data);
            return response.data;
        } catch (error: unknown) {
            console.error('Error fetching event details:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorResponse = (error as { response?: { status?: number; data?: unknown } })?.response;
            console.error('Error details:', {
                message: errorMessage,
                status: errorResponse?.status,
                data: errorResponse?.data
            });
            throw error;
        }
    },

    /**
     * Update existing event
     */
    updateEvent: async (eventId: string, eventData: any) => {
        try {
            const config = { headers: { 'Content-Type': 'multipart/form-data' } };
            const response = await apiService(
                `${endPoints.updateEvent}/${eventId}`,
                'PATCH',
                eventData,
                config
            );
            return response.data;
        } catch (error) {
            console.error('Error updating event:', error);
            throw error;
        }
    },

    /**
     * Upgrade event plan
     */
    upgradeEvent: async (eventId: string, upgradeData: Partial<CreateEventData>) => {
        try {
            const response = await apiService(
                `${endPoints.upgradeEvent}/${eventId}/upgrade`,
                'PATCH',
                upgradeData
            );
            return response.data;
        } catch (error) {
            console.error('Error upgrading event:', error);
            throw error;
        }
    },
    /**
     * get event photos
     */
    getEventPhotos: async (eventId: string,) => {
        try {
            const response = await apiService(
                `${endPoints.getEvent}/${eventId}/photos`,
                'GET',
            );
            return response.data;
        } catch (error) {
            console.error('Error upgrading event:', error);
            throw error;
        }
    }
}; 