import { Linking, Alert, Platform, PermissionsAndroid } from 'react-native';
import Toast from 'react-native-toast-message';
import { BASEURL } from '../services/Endpoints';
import RNFS from 'react-native-fs';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';const handleSupportEmail = async () => {
    const email = 'support@overlaypix.com';
    const url = `mailto:${email}`;

    try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            Alert.alert(
                'Email Not Available',
                `Please contact us at: ${email}`,
                [{ text: 'OK' }]
            );
        }
    } catch (error) {
        Alert.alert(
            'Error',
            `Please contact us at: ${email}`,
            [{ text: 'OK' }]
        );
    }
};

export const showErrorToastWithSupport = (message: string) => {
    Toast.show({
        type: 'error',
        text1: message,
        text2: 'Tap to contact support',
        position: 'top',
        visibilityTime: 4000,
        onPress: handleSupportEmail,
        props: {
            text2Style: {
                color: '#3DA9B7',
                textDecorationLine: 'underline',
                fontSize: 14
            }
        }
    });
};

export const proxyOverlayImage = (imageUrl: any): string => {
    // Only proxy R2 URLs
    if (imageUrl?.includes('pub-1fe18182db0a4663b094a09a53fae1e8.r2.dev')) {
        return `${BASEURL}/images/proxy?url=${encodeURIComponent(imageUrl)}`;
    }
    return imageUrl;
};

// Helper to format price to 2 decimals
export const formatPrice = (value: any) => {
    if (value == null || value === "") return "";

    const num = Number(value);

    if (isNaN(num)) return ""; // or return value

    const fixed = num.toFixed(2);

    // If decimal part is "00", return only the integer part
    if (fixed.endsWith(".00")) {
        return parseInt(fixed).toString();
    }

    return fixed;
};

// Helper to clear anonymous event data from AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

export const clearAnonymousEventData = async () => {
    try {
        const keys = await AsyncStorage.getAllKeys();

        // Find all keys related to anonymous event acceptance
        const keysToRemove = keys.filter(
            key => key.startsWith('event_uuid_') || key.startsWith('terms_accepted_')
        );

        // Also remove the guest_login flag
        keysToRemove.push('guest_login');

        if (keysToRemove.length > 0) {
            await AsyncStorage.multiRemove(keysToRemove);
            console.log('Cleared anonymous event data:', keysToRemove);
        }
    } catch (error) {
        console.error('Error clearing anonymous event data:', error);
    }
};

/**
 * Handle multiple image downloads efficiently.
 * @param urls Array of image URLs to download
 * @param eventName Name of the event to create a subfolder for
 */
export const downloadImages = async (urls: string[], eventName?: string) => {
    if (!urls || urls.length === 0) {
        Toast.show({
            type: 'error',
            text1: 'No images to download',
        });
        return;
    }

    // Sanitize eventName for folder name
    const sanitizedEventName = eventName ? eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'event_photos';

    // Request permissions on Android
    if (Platform.OS === 'android') {
        try {
            if (Platform.Version < 33) {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    {
                        title: 'Storage Permission Required',
                        message: 'App needs access to your storage to save photos',
                        buttonPositive: 'OK',
                    }
                );
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    Toast.show({
                        type: 'error',
                        text1: 'Permission Denied',
                        text2: 'Storage permission is required to download images',
                    });
                    return;
                }
            }
        } catch (err) {
            console.error('Permission error:', err);
            return;
        }
    }

    Toast.show({
        type: 'info',
        text1: 'Downloading images...',
        text2: `0 of ${urls.length} completed`,
        autoHide: false,
    });

    let successCount = 0;
    let failCount = 0;

    const baseDir = Platform.select({
        ios: RNFS.DocumentDirectoryPath,
        android: RNFS.DownloadDirectoryPath,
    }) || RNFS.CachesDirectoryPath;

    const overlayPixDir = `${baseDir}/OverlayPix`;
    const eventDir = `${overlayPixDir}/${sanitizedEventName}`;

    try {
        // Create directories if they don't exist
        const exists = await RNFS.exists(eventDir);
        if (!exists) {
            await RNFS.mkdir(eventDir);
        }
    } catch (err) {
        console.error('Error creating directory:', err);
        // Fallback to baseDir if mkdir fails (unlikely, but safe)
    }

    const downloadDir = eventDir;

    // Use a Promise.all with some concurrency control if needed, but for simplicity we'll do them sequentially or in small batches
    // Let's do them in parallel since they are separate files
    const downloadPromises = urls.map(async (url, index) => {
        try {
            const fileName = `OverlayPix_${Date.now()}_${index}.jpg`;
            const destPath = `${downloadDir}/${fileName}`;

            const result = await RNFS.downloadFile({
                fromUrl: url,
                toFile: destPath,
                background: true,
            }).promise;

            if (result.statusCode === 200) {
                if (Platform.OS === 'android') {
                    // Update Android Media Store immediately
                    await RNFS.scanFile(destPath);
                } else if (Platform.OS === 'ios') {
                    // Save to iOS native Photos App
                    await CameraRoll.save(destPath, { type: 'photo' });
                }
                successCount++;
            } else {
                failCount++;
            }
        } catch (error) {
            console.error(`Error downloading image ${index}:`, error);
            failCount++;
        } finally {
            // Update toast progress every 5 images or at the end to avoid UI lag
            if ((successCount + failCount) % 5 === 0 || (successCount + failCount) === urls.length) {
                Toast.show({
                    type: 'info',
                    text1: 'Downloading images...',
                    text2: `${successCount + failCount} of ${urls.length} completed`,
                    autoHide: false,
                });
            }
        }
    });

    await Promise.all(downloadPromises);

    Toast.hide();

    if (successCount === urls.length) {
        Toast.show({
            type: 'success',
            text1: 'Download Complete!',
            text2: `Successfully saved ${successCount} images to Gallery`,
            visibilityTime: 4000,
        });
    } else {
        Toast.show({
            type: 'info',
            text1: 'Download Finished',
            text2: `${successCount} saved to Gallery, ${failCount} failed.`,
            visibilityTime: 5000,
        });
    }
};
