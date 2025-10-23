import { showErrorToastWithSupport } from '../utils/HelperFunctions';
import { apiService } from './api';
export interface GalleryImage {
    id: string;
    eventId: string;
    guestId: string;
    guestName: string;
    photoUrl: string;
    overlayId: string | null;
    isAnonymous: boolean;
    likes: string[];
    likeCount: number;
    createdAt: {
        _seconds: number;
        _nanoseconds: number;
    };
    updatedAt: {
        _seconds: number;
        _nanoseconds: number;
    };
    eventShareCode: string;
    eventName: string;
}

export interface GetGalleryImagesResponse {
    images?: GalleryImage[];
    eventInfo?: any;
    photos?: any[];
}

export interface UploadPhotoResponse {
    id: string;
    eventId: string;
    guestId: string;
    guestName: string;
    photoUrl: string;
    overlayId: string | null;
    isAnonymous: boolean;
    likes: string[];
    likeCount: number;
    createdAt: {
        _seconds: number;
        _nanoseconds: number;
    };
    updatedAt: {
        _seconds: number;
        _nanoseconds: number;
    };
    eventShareCode: string;
    eventName: string;
}

export const guestServices = {
    /**
     * Upload a photo for a guest/event.
     * @param eventId 
     * @param formData 
     * @returns
     */
    uploadPhoto: async (
        eventId: string,
        formData: FormData,
        navigate: any
    ): Promise<UploadPhotoResponse> => {
        if (!eventId || !formData) {
            throw new Error('event ID and photo data are required');
        }

        console.log('upload photo from data =>>>>>>>>>>>>>.',eventId,formData)

        try {
            const response = await apiService<UploadPhotoResponse>(
                `/guests/${eventId}/photos`,
                'POST',
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            return response.data;
        } catch (error: unknown) {
            console.error('Error uploading photo:', error);

            // Try to extract the most specific error message from the Axios error structure
            let errorMsg = 'Failed to upload photo. Please try again.';
            if (
                error &&
                typeof error === 'object' &&
                (error as any).response &&
                (error as any).response.data
            ) {
                const errData = (error as any).response.data;
                errorMsg =
                    errData.error ||
                    errData.message ||
                    (error as any).response.statusText ||
                    (error as any).message ||
                    'Unknown error';
            } else if (error instanceof Error && error.message) {
                errorMsg = error.message;
            }
            // Show error toast with support
            if (typeof showErrorToastWithSupport === 'function') {
                showErrorToastWithSupport(errorMsg);
                if (typeof navigate === 'function') {
                    navigate(-1);
                }
            }
            throw new Error(errorMsg);
        }
    },

    /**
     * Get gallery images for a specific event.
     * @param eventId - The event ID
     * @returns Promise with gallery images
     */
    getGuestsImages: async (
        eventId: string,
        endPoint: string
    ): Promise<GetGalleryImagesResponse> => {
        if (!eventId) {
            throw new Error('event ID is required');
        }
        console.log('user gallery  event id=>>>>>>', eventId, '=>>>>>>>>>>>>',);
        try {
            const response = await apiService<GetGalleryImagesResponse>(
                `/guests/${eventId}/${endPoint}`,
                'GET'
            );
            return response.data;
        } catch (error: unknown) {
            console.error('Error fetching gallery images:', error);
            let errorMsg = 'Failed to fetch gallery images. Please try again.';
            if (
                typeof error === 'object' &&
                error !== null &&
                'response' in error &&
                (error as { response?: { data?: { error?: string }, statusText?: string } }).response?.data
            ) {
                const errObj = error as { response?: { data?: { error?: string }, statusText?: string } };
                errorMsg = `Failed to fetch gallery images: ${errObj.response?.data?.error || errObj.response?.statusText || 'Unknown error'}`;
            } else if (error instanceof Error) {
                errorMsg = `Failed to fetch gallery images: ${error.message}`;
            }
            throw new Error(errorMsg);
        }
    },

    /**
     * Get all images for a specific guest in an event (used for viewImageScreen).
     * @param eventId - The event ID
     * @param guestId - The guest ID
     * @returns Promise with all images and event info
     */
    getImageById: async (
        eventId: string,
        guestId: string,
    ): Promise<GetGalleryImagesResponse> => {
        if (!eventId) {
            throw new Error('event ID is required');
        }

        try {
            const response = await apiService<any>(
                `/guests/${eventId}/all-photos/${guestId}`,
                'GET'
            );
            // The backend returns { eventInfo, photos }, not { images }
            // So we return as-is for compatibility with viewImageScreen
            return response.data;
        } catch (error: unknown) {
            console.error('Error fetching a images:', error);
            let errorMsg = 'Failed to fetch gallery images. Please try again.';
            if (
                typeof error === 'object' &&
                error !== null &&
                'response' in error &&
                (error as { response?: { data?: { error?: string }, statusText?: string } }).response?.data
            ) {
                const errObj = error as { response?: { data?: { error?: string }, statusText?: string } };
                errorMsg = `Failed to fetch gallery images: ${errObj.response?.data?.error || errObj.response?.statusText || 'Unknown error'}`;
            } else if (error instanceof Error) {
                errorMsg = `Failed to fetch gallery images: ${error.message}`;
            }
            throw new Error(errorMsg);
        }
    }
};