import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { dashboardService } from '../../services/dashboardService';
import type { EventData } from '../../types/dashboard';
import QRCode from 'react-native-qrcode-svg';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import { hp, wp } from '../../contants/StyleGuide';
import { SafeAreaView } from 'react-native-safe-area-context';

const InviteGuestEasily: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { eventId } = (route.params as { eventId: string }) || {};

    const [eventData, setEventData] = useState<EventData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEventData = async () => {
            if (!eventId) {
                setError('Event ID is required');
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                setError(null);
                const data = await dashboardService.getEventById(eventId);
                setEventData(data as EventData);
            } catch (err) {
                setError('Failed to load event data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchEventData();
    }, [eventId]);

    // Copy event link
    const handleCopyLink = async () => {
        if (eventData?.shareCode) {
            const url = `https://overlaypix.com/termsAndPolicy/${eventData.shareCode}`;
            Clipboard.setString(url);

            Toast.show({
                type: 'success',
                text1: '✔️ Link copied!',
                text2: `https://overlaypix.com/termsAndPolicy/${eventData.shareCode}`,
                text2Style: { marginTop: hp(1), fontSize: wp(2.5), color: '#3DA9B7' },
                visibilityTime: 2000,
                position: 'top',
            });
        }
    };

    const handleCopyShareCode = () => {
        if (!eventData?.shareCode) return;
        Clipboard.setString(eventData.shareCode);
        Toast.show({
            type: 'success',
            text1: '✔️ Share code copied!',
            visibilityTime: 2000,
            position: 'top',
        });
    };

    // Download QR code is not natively supported in React Native without extra packages or native code.
    // We'll show a toast instead.
    const handleDownloadQRCode = () => {
        Toast.show({
            type: 'info',
            text1: 'To save the QR code, take a screenshot.',
            visibilityTime: 2000,
            position: 'top',
        });
    };

    const eventShareUrl = eventData?.shareCode
        ? `https://overlaypix.com/termsAndPolicy/${eventData.shareCode}`
        : '';

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.card}>
                    <ActivityIndicator size="large" color="#3DA9B7" style={{ marginBottom: hp(2) }} />
                    <Text style={styles.loadingText}>Loading event details...</Text>
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <View style={styles.card}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                        style={styles.goBackButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.goBackButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (!eventData) {
        return (
            <View style={styles.container}>
                <View style={styles.card}>
                    <Text style={styles.noDataText}>No event data found</Text>
                    <TouchableOpacity
                        style={styles.goBackButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.goBackButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.container}>

                <View style={styles.card}>
                    <Text style={styles.title}>Invite Guests Easily!</Text>
                    <Text style={styles.subtitle}>
                        Share this QR code to let guests access your event instantly.
                    </Text>

                    {/* QR Code */}
                    <View style={styles.qrContainer}>
                        <View style={styles.qrInner}>
                            {eventShareUrl ? (
                                <QRCode
                                    value={eventShareUrl}
                                    size={wp(30)}
                                    backgroundColor="#FFFFFF"
                                    color="#000000"
                                />
                            ) : (
                                <View style={styles.noQrBox}>
                                    <Text style={styles.noQrText}>No QR</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <Text style={styles.eventName}>
                        {eventData?.name || 'Event Title'}
                    </Text>

                    {/* First row: Copy Event Link & Download */}
                    <View style={styles.row}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleCopyLink}
                        >
                            <Text style={styles.actionButtonText}>Copy Event Link</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleDownloadQRCode}
                        >
                            <Text style={styles.actionButtonText}>Download</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Second row: Copy Share Code */}
                    <View style={styles.row}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={handleCopyShareCode}
                        >
                            <Text style={styles.actionButtonText}>
                                Copy Event Share Code{' '}
                                <Text style={styles.shareCodeText}>
                                    ({eventData?.shareCode})
                                </Text>
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={() => navigation.navigate('dashboard' as never)}>
                        <Text style={styles.continueButtonText}>Continue</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            {/* Toast container must be outside ScrollView */}
            <Toast />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        minHeight: hp(100),
        backgroundColor: '#F6FEFF',
        alignItems: 'center',
        justifyContent: 'center',
        padding: wp(3),
    },
    card: {
        borderRadius: wp(3),
        backgroundColor: '#fff',
        paddingVertical: hp(4),
        paddingHorizontal: wp(4),
        width: '100%',
        maxWidth: wp(90),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    title: {
        fontSize: wp(5.5),
        fontWeight: 'bold',
        color: '#1CA6B5',
        marginBottom: hp(1),
        textAlign: 'center',
    },
    subtitle: {
        color: '#666666',
        fontSize: wp(3.5),
        fontWeight: '400',
        textAlign: 'center',
        marginBottom: hp(3),
    },
    qrContainer: {
        backgroundColor: '#fff',
        padding: wp(2),
        borderRadius: wp(2),
        marginBottom: hp(1),
        alignItems: 'center',
        justifyContent: 'center',
    },
    qrInner: {
        width: wp(32),
        height: wp(32),
        alignItems: 'center',
        justifyContent: 'center',
    },
    noQrBox: {
        width: wp(32),
        height: wp(32),
        backgroundColor: '#e5e7eb',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: wp(2),
    },
    noQrText: {
        color: '#bdbdbd',
        fontSize: wp(4),
    },
    eventName: {
        textAlign: 'center',
        fontSize: wp(3.8),
        color: '#000',
        fontWeight: '500',
        marginBottom: hp(3),
    },
    row: {
        flexDirection: 'row',
        gap: wp(3),
        marginBottom: hp(2),
        width: '100%',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#D3D3D3',
        backgroundColor: '#fff',
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.2),
        borderRadius: wp(2),
        marginHorizontal: wp(1),
    },
    actionButtonText: {
        color: '#1CA6B5',
        fontSize: wp(3.2),
        fontWeight: '400',
    },
    shareCodeText: {
        color: '#666666',
        fontSize: wp(4.5),
        fontWeight: '400',
    },
    continueButton: {
        width: '80%',
        backgroundColor: '#1CA6B5',
        paddingVertical: hp(2),
        borderRadius: wp(2),
        marginTop: hp(1),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: wp(3.8),
        fontWeight: '600',
    },
    loadingText: {
        textAlign: 'center',
        color: '#666',
        fontSize: wp(3.5),
    },
    errorText: {
        textAlign: 'center',
        color: '#e53e3e',
        marginBottom: hp(2),
        fontSize: wp(3.8),
    },
    noDataText: {
        textAlign: 'center',
        color: '#888',
        marginBottom: hp(2),
        fontSize: wp(3.8),
    },
    goBackButton: {
        backgroundColor: '#1CA6B5',
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.2),
        borderRadius: wp(2),
        marginTop: hp(1),
    },
    goBackButtonText: {
        color: '#fff',
        fontSize: wp(3.5),
        fontWeight: '600',
    },
});

export default InviteGuestEasily;