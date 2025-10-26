import React, { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import { endPoints } from '../services/Endpoints';
import { dashboardService } from '../services/dashboardService';
import { CreateEventContext } from './CreateEventContextDef';
import type {
    CreateEventContextType,
    CreateEventStep1Data,
    CreateEventStep2Data,
    CreateEventStep3Data,
    CreateEventStep4Data,
    // CreateEventData,
    // EventData
} from '../types/createEvent';
import { showErrorToastWithSupport } from '../utils/HelperFunctions';
// import { data } from 'react-router-dom';

// Initial state
const initialStep1Data: CreateEventStep1Data = {
    name: '',
    type: '',
    date: '',
    timeZone: 'EST',
    startTime: '',
    endTime: '',
    overlay: '',
    overlayId: '',
    overlayName: '',
};

const initialStep2Data: CreateEventStep2Data = {
    plan: {
        planId: '',
        basePlan: 0,
        guestLimit: 0,
        guestLimitPrice: 0,
        photoPool: 0,
        photoPoolPrice: 0,
        photosPerGuest: 0,
        storageDays: 0,
        storageDaysPrice: 0,
        finalPrice: 0,
        permissions: {
            canViewGallery: false,
            canSharePhotos: false,
            canDownload: false
        }
    }
};

const initialStep3Data: CreateEventStep3Data = {
    brandColor: '#3DA9B7',
    fontFamily: 'inter',
    fontWeight: 'bold',
    fontSize: '12',
    eventPicture: '',
    eventPictureFile: undefined,
};

const initialStep4Data: CreateEventStep4Data = {
    discountPrice: 0,
    payment: {
        method: '',
        paymentIntentId: ''
    }
};

// Provider component
export const CreateEventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // State management using useState
    const [step1Data, setStep1Data] = useState<CreateEventStep1Data>(initialStep1Data);
    const [step2Data, setStep2Data] = useState<CreateEventStep2Data>(initialStep2Data);
    const [step3Data, setStep3Data] = useState<CreateEventStep3Data>(initialStep3Data);
    const [step4Data, setStep4Data] = useState<CreateEventStep4Data>(initialStep4Data);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);


    // Validation functions
    const isStep1Valid = useCallback(() => {
        const { name, type, date, timeZone, endTime, startTime } = step1Data;
        return name.trim().length >= 3 && type !== '' && date !== '' && timeZone !== '' && startTime !== '' && endTime !== '';
    }, [step1Data]);

    const isStep2Valid = useCallback(() => {
        const { plan } = step2Data;
        return (
            plan.planId !== '' &&
            plan.guestLimit > 0 &&
            plan.photoPool > 0 &&
            plan.photosPerGuest <= plan.photoPool
        );
    }, [step2Data]);

    const isStep3Valid = useCallback(() => {
        const { brandColor, fontFamily, fontWeight, fontSize } = step3Data;
        return brandColor !== '' && fontFamily !== '' && fontWeight !== '' && fontSize !== '';
    }, [step3Data]);

    const isStep4Valid = useCallback(() => {
        const { payment } = step4Data;
        // For now, only check if payment method is selected
        // In a real implementation, you'd validate the token after payment processing
        return payment.method !== '';
    }, [step4Data]);

    // Update functions
    const updateStep1Data = useCallback((data: Partial<CreateEventStep1Data>) => {
        setStep1Data(prev => ({ ...prev, ...data }));
    }, []);

    const updateStep2Data = useCallback((data: Partial<CreateEventStep2Data>) => {
        setStep2Data(prev => ({ ...prev, ...data }));
    }, []);

    const updateStep3Data = useCallback((data: Partial<CreateEventStep3Data>) => {
        setStep3Data(prev => ({ ...prev, ...data }));
    }, []);

    const updateStep4Data = useCallback((data: Partial<CreateEventStep4Data>) => {
        setStep4Data(prev => ({ ...prev, ...data }));
    }, []);

    // Create event API call with provided data
    const createEventWithData = useCallback(async (data: {
        step1Data: any;
        step2Data: any;
        step3Data: any;
        step4Data: any;
    }, paymentIntent?: any): Promise<{ success: boolean; eventId?: string; event?: { eventId: string } } | null> => {
        try {
            setIsLoading(true);
            setError(null);

            // Step 1: Basic validations
            if (!data.step1Data.name || !data.step1Data.name.trim()) {
                throw new Error('Please enter an event name');
            }
            if (!data.step1Data.type) {
                throw new Error('Please select an event type');
            }
            if (!data.step1Data.date) {
                throw new Error('Please select an event date');
            }

            // console.log('data.step1Data.overlay', data.step1Data.overlay);
            // console.log('event picture', data.step3Data.eventPictureFile);

            const finalPrice = data.step2Data.plan.finalPrice - data.step4Data.discountPrice;

            const formData = new FormData();

            const photosPerGuest = data.step2Data.plan.photosPerGuest > 0 ? data.step2Data.plan.photosPerGuest : null;

            formData.append('name', data.step1Data.name.trim());
            formData.append('type', data.step1Data.type);
            formData.append('eventDate', data.step1Data.date);
            formData.append('eventStartTime', data.step1Data.startTime || '');
            formData.append('eventEndTime', data.step1Data.endTime || '');
            formData.append('timeZone', data.step1Data.timeZone || 'America/New_York');
            formData.append('brandColor', data.step3Data.brandColor);
            formData.append('typography', data.step3Data.fontFamily);
            formData.append('fontStyle', data.step3Data.fontWeight);
            formData.append('fontSize', String(parseInt(data.step3Data.fontSize) || 16));
            formData.append('planId', data.step2Data.plan.planId);
            formData.append('customPlan', JSON.stringify({
                guestLimit: data.step2Data.plan.guestLimit,
                photoPool: data.step2Data.plan.photoPool,
                photosPerGuest: photosPerGuest,
                storageDays: data.step2Data.plan.storageDays,
                permissions: data.step2Data.plan.permissions
            }));
            formData.append('finalPrice', String(finalPrice));

            if (data.step4Data.payment) {
                formData.append('payment', JSON.stringify({
                    method: data.step4Data.payment.method,
                    paymentIntentId: data.step4Data.payment.paymentIntentId || paymentIntent?.id || ''
                }));
            }
            // Append overlay file
            if (data.step1Data.overlay !== null && data.step1Data.overlay !== '') {
                formData.append('overlay', data.step1Data.overlay);
            }

            if (data.step1Data.overlayName !== '') {
                formData.append('overlayName', data.step1Data.overlayName);
            }

            // Append event picture file if available
            if (data.step3Data.eventPictureFile) {
                formData.append('eventPicture', data.step3Data.eventPictureFile);
            }

            // Debug: log all FormData entries
            // console.log('FormData being sent:');
            // for (const [key, value] of formData.entries()) {
            //     console.log(key, JSON.stringify(value));
            // }

            const config = { headers: { 'Content-Type': 'multipart/form-data' } };
            // Step 5: Make API call
            // console.log('Making API call to create event...');
            const response = await apiService<{ success: boolean; eventId?: string; id?: string; event?: { eventId: string } }>(
                endPoints.createEvent,
                'POST',
                formData,
                config
            );

            // console.log('Create Event API response:', response?.data);

            if (response.data.success) {
                console.log('Event created successfully:', response.data);
                return response.data;
            } else {
                console.error('API error response:', response.data);
                throw new Error('Failed to create event');
            }
        } catch (error: unknown) {
            console.error('Error creating event:', error);

            if (error && typeof error === 'object' && 'response' in error) {
                const apiError = error as { response: { data?: any; status: number; statusText: string } };
                // Try to extract a message from the API error response
                let apiMessage = 'Failed to create event';
                if (apiError.response?.data) {
                    if (typeof apiError.response.data === 'string') {
                        apiMessage = apiError.response.data;
                    } else if (typeof apiError.response.data === 'object' && apiError.response.data !== null) {
                        // Try to find a message or error property
                        apiMessage =
                            apiError.response.data.message ||
                            apiError.response.data.error ||
                            JSON.stringify(apiError.response.data);
                    }
                }
                setError(apiMessage);
                showErrorToastWithSupport(apiMessage); // Show error in toast
            } else {
                const msg = error instanceof Error ? error.message : 'Failed to create event';
                setError(msg);
                showErrorToastWithSupport(msg); // Show error in toast
            }
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Create event API call
    const createEvent = useCallback(async (): Promise<{ success: boolean; eventId?: string } | null> => {
        try {
            setIsLoading(true);
            setError(null);

            // Step 1: Basic validations
            if (!step1Data.name || !step1Data.name.trim()) {
                throw new Error('Please enter an event name');
            }
            if (!step1Data.type) {
                throw new Error('Please select an event type');
            }
            if (!step1Data.date) {
                throw new Error('Please select an event date');
            }


            const finalPrice = step2Data.plan.finalPrice - step4Data.discountPrice;

            const formData = new FormData();

            const photosPerGuest = step2Data.plan.photosPerGuest > 0 ? step2Data.plan.photosPerGuest : null;

            formData.append('name', step1Data.name.trim());
            formData.append('type', step1Data.type);
            formData.append('eventDate', step1Data.date);
            formData.append('eventStartTime', step1Data.startTime || '');
            formData.append('eventEndTime', step1Data.endTime || '');
            formData.append('timeZone', step1Data.timeZone || 'America/New_York');
            formData.append('brandColor', step3Data.brandColor);
            formData.append('typography', step3Data.fontFamily);
            formData.append('fontStyle', step3Data.fontWeight);
            formData.append('fontSize', String(parseInt(step3Data.fontSize) || 16));
            formData.append('planId', step2Data.plan.planId);
            formData.append('customPlan', JSON.stringify({
                guestLimit: step2Data.plan.guestLimit,
                photoPool: step2Data.plan.photoPool,
                photosPerGuest: photosPerGuest,
                storageDays: step2Data.plan.storageDays,
                permissions: step2Data.plan.permissions
            }));
            formData.append('finalPrice', String(finalPrice));

            if (step4Data.payment && step4Data.payment.paymentIntentId) {
                formData.append('payment', JSON.stringify({
                    ...step4Data.payment,
                }));
            }
            // Append overlay file
            if (step1Data.overlay !== '' && step1Data.overlayId !== '') {
                formData.append('overlay', step1Data.overlayId);
            } else if (step1Data.overlay !== '' && step1Data.overlayId === '') {
                formData.append('overlay', step1Data.overlay);
            }

            if (step1Data.overlayName !== '') {
                formData.append('overlayName', step1Data.overlayName);
            }

            // Append event picture file if available
            if (step3Data.eventPictureFile) {
                formData.append('eventPicture', step3Data.eventPictureFile);
            }

            // Debug: log all FormData entries
            // Log FormData keys and values in a way compatible with React Native's FormData (which may not support entries())
            console.log('FormData being sent:=>>>>>>>>>>>>>>>>>');
            // NOTE: This will only work in environments with FormData.getParts or if a polyfill is used
            if (typeof (formData as any)._parts !== 'undefined') {
                (formData as any)._parts.forEach((part: any) => {
                    console.log(part[0], part[1]);
                });
            } else {
                console.log('formData structure not inspectable in this environment');
            }

            const config = { headers: { 'Content-Type': 'multipart/form-data' } };
            // Step 5: Make API call
            // console.log('Making API call to create event...');
            const response = await apiService<{ success: boolean; eventId?: string; id?: string; event?: { eventId: string } }>(
                endPoints.createEvent,
                'POST',
                formData,
                config
            );

            // console.log('Create Event API response:', response?.data);

            if (response.data.success) {
                console.log('Event created successfully:', response.data);
                return response.data;
            } else {
                console.error('API error response:', response.data);
                throw new Error('Failed to create event');
            }
        } catch (error: unknown) {
            console.error('Error creating event:', error);

            if (error && typeof error === 'object' && 'response' in error) {
                const apiError = error as { response: { data?: any; status: number; statusText: string } };
                // Try to extract a message from the API error response
                let apiMessage = 'Failed to create event';
                if (apiError.response?.data) {
                    if (typeof apiError.response.data === 'string') {
                        apiMessage = apiError.response.data;
                    } else if (typeof apiError.response.data === 'object' && apiError.response.data !== null) {
                        // Try to find a message or error property
                        apiMessage =
                            apiError.response.data.message ||
                            apiError.response.data.error ||
                            JSON.stringify(apiError.response.data);
                    }
                }
                setError(apiMessage);
                showErrorToastWithSupport(apiMessage); // Show error in toast
            } else {
                const msg = error instanceof Error ? error.message : 'Failed to create event';
                setError(msg);
                showErrorToastWithSupport(msg); // Show error in toast
            }
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [step1Data, step2Data, step3Data, step4Data]);


    // Load event data for editing
    const loadEventForEdit = useCallback(async (eventId: string) => {
        try {
            setIsLoading(true);
            setError(null);
            const eventData = await dashboardService.getEventById(eventId) as any;

            // Helper function to safely parse date
            const parseDate = (dateValue: string | { _seconds: number; _nanoseconds: number } | null | undefined): string => {
                if (!dateValue) return '';

                // Handle Firestore timestamp object
                if (dateValue && typeof dateValue === 'object' && '_seconds' in dateValue) {
                    console.log('Firestore timestamp detected:', dateValue);
                    try {
                        // Convert Firestore timestamp to JavaScript Date
                        const date = new Date(dateValue._seconds * 1000);
                        console.log('Converted Firestore timestamp to date:', date);
                        if (isNaN(date.getTime())) {
                            console.warn('Invalid Firestore timestamp:', dateValue);
                            return '';
                        }
                        const formattedDate = date.toISOString().split('T')[0];
                        console.log('Formatted Firestore date:', formattedDate);
                        return formattedDate;
                    } catch (error) {
                        console.warn('Error parsing Firestore timestamp:', dateValue, error);
                        return '';
                    }
                }

                // If it's already in YYYY-MM-DD format, return as is
                if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                    console.log('Date already in correct format:', dateValue);
                    return dateValue;
                }

                try {
                    const date = new Date(dateValue as string);
                    console.log('Parsed date object:', date);
                    // Check if the date is valid
                    if (isNaN(date.getTime())) {
                        console.warn('Invalid date received:', dateValue);
                        return '';
                    }
                    // Return date in YYYY-MM-DD format
                    const formattedDate = date.toISOString().split('T')[0];
                    console.log('Formatted date:', formattedDate);
                    return formattedDate;
                } catch (error) {
                    console.warn('Error parsing date:', dateValue, error);
                    return '';
                }
            };

            // Populate step 1 data
            updateStep1Data({
                name: eventData.name || '',
                type: eventData.type || '',
                date: parseDate(eventData.eventDate),
                timeZone: eventData.timeZone || 'EST',
                startTime: eventData?.eventStartTime || '',
                endTime: eventData?.eventEndTime || '',
                overlay: eventData?.overlayUrl || '',
                overlayId: eventData?.overlayId || '',
                overlayName: eventData?.overlayName || ''
            });

            // Populate step 2 data
            if (eventData) {
                updateStep2Data({
                    plan: {
                        planId: eventData.planId,
                        guestLimit: eventData?.customPlan?.guestLimit,
                        photoPool: eventData?.customPlan?.photoPool,
                        photosPerGuest: eventData?.customPlan?.photosPerGuest,
                        storageDays: eventData?.customPlan?.storageDays,
                        finalPrice: eventData?.finalPrice,
                        permissions: {
                            canViewGallery: eventData.customPlan?.permissions?.canViewGallery ?? true,
                            canSharePhotos: eventData.customPlan?.permissions?.canSharePhotos ?? false,
                            canDownload: eventData.customPlan?.permissions?.canDownload ?? false
                        }
                    }
                });
            }

            // Populate step 3 data
            if (eventData) {
                updateStep3Data({
                    brandColor: eventData?.brandColor || '#3DA9B7',
                    fontFamily: eventData?.fontFamily || 'inter',
                    fontWeight: (eventData.fontStyle || 'bold').toLowerCase(),
                    fontSize: eventData?.fontSize || '12',
                    eventPicture: eventData?.eventPictureUrl || null
                });
            }

            // Populate step 4 data (payment info might not be available for editing)
            // updateStep4Data({
            //     payment: {
            //         method: 'card',
            //         paymentIntentId: '' // Default token for editing
            //     }
            // });

        } catch (error: unknown) {
            console.error('Error loading event for edit:', error);
            const msg = error instanceof Error ? error.message : 'Failed to load event data';
            setError(msg);
            showErrorToastWithSupport(msg); // Show error in toast
        } finally {
            setIsLoading(false);
        }
    }, [updateStep1Data, updateStep2Data, updateStep3Data, updateStep4Data]);

    // Update event API call
    const updateEvent = useCallback(async (eventId: string) => {
        console.log('updateEvent function called!');
        try {
            setIsLoading(true);
            setError(null);

            // Validate required fields before making API call
            if (!step1Data.name || !step1Data.type || !step1Data.date) {
                throw new Error('Please fill in all required fields (name, type, date)');
            }

            const photosPerGuest = step2Data.plan.photosPerGuest > 0 ? step2Data.plan.photosPerGuest : null;

            const eventData = new FormData();
            eventData.append('name', step1Data.name.trim());
            eventData.append('type', step1Data.type);
            eventData.append('eventDate', step1Data.date);
            eventData.append('eventStartTime', step1Data.startTime || '');
            eventData.append('eventEndTime', step1Data.endTime || '');
            eventData.append('timeZone', step1Data.timeZone || 'America/New_York');
            eventData.append('customPlan', JSON.stringify({
                guestLimit: step2Data.plan.guestLimit,
                photoPool: step2Data.plan.photoPool,
                photosPerGuest: photosPerGuest,
                storageDays: step2Data.plan.storageDays,
                permissions: step2Data.plan.permissions
            }));
            eventData.append('brandColor', step3Data.brandColor);
            eventData.append('typography', step3Data.fontFamily);
            eventData.append('fontStyle', step3Data.fontWeight);
            eventData.append('fontSize', String(parseInt(step3Data.fontSize) || 16));

            // Handle overlay: could be a file or an id/string
            if (step1Data.overlay !== '' && step1Data.overlayId !== '') {
                eventData.append('overlay', step1Data.overlayId);
            } else if (step1Data.overlay !== '' && step1Data.overlayId === '') {
                eventData.append('overlay', step1Data.overlay);
            }
            if (step1Data.overlayName !== '') {
                eventData.append('overlayName', step1Data.overlayName);
            }

            if (step3Data.eventPictureFile) {
                eventData.append('eventPicture', step3Data.eventPictureFile);
            }
            // console.log('event pic edit =>>>>>>>', step3Data.eventPictureFile)
            // console.log('edit api data =>>>>>>>>>');
            // for (const [key, value] of eventData.entries()) {
            //     console.log(`${key}:`, value);
            // }

            // Make API call
            const response = await dashboardService.updateEvent(eventId, eventData) as { success: boolean };

            // console.log('Update API res=?????>>>>>>>>:', response);

            if (response.success) {
                // Event updated successfully
                console.log('Event updated successfully:', response);
                // You can navigate to success page or handle success here
            } else {
                throw new Error('Failed to update event');
            }
        } catch (error: unknown) {
            console.error('Error updating event:', error);

            // Log the actual API error response
            if (error && typeof error === 'object' && 'response' in error) {
                const apiError = error as { response: { data?: any; status: number; statusText: string } };
                const apiMessage =
                    apiError.response?.data?.message ||
                    apiError.response?.data?.error ||
                    apiError.response?.statusText ||
                    'An error occurred while updating the event. Please try again.';
                setError(apiMessage);
                showErrorToastWithSupport(apiMessage);
            } else {
                const msg = error instanceof Error ? error.message : 'Failed to update event';
                setError(msg);
                showErrorToastWithSupport(msg);
            }
        } finally {
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step1Data, step2Data, step3Data, step4Data]);

    // Upgrade event API call with provided data
    const upgradeEventWithData = useCallback(async (eventId: string, data: {
        step2Data: any;
        step4Data: any;
    }, paymentIntent?: any): Promise<{ success: boolean } | null> => {
        try {
            setIsLoading(true);
            setError(null);

            // Prepare the data in the required format
            const eventData: any = {
                planId: data.step2Data.plan.planId,
                customPlan: {
                    guestLimit: data.step2Data.plan.guestLimit,
                    photoPool: data.step2Data.plan.photoPool,
                    photosPerGuest: data.step2Data.plan.photosPerGuest,
                    storageDays: data.step2Data.plan.storageDays,
                    permissions: {
                        canViewGallery: data.step2Data.plan.permissions.canViewGallery,
                        canSharePhotos: data.step2Data.plan.permissions.canSharePhotos,
                        canDownload: data.step2Data.plan.permissions.canDownload,
                    }
                },
                finalPrice: data.step2Data.plan.finalPrice,
                payment: {
                    paymentIntentId: data.step4Data.payment.paymentIntentId || paymentIntent?.id || ''
                }
            };

            console.log('Upgrade event with data:', eventData);

            // Make API call
            const response = await dashboardService.upgradeEvent(eventId, eventData) as { success: boolean };
            if (response.success) {
                return response;
            } else {
                throw new Error('Failed to upgrade event');
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Failed to upgrade event';
            setError(msg);
            showErrorToastWithSupport(msg);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Upgrade event API call
    const upgradeEvent = useCallback(async (eventId: string): Promise<{ success: boolean } | null> => {
        try {
            setIsLoading(true);
            setError(null);

            // Prepare the data in the required format
            const eventData: any = {
                planId: step2Data.plan.planId,
                customPlan: {
                    guestLimit: step2Data.plan.guestLimit,
                    photoPool: step2Data.plan.photoPool,
                    photosPerGuest: step2Data.plan.photosPerGuest,
                    storageDays: step2Data.plan.storageDays,
                    permissions: {
                        canViewGallery: step2Data.plan.permissions.canViewGallery,
                        canSharePhotos: step2Data.plan.permissions.canSharePhotos,
                        canDownload: step2Data.plan.permissions.canDownload,
                    }
                },
                finalPrice: step2Data.plan.finalPrice,
                payment: {
                    paymentIntentId: step4Data.payment.paymentIntentId
                }

            };

            // console.log('udgrade event from context =>>>>>>>>', eventData)

            // Make API call
            const response = await dashboardService.upgradeEvent(eventId, eventData) as { success: boolean };
            if (response.success) {
                return response;
            } else {
                throw new Error('Failed to upgrade event');
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Failed to upgrade event';
            setError(msg);
            showErrorToastWithSupport(msg);
            return null;
        } finally {
            setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step1Data, step2Data, step4Data]);

    // Reset function
    const resetEventData = useCallback(() => {
        setStep1Data(initialStep1Data);
        setStep2Data(initialStep2Data);
        setStep3Data(initialStep3Data);
        setStep4Data(initialStep4Data);
        setIsLoading(false);
        setError(null);

    }, []);

    const contextValue: CreateEventContextType = {
        step1Data,
        step2Data,
        step3Data,
        step4Data,
        updateStep1Data,
        updateStep2Data,
        updateStep3Data,
        updateStep4Data,
        isStep1Valid: isStep1Valid(),
        isStep2Valid: isStep2Valid(),
        isStep3Valid: isStep3Valid(),
        isStep4Valid: isStep4Valid(),
        createEvent,
        createEventWithData,
        loadEventForEdit,
        updateEvent,
        upgradeEvent,
        upgradeEventWithData,
        isLoading,
        error,
        resetEventData
    };

    return (
        <CreateEventContext.Provider value={contextValue}>
            {children}
        </CreateEventContext.Provider>
    );
}; 