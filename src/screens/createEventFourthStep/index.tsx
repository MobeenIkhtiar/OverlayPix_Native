import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    Linking,
    Platform,
    Text
} from 'react-native';
import Header from '../../components/Header';
import Stepper from '../../components/Stepper';
import PaymentForm from '../../components/PaymentForm';
import PlanDetailsCard from '../../components/PlanDetailsCard';
import { useCreateEvent } from '../../hooks/useCreateEvent';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useIAP } from '../../hooks/useIAP';
import { revenueCatService } from '../../services/revenueCatService';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { wp, hp } from '../../contants/StyleGuide';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomerInfo } from 'react-native-purchases';

type CreateEventResult = {
    success: boolean;
    eventId?: string;
    id?: string;
    event?: {
        eventId: string;
    };
    [key: string]: unknown;
} | undefined;

const showErrorToastWithSupport = (message: string) => {
    Toast.show({
        type: 'error',
        text1: 'Error',
        text2: `${message}\n\nNeed help? Contact: support@overlaypix.com`,
        position: 'top',
        visibilityTime: 5000,
        autoHide: true,
        topOffset: 60,
        onPress: () => {
            Linking.openURL('mailto:support@overlaypix.com');
        }
    });
};

const CreateEventFourthStep: React.FC = () => {
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [eventId, setEventId] = useState<string>('');
    const {
        step1Data,
        step2Data,
        step3Data,
        step4Data,
        updateStep4Data,
        createEvent,
        createEventWithData,
        upgradeEvent,
        upgradeEventWithData,
        error
    } = useCreateEvent();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const [isUpgradeMode, setIsUpgradeMode] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    // RevenueCat Hook
    const {
        isInitialized: iapInitialized,
        isLoading: iapLoading,
        error: iapError,
        customerInfo,
        purchasePackage,
        getPackageByPlanId,
    } = useIAP();

    const [appliedDiscountCode, setAppliedDiscountCode] = useState<string>('');
    const [paymentMessage, setPaymentMessage] = useState('');
    const [paymentMessageType, setPaymentMessageType] = useState<'success' | 'error' | ''>('');
    // const [isPaymentComplete, setIsPaymentComplete] = useState<boolean>(false); // Removed to avoid race condition

    // console.log('step4Data=>>>>>>>', step4Data);
    // console.log('step3Data=>>>>>>>', step3Data);
    // console.log('step2Data=>>>>>>>', step2Data);
    // console.log('step1Data=>>>>>>>', step1Data);


    useEffect(() => {
        // Get params from route
        const upgradeParam = route.params?.upgrade;
        if (upgradeParam) {
            setIsUpgradeMode(true);
            setEventId(upgradeParam);
        } else {
            const editParam = route.params?.edit;
            if (editParam) {
                setIsEditMode(true);
                setEventId(editParam);
            } else {
                setIsEditMode(false);
                setIsUpgradeMode(false);
            }
        }
    }, [route.params]);

    // Show error toast when error changes
    useEffect(() => {
        if (error) {
            showErrorToastWithSupport(error);
        }
    }, [error]);

    // Show IAP error
    useEffect(() => {
        if (iapError) {
            setPaymentMessage(iapError);
            setPaymentMessageType('error');
            setLoading(false);
        }
    }, [iapError]);

    // Handle purchase completion logic moved to handlePayAndContinue to avoid infinite loop

    // useEffect for payment completion removed to avoid race condition

    // Common function to handle event creation/upgrade after payment/free check
    const processEventCompletion = async (paymentData: any) => {
        try {
            // Update context for UI consistency (though we pass data explicitly to API)
            updateStep4Data({ payment: paymentData });

            if (isUpgradeMode && eventId) {
                console.log('Upgrading event:', eventId);
                const upgradeRes = await upgradeEventWithData(eventId, {
                    step2Data,
                    step4Data: { ...step4Data, payment: paymentData }
                });

                if (upgradeRes?.success) {
                    navigation.navigate('eventCreatedScreen', { eventId });
                } else {
                    setPaymentMessage('Error occurred during event upgrade.');
                    setPaymentMessageType('error');
                    showErrorToastWithSupport('Error occurred during event upgrade.');
                }
            } else {
                // console.log('Creating event with data:', { step2Data, step4Data: { ...step4Data, payment: paymentData } });
                // console.log('Creating event with data:', { step2Data, step4Data: { ...step4Data, payment: paymentData } });
                const result = await createEvent(paymentData);
                console.log('Create event result:', result);

                if (result && result.success === true) {
                    const createdEventId = result?.event?.eventId;
                    console.log('Created event ID:', createdEventId);

                    if (createdEventId) {
                        navigation.navigate('eventCreatedScreen', { eventId: createdEventId });
                    } else {
                        const msg = 'Event created but no event ID received. Please check your events list.';
                        setPaymentMessage(msg);
                        setPaymentMessageType('error');
                        showErrorToastWithSupport(msg);
                    }
                } else {
                    const msg = 'Error occurred during event creation.';
                    setPaymentMessage(msg);
                    setPaymentMessageType('error');
                    showErrorToastWithSupport(msg);
                }
            }
        } catch (createError) {
            console.error('Error in processEventCompletion:', createError);
            const msg = createError instanceof Error ? createError.message : 'Error occurred during event creation.';
            setPaymentMessage(msg);
            setPaymentMessageType('error');
            showErrorToastWithSupport(msg);
        } finally {
            setLoading(false);
        }
    };

    const handlePayAndContinue = async () => {
        setLoading(true);
        setPaymentMessage('');
        setPaymentMessageType('');
        // setIsPaymentComplete(false); // Removed

        try {
            // Handle free plans immediately
            if (step2Data.plan.finalPrice <= 0) {
                const freePaymentData = { method: 'free' };
                await processEventCompletion(freePaymentData);
                return;
            }

            if (!iapInitialized) {
                setPaymentMessage("Payment system is not initialized. Please restart the app.");
                setPaymentMessageType('error');
                showErrorToastWithSupport("Payment system is not initialized. Please restart the app.");
                setLoading(false);
                return;
            }

            const token = await AsyncStorage.getItem('token');
            const userId = await AsyncStorage.getItem('uid');

            if (!token) {
                setPaymentMessage("Authentication required. Please log in again.");
                setPaymentMessageType('error');
                showErrorToastWithSupport("Authentication required. Please log in again.");
                setLoading(false);
                return;
            }

            if (!step2Data?.plan) {
                setPaymentMessage('Plan data is missing. Please go back and select a plan.');
                setPaymentMessageType('error');
                showErrorToastWithSupport('Plan data is missing. Please go back and select a plan.');
                setLoading(false);
                return;
            }

            // Get the RevenueCat package for this plan
            const pkg = await getPackageByPlanId(step2Data.plan.planId);

            if (!pkg) {
                setPaymentMessage('Product not available. Please try again later.');
                setPaymentMessageType('error');
                showErrorToastWithSupport('Product not available. Please try again later.');
                setLoading(false);
                return;
            }

            console.log('Purchasing package:', pkg.identifier);

            setPaymentMessage(`Initiating ${Platform.OS === 'ios' ? 'App Store' : 'Google Play'} purchase...`);
            setPaymentMessageType('');

            // FORCE set user ID before purchase to ensure correct linking
            if (userId) {
                console.log('Ensuring RevenueCat user ID is set to:', userId);
                await revenueCatService.setUserId(userId);
            }

            // Initiate purchase - RevenueCat handles validation automatically
            const purchaseResult = await purchasePackage(pkg);

            if (!purchaseResult) {
                setPaymentMessage('Purchase was not completed. Please try again.');
                setPaymentMessageType('error');
                setLoading(false);
                return;
            }

            // Purchase completed successfully
            console.log('Purchase completed successfully');

            console.log('Processing purchase with customer info:', purchaseResult);
            setPaymentMessage('Purchase successful!');
            setPaymentMessageType('success');

            try {
                // RevenueCat automatically validates receipts
                // We just need to save the customer info
                const activeEntitlements = Object.keys(purchaseResult.entitlements.active);
                const productIdentifiers = purchaseResult.allPurchasedProductIdentifiers;

                console.log('Purchase validated by RevenueCat:', {
                    entitlements: activeEntitlements,
                    products: productIdentifiers,
                });

                setPaymentMessage('✅ Purchase successful!');
                setPaymentMessageType('success');

                const rcPaymentData = {
                    method: 'revenuecat',
                    customerInfo: purchaseResult,
                    productId: productIdentifiers[0] || '',
                    transactionId: purchaseResult.originalAppUserId,
                    platform: Platform.OS as 'ios' | 'android',
                };

                // Proceed with event creation directly
                await processEventCompletion(rcPaymentData);

            } catch (err: any) {
                console.error('Error processing purchase:', err);
                setPaymentMessage(err.message || 'Failed to process purchase');
                setPaymentMessageType('error');
                setLoading(false);
            }

        } catch (purchaseError: unknown) {
            console.error('Purchase error:', purchaseError);
            if (axios.isAxiosError(purchaseError)) {
                const status = purchaseError.response?.status;
                if (status === 401) {
                    setPaymentMessage('Session expired. Please login again.');
                    setPaymentMessageType('error');
                    showErrorToastWithSupport('Session expired. Please login again.');
                } else if (status === 403) {
                    setPaymentMessage('Access denied. Please check your permissions.');
                    setPaymentMessageType('error');
                    showErrorToastWithSupport('Access denied. Please check your permissions.');
                } else {
                    setPaymentMessage(purchaseError.response?.data?.message || 'An error occurred. Please try again.');
                    setPaymentMessageType('error');
                    showErrorToastWithSupport(purchaseError.response?.data?.message || 'An error occurred. Please try again.');
                }
            } else if (purchaseError instanceof Error) {
                setPaymentMessage(purchaseError.message);
                setPaymentMessageType('error');
                showErrorToastWithSupport(purchaseError.message);
            } else {
                setPaymentMessage('An unexpected error occurred. Please try again.');
                setPaymentMessageType('error');
                showErrorToastWithSupport('An unexpected error occurred. Please try again.');
            }
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                <Header
                    title={
                        isUpgradeMode
                            ? "Upgrade Event"
                            : isEditMode
                                ? "Edit Event"
                                : "Create Event"
                    }
                    subtitle=""
                    logoHover={true}
                />
                <Stepper steps={4} activeStep={4} />

                <View style={styles.content}>

                    <PaymentForm
                        paymentData={step4Data.payment}
                        onDiscountUpdate={(discount) => {
                            updateStep4Data({ discountPrice: discount });
                        }}
                        isUpgradeMode={isUpgradeMode}
                        eventId={eventId}
                        setAppliedDiscountCode={setAppliedDiscountCode}
                        appliedDiscountCode={appliedDiscountCode}
                        paymentMessage={paymentMessage}
                        paymentMessageType={paymentMessageType}
                    />

                    <PlanDetailsCard
                        handlePayAndContinue={handlePayAndContinue}
                        loading={loading || iapLoading}
                        isEditMode={isUpgradeMode}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    contentContainer: {
        paddingBottom: hp(3),
    },
    content: {
        paddingHorizontal: wp(5),
        gap: hp(3),
    },
});

export default CreateEventFourthStep;
