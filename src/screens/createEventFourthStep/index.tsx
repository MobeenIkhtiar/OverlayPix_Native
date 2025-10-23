import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    Linking
} from 'react-native';
import Header from '../../components/Header';
import Stepper from '../../components/Stepper';
import PaymentForm from '../../components/PaymentForm';
import PlanDetailsCard from '../../components/PlanDetailsCard';
import { useCreateEvent } from '../../hooks/useCreateEvent';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStripe } from '@stripe/stripe-react-native';
import axios from 'axios';
import { endPoints } from '../../services/Endpoints';
import { apiService } from '../../services/api';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { wp, hp } from '../../contants/StyleGuide';
import { SafeAreaView } from 'react-native-safe-area-context';

type CreateEventResult = {
    success: boolean;
    eventId?: string;
    id?: string;
    event?: {
        eventId: string;
    };
    [key: string]: unknown;
} | undefined;

interface PaymentIntentResponse {
    id: string;
    clientSecret: string;
    amount: number;
    currency: string;
    isFreePlan: boolean;
    success?: boolean;
    message?: string;
}

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
        upgradeEvent,
        prepareDataForStorage,
        error
    } = useCreateEvent();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const [isUpgradeMode, setIsUpgradeMode] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    const { confirmPayment } = useStripe();
    const [appliedDiscountCode, setAppliedDiscountCode] = useState<string>('');
    const [selected, setSelected] = useState(step4Data?.payment?.method || 'card');
    const [paymentMessage, setPaymentMessage] = useState('');
    const [paymentMessageType, setPaymentMessageType] = useState<'success' | 'error' | ''>('');
    const [isPaymentIntent, setISPaymentIntent] = useState<boolean>(false);

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
    }, [route.params, step4Data.payment]);

    // Show error toast when error changes
    useEffect(() => {
        if (error) {
            showErrorToastWithSupport(error);
        }
    }, [error]);

    const handlePayAndContinue = async () => {
        setLoading(true);
        setPaymentMessage('');
        setPaymentMessageType('');

        try {
            // Handle free plans immediately
            if (step2Data.plan.finalPrice <= 0) {
                setISPaymentIntent(true);
                setLoading(false);
                return;
            }

            if (!confirmPayment) {
                setPaymentMessage("Stripe is not properly initialized. Please restart the app.");
                setPaymentMessageType('error');
                showErrorToastWithSupport("Stripe is not properly initialized. Please restart the app.");
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

            const paymentIntentData = {
                planId: step2Data.plan.planId,
                userId: userId,
                customPlan: {
                    guestLimit: step2Data.plan.guestLimit,
                    photoPool: step2Data.plan.photoPool,
                    photosPerGuest: step2Data.plan.photosPerGuest,
                    storageDays: step2Data.plan.storageDays
                },
                ...(isUpgradeMode
                    ? {
                        upgradePrice: step2Data.plan.finalPrice,
                        eventId: eventId
                    }
                    : { finalPrice: step2Data.plan.finalPrice - step4Data.discountPrice }
                ),
                discountCode: appliedDiscountCode || null,
                paymentMethod: selected,
            };

            let endPoint;
            if (selected === 'cashapp') {
                endPoint = isUpgradeMode ? endPoints.upgradeCashAppIntent : endPoints.createCashAppIntent;
            } else {
                endPoint = isUpgradeMode ? endPoints.upgradePaymentIntent : endPoints.createPaymentIntent;
            }

            const res = await apiService<PaymentIntentResponse>(
                endPoint,
                'POST',
                paymentIntentData
            );

            if (!res.data?.clientSecret) {
                setPaymentMessage('Invalid response from payment server.');
                setPaymentMessageType('error');
                showErrorToastWithSupport('Invalid response from payment server.');
                setLoading(false);
                return;
            }

            const { clientSecret } = res.data;

            let result: any;

            if (selected === 'card') {
                const { error: paymentError, paymentIntent } = await confirmPayment(clientSecret, {
                    paymentMethodType: 'Card',
                });

                result = {
                    error: paymentError,
                    paymentIntent
                };
            } else if (selected === 'cashapp') {
                setPaymentMessage("Initiating Cash App payment...");
                setPaymentMessageType('');

                const eventDataToStore = {
                    step1Data,
                    step2Data,
                    step3Data,
                    step4Data: {
                        ...step4Data,
                        payment: {
                            method: selected,
                            paymentIntentId: ''
                        }
                    },
                    isUpgradeMode,
                    eventId
                };

                const preparedData = await prepareDataForStorage(eventDataToStore);
                await AsyncStorage.setItem('pendingEventData', JSON.stringify(preparedData));
                console.log('Stored event data for Cash App payment:', preparedData);

                try {
                    const { error: cashAppError, paymentIntent } = await confirmPayment(clientSecret, {
                        paymentMethodType: 'CashApp',
                        paymentMethodData: {}
                    });

                    result = { error: cashAppError, paymentIntent };
                } catch (paymentError) {
                    console.error('Cash App payment error:', paymentError);
                    await AsyncStorage.removeItem('pendingEventData');
                    setPaymentMessage("Failed to initiate Cash App payment. Please try again or select a different payment method.");
                    setPaymentMessageType('error');
                    showErrorToastWithSupport("Failed to initiate Cash App payment. Please try again or select a different payment method.");
                    setLoading(false);
                    return;
                }
            } else {
                setPaymentMessage("Invalid payment method selected.");
                setPaymentMessageType('error');
                showErrorToastWithSupport("Invalid payment method selected.");
                setLoading(false);
                return;
            }

            // Handle payment result
            if (result.error) {
                setPaymentMessage(result.error.message || "Payment failed.");
                setPaymentMessageType('error');
                showErrorToastWithSupport(result.error.message || "Payment failed.");
                setLoading(false);
                return;
            }

            const paymentStatus = result.paymentIntent?.status;
            console.log('Payment status:', paymentStatus);

            switch (paymentStatus) {
                case 'Succeeded':
                    setPaymentMessage("✅ Payment successful!");
                    setPaymentMessageType('success');
                    updateStep4Data({
                        payment: {
                            method: selected,
                            paymentIntentId: result.paymentIntent?.id
                        }
                    });
                    // Proceed with event creation/upgrade
                    setISPaymentIntent(true);
                    break;

                case 'requires_action':
                case 'requires_payment_method':
                    if (selected === 'cashapp') {
                        setPaymentMessage("✅ Cash App payment initiated! Please complete the payment in your Cash App.");
                        setPaymentMessageType('success');
                        updateStep4Data({
                            payment: {
                                method: selected,
                                paymentIntentId: result.paymentIntent?.id
                            }
                        });
                        // For Cash App, we might need to wait for webhook confirmation
                        // For now, proceed with event creation
                        setISPaymentIntent(true);
                    } else {
                        setPaymentMessage("Payment requires additional action. Please try again.");
                        setPaymentMessageType('error');
                        showErrorToastWithSupport("Payment requires additional action. Please try again.");
                        setLoading(false);
                        return;
                    }
                    break;

                case 'processing':
                    setPaymentMessage("Payment is processing. This may take a few moments...");
                    setPaymentMessageType('');
                    // Wait a bit and check status again, or rely on webhooks
                    setTimeout(() => {
                        setISPaymentIntent(true);
                    }, 2000);
                    break;

                case 'canceled':
                    setPaymentMessage("Payment was canceled. Please try again.");
                    setPaymentMessageType('error');
                    showErrorToastWithSupport("Payment was canceled. Please try again.");
                    setLoading(false);
                    return;

                default:
                    console.log('Unknown payment status:', paymentStatus);
                    setPaymentMessage(`Payment status: ${paymentStatus}. Please check your payment method.`);
                    setPaymentMessageType('error');
                    showErrorToastWithSupport(`Payment status: ${paymentStatus}. Please check your payment method.`);
                    setLoading(false);
                    return;
            }

            // For upgrade mode, handle immediately
            if (isUpgradeMode && eventId && paymentStatus === 'succeeded') {
                const upgradeRes = await upgradeEvent(eventId);
                if (upgradeRes?.success) {
                    navigation.navigate('EventCreatedScreen', { eventId });
                } else {
                    setPaymentMessage('Error occurred during event upgrade.');
                    setPaymentMessageType('error');
                    showErrorToastWithSupport('Error occurred during event upgrade.');
                }
                setLoading(false);
            }

        } catch (paymentError: unknown) {
            console.error('Payment error:', paymentError);
            if (axios.isAxiosError(paymentError)) {
                const status = paymentError.response?.status;
                if (status === 401) {
                    setPaymentMessage('Session expired. Please login again.');
                    setPaymentMessageType('error');
                    showErrorToastWithSupport('Session expired. Please login again.');
                } else if (status === 403) {
                    setPaymentMessage('Access denied. Please check your permissions.');
                    setPaymentMessageType('error');
                    showErrorToastWithSupport('Access denied. Please check your permissions.');
                } else {
                    setPaymentMessage(paymentError.response?.data?.message || 'An error occurred. Please try again.');
                    setPaymentMessageType('error');
                    showErrorToastWithSupport(paymentError.response?.data?.message || 'An error occurred. Please try again.');
                }
            } else {
                setPaymentMessage('An unexpected error occurred. Please try again.');
                setPaymentMessageType('error');
                showErrorToastWithSupport('An unexpected error occurred. Please try again.');
            }
            setLoading(false);
        }
    };

    useEffect(() => {
        const createEventLocal = async () => {
            try {
                console.log('Creating event with data:', { step2Data, step4Data });

                const result = await (createEvent() as Promise<CreateEventResult>);
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
            } catch (createError) {
                console.error('Error in createEventLocal:', createError);
                const msg = createError instanceof Error ? createError.message : 'Error occurred during event creation.';
                setPaymentMessage(msg);
                setPaymentMessageType('error');
                showErrorToastWithSupport(msg);
            } finally {
                setISPaymentIntent(false);
                setLoading(false);
            }
        }

        if (isPaymentIntent) {
            createEventLocal();
        }

    }, [isPaymentIntent, createEvent, navigation, step2Data, step4Data])

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
                <View style={styles.formCard}>
                    <PaymentForm
                        paymentData={step4Data.payment}
                        isUpgradeMode={isUpgradeMode}
                        eventId={eventId}
                        setAppliedDiscountCode={setAppliedDiscountCode}
                        appliedDiscountCode={appliedDiscountCode}
                        setSelected={setSelected}
                        selected={selected}
                        paymentMessage={paymentMessage}
                        paymentMessageType={paymentMessageType}
                        onDiscountUpdate={(discount: number) => {
                            updateStep4Data({ discountPrice: discount })
                        }}
                    />

                    <PlanDetailsCard
                        handlePayAndContinue={handlePayAndContinue}
                        isEditMode={isEditMode}
                        loading={loading}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6FEFF',
    },
    contentContainer: {
        padding: wp(3),
        paddingBottom: hp(10),
    },
    formCard: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        borderRadius: wp(2.5),
        width: '100%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: hp(2),
    },
});

export default CreateEventFourthStep;
