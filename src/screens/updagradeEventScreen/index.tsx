import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import LimitInputPair from '../../components/LimitInputPair';
import ToggleSwitch from '../../components/ToggleSwitch';
import Header from '../../components/Header';
import { useNavigation, useRoute } from '@react-navigation/native';
import { dashboardService } from '../../services/dashboardService';
import { useCreateEvent } from '../../hooks/useCreateEvent';
import { planService } from '../../services/planService';
import { hp, wp } from '../../contants/StyleGuide';
import { SafeAreaView } from 'react-native-safe-area-context';

const UpgradeEventScreen: React.FC = () => {
    const [newGuestLimit, setNewGuestLimit] = useState<number>(0);
    const [newPhotoPool, setNewPhotoPool] = useState<number>(0);
    const [currentGuestLimit, setCurrentGuestLimit] = useState<number>(0);
    const [currentPhotoPool, setCurrentPhotoPool] = useState<number>(0);

    // Toggle states for guest permissions
    const [canViewGallery, setCanViewGallery] = useState<boolean>(true);
    const [canSharePhoto, setCanSharePhoto] = useState<boolean>(false);
    const [canDownload, setCanDownload] = useState<boolean>(false);

    const navigation: any = useNavigation();
    const route = useRoute();
    const eventId = (route.params as any)?.eventId;

    const [loading, setLoading] = useState(true);

    const { updateStep2Data } = useCreateEvent();
    const [originalPlan, setOriginalPlan] = useState<any>(null);

    // For price calculation
    const [guestIncreasePrice, setGuestIncreasePrice] = useState<number | null>(null);
    const [photoIncreasePrice, setPhotoIncreasePrice] = useState<number | null>(null);

    // Track the calculated total cost so we can update finalPrice in step2Data
    const [totalCost, setTotalCost] = useState<number>(0);

    useEffect(() => {
        // console.log('guestIncreasePrice:', guestIncreasePrice);
        // console.log('photoIncreasePrice:', photoIncreasePrice);
    }, [guestIncreasePrice, photoIncreasePrice]);

    // Fetch plan details for price calculation
    const fetchPlanByID = useCallback(async (planId: string) => {
        try {
            const plan: any = await planService.getPlanById(planId);
            setGuestIncreasePrice(plan.guestLimitIncreasePricePerGuest);
            setPhotoIncreasePrice(plan.photoPoolLimitIncreasePricePerPhoto);
        } catch (error: any) {
            setGuestIncreasePrice(0);
            setPhotoIncreasePrice(0);
        }
    }, []);

    // Fetch event data and then fetch plan price
    useEffect(() => {
        const fetchEventData = async () => {
            if (!eventId) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const data: any = await dashboardService.getEventById(eventId);
                setCurrentGuestLimit(data?.customPlan?.guestLimit ?? 0);
                setCurrentPhotoPool(data?.customPlan?.photoPool ?? 0);
                setNewGuestLimit(data?.customPlan?.guestLimit ?? 0);
                setNewPhotoPool(data?.customPlan?.photoPool ?? 0);
                setCanViewGallery(data?.customPlan?.permissions?.canViewGallery ?? true);
                setCanSharePhoto(data?.customPlan?.permissions?.canSharePhotos ?? false);
                setCanDownload(data?.customPlan?.permissions?.canDownload ?? false);
                setOriginalPlan({
                    ...data,
                    planId: data?.planId,
                    customPlan: data?.customPlan,
                });
                // Fetch plan price after event data is loaded
                if (data?.planId) {
                    fetchPlanByID(data.planId);
                } else {
                    setGuestIncreasePrice(0);
                    setPhotoIncreasePrice(0);
                }
            } catch (err: any) {
                setGuestIncreasePrice(0);
                setPhotoIncreasePrice(0);
            } finally {
                setLoading(false);
            }
        };
        fetchEventData();
    }, [eventId, updateStep2Data, fetchPlanByID]);

    // Calculate total cost for increases only
    const calculateTotalCost = useCallback(() => {
        if (guestIncreasePrice === null || photoIncreasePrice === null) return 0;
        let total = 0;
        if (newGuestLimit > currentGuestLimit) {
            total += (newGuestLimit - currentGuestLimit) * guestIncreasePrice;
        }
        if (newPhotoPool > currentPhotoPool) {
            total += (newPhotoPool - currentPhotoPool) * photoIncreasePrice;
        }
        return total;
    }, [guestIncreasePrice, photoIncreasePrice, newGuestLimit, currentGuestLimit, newPhotoPool, currentPhotoPool]);

    // Update totalCost state whenever relevant values change
    useEffect(() => {
        setTotalCost(calculateTotalCost());
    }, [calculateTotalCost]);

    // Track changes and update context, including finalPrice
    useEffect(() => {
        if (!originalPlan) return;
        const changed =
            newGuestLimit !== originalPlan?.customPlan?.guestLimit ||
            newPhotoPool !== originalPlan?.customPlan?.photoPool ||
            canViewGallery !== originalPlan?.customPlan?.permissions?.canViewGallery ||
            canSharePhoto !== originalPlan?.customPlan?.permissions?.canSharePhotos ||
            canDownload !== originalPlan?.customPlan?.permissions?.canDownload ||
            totalCost !== (originalPlan?.finalPrice ?? 0);

        if (changed) {
            updateStep2Data({
                plan: {
                    ...originalPlan,
                    guestLimit: newGuestLimit,
                    photoPool: newPhotoPool,
                    permissions: {
                        canViewGallery,
                        canSharePhotos: canSharePhoto,
                        canDownload,
                    },
                    finalPrice: totalCost,
                },
            });
        }
    }, [
        newGuestLimit,
        newPhotoPool,
        canViewGallery,
        canSharePhoto,
        canDownload,
        originalPlan,
        updateStep2Data,
        totalCost,
    ]);

    const handleGuestLimitChange = (value: number) => {
        setNewGuestLimit(value);
    };

    const handlePhotoPoolChange = (value: number) => {
        setNewPhotoPool(value);
    };

    const handleProceed = () => {
        if (!eventId) return;
        navigation.navigate('CreateEventFourthStep', { upgrade: eventId });
    };

    // The button should only be enabled if totalCost > 0
    const isProceedEnabled = totalCost > 0;

    return (
        <SafeAreaView style={styles.container}>
            <Header
                title="Event Dashboard"
                subtitle="Manage and track all your events"
                logoHover={Boolean(true)}
            />
            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#3DA9B7" />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.card}>
                        <Text style={styles.title}>Upgrade Your Event Plan</Text>

                        {/* Guest Limit */}
                        <LimitInputPair
                            currentLabel="Current Guest Limit"
                            currentValue={currentGuestLimit}
                            newLabel="New Guest Limit"
                            newValue={newGuestLimit}
                            onNewValueChange={handleGuestLimitChange}
                        />

                        {/* Photo Pool */}
                        <LimitInputPair
                            currentLabel="Current Photo Pool"
                            currentValue={currentPhotoPool}
                            newLabel="New Photo Pool"
                            newValue={newPhotoPool}
                            onNewValueChange={handlePhotoPoolChange}
                        />

                        {/* Guest Permissions Section */}
                        <View style={styles.permissionsSection}>
                            {/* View Gallery */}
                            <View style={styles.permissionRow}>
                                <Text style={styles.permissionLabel}>
                                    Allow Guest to view Live Gallery?
                                </Text>
                                <ToggleSwitch checked={canViewGallery} onChange={setCanViewGallery} />
                            </View>
                            {/* Share Gallery */}
                            <View style={styles.permissionRow}>
                                <Text style={styles.permissionLabel}>
                                    Allow Guest to share Live Gallery pictures?
                                </Text>
                                <ToggleSwitch checked={canSharePhoto} onChange={setCanSharePhoto} />
                            </View>
                            {/* Download All */}
                            <View style={styles.permissionRow}>
                                <Text style={styles.permissionLabel}>
                                    Allow Guest to Download All in Live Gallery?
                                </Text>
                                <ToggleSwitch checked={canDownload} onChange={setCanDownload} />
                            </View>

                            {/* Note Box */}
                            <View style={styles.noteBox}>
                                <Text style={styles.noteTitle}>Note:</Text>
                                <Text style={styles.noteText}>You can increase your Event Plan items.</Text>
                            </View>

                            {/* Total Cost */}
                            <View style={styles.totalCostRow}>
                                <Text style={styles.totalCostText}>
                                    Total Cost: ${totalCost.toFixed(2)}
                                </Text>
                            </View>

                            {/* Proceed to Payment Button */}
                            <TouchableOpacity
                                style={[
                                    styles.proceedButton,
                                    isProceedEnabled
                                        ? styles.proceedButtonEnabled
                                        : styles.proceedButtonDisabled,
                                ]}
                                onPress={isProceedEnabled ? handleProceed : undefined}
                                disabled={!isProceedEnabled}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6FFFF',
        minHeight: hp(100),
        width: '100%',
        paddingBottom: hp(2),
        paddingHorizontal: wp(2),
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: hp(40),
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: hp(5),
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: wp(3),
        marginBottom: hp(8),
        padding: wp(4),
        marginTop: hp(2),
        width: '100%',
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    title: {
        fontSize: wp(4.2),
        fontWeight: 'bold',
        color: '#3DA9B7',
        textAlign: 'center',
        marginBottom: hp(2),
    },
    limitInputPair: {
        marginBottom: hp(2),
    },
    permissionsSection: {
        flexDirection: 'column',
        gap: hp(1.5),
        marginTop: hp(3),
    },
    permissionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F7F7F7',
        borderRadius: wp(3),
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        marginBottom: hp(1),
    },
    permissionLabel: {
        fontSize: wp(3.5),
        fontWeight: '500',
        color: '#666666',
        flex: 1,
        marginRight: wp(2),
    },
    noteBox: {
        backgroundColor: '#E6F4F7',
        borderRadius: wp(2),
        padding: wp(3),
        marginTop: hp(1),
        flexDirection: 'row',
        alignItems: 'center',
    },
    noteTitle: {
        fontWeight: 'bold',
        fontSize: wp(3),
        color: '#000',
        opacity: 0.6,
    },
    noteText: {
        color: '#626666',
        fontSize: wp(2.5),
        marginLeft: wp(2),
    },
    totalCostRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: hp(1),
        marginTop: hp(2),
    },
    totalCostText: {
        fontSize: wp(3.5),
        fontWeight: 'bold',
        color: '#3DA9B7',
    },
    proceedButton: {
        width: '100%',
        paddingVertical: hp(2.2),
        borderRadius: wp(2),
        alignItems: 'center',
        marginTop: hp(1),
    },
    proceedButtonEnabled: {
        backgroundColor: '#3DA9B7',
    },
    proceedButtonDisabled: {
        backgroundColor: '#B0C4C7',
    },
    proceedButtonText: {
        color: '#fff',
        fontSize: wp(3.8),
        fontWeight: '600',
    },
});

export default UpgradeEventScreen;
