import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, ScrollView, Share } from 'react-native';
import Header from '../../components/Header';
import { useNavigation, useRoute } from '@react-navigation/native';
import { dashboardService } from '../../services/dashboardService';
import type { EventData } from '../../types/dashboard';
import { EventSummaryCard } from '../../components/EventSummaryCard';
import { hp, wp } from '../../contants/StyleGuide';
import Clipboard from '@react-native-clipboard/clipboard';
import { icons } from '../../contants/Icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const EventCreatedScreen: React.FC = () => {
    const navigation: any = useNavigation();
    const route = useRoute();
    const eventId = (route.params as any)?.eventId;
    const [eventData, setEventData] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const parseDate = (
        dateValue: { _seconds: number; _nanoseconds?: number } | null | undefined
    ): string => {

        if (!dateValue || typeof dateValue._seconds !== 'number') return '';

        const date = new Date(dateValue._seconds * 1000);

        // Convert to YYYY-MM-DD in UTC (matches API exactly)
        return date.toISOString().split('T')[0];
    };


    useEffect(() => {
        const fetchEventData = async () => {
            if (!eventId) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const data = await dashboardService.getEventById(eventId);
                setEventData(data as EventData);
            } catch (err) {
                console.error('Error fetching event data:', err);
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

    // Share event link
    const handleShareLink = async () => {
        if (!eventData?.shareCode) return;

        const url = `https://overlaypix.com/${eventData.shareCode}`;
        const shareData = {
            title: eventData?.name ? `Join my event: ${eventData.name}` : 'Join my event',
            message: eventData?.name
                ? `You're invited to join the event "${eventData.name}"!\n${url}`
                : `You're invited to join my event!\n${url}`,
            url,
        };

        try {
            await Share.share(shareData);
        } catch (err) {
            Clipboard.setString(url);
            Toast.show({
                type: 'success',
                text1: '✔️ Link copied!',
                visibilityTime: 2000,
                position: 'top',
            });
        }
    };

    const handleViewQR = () => {
        navigation.navigate('inviteGuestEasily', { eventId });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={{ flex: 1 }}>
                <Header title="" subtitle="" />

                <View style={styles.centeredContent}>
                    <View style={styles.hexagonContainer}>
                        <Image
                            source={icons.hexagon_check}
                            style={{ width: wp(24), height: wp(24), marginBottom: hp(2) }}
                            resizeMode="contain"
                        />
                    </View>

                    <Text style={styles.headline}>Your Event Has Been Created!</Text>
                    <Text style={styles.subtext}>
                        You're all set. Your event will be live at the below date/time and ready to welcome guests.
                    </Text>

                    {loading ? (
                        <View style={styles.card}>
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#3DA9B7" />
                                <Text style={styles.loadingText}>Loading event details...</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.card}>
                            <EventSummaryCard
                                eventName={eventData?.name}
                                dateTime={parseDate(eventData?.eventDate)}
                                plan={eventData?.basePlanName}
                                guestLimit={eventData?.customPlan?.guestLimit}
                                photoPool={eventData?.customPlan?.photoPool}
                                photoDuration={eventData?.customPlan?.storageDays}
                                eventLink={
                                    eventData?.shareCode
                                        ? `https://overlaypix.com/termsAndPolicy/${eventData.shareCode}`
                                        : ''
                                }
                                onCopyLink={handleCopyLink}
                                onShareLink={handleShareLink}
                                onViewQR={handleViewQR}
                            />
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Toast container must be outside ScrollView */}
            <Toast />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        flex: 1,
        flexDirection: 'column',
        padding: wp(3),
        backgroundColor: '#F6FEFF',
    },
    centeredContent: {
        flex: 1,
        alignItems: 'center',
    },
    hexagonContainer: {
        marginBottom: hp(2),
    },
    headline: {
        fontSize: wp(5),
        fontWeight: 'bold',
        color: '#3DA9B7',
        textAlign: 'center',
        marginBottom: hp(1),
    },
    subtext: {
        color: '#626666',
        paddingHorizontal: wp(4),
        fontSize: wp(3.5),
        textAlign: 'center',
        fontWeight: '400',
        maxWidth: wp(80),
        marginBottom: hp(2),
    },
    card: {
        backgroundColor: '#fff',
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        borderRadius: wp(3),
        width: '100%',
        alignSelf: 'center',
        flexDirection: 'column',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        marginBottom: hp(2),
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: hp(4),
    },
    loadingText: {
        color: '#626666',
        marginTop: hp(1),
        fontSize: wp(3.5),
    },
});

export default EventCreatedScreen;
