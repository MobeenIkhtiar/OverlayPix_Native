import { useContext } from 'react';
import { CreateEventContext } from '../contexts/CreateEventContextDef';
import type { CreateEventContextType } from '../types/createEvent';

// Helper function to convert base64 to File object
const base64ToFile = (base64String: string, fileName: string, mimeType: string): File => {
    const byteCharacters = atob(base64String.split(',')[1] || base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new File([byteArray], fileName, { type: mimeType });
};

// Helper function to convert File object to base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

// Interface for data that can be stored in localStorage (with base64 strings instead of File objects)
interface StorageData {
    step1Data?: {
        name?: string;
        type?: string;
        date?: string;
        timeZone?: string;
        startTime?: string;
        endTime?: string;
        overlay?: string | File; // Can be base64 string or File
        overlayName?: string;
        overlayId?: string;
    };
    step2Data?: CreateEventContextType['step2Data'];
    step3Data?: {
        brandColor?: string;
        fontFamily?: string;
        fontWeight?: string;
        fontSize?: string;
        eventPicture?: string | null;
        eventPictureFile?: string | File; // Can be base64 string or File
        overlayTemplate?: string | File; // Can be base64 string or File
    };
    step4Data?: CreateEventContextType['step4Data'];
    isUpgradeMode?: boolean;
    eventId?: string;
}

// Custom hook to use the context
export const useCreateEvent = () => {
    const context = useContext(CreateEventContext);
    if (!context) {
        throw new Error('useCreateEvent must be used within a CreateEventProvider');
    }

    // Add a function to restore data from localStorage
    const restoreEventDataFromStorage = async () => {
        const storedData = localStorage.getItem('pendingEventData');
        if (storedData) {
            try {
                const parsedData = JSON.parse(storedData);
                console.log('Restoring event data from storage:', parsedData);

                // Convert base64 strings back to File objects if they exist
                if (parsedData.step1Data?.overlay && typeof parsedData.step1Data.overlay === 'string' && parsedData.step1Data.overlay.startsWith('data:')) {
                    try {
                        const overlayFile = base64ToFile(parsedData.step1Data.overlay, parsedData.step1Data.overlayName || 'overlay.svg', 'image/svg+xml');
                        parsedData.step1Data.overlay = overlayFile;
                    } catch (error) {
                        console.warn('Failed to restore overlay file:', error);
                    }
                }

                if (parsedData.step3Data?.eventPictureFile && typeof parsedData.step3Data.eventPictureFile === 'string' && parsedData.step3Data.eventPictureFile.startsWith('data:')) {
                    try {
                        const eventPictureFile = base64ToFile(parsedData.step3Data.eventPictureFile, 'event-picture.jpg', 'image/jpeg');
                        parsedData.step3Data.eventPictureFile = eventPictureFile;
                    } catch (error) {
                        console.warn('Failed to restore event picture file:', error);
                    }
                }

                if (parsedData.step3Data?.overlayTemplate && typeof parsedData.step3Data.overlayTemplate === 'string' && parsedData.step3Data.overlayTemplate.startsWith('data:')) {
                    try {
                        const overlayTemplateFile = base64ToFile(parsedData.step3Data.overlayTemplate, 'overlay-template.svg', 'image/svg+xml');
                        parsedData.step3Data.overlayTemplate = overlayTemplateFile;
                    } catch (error) {
                        console.warn('Failed to restore overlay template file:', error);
                    }
                }

                // Restore all step data to context
                if (parsedData.step1Data) {
                    context.updateStep1Data(parsedData.step1Data);
                }
                if (parsedData.step2Data) {
                    context.updateStep2Data(parsedData.step2Data);
                }
                if (parsedData.step3Data) {
                    context.updateStep3Data(parsedData.step3Data);
                }
                if (parsedData.step4Data) {
                    context.updateStep4Data(parsedData.step4Data);
                }

                // Wait for React to process the state updates
                await new Promise(resolve => setTimeout(resolve, 50));

                return parsedData;
            } catch (error) {
                console.error('Error parsing stored event data:', error);
                return null;
            }
        }
        return null;
    };

    // Function to prepare data for localStorage storage
    const prepareDataForStorage = async (data: StorageData): Promise<StorageData> => {
        const dataToStore: StorageData = { ...data };

        // Convert File objects to base64 strings
        if (dataToStore.step1Data?.overlay instanceof File) {
            try {
                dataToStore.step1Data.overlay = await fileToBase64(dataToStore.step1Data.overlay);
            } catch (error) {
                console.warn('Failed to convert overlay file to base64:', error);
            }
        }

        if (dataToStore.step3Data?.eventPictureFile instanceof File) {
            try {
                dataToStore.step3Data.eventPictureFile = await fileToBase64(dataToStore.step3Data.eventPictureFile);
            } catch (error) {
                console.warn('Failed to convert event picture file to base64:', error);
            }
        }

        if (dataToStore.step3Data?.overlayTemplate instanceof File) {
            try {
                dataToStore.step3Data.overlayTemplate = await fileToBase64(dataToStore.step3Data.overlayTemplate);
            } catch (error) {
                console.warn('Failed to convert overlay template file to base64:', error);
            }
        }

        return dataToStore;
    };

    return {
        ...context,
        restoreEventDataFromStorage,
        prepareDataForStorage
    };
}; 