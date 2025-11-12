import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Image,
    StyleSheet,
    ActivityIndicator,
    Platform
} from 'react-native';
import type { EventPayment } from '../types/createEvent';
import { CardField, useStripe, PlatformPay } from '@stripe/stripe-react-native';
import { useCreateEvent } from '../hooks/useCreateEvent';
import { planService } from '../services/planService';
import { icons } from '../contants/Icons';
import { wp, hp } from '../contants/StyleGuide';

const getPaymentMethods = (isApplePaySupported: boolean, isGooglePaySupported: boolean) => {
    const methods = [
        {
            label: 'Credit Card',
            value: 'card',
            icons: [icons.mastercardLogo, icons.visa],
        },
    ];

    if (Platform.OS === 'ios' && isApplePaySupported) {
        methods.push({
            label: 'Apple Pay',
            value: 'applepay',
            icons: [icons.applePay],
        });
    }

    if (Platform.OS === 'android' && isGooglePaySupported) {
        methods.push({
            label: 'Google Pay',
            value: 'googlepay',
            icons: [icons.googlePay],
        });
    }

    // Add Cash App Pay (available on both iOS and Android)
    methods.push({
        label: 'Cash App Pay',
        value: 'cashapp',
        icons: [icons.cashApp],
    });

    // Add PayPal (available on both iOS and Android)
    methods.push({
        label: 'PayPal',
        value: 'paypal',
        icons: [icons.paypal],
    });

    return methods;
};

interface PaymentFormProps {
    paymentData?: EventPayment;
    onDiscountUpdate?: (discount: number) => void;
    isUpgradeMode: boolean;
    eventId: string;
    setAppliedDiscountCode: (val: string) => void;
    appliedDiscountCode: string;
    selected: string;
    setSelected: (val: string) => void;
    paymentMessage: string;
    paymentMessageType: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
    onDiscountUpdate,
    isUpgradeMode,
    setAppliedDiscountCode,
    appliedDiscountCode,
    selected,
    setSelected,
    paymentMessage,
    paymentMessageType
}) => {
    const [discount, setDiscount] = useState('');
    const [CodeLoading, setCodeLoading] = useState<boolean>(false);

    const [discountMessage, setDiscountMessage] = useState('');
    const [discountMessageType, setDiscountMessageType] = useState<'success' | 'error' | ''>('');
    const [isApplePaySupported, setIsApplePaySupported] = useState(false);
    const [isGooglePaySupported, setIsGooglePaySupported] = useState(false);

    const { step2Data } = useCreateEvent();
    const { isPlatformPaySupported, confirmPlatformPayPayment } = useStripe();
    const isFreePlan = step2Data?.plan?.finalPrice === 0;

    // Check if Apple Pay or Google Pay is supported
    useEffect(() => {
        const checkPlatformPaySupport = async () => {
            try {
                const isSupported = await isPlatformPaySupported();
                if (Platform.OS === 'ios') {
                    setIsApplePaySupported(isSupported);
                } else if (Platform.OS === 'android') {
                    setIsGooglePaySupported(isSupported);
                }
            } catch (error) {
                console.error('Error checking platform pay support:', error);
            }
        };
        checkPlatformPaySupport();
    }, [isPlatformPaySupported]);

    const handleApplyDicountCode = async (discountCode: string) => {
        setCodeLoading(true);
        setDiscountMessage('');
        setDiscountMessageType('');
        try {
            const res = await planService.validateDiscountCode(discountCode);
            if (
                res.success &&
                res.data &&
                res.data.isValid === true &&
                res.data.discountCode
            ) {
                const { discountType, discountValue, code } = res.data.discountCode;
                setDiscountMessage(
                    `Discount applied! ${discountValue}${discountType === 'percentage' ? '%' : ''} off with code "${code}".`
                );
                setDiscountMessageType('success');
                setAppliedDiscountCode(code);

                let discountAmount = 0;
                if (discountType === 'percentage') {
                    if (typeof step2Data?.plan?.finalPrice === 'number') {
                        discountAmount = (step2Data.plan.finalPrice * discountValue) / 100;
                    }
                } else {
                    discountAmount = discountValue;
                }
                onDiscountUpdate?.(discountAmount);
            } else {
                setDiscountMessage(res.message || 'Invalid discount code.');
                setDiscountMessageType('error');
            }
        } catch (error) {
            setDiscountMessage('Failed to validate discount code.');
            setDiscountMessageType('error');
        } finally {
            setCodeLoading(false);
        }
    };

    const handleClearDiscountCode = () => {
        setAppliedDiscountCode('');
        setDiscount('');
        setDiscountMessage('');
        setDiscountMessageType('');
        onDiscountUpdate?.(0);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Payment</Text>
            {step2Data?.plan?.finalPrice > 0 && (
                <Text style={styles.subtitle}>Complete your purchase</Text>
            )}

            {/* Payment method selection */}
            {!isFreePlan && (
                <View style={styles.paymentMethodsContainer}>
                    {getPaymentMethods(isApplePaySupported, isGooglePaySupported).map((method: any) => {
                        const isSelected = selected === method.value;

                        return (
                            <TouchableOpacity
                                key={method.value}
                                style={[
                                    styles.paymentMethodButton,
                                    isSelected && styles.paymentMethodButtonSelected
                                ]}
                                onPress={() => {
                                    setSelected(method.value);
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.paymentMethodLabel}>{method.label}</Text>
                                <View style={styles.paymentMethodIcons}>
                                    {method.icons.map((icon: any, i: number) => (
                                        <Image
                                            key={i}
                                            source={icon}
                                            style={styles.paymentIcon}
                                            resizeMode="contain"
                                        />
                                    ))}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            {/* Card Payment */}
            {!isFreePlan && selected === 'card' && (
                <View style={styles.cardDetailsContainer}>
                    <Text style={styles.label}>Card Details</Text>
                    <CardField
                        postalCodeEnabled={false}
                        placeholders={{
                            number: '4242 4242 4242 4242',
                        }}
                        cardStyle={{
                            backgroundColor: '#FFFFFF',
                            placeholderColor: '#9e9e9e',
                            textColor: '#333333',
                            borderColor: '#E6F7FA',
                            borderWidth: 1,
                            borderRadius: wp(2),
                        }}
                        style={styles.cardField}
                    />
                </View>
            )}

            {/* Apple Pay Payment */}
            {!isFreePlan && selected === 'applepay' && Platform.OS === 'ios' && (
                <View style={styles.digitalPaymentContainer}>
                    <Text style={styles.label}>Apple Pay</Text>
                    <View style={styles.digitalPaymentBox}>
                        <View style={styles.digitalPaymentContent}>
                            <Image
                                source={icons.applePay}
                                style={styles.digitalPaymentIcon}
                                resizeMode="contain"
                            />
                            <Text style={styles.digitalPaymentText}>
                                Pay securely with Apple Pay
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.digitalPaymentNote}>
                        You'll be prompted to authenticate with Face ID, Touch ID, or passcode when you complete your purchase.
                    </Text>
                </View>
            )}

            {/* Google Pay Payment */}
            {!isFreePlan && selected === 'googlepay' && Platform.OS === 'android' && (
                <View style={styles.digitalPaymentContainer}>
                    <Text style={styles.label}>Google Pay</Text>
                    <View style={styles.digitalPaymentBox}>
                        <View style={styles.digitalPaymentContent}>
                            <Image
                                source={icons.googlePay}
                                style={styles.digitalPaymentIcon}
                                resizeMode="contain"
                            />
                            <Text style={styles.digitalPaymentText}>
                                Pay securely with Google Pay
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.digitalPaymentNote}>
                        You'll be prompted to confirm your payment with Google Pay when you complete your purchase.
                    </Text>
                </View>
            )}

            {/* Cash App Pay Payment */}
            {!isFreePlan && selected === 'cashapp' && (
                <View style={styles.digitalPaymentContainer}>
                    <Text style={styles.label}>Cash App Pay</Text>
                    <View style={styles.digitalPaymentBox}>
                        <View style={styles.digitalPaymentContent}>
                            <Image
                                source={icons.cashApp}
                                style={styles.digitalPaymentIcon}
                                resizeMode="contain"
                            />
                            <Text style={styles.digitalPaymentText}>
                                Pay securely with Cash App
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.digitalPaymentNote}>
                        You'll be redirected to Cash App to complete your payment securely.
                    </Text>
                </View>
            )}

            {/* PayPal Payment */}
            {!isFreePlan && selected === 'paypal' && (
                <View style={styles.digitalPaymentContainer}>
                    <Text style={styles.label}>PayPal</Text>
                    <View style={styles.digitalPaymentBox}>
                        <View style={styles.digitalPaymentContent}>
                            <Image
                                source={icons.paypal}
                                style={styles.digitalPaymentIcon}
                                resizeMode="contain"
                            />
                            <Text style={styles.digitalPaymentText}>
                                Pay securely with PayPal
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.digitalPaymentNote}>
                        You'll be redirected to PayPal to complete your payment securely.
                    </Text>
                </View>
            )}

            {/* Discount Code */}
            {step2Data?.plan?.finalPrice > 0 && !isUpgradeMode && (
                <View style={styles.discountContainer}>
                    <Text style={styles.label}>Discount Code</Text>
                    <View style={styles.discountInputRow}>
                        <TextInput
                            style={styles.discountInput}
                            placeholder="234151-afs"
                            placeholderTextColor="#999999"
                            value={discount}
                            onChangeText={setDiscount}
                            editable={!appliedDiscountCode}
                        />
                        {appliedDiscountCode ? (
                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={handleClearDiscountCode}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.clearButtonText}>Clear</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[
                                    styles.applyButton,
                                    (CodeLoading || !discount.trim()) && styles.applyButtonDisabled
                                ]}
                                onPress={() => handleApplyDicountCode(discount)}
                                disabled={CodeLoading || !discount.trim()}
                                activeOpacity={0.7}
                            >
                                {CodeLoading ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.applyButtonText}>Apply</Text>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                    {discountMessage && (
                        <Text style={[
                            styles.discountMessage,
                            discountMessageType === 'success' ? styles.successMessage : styles.errorMessage
                        ]}>
                            {discountMessage}
                        </Text>
                    )}
                </View>
            )}

            {paymentMessage && (
                <Text style={[
                    styles.paymentMessage,
                    paymentMessageType === 'success' ? styles.successMessage : styles.errorMessage
                ]}>
                    {paymentMessage}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    title: {
        fontSize: wp(5.5),
        fontWeight: 'bold',
        color: '#3DA9B7',
        textAlign: 'left',
        marginBottom: hp(0.5),
    },
    subtitle: {
        fontSize: wp(3.5),
        color: '#666666',
        fontWeight: '400',
        textAlign: 'left',
        marginBottom: hp(2),
    },
    paymentMethodsContainer: {
        gap: hp(1),
        marginBottom: hp(2),
    },
    paymentMethodButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        borderRadius: wp(2),
        borderWidth: 1,
        borderColor: '#CCCCCC',
        backgroundColor: '#FFFFFF',
    },
    paymentMethodButtonSelected: {
        backgroundColor: '#EFF8F9',
        borderColor: '#86C9D2',
    },
    paymentMethodButtonDisabled: {
        opacity: 0.5,
    },
    paymentMethodLabel: {
        fontWeight: '500',
        fontSize: wp(3),
        color: '#626B6C',
    },
    paymentMethodIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
    },
    paymentIcon: {
        height: hp(2),
        width: wp(8),
    },
    cardDetailsContainer: {
        gap: hp(1.5),
        marginTop: hp(1),
    },
    label: {
        fontSize: wp(4),
        color: '#666666',
        fontWeight: '500',
        textAlign: 'left',
    },
    cardField: {
        width: '100%',
        height: hp(6),
        marginVertical: hp(1),
    },
    placeholderText: {
        fontSize: wp(3.5),
        color: '#999999',
        textAlign: 'center',
    },
    digitalPaymentContainer: {
        gap: hp(1.5),
        marginTop: hp(1),
    },
    digitalPaymentBox: {
        borderWidth: 1,
        borderColor: '#E6F7FA',
        borderRadius: wp(2),
        paddingHorizontal: wp(3),
        paddingVertical: hp(2),
        minHeight: hp(6),
        backgroundColor: '#F9F9F9',
    },
    digitalPaymentContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: hp(5),
    },
    digitalPaymentIcon: {
        height: hp(4),
        width: wp(12),
        marginRight: wp(2),
    },
    digitalPaymentText: {
        fontSize: wp(3.5),
        color: '#666666',
        fontWeight: '500',
    },
    digitalPaymentNote: {
        fontSize: wp(3),
        color: '#999999',
        marginTop: hp(1),
        lineHeight: wp(4.5),
    },
    loadingContainer: {
        marginTop: hp(2),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: hp(6),
        borderWidth: 1,
        borderColor: '#E6E6E6',
        borderRadius: wp(2),
        backgroundColor: '#F5F5F5',
        gap: wp(2),
    },
    loadingText: {
        fontSize: wp(3.5),
        color: '#666666',
    },
    discountContainer: {
        marginTop: hp(2),
    },
    discountInputRow: {
        flexDirection: 'row',
        gap: wp(2),
        marginTop: hp(0.5),
    },
    discountInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E6F7FA',
        fontSize: wp(3),
        borderRadius: wp(2),
        paddingHorizontal: wp(3),
        paddingVertical: hp(1.5),
        backgroundColor: '#FFFFFF',
        color: '#333333',
    },
    clearButton: {
        backgroundColor: '#EF4444',
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        borderRadius: wp(2),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    clearButtonText: {
        fontSize: wp(3.5),
        color: '#FFFFFF',
        fontWeight: '600',
    },
    applyButton: {
        backgroundColor: '#3DA9B7',
        paddingHorizontal: wp(8),
        paddingVertical: hp(1.5),
        borderRadius: wp(2),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        minWidth: wp(20),
    },
    applyButtonDisabled: {
        opacity: 0.5,
    },
    applyButtonText: {
        fontSize: wp(3.5),
        color: '#FFFFFF',
        fontWeight: '600',
    },
    discountMessage: {
        fontSize: wp(3),
        marginTop: hp(0.5),
    },
    paymentMessage: {
        fontSize: wp(3.5),
        marginTop: hp(1),
    },
    successMessage: {
        color: '#16A34A',
    },
    errorMessage: {
        color: '#EF4444',
    },
});

export default PaymentForm;
