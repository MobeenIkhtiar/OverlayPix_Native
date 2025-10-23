import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StorageOption } from '../types/plan';
import { wp, hp } from '../contants/StyleGuide';

interface DaySelectionProps {
    value: number;
    onChange: (value: any) => void;
    options: StorageOption[];
    isEditMode: boolean;
}

const DaySelection: React.FC<DaySelectionProps> = ({ value, onChange, options, isEditMode }) => {
    // Helper to format price as per requirements
    const formatPrice = (price: number) => {
        if (price === 0) {
            return '( Free )';
        }
        if (price > 0) {
            return `( +$${price} )`;
        }
        return '';
    };

    return (
        <View style={[styles.container, isEditMode && styles.disabled]}>
            {options.map((opt) => (
                <TouchableOpacity
                    key={opt.days}
                    style={[
                        styles.option,
                        value === opt.days ? styles.optionSelected : styles.optionDefault,
                        isEditMode && styles.optionDisabled
                    ]}
                    activeOpacity={isEditMode ? 1 : 0.8}
                    onPress={() => {
                        if (!isEditMode) {
                            onChange(opt);
                        }
                    }}
                    disabled={isEditMode}
                >
                    <View style={styles.radioOuter}>
                        <View style={[
                            styles.radioCircle,
                            value === opt.days ? styles.radioCircleSelected : styles.radioCircleDefault
                        ]}>
                            {value === opt.days && <View style={styles.radioDot} />}
                        </View>
                    </View>
                    <View style={styles.labelContainer}>
                        <Text style={[
                            styles.daysText,
                            value === opt.days ? styles.selectedText : styles.defaultText
                        ]}>
                            {opt.days} Days
                        </Text>
                        <Text style={[
                            styles.priceText,
                            value === opt.days ? styles.selectedText : styles.priceDefault
                        ]}>
                            {formatPrice(opt.price)}
                        </Text>
                    </View>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        gap: hp(1.5),
        marginTop: hp(1.5),
    },
    disabled: {
        opacity: 0.6,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        borderRadius: wp(2),
        borderWidth: 1,
        marginBottom: hp(0.5),
    },
    optionSelected: {
        borderColor: '#3DA9B7',
        backgroundColor: '#F6FEFF',
    },
    optionDefault: {
        borderColor: '#E5E5E5',
        backgroundColor: '#fff',
    },
    optionDisabled: {
        // pointerEvents handled by TouchableOpacity's disabled prop
    },
    radioOuter: {
        marginRight: wp(3),
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioCircle: {
        width: wp(5),
        height: wp(5),
        borderRadius: wp(2.5),
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioCircleSelected: {
        borderColor: '#3DA9B7',
    },
    radioCircleDefault: {
        borderColor: '#B2B2B2',
    },
    radioDot: {
        width: wp(2.5),
        height: wp(2.5),
        borderRadius: wp(1.25),
        backgroundColor: '#3DA9B7',
    },
    labelContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    daysText: {
        fontSize: wp(3.5),
        fontWeight: '500',
        color: '#626666',
    },
    selectedText: {
        color: '#3DA9B7',
    },
    defaultText: {
        color: '#626666',
    },
    priceText: {
        marginLeft: wp(2),
        fontSize: wp(3.2),
        fontWeight: '400',
    },
    priceDefault: {
        color: '#808080',
    },
});

export default DaySelection;