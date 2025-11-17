import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCreateEvent } from '../hooks/useCreateEvent';
import Loader from './Loader';
import { formatPrice } from '../utils/HelperFunctions';
import { wp, hp } from '../contants/StyleGuide';

interface PlanDetailsCardProps {
    handlePayAndContinue: () => void;
    isEditMode?: boolean;
    loading?: boolean;
}

const PlanDetailsCard: React.FC<PlanDetailsCardProps> = ({
    handlePayAndContinue,
    loading
}) => {
    const navigation: any = useNavigation();

    const { step2Data, step4Data } = useCreateEvent();

    const planDetails = [
        {
            label: 'Base Plan',
            value: step2Data.plan?.basePlan != null ? `$${formatPrice(step2Data.plan.basePlan)}` : '$0',
        },
        {
            label: `Photo Storage Duration (${step2Data?.plan?.storageDays} days)`,
            value: `$${formatPrice(step2Data?.plan?.storageDaysPrice ?? 0)}`,
        },
        {
            label: `Guest Limit ( ${step2Data?.plan?.guestLimit ?? 0} guests )`,
            value: `$${formatPrice(step2Data?.plan?.guestLimitPrice ?? 0)}`,
        },
        {
            label: `Photo Pool ( ${step2Data?.plan?.photoPool ?? 0} photos )`,
            value: `$${formatPrice(step2Data?.plan?.photoPoolPrice ?? 0)}`,
        },
        {
            label: 'Discount',
            value: `$${formatPrice(step4Data.discountPrice)}`,
        },
    ];

    const handlePrevious = () => {
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Plan Details</Text>

            <View style={styles.detailsContainer}>
                {planDetails.map((item, idx) => (
                    <View key={idx} style={styles.detailRow}>
                        <Text style={styles.detailLabel}>{item.label}</Text>
                        <Text style={styles.detailValue}>{item.value}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>
                    ${formatPrice(step2Data.plan.finalPrice - step4Data.discountPrice)}
                </Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.previousButton}
                    onPress={handlePrevious}
                >
                    <Text style={styles.previousButtonText}>Previous</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.nextButton,
                        loading && styles.nextButtonDisabled
                    ]}
                    onPress={handlePayAndContinue}
                    disabled={loading}
                >
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <Loader size="small" color="#ffffff" />
                            <Text style={styles.nextButtonText}>Processing...</Text>
                        </View>
                    ) : (
                        <Text style={styles.nextButtonText}>{step2Data?.plan?.finalPrice > 0 ? 'Pay and Continue' : 'Create Event'}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: wp(4),
    },
    title: {
        fontSize: wp(3.8),
        fontWeight: '600',
        color: '#666666',
        textAlign: 'left',
        marginTop: hp(2),
        marginBottom: hp(1),
        marginLeft: wp(2),
    },
    detailsContainer: {
        width: '100%',
        gap: hp(1.5),
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
        borderRadius: wp(1.5),
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
    },
    detailLabel: {
        fontSize: wp(3.2),
        fontWeight: '400',
        color: '#646464',
        flex: 1,
    },
    detailValue: {
        fontSize: wp(3.2),
        fontWeight: 'bold',
        color: '#646464',
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: wp(2),
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        marginTop: hp(2),
    },
    totalLabel: {
        fontSize: wp(3.2),
        fontWeight: '600',
        color: '#626262',
    },
    totalValue: {
        fontSize: wp(3.2),
        fontWeight: 'bold',
        color: '#626262',
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: wp(4),
        marginTop: hp(3.5),
        justifyContent: 'space-between',
    },
    previousButton: {
        borderWidth: 1,
        borderColor: '#E6E6E6',
        borderRadius: wp(2),
        paddingHorizontal: wp(8),
        paddingVertical: hp(1.5),
        backgroundColor: '#FFFFFF',
    },
    previousButtonText: {
        color: '#808080',
        fontWeight: '500',
        fontSize: wp(3.5),
    },
    nextButton: {
        borderRadius: wp(2),
        paddingHorizontal: wp(6),
        paddingVertical: hp(1.5),
        backgroundColor: '#3DA9B7',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextButtonDisabled: {
        opacity: 0.6,
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: wp(3.8),
        fontWeight: '500',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: wp(2),
    },
});

export default PlanDetailsCard; 