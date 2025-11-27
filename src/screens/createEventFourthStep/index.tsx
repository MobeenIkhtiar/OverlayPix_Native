import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    Linking,
    AppState
} from 'react-native';
import Header from '../../components/Header';
import Stepper from '../../components/Stepper';
import PaymentForm from '../../components/PaymentForm';
import PlanDetailsCard from '../../components/PlanDetailsCard';
import { useCreateEvent } from '../../hooks/useCreateEvent';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStripe, isPlatformPaySupported } from '@stripe/stripe-react-native';
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

    const { confirmPayment, confirmPlatformPayPayment } = useStripe();
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

            // Use standard payment intent endpoint for all payment methods
            const endPoint = isUpgradeMode ? endPoints.upgradePaymentIntent : endPoints.createPaymentIntent;

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
            } else if (selected === 'applepay' || selected === 'googlepay') {
                // Handle Apple Pay and Google Pay using Platform Pay
                setPaymentMessage(`Initiating ${selected === 'applepay' ? 'Apple Pay' : 'Google Pay'} payment...`);
                setPaymentMessageType('');

                try {
                    // First check if platform pay is supported
                    const isSupported = await isPlatformPaySupported();
                    if (!isSupported) {
                        setPaymentMessage(`${selected === 'applepay' ? 'Apple Pay' : 'Google Pay'} is not available on this device.`);
                        setPaymentMessageType('error');
                        showErrorToastWithSupport(`${selected === 'applepay' ? 'Apple Pay' : 'Google Pay'} is not available on this device.`);
                        setLoading(false);
                        return;
                    }

                    // Confirm payment using Platform Pay
                    const { error: platformPayError, paymentIntent } = await confirmPlatformPayPayment(
                        clientSecret,
                        {
                            applePay: {
                                cartItems: [
                                    {
                                        label: 'Event Plan',
                                        amount: ((step2Data?.plan?.finalPrice || 0) - (step4Data?.discountPrice || 0)).toFixed(2),
                                        paymentType: 'Immediate' as any,
                                    },
                                ],
                                merchantCountryCode: 'US',
                                currencyCode: 'USD',
                                requiredShippingAddressFields: [],
                                requiredBillingContactFields: [],
                            },
                            googlePay: {
                                testEnv: __DEV__,
                                merchantName: 'OverlayPix',
                                merchantCountryCode: 'US',
                                currencyCode: 'USD',
                                billingAddressConfig: {
                                    isRequired: false,
                                },
                            },
                        }
                    );

                    result = { error: platformPayError, paymentIntent };
                } catch (paymentError) {
                    console.error(`${selected === 'applepay' ? 'Apple Pay' : 'Google Pay'} payment error:`, paymentError);
                    setPaymentMessage(`Failed to initiate ${selected === 'applepay' ? 'Apple Pay' : 'Google Pay'} payment. Please try again or select a different payment method.`);
                    setPaymentMessageType('error');
                    showErrorToastWithSupport(`Failed to initiate ${selected === 'applepay' ? 'Apple Pay' : 'Google Pay'} payment. Please try again or select a different payment method.`);
                    setLoading(false);
                    return;
                }
            } else if (selected === 'cashapp') {
                // Handle Cash App Pay
                setPaymentMessage('Initiating Cash App Pay payment...');
                setPaymentMessageType('');

                try {
                    const { error: cashAppError, paymentIntent } = await confirmPayment(clientSecret, {
                        paymentMethodType: 'CashApp'
                    });

                    result = {
                        error: cashAppError,
                        paymentIntent
                    };
                } catch (paymentError) {
                    console.error('Cash App Pay payment error:', paymentError);
                    setPaymentMessage('Failed to initiate Cash App Pay payment. Please try again or select a different payment method.');
                    setPaymentMessageType('error');
                    showErrorToastWithSupport('Failed to initiate Cash App Pay payment. Please try again or select a different payment method.');
                    setLoading(false);
                    return;
                }
            } else if (selected === 'paypal') {
                // Handle PayPal payment
                setPaymentMessage('Initiating PayPal payment...');
                setPaymentMessageType('');

                try {
                    // Create PayPal order using the backend API
                    const paypalOrderData = {
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
                        returnUrl: 'overlaypix://paypal/success',
                        cancelUrl: 'overlaypix://paypal/cancel',
                    };

                    console.log('Creating PayPal order with data:', paypalOrderData);
                    
                    // Use different endpoint based on upgrade mode
                    const paypalEndpoint = isUpgradeMode 
                        ? endPoints.paypalUpgradeOrder 
                        : endPoints.createPayalIntent;
                    
                    console.log('Using PayPal endpoint:', paypalEndpoint);
                    
                    const paypalOrderRes = await apiService<{ 
                        id?: string; 
                        orderId?: string; 
                        approvalUrl: string;
                        success?: boolean;
                    }>(
                        paypalEndpoint,
                        'POST',
                        paypalOrderData
                    );

                    console.log('PayPal order response:', paypalOrderRes.data);

                    // Handle both 'id' and 'orderId' response formats
                    const orderId = paypalOrderRes.data?.id || paypalOrderRes.data?.orderId;
                    const approvalUrl = paypalOrderRes.data?.approvalUrl;

                    if (!orderId || !approvalUrl) {
                        console.error('Invalid PayPal response:', paypalOrderRes.data);
                        setPaymentMessage(`Failed to create PayPal order. Response: ${JSON.stringify(paypalOrderRes.data)}`);
                        setPaymentMessageType('error');
                        showErrorToastWithSupport('Failed to create PayPal order. Check console for details.');
                        setLoading(false);
                        return;
                    }

                    // Store the order ID BEFORE opening PayPal (in both state and AsyncStorage)
                    console.log('💾 Storing PayPal order ID:', orderId);
                    
                    // Store in AsyncStorage for persistence across app background/foreground
                    await AsyncStorage.setItem('pendingPaypalOrderId', orderId);
                    await AsyncStorage.setItem('pendingPaypalPaymentMethod', 'paypal');
                    
                    updateStep4Data({
                        payment: {
                            method: selected,
                            paypalOrderId: orderId
                        }
                    });

                    // Open PayPal approval URL in browser
                    const canOpen = await Linking.canOpenURL(approvalUrl);
                    if (canOpen) {
                        setPaymentMessage('Opening PayPal... Please complete your payment.');
                        setPaymentMessageType('');
                        
                        // Small delay to ensure state is updated
                        await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
                        
                        await Linking.openURL(approvalUrl);
                        
                        // Keep loading state - will be handled by deep link
                        setPaymentMessage('Waiting for PayPal payment...');
                        // Don't set loading to false - deep link will handle it
                        return;
                    } else {
                        setPaymentMessage('Unable to open PayPal. Please try again.');
                        setPaymentMessageType('error');
                        showErrorToastWithSupport('Unable to open PayPal. Please try again.');
                        setLoading(false);
                        return;
                    }
                } catch (paymentError: any) {
                    console.error('PayPal payment error:', paymentError);
                    console.error('PayPal error details:', {
                        message: paymentError?.message,
                        response: paymentError?.response?.data,
                        status: paymentError?.response?.status
                    });
                    
                    const errorMsg = paymentError?.response?.data?.message || 
                                   paymentError?.message || 
                                   'Failed to initiate PayPal payment';
                    
                    setPaymentMessage(`${errorMsg}. Please try again or select a different payment method.`);
                    setPaymentMessageType('error');
                    showErrorToastWithSupport(`${errorMsg}. Please check console for details.`);
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
                case 'succeeded':
                    setPaymentMessage("✅ Payment successful!");
                    setPaymentMessageType('success');
                    updateStep4Data({
                        payment: {
                            method: selected,
                            paymentIntentId: result.paymentIntent?.id
                        }
                    });
                    // Proceed with event creation/upgrade
                    // Only trigger useEffect for create mode, not upgrade
                    if (!isUpgradeMode) {
                        setISPaymentIntent(true);
                    }
                    break;

                case 'requires_action':
                case 'requires_payment_method':
                    setPaymentMessage("Payment requires additional action. Please try again.");
                    setPaymentMessageType('error');
                    showErrorToastWithSupport("Payment requires additional action. Please try again.");
                    setLoading(false);
                    return;

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

            // For upgrade mode, handle immediately and return
            if (isUpgradeMode && eventId && (paymentStatus === 'succeeded' || paymentStatus === 'Succeeded')) {
                const upgradeRes = await upgradeEvent(eventId);
                if (upgradeRes?.success) {
                    navigation.navigate('eventCreatedScreen', { eventId });
                } else {
                    setPaymentMessage('Error occurred during event upgrade.');
                    setPaymentMessageType('error');
                    showErrorToastWithSupport('Error occurred during event upgrade.');
                }
                setLoading(false);
                return; // CRITICAL: Exit here to prevent any further execution
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

    const handlePayPalCapture = async (orderId: string) => {
        setLoading(true);
        setPaymentMessage('Capturing PayPal payment...');
        setPaymentMessageType('');

        try {
            // console.log('🎯 Capturing PayPal payment for order:', orderId);
            // console.log('🔍 Current state - isUpgradeMode:', isUpgradeMode);
            // console.log('🔍 Current state - eventId:', eventId);
            // console.log('🔍 Current state - step4Data:', step4Data);
            
            const token = await AsyncStorage.getItem('token');
            const userId = await AsyncStorage.getItem('uid');

            if (!token) {
                setPaymentMessage("Authentication required. Please log in again.");
                setPaymentMessageType('error');
                showErrorToastWithSupport("Authentication required. Please log in again.");
                setLoading(false);
                return;
            }

            // Capture the PayPal payment
            const captureRes = await apiService<{ success: boolean; status: string }>(
                endPoints.confirmPayalIntent,
                'POST',
                { orderId }
            );

            console.log('PayPal capture response:', captureRes.data);

            if (captureRes.data?.success && captureRes.data?.status === 'COMPLETED') {
                console.log('✅ PayPal payment captured successfully!');
                setPaymentMessage("✅ PayPal payment successful!");
                setPaymentMessageType('success');
                
                updateStep4Data({
                    payment: {
                        method: 'paypal',
                        paypalOrderId: orderId
                    }
                });

                // Proceed with event creation/upgrade
                if (!isUpgradeMode) {
                    console.log('📝 Creating new event...');
                    setISPaymentIntent(true);
                } else if (isUpgradeMode && eventId) {
                    console.log('⬆️ Upgrading event:', eventId);
                    console.log('Calling upgradeEvent with eventId:', eventId);
                    
                    try {
                        const upgradeRes = await upgradeEvent(eventId);
                        console.log('Upgrade event response:', upgradeRes);
                        
                        if (upgradeRes?.success) {
                            console.log('✅ Event upgraded successfully!');
                            setPaymentMessage('Event upgraded successfully!');
                            setPaymentMessageType('success');
                            navigation.navigate('eventCreatedScreen', { eventId });
                        } else {
                            console.error('❌ Event upgrade failed:', upgradeRes);
                            setPaymentMessage('Error occurred during event upgrade.');
                            setPaymentMessageType('error');
                            showErrorToastWithSupport('Error occurred during event upgrade.');
                        }
                    } catch (upgradeError) {
                        console.error('❌ Error upgrading event:', upgradeError);
                        setPaymentMessage('Error occurred during event upgrade.');
                        setPaymentMessageType('error');
                        showErrorToastWithSupport('Error occurred during event upgrade.');
                    }
                    setLoading(false);
                } else {
                    console.error('❌ Upgrade mode but no eventId found');
                    setPaymentMessage('Event ID not found for upgrade.');
                    setPaymentMessageType('error');
                    setLoading(false);
                }
            } else {
                console.error('❌ PayPal capture failed:', captureRes.data);
                setPaymentMessage('PayPal payment capture failed. Please try again.');
                setPaymentMessageType('error');
                showErrorToastWithSupport('PayPal payment capture failed. Please try again.');
                setLoading(false);
            }
        } catch (error) {
            console.error('PayPal capture error:', error);
            setPaymentMessage('Failed to capture PayPal payment. Please try again.');
            setPaymentMessageType('error');
            showErrorToastWithSupport('Failed to capture PayPal payment. Please try again.');
            setLoading(false);
        }
    };

    useEffect(() => {
        const createEventLocal = async () => {
            try {
                // Safety check: Don't create event if in upgrade mode
                if (isUpgradeMode) {
                    console.log('Skipping createEvent - in upgrade mode');
                    return;
                }

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

    // Handle AppState changes (when app comes back from background)
    useEffect(() => {
        console.log('👀 AppState listener mounted');
        
        const handleAppStateChange = async (nextAppState: string) => {
            console.log('📱 App state changed to:', nextAppState);
            
            if (nextAppState === 'active') {
                console.log('✨ App became active, checking for pending PayPal order...');
                
                // Check if there's a pending PayPal order
                const pendingOrderId = await AsyncStorage.getItem('pendingPaypalOrderId');
                
                if (pendingOrderId) {
                    console.log('🔍 Found pending PayPal order:', pendingOrderId);
                    console.log('🎯 Auto-capturing payment...');
                    
                    // Update state
                    updateStep4Data({
                        payment: {
                            method: 'paypal',
                            paypalOrderId: pendingOrderId
                        }
                    });
                    
                    // Capture the payment
                    await handlePayPalCapture(pendingOrderId);
                    
                    // Clean up
                    await AsyncStorage.removeItem('pendingPaypalOrderId');
                    await AsyncStorage.removeItem('pendingPaypalPaymentMethod');
                } else {
                    console.log('ℹ️ No pending PayPal order found');
                }
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            console.log('🧹 Cleaning up AppState listener');
            subscription.remove();
        };
    }, []);

    // Handle deep linking from PayPal
    useEffect(() => {
        console.log('🎬 Deep link useEffect mounted/updated');
        
        const handleDeepLink = async (event: { url: string }) => {
            const url = event.url;
            console.log('🔗 Deep link received:', url);
            console.log('📦 Current step4Data:', step4Data);
            console.log('🆔 PayPal Order ID in state:', step4Data?.payment?.paypalOrderId);

            // Check if this is a PayPal return URL
            if (url.includes('overlaypix://paypal')) {
                console.log('✅ PayPal redirect detected');
                
                if (url.includes('success')) {
                    // Payment was successful
                    console.log('💰 PayPal payment successful, capturing...');
                    
                    // Try to get order ID from state first, then AsyncStorage
                    let paypalOrderId: string | undefined = step4Data?.payment?.paypalOrderId;
                    
                    if (!paypalOrderId) {
                        console.log('🔍 Order ID not in state, checking AsyncStorage...');
                        const storedOrderId = await AsyncStorage.getItem('pendingPaypalOrderId');
                        paypalOrderId = storedOrderId || undefined;
                        console.log('📦 Retrieved from AsyncStorage:', paypalOrderId);
                    }
                    
                    if (paypalOrderId) {
                        console.log('🎯 Calling handlePayPalCapture with ID:', paypalOrderId);
                        
                        // Update state with the order ID if it wasn't there
                        if (!step4Data?.payment?.paypalOrderId) {
                            updateStep4Data({
                                payment: {
                                    method: 'paypal',
                                    paypalOrderId: paypalOrderId
                                }
                            });
                        }
                        
                        await handlePayPalCapture(paypalOrderId);
                        
                        // Clean up AsyncStorage after successful capture
                        await AsyncStorage.removeItem('pendingPaypalOrderId');
                        await AsyncStorage.removeItem('pendingPaypalPaymentMethod');
                    } else {
                        console.error('❌ No PayPal order ID found in state or AsyncStorage');
                        console.error('Current step4Data:', JSON.stringify(step4Data, null, 2));
                        setPaymentMessage('PayPal order ID not found. Please try again.');
                        setPaymentMessageType('error');
                        setLoading(false);
                    }
                } else if (url.includes('cancel')) {
                    // Payment was cancelled
                    console.log('❌ PayPal payment cancelled');
                    
                    // Clean up AsyncStorage
                    await AsyncStorage.removeItem('pendingPaypalOrderId');
                    await AsyncStorage.removeItem('pendingPaypalPaymentMethod');
                    
                    setPaymentMessage('PayPal payment was cancelled.');
                    setPaymentMessageType('error');
                    setLoading(false);
                }
            } else {
                console.log('ℹ️ Not a PayPal deep link, ignoring');
            }
        };

        // Add event listener for deep links
        console.log('📡 Adding deep link listener...');
        const subscription = Linking.addEventListener('url', handleDeepLink);

        // Check if app was opened with a deep link
        Linking.getInitialURL().then((url) => {
            console.log('🔍 Checking initial URL:', url);
            if (url) {
                handleDeepLink({ url });
            }
        });

        return () => {
            console.log('🧹 Cleaning up deep link listener');
            subscription.remove();
        };
    }, []); // Empty dependency array - only run once on mount

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
