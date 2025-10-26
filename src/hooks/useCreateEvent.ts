import { useContext } from 'react';
import { CreateEventContext } from '../contexts/CreateEventContextDef';
import type { CreateEventContextType } from '../types/createEvent';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper function to convert base64 to "React Native File-like object"
const base64ToFile = (base64String: string, fileName: string, mimeType: string) => {
    // In React Native, the best equivalent is a { uri, name, type } object for uploading via fetch/FormData
    return {
        uri: base64String,
        name: fileName,
        type: mimeType,
    };
};

// Helper function to convert File-like object to base64
const fileToBase64 = async (file: any): Promise<string> => {
    // If file.uri is present, we assume it's a local file that needs to be read as base64
    // This requires react-native-fs or similar; here we assume only base64 data or uri starting with 'data:'
    if (typeof file === 'string' && file.startsWith('data:')) {
        return file;
    }
    if (file && file.uri && file.uri.startsWith('data:')) {
        return file.uri;
    }
    // No general solution without third party libs, so just return uri or empty
    return file && file.uri ? file.uri : '';
};

interface StorageData {
    step1Data?: {
        name?: string;
        type?: string;
        date?: string;
        timeZone?: string;
        startTime?: string;
        endTime?: string;
        overlay?: string | { uri: string; name: string; type: string }; // base64 or RN "file"
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
        eventPictureFile?: string | { uri: string; name: string; type: string };
        overlayTemplate?: string | { uri: string; name: string; type: string };
    };
    step4Data?: CreateEventContextType['step4Data'];
    isUpgradeMode?: boolean;
    eventId?: string;
}

export const useCreateEvent = () => {
    const context = useContext(CreateEventContext);
    if (!context) {
        throw new Error('useCreateEvent must be used within a CreateEventProvider');
    }

    // restoreEventDataFromStorage using AsyncStorage instead of localStorage
    const restoreEventDataFromStorage = async () => {
        try {
            const storedData = await AsyncStorage.getItem('pendingEventData');
            if (storedData) {
                const parsedData = JSON.parse(storedData);
                console.log('Restoring event data from storage:', parsedData);

                // Convert base64 strings back to RN file objects if they exist
                if (
                    parsedData.step1Data?.overlay &&
                    typeof parsedData.step1Data.overlay === 'string' &&
                    parsedData.step1Data.overlay.startsWith('data:')
                ) {
                    try {
                        const overlayFile = base64ToFile(
                            parsedData.step1Data.overlay,
                            parsedData.step1Data.overlayName || 'overlay.svg',
                            'image/svg+xml'
                        );
                        parsedData.step1Data.overlay = overlayFile;
                    } catch (error) {
                        console.warn('Failed to restore overlay file:', error);
                    }
                }

                if (
                    parsedData.step3Data?.eventPictureFile &&
                    typeof parsedData.step3Data.eventPictureFile === 'string' &&
                    parsedData.step3Data.eventPictureFile.startsWith('data:')
                ) {
                    try {
                        const eventPictureFile = base64ToFile(
                            parsedData.step3Data.eventPictureFile,
                            'event-picture.jpg',
                            'image/jpeg'
                        );
                        parsedData.step3Data.eventPictureFile = eventPictureFile;
                    } catch (error) {
                        console.warn('Failed to restore event picture file:', error);
                    }
                }

                if (
                    parsedData.step3Data?.overlayTemplate &&
                    typeof parsedData.step3Data.overlayTemplate === 'string' &&
                    parsedData.step3Data.overlayTemplate.startsWith('data:')
                ) {
                    try {
                        const overlayTemplateFile = base64ToFile(
                            parsedData.step3Data.overlayTemplate,
                            'overlay-template.svg',
                            'image/svg+xml'
                        );
                        parsedData.step3Data.overlayTemplate = overlayTemplateFile;
                    } catch (error) {
                        console.warn('Failed to restore overlay template file:', error);
                    }
                }

                if (parsedData.step1Data) context.updateStep1Data(parsedData.step1Data);
                if (parsedData.step2Data) context.updateStep2Data(parsedData.step2Data);
                if (parsedData.step3Data) context.updateStep3Data(parsedData.step3Data);
                if (parsedData.step4Data) context.updateStep4Data(parsedData.step4Data);

                // Wait for React to process the state updates
                await new Promise(resolve => setTimeout(resolve, 50));

                return parsedData;
            }
            return null;
        } catch (error) {
            console.error('Error parsing stored event data:', error);
            return null;
        }
    };

    // Function to prepare data for AsyncStorage storage (same as before but RN-style)
    const prepareDataForStorage = async (data: StorageData): Promise<StorageData> => {
        const dataToStore: StorageData = { ...data };

        if (
            dataToStore.step1Data?.overlay &&
            typeof dataToStore.step1Data.overlay === 'object' &&
            dataToStore.step1Data.overlay.uri?.startsWith('data:')
        ) {
            try {
                dataToStore.step1Data.overlay = await fileToBase64(dataToStore.step1Data.overlay);
            } catch (error) {
                console.warn('Failed to convert overlay file to base64:', error);
            }
        }

        if (
            dataToStore.step3Data?.eventPictureFile &&
            typeof dataToStore.step3Data.eventPictureFile === 'object' &&
            dataToStore.step3Data.eventPictureFile.uri?.startsWith('data:')
        ) {
            try {
                dataToStore.step3Data.eventPictureFile = await fileToBase64(dataToStore.step3Data.eventPictureFile);
            } catch (error) {
                console.warn('Failed to convert event picture file to base64:', error);
            }
        }

        if (
            dataToStore.step3Data?.overlayTemplate &&
            typeof dataToStore.step3Data.overlayTemplate === 'object' &&
            dataToStore.step3Data.overlayTemplate.uri?.startsWith('data:')
        ) {
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
        prepareDataForStorage,
    };
};