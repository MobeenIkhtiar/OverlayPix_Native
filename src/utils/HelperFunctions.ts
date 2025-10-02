import { Linking, Alert } from 'react-native';
import Toast from 'react-native-toast-message';

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

// Helper to format price to 2 decimals
export const formatPrice = (value: number) => {
    return value && value?.toFixed(2);
};