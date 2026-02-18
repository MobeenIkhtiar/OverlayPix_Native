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
import { useCreateEvent } from '../hooks/useCreateEvent';
import { planService } from '../services/planService';
import { revenueCatService } from '../services/revenueCatService';
import { icons } from '../contants/Icons';
import { wp, hp } from '../contants/StyleGuide';
import { PurchasesPackage } from 'react-native-purchases';

interface PaymentFormProps {
    paymentData?: EventPayment;
    onDiscountUpdate?: (discount: number) => void;
    isUpgradeMode: boolean;
    eventId: string;
    setAppliedDiscountCode: (val: string) => void;
    appliedDiscountCode: string;
    paymentMessage: string;
    paymentMessageType: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
    onDiscountUpdate,
    isUpgradeMode,
    setAppliedDiscountCode,
    appliedDiscountCode,
    paymentMessage,
    paymentMessageType
}) => {
    const [discount, setDiscount] = useState('');
    const [CodeLoading, setCodeLoading] = useState<boolean>(false);
    const [discountMessage, setDiscountMessage] = useState('');
    const [discountMessageType, setDiscountMessageType] = useState<'success' | 'error' | ''>('');
    const [iapProduct, setIapProduct] = useState<PurchasesPackage | null>(null);
    const [loadingProduct, setLoadingProduct] = useState(false);

    const { step2Data } = useCreateEvent();
    const isFreePlan = step2Data?.plan?.finalPrice === 0;

    // Fetch RevenueCat package when plan changes
    useEffect(() => {
        const fetchRevenueCatPackage = async () => {
            if (isFreePlan || !step2Data?.plan?.planId) {
                return;
            }

            try {
                setLoadingProduct(true);
                const pkg = await revenueCatService.getPackageByPlanId(step2Data.plan.planId);
                setIapProduct(pkg);
            } catch (error) {
                console.error('Error fetching RevenueCat package:', error);
            } finally {
                setLoadingProduct(false);
            }
        };

        fetchRevenueCatPackage();
    }, [step2Data?.plan?.planId, isFreePlan]);

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

    const platformName = Platform.OS === 'ios' ? 'App Store' : 'Google Play';

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Payment</Text>
            {step2Data?.plan?.finalPrice > 0 && (
                <Text style={styles.subtitle}>Complete your purchase via {platformName}</Text>
            )}

            {/* IAP Payment Method */}
            {!isFreePlan && (
                <View style={styles.iapContainer}>
                    <Text style={styles.label}>Payment Method</Text>
                    <View style={styles.iapMethodBox}>
                        <View style={styles.iapMethodContent}>
                            <Image
                                source={Platform.OS === 'ios' ? icons.applePay : icons.googlePay}
                                style={styles.iapIcon}
                                resizeMode="contain"
                            />
                            <View style={styles.iapTextContainer}>
                                <Text style={styles.iapMethodText}>
                                    {Platform.OS === 'ios' ? 'App Store' : 'Google Play'}
                                </Text>
                                <Text style={styles.iapSubtext}>
                                    Secure payment through {platformName}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Product Info */}
                    {loadingProduct ? (
                        <View style={styles.productLoadingContainer}>
                            <ActivityIndicator size="small" color="#3DA9B7" />
                            <Text style={styles.productLoadingText}>Loading product...</Text>
                        </View>
                    ) : iapProduct ? (
                        <View style={styles.productInfoBox}>
                            <Text style={styles.productName}>{revenueCatService.getProductTitle(iapProduct)}</Text>
                            <Text style={styles.productPrice}>
                                {revenueCatService.getFormattedPrice(iapProduct)}
                            </Text>
                            {iapProduct.product.description && (
                                <Text style={styles.productDescription}>
                                    {revenueCatService.getProductDescription(iapProduct)}
                                </Text>
                            )}
                        </View>
                    ) : (
                        <View style={styles.productErrorBox}>
                            <Text style={styles.productErrorText}>
                                Product not available. Please try again later.
                            </Text>
                        </View>
                    )}

                    <Text style={styles.iapNote}>
                        {Platform.OS === 'ios'
                            ? 'You\'ll be prompted to authenticate with Face ID, Touch ID, or passcode.'
                            : 'You\'ll be prompted to confirm your payment with Google Play.'}
                    </Text>
                </View>
            )}

            {/* Free Plan Message */}
            {isFreePlan && (
                <View style={styles.freePlanBox}>
                    <Text style={styles.freePlanText}>
                        ✨ This is a free plan - no payment required!
                    </Text>
                </View>
            )}

            {/* Discount Code */}
            {/* {step2Data?.plan?.finalPrice > 0 && !isUpgradeMode && (
                <View style={styles.discountContainer}>
                    <Text style={styles.label}>Discount Code</Text>
                    <View style={styles.discountInputRow}>
                        <TextInput
                            style={styles.discountInput}
                            placeholder="Enter discount code"
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
            )} */}

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
    iapContainer: {
        gap: hp(1.5),
        marginTop: hp(1),
    },
    label: {
        fontSize: wp(4),
        color: '#666666',
        fontWeight: '500',
        textAlign: 'left',
    },
    iapMethodBox: {
        borderWidth: 1,
        borderColor: '#86C9D2',
        borderRadius: wp(2),
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        backgroundColor: '#EFF8F9',
    },
    iapMethodContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iapIcon: {
        height: hp(4),
        width: wp(12),
        marginRight: wp(3),
    },
    iapTextContainer: {
        flex: 1,
    },
    iapMethodText: {
        fontSize: wp(4),
        color: '#333333',
        fontWeight: '600',
    },
    iapSubtext: {
        fontSize: wp(3),
        color: '#666666',
        marginTop: hp(0.3),
    },
    iapNote: {
        fontSize: wp(3),
        color: '#999999',
        marginTop: hp(0.5),
        lineHeight: wp(4.5),
    },
    productLoadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: hp(2),
        gap: wp(2),
    },
    productLoadingText: {
        fontSize: wp(3.5),
        color: '#666666',
    },
    productInfoBox: {
        borderWidth: 1,
        borderColor: '#E6F7FA',
        borderRadius: wp(2),
        padding: wp(3),
        backgroundColor: '#F9FEFF',
    },
    productName: {
        fontSize: wp(3.5),
        color: '#333333',
        fontWeight: '500',
    },
    productPrice: {
        fontSize: wp(5),
        color: '#3DA9B7',
        fontWeight: 'bold',
        marginTop: hp(0.5),
    },
    productDescription: {
        fontSize: wp(3),
        color: '#666666',
        marginTop: hp(0.5),
    },
    productErrorBox: {
        borderWidth: 1,
        borderColor: '#FFCCCC',
        borderRadius: wp(2),
        padding: wp(3),
        backgroundColor: '#FFF5F5',
    },
    productErrorText: {
        fontSize: wp(3.5),
        color: '#EF4444',
        textAlign: 'center',
    },
    freePlanBox: {
        borderWidth: 1,
        borderColor: '#86C9D2',
        borderRadius: wp(2),
        padding: wp(4),
        backgroundColor: '#EFF8F9',
        marginTop: hp(2),
    },
    freePlanText: {
        fontSize: wp(4),
        color: '#3DA9B7',
        fontWeight: '600',
        textAlign: 'center',
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
