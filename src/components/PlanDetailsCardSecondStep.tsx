import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCreateEvent } from '../hooks/useCreateEvent';
import { wp, hp } from '../contants/StyleGuide';

interface PlanDetailsCardSecondStepProps {
    totalPhotoPool: number;
    guestLimit: number;
    maxPerGuest: number;
    basePlan: string;
    photoStorageDuration: string;
    guestLimitPrice: string;
    photoPoolPrice: string;
    photosPerGuestPrice: string;
    totalAmount: string;
    onPrevious?: () => void;
    onNext?: () => void;
    isEditMode?: boolean;
    editParam?: string | null;
}

const PlanDetailsCardSecondStep: React.FC<PlanDetailsCardSecondStepProps> = ({
    totalPhotoPool,
    guestLimit,
    maxPerGuest,
    basePlan,
    photoStorageDuration,
    guestLimitPrice,
    photoPoolPrice,
    // photosPerGuestPrice,
    // totalAmount,
    // onPrevious,
    onNext,
    isEditMode = false,
    editParam = null,
}) => {
    const navigation: any = useNavigation();

    const { isStep2Valid } = useCreateEvent();

    const handleNext = () => {
        // navigation.navigate('CreateEventThirdStep', { edit: editParam });

        if (onNext) {
            onNext();
        } else {
            if (editParam) {
                navigation.navigate(`CreateEventThirdStep`, { eventId: editParam })
            } else {
                navigation.navigate('CreateEventThirdStep')
            }
        }
    };

    const handlePrevious = () => {
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Plan Details</Text>

            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{totalPhotoPool}</Text>
                    <Text style={styles.statLabel}>Total Photo Pool</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{guestLimit}</Text>
                    <Text style={styles.statLabel}>Guest Limit</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{String(maxPerGuest).padStart(2, '0')}</Text>
                    <Text style={styles.statLabel}>Max per Guest</Text>
                </View>
            </View>

            <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Base Plan</Text>
                    <Text style={styles.detailValue}>{basePlan}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Photo Storage Duration</Text>
                    <Text style={styles.detailValue}>{photoStorageDuration}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Guest Limit</Text>
                    <Text style={styles.detailValue}>{guestLimitPrice}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Photo Pool</Text>
                    <Text style={styles.detailValue}>{photoPoolPrice}</Text>
                </View>
                {/* <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Photos Per Guest</Text>
                    <Text style={styles.detailValue}>{photosPerGuestPrice}</Text>
                </View> */}
            </View>

            {/* <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>{totalAmount}</Text>
            </View> */}

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
                        !isStep2Valid && styles.nextButtonDisabled
                    ]}
                    onPress={handleNext}
                    disabled={!isStep2Valid}
                >
                    <Text style={styles.nextButtonText}>
                        {isEditMode ? 'Save & Continue' : 'Next'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        maxWidth: wp(90),
        alignSelf: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: wp(4),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: hp(5),
        padding: wp(6),
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EAF2F2',
    },
    title: {
        fontSize: wp(6),
        fontWeight: '600',
        color: '#666',
        textAlign: 'center',
        marginBottom: hp(3),
    },
    statsContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        gap: wp(2),
        marginBottom: hp(3),
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#F8FCFD',
        borderRadius: wp(3),
        paddingVertical: hp(2),
    },
    statValue: {
        fontSize: wp(5.5),
        fontWeight: 'bold',
        color: '#8BCBD4',
        lineHeight: wp(6),
    },
    statLabel: {
        fontSize: wp(2.5),
        fontWeight: '500',
        color: '#A3A3A3',
        marginTop: hp(0.5),
        textAlign: 'center',
    },
    detailsContainer: {
        width: '100%',
        gap: hp(1),
        marginBottom: hp(1),
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
        borderRadius: wp(2),
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
    },
    detailLabel: {
        fontSize: wp(3.8),
        fontWeight: '400',
        color: '#A3A3A3',
    },
    detailValue: {
        fontSize: wp(3.8),
        fontWeight: '500',
        color: '#A3A3A3',
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: wp(2),
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        marginTop: hp(1),
        width: '100%',
    },
    totalLabel: {
        fontSize: wp(3.8),
        fontWeight: '600',
        color: '#A3A3A3',
    },
    totalValue: {
        fontSize: wp(4.5),
        fontWeight: 'bold',
        color: '#A3A3A3',
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: wp(4),
        marginTop: hp(4),
        marginBottom: hp(1),
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
        paddingHorizontal: wp(8),
        paddingVertical: hp(1.5),
        backgroundColor: '#3DA9B7',
    },
    nextButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: wp(3.5),
        fontWeight: '500',
    },
});

export default PlanDetailsCardSecondStep; 