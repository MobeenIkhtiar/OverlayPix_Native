import { adminApiService, apiService } from './api';
import { endPoints } from './Endpoints';

export interface OverlayData {
    id: string;
    name: string;
    category: string;
    url: string;
    fileName: string;
    createdAt: {
        _seconds: number;
        _nanoseconds: number;
    };
    updatedAt: {
        _seconds: number;
        _nanoseconds: number;
    };
}

export interface OverlaysResponse {
    success: boolean;
    data: OverlayData[];
}


export const overlayService = {
    /**
     * Fetch all available overlays from the API
     */
    getAllOverlays: async (): Promise<OverlayData[]> => {
        try {
            const response = await apiService<OverlayData[]>(
                endPoints.getAllOverlays,
                'GET'
            );
            // console.log('Overlays data:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching overlays:', error);
            throw error;
        }
    },

}; 