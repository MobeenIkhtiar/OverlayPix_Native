import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Image,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft } from 'lucide-react-native';
import Svg, { Path, Mask, G } from 'react-native-svg';
import CustomCheckBox from '../../../components/CustomCheckBox';
// import { images } from '../../../constants/images';

import { apiService } from '../../../services/api';
import type { EventData } from '../../../types/terms';
import { proxyOverlayImage, showErrorToastWithSupport } from '../../../utils/HelperFunctions';
import { wp, hp } from '../../../contants/StyleGuide';
import { icons } from '../../../contants/Icons';
import { termsService } from '../../../services/termsService';
// import { loginAnonymously } from '../../../services/loginService';

const TermsAndPolicy: React.FC = () => {
    const [checked, setChecked] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [acceptingTerms, setAcceptingTerms] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [eventData, setEventData] = useState<EventData | null>(null);
    // console.log("eventData =>>>>>>>>>", eventData);

    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const shareId = route.params?.shareId;
    const [isGuest, setIsGuest] = useState<boolean>(false);

    const fromDashboard = route.params?.fromDashboard ?? false;

    useEffect(() => {
        const checkGuestStatus = async () => {
            const guestLogin = await AsyncStorage.getItem('guest_login');
            setIsGuest(guestLogin === 'true');
        };
        checkGuestStatus();
    }, []);

    const getShareId = () => {
        return shareId;
    };

    useEffect(() => {
        const id = getShareId();
        if (!id) {
            setError('Invalid or missing share link.');
            showErrorToastWithSupport('Invalid or missing share link.');
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response: any = await apiService(`/guests/share/${shareId}`,
                    'GET'
                );

                console.log('share api res =>>>>>>>>>', response.data)
                setEventData(response.data as EventData);

                // After fetching event data, check if user has already accepted terms for this event
                const eventUuid = await AsyncStorage.getItem(`event_uuid_${id}`);
                if (eventUuid) {
                    // User has already accepted terms, redirect to take picture screen
                    console.log('already login evnt id=>>>>>>.', response)
                    // navigation.navigate(`/`, { state: {} });
                    navigation.navigate('userGallery', { eventId: response?.data?.eventId, overlayUrl: response?.data?.overlayUrl });
                    // navigation.navigate('takePicture', { eventId: response?.data?.eventId, overlayUrl: proxyOverlayImage(response?.data?.overlayUrl), fromDashboard: isGuest ? true : false });
                }
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : 'An error occurred.';
                setError(errorMessage);
                showErrorToastWithSupport(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        // eslint-disable-next-line
    }, []);

    // Handle terms acceptance
    const handleAcceptTerms = async () => {
        if (!checked) return;

        const shareId = getShareId();
        if (!shareId) {
            setError('Invalid share link.');
            return;
        }

        setAcceptingTerms(true);
        setError(null);

        try {
            // Accept terms
            const res = await termsService.acceptTerms(shareId, isGuest);

            if (res) {
                // Store the UUID returned from acceptTerms in AsyncStorage
                await AsyncStorage.setItem(`event_uuid_${shareId}`, res.acceptanceId);
                // Store acceptance in AsyncStorage for future reference
                await AsyncStorage.setItem(`terms_accepted_${shareId}`, 'true');

                navigation.navigate('takePicture', { eventId: eventData?.eventId, overlayUrl: proxyOverlayImage(eventData?.overlayUrl), fromDashboard: isGuest ? true : false });
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to accept terms. Please try again.';
            setError(errorMessage);
        } finally {
            setAcceptingTerms(false);
        }
    };

    // Modified handleSignIn to navigate to login page and send location state { guest: true }
    const handleSignIn = () => {
        navigation.navigate('login', { guest: true, shareId: shareId, isAnonymous: true });
    }
    const handleSignUp = () => {
        navigation.navigate('signup', { guest: true, shareId: shareId, isAnonymous: true });
    }

    // Fallbacks if eventData is not loaded
    const eventName = eventData?.eventName || "Event";
    const hostName = eventData?.ownerName || "Event Host";
    const totalPictures = eventData?.guestPicturesLeft ?? 0;
    const maxPictures = eventData?.guestPicturesMax ?? 0;

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#3DA9B7" />
                    <Text style={styles.loadingText}>Loading event details...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContainer}>
                    <Text style={styles.errorTextLarge}>{error}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Show back button if fromDashboard is true */}
                {fromDashboard && (
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.8}
                    >
                        <ChevronLeft size={wp(6)} color="#3DA9B7" />
                    </TouchableOpacity>
                )}

                {/* Logo and App Name */}
                <View style={styles.logoContainer}>
                    <Image source={icons.logo} style={styles.logo} resizeMode="cover" />
                    <Text style={styles.appName}>Overlay Pix</Text>
                    <Text style={styles.welcomeText}>Welcome to</Text>
                    <Text style={styles.eventNamePlaceholder}></Text>
                    <Text
                        style={[
                            styles.eventName,
                            {
                                color: eventData?.brandColor || "#666666",
                                fontSize: eventData?.fontSize || wp(4.5),
                                fontWeight: (eventData?.fontStyle as any) || "500",
                                fontFamily: eventData?.typography || undefined,
                            }
                        ]}
                    >
                        {eventName}
                    </Text>
                </View>

                {/* Event Image and Info */}
                <View style={styles.eventCard}>
                    <View style={styles.eventImageContainer}>
                        {eventData?.eventPictureUrl ? (
                            <Image
                                source={{ uri: eventData.eventPictureUrl }}
                                style={styles.eventImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <Text style={styles.noImageText}>No event image available</Text>
                        )}
                    </View>
                    <View style={styles.eventInfoContainer}>
                        {eventData?.customPlan?.photosPerGuest > 0 && (
                            <View style={styles.pictureInfoRow}>
                                <Svg width={wp(4.5)} height={wp(4.5)} viewBox="0 0 16 16" fill="none">
                                    <Path d="M7.46635 5.5835L9.79968 1.5835C10.8108 1.85016 11.7081 2.33905 12.4917 3.05016C13.2752 3.76127 13.8446 4.60572 14.1997 5.5835H7.46635ZM5.61635 7.25016L3.33302 3.25016C3.93302 2.66127 4.63035 2.19461 5.42501 1.85016C6.21968 1.50572 7.0779 1.3335 7.99968 1.3335C8.14413 1.3335 8.31079 1.34194 8.49968 1.35883C8.68857 1.37572 8.86079 1.39505 9.01635 1.41683L5.61635 7.25016ZM1.54968 9.66683C1.48302 9.40016 1.43013 9.12794 1.39102 8.85016C1.3519 8.57238 1.33257 8.28905 1.33302 8.00016C1.33302 7.21127 1.46079 6.46683 1.71635 5.76683C1.9719 5.06683 2.33302 4.42794 2.79968 3.85016L6.16635 9.66683H1.54968ZM6.21635 14.4168C5.20524 14.1502 4.30524 13.6613 3.51635 12.9502C2.72746 12.2391 2.15524 11.3946 1.79968 10.4168H8.51635L6.21635 14.4168ZM7.99968 14.6668C7.83301 14.6668 7.66346 14.6557 7.49102 14.6335C7.31857 14.6113 7.15479 14.5891 6.99968 14.5668L10.383 8.75016L12.6663 12.7502C12.0663 13.3391 11.3692 13.8057 10.575 14.1502C9.78079 14.4946 8.92235 14.6668 7.99968 14.6668ZM13.1997 12.1502L9.83301 6.3335H14.4497C14.5163 6.60016 14.5692 6.87239 14.6083 7.15016C14.6475 7.42794 14.6668 7.71127 14.6663 8.00016C14.6663 8.77794 14.5303 9.52238 14.2583 10.2335C13.9863 10.9446 13.6335 11.5835 13.1997 12.1502Z" fill="#3DA9B7" />
                                </Svg>
                                <Text style={styles.pictureInfoText}>
                                    You have {totalPictures} picture left out of {maxPictures}
                                </Text>
                            </View>
                        )}
                        {hostName && (
                            <Text style={styles.hostedByText}>Hosted by {hostName}</Text>
                        )}
                    </View>
                </View>

                {/* Terms & Privacy Section */}
                <View style={styles.termsCard}>
                    <Text style={styles.termsTitle}>Terms & Privacy</Text>
                    <View style={styles.checkboxRow}>
                        <View style={{ marginTop: hp(.4) }}>
                            <CustomCheckBox
                                value={checked}
                                onValueChange={setChecked}
                                size={wp(4)}
                                checkedColor="#2EC4B6"
                                uncheckedColor="#fff"
                                borderColor="#9CA3AF"
                            />
                        </View>
                        <View style={styles.termsTextContainer}>
                            <Text style={styles.termsText}>
                                I agree to the{' '}
                                <Text style={styles.linkText}>Terms of Service</Text>
                                {' '}and{' '}
                                <Text
                                    style={styles.linkText}
                                    onPress={() => {
                                        console.log('privacy policy clicked');
                                        navigation.navigate('privacyPolicy');
                                    }}
                                >
                                    Privacy Policy
                                </Text>
                                {' '}and understand that photos I share will be visible to all event guests.
                            </Text>
                        </View>
                    </View>
                    <View style={styles.infoBox}>
                        <View style={styles.infoBoxContent}>
                            <Svg width={wp(3.5)} height={wp(3)} viewBox="0 0 13 11" fill="none" style={styles.infoIcon}>
                                <Mask id="mask0_7_137" maskUnits="userSpaceOnUse" x="0" y="0" width="13" height="11">
                                    <Path d="M7.47085 0.874023H5.14891C2.9599 0.874023 1.8651 0.874023 1.18536 1.55435C0.695427 2.0437 0.558433 2.74841 0.520121 3.92157H12.0996C12.0613 2.74841 11.9243 2.0437 11.4344 1.55435C10.7547 0.874023 9.65986 0.874023 7.47085 0.874023ZM5.14891 10.1618H7.47085C9.65986 10.1618 10.7547 10.1618 11.4344 9.48145C12.1141 8.80113 12.1147 7.70691 12.1147 5.5179C12.1147 5.26172 12.1143 5.01985 12.1136 4.7923H0.506189C0.505028 5.01985 0.504641 5.26172 0.505028 5.5179C0.505028 7.70691 0.505028 8.80171 1.18536 9.48145C1.86568 10.1612 2.9599 10.1618 5.14891 10.1618Z" fill="white" />
                                    <Path fillRule="evenodd" clipRule="evenodd" d="M2.3916 7.84015C2.3916 7.72468 2.43747 7.61395 2.51912 7.5323C2.60076 7.45065 2.7115 7.40479 2.82697 7.40479H5.14891C5.26437 7.40479 5.37511 7.45065 5.45675 7.5323C5.5384 7.61395 5.58427 7.72468 5.58427 7.84015C5.58427 7.95561 5.5384 8.06635 5.45675 8.148C5.37511 8.22964 5.26437 8.27551 5.14891 8.27551H2.82697C2.7115 8.27551 2.60076 8.22964 2.51912 8.148C2.43747 8.06635 2.3916 7.95561 2.3916 7.84015ZM6.16475 7.84015C6.16475 7.72468 6.21062 7.61395 6.29227 7.5323C6.37392 7.45065 6.48465 7.40479 6.60012 7.40479H7.47085C7.58631 7.40479 7.69705 7.45065 7.77869 7.5323C7.86034 7.61395 7.90621 7.72468 7.90621 7.84015C7.90621 7.95561 7.86034 8.06635 7.77869 8.148C7.69705 8.22964 7.58631 8.27551 7.47085 8.27551H6.60012C6.48465 8.27551 6.37392 8.22964 6.29227 8.148C6.21062 8.06635 6.16475 7.95561 6.16475 7.84015Z" fill="black" />
                                </Mask>
                                <G mask="url(#mask0_7_137)">
                                    <Path d="M-0.65625 -1.44775H13.2754V12.4839H-0.65625V-1.44775Z" fill="#3DA9B7" />
                                </G>
                            </Svg>
                            <Text style={styles.infoBoxText}>
                                Your photos will only be shared with guests of this event. You can delete your photos at any time. Event organizers may download and use photos for event memories.
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Buttons */}
                <View style={styles.buttonsCard}>
                    <View style={styles.buttonsContainer}>
                        <TouchableOpacity
                            style={[
                                styles.acceptButton,
                                (!checked || acceptingTerms) && styles.acceptButtonDisabled
                            ]}
                            disabled={!checked || acceptingTerms}
                            onPress={() => {
                                if (eventData?.eventStatus === "expired") {
                                    showErrorToastWithSupport('Event Expired');
                                } else if (
                                    typeof eventData?.guestLimit === 'number' &&
                                    typeof eventData?.currentGuestCount === 'number' &&
                                    eventData.guestLimit > eventData.currentGuestCount
                                ) {
                                    handleAcceptTerms();
                                } else {
                                    showErrorToastWithSupport('Guest Limit Reached');
                                }
                            }}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.acceptButtonText}>
                                {acceptingTerms
                                    ? 'Accepting Terms...'
                                    : isGuest
                                        ? 'Accept and Continue'
                                        : 'Accept and Continue as Anonymous Guest'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.declineButton}
                            disabled
                            activeOpacity={0.8}
                        >
                            <Text style={styles.declineButtonText}>Decline</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Sign in / Sign up */}
                {!isGuest && (
                    <View style={styles.authCard}>
                        <TouchableOpacity
                            style={styles.signInButton}
                            onPress={handleSignIn}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.signInButtonText}>Sign in</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.signUpButton}
                            onPress={handleSignUp}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.signUpButtonText}>Sign up</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default TermsAndPolicy;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6FEFF',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: wp(3),
        paddingTop: hp(2),
        paddingBottom: hp(4),
        alignItems: 'center',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#6B7280',
        fontSize: wp(4.5),
        marginTop: hp(2),
    },
    errorTextLarge: {
        color: '#EF4444',
        fontSize: wp(4.5),
        textAlign: 'center',
        paddingHorizontal: wp(5),
    },
    backButton: {
        position: 'absolute',
        top: hp(2),
        left: wp(4),
        zIndex: 10,
        width: wp(8),
        height: wp(8),
        borderRadius: wp(4),
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: wp(1),
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
    },
    logoContainer: {
        marginTop: hp(3),
        alignItems: 'center',
    },
    logo: {
        width: wp(7),
        height: wp(7),
        marginBottom: hp(1),
    },
    appName: {
        fontSize: wp(3),
        fontWeight: 'bold',
        color: '#374151',
    },
    welcomeText: {
        color: '#646666',
        fontSize: wp(6),
        marginTop: hp(1),
    },
    eventNamePlaceholder: {
        fontSize: wp(4.5),
        fontWeight: '600',
        color: '#3DA9B7',
        marginTop: hp(0.5),
    },
    eventName: {
        marginBottom: hp(2),
        textAlign: 'center',
        paddingHorizontal: wp(5),
    },
    eventCard: {
        width: '100%',
        paddingHorizontal: wp(4),
        paddingVertical: hp(1),
        marginTop: hp(2.5),
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#C6F1F6',
        borderRadius: wp(4),
        marginBottom: hp(3),
        alignItems: 'center',
    },
    eventImageContainer: {
        width: '100%',
        height: hp(18),
        borderRadius: wp(2.5),
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    eventImage: {
        width: '100%',
        height: '100%',
    },
    noImageText: {
        color: '#9CA3AF',
        fontSize: wp(3.5),
    },
    eventInfoContainer: {
        alignItems: 'center',
        paddingVertical: hp(2),
    },
    pictureInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: hp(0.5),
    },
    pictureInfoText: {
        fontSize: wp(4.5),
        marginLeft: wp(2),
        fontWeight: '600',
        color: '#666',
    },
    hostedByText: {
        fontSize: wp(2.5),
        color: '#8B8B8B',
    },
    termsCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#C6F1F6',
        borderRadius: wp(4),
        marginTop: hp(3),
        padding: wp(4),
    },
    termsTitle: {
        fontWeight: '600',
        color: '#374151',
        marginBottom: hp(1),
        fontSize: wp(4),
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: hp(1.5),
        gap: wp(2),
    },
    termsTextContainer: {
        flex: 1,
    },
    termsText: {
        fontSize: wp(3),
        color: '#374151',
        lineHeight: wp(4.5),
    },
    linkText: {
        color: '#3484FD',
    },
    infoBox: {
        backgroundColor: '#E6FAF8',
        borderRadius: wp(2.5),
        padding: wp(3),
        marginTop: hp(2),
    },
    infoBoxContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    infoIcon: {
        marginTop: hp(0.2),
        marginRight: wp(2),
    },
    infoBoxText: {
        flex: 1,
        fontSize: wp(2.5),
        color: '#6B7280',
        lineHeight: wp(3.5),
    },
    buttonsCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#C6F1F6',
        borderRadius: wp(4),
        marginTop: hp(1),
        padding: wp(4),
    },
    buttonsContainer: {
        width: '100%',
        marginTop: hp(3),
    },
    acceptButton: {
        width: '100%',
        paddingVertical: hp(2),
        borderRadius: wp(2.5),
        backgroundColor: '#3DA9B7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: hp(1.5),
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: wp(1.5),
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    acceptButtonDisabled: {
        opacity: 0.5,
    },
    acceptButtonText: {
        fontSize: wp(3),
        fontWeight: '600',
        color: '#fff',
    },
    declineButton: {
        width: '100%',
        paddingVertical: hp(1.5),
        borderRadius: wp(2.5),
        backgroundColor: '#F6F6F6',
        borderWidth: 1,
        borderColor: '#C0BEBE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    declineButtonText: {
        fontSize: wp(3),
        fontWeight: '600',
        color: '#9A9A9A',
    },
    authCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderWidth: 0.5,
        borderColor: '#BFBFBF',
        borderRadius: wp(2),
        marginTop: hp(1),
        padding: wp(0.5),
        flexDirection: 'row',
        gap: wp(3),
    },
    signInButton: {
        flex: 1,
        paddingVertical: hp(1.5),
        borderRadius: wp(2.5),
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#A5A5A5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    signInButtonText: {
        color: '#808080',
        fontSize: wp(3.5),
        fontWeight: '400',
    },
    signUpButton: {
        flex: 1,
        paddingVertical: hp(1.5),
        borderRadius: wp(2.5),
        backgroundColor: '#3DA9B7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    signUpButtonText: {
        color: '#fff',
        fontSize: wp(3.5),
        fontWeight: '400',
    },
});
