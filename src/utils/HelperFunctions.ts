import { Linking, Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import { BASEURL } from '../services/Endpoints';

const handleSupportEmail = async () => {
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
